const { EmbedBuilder } = require('discord.js');
const { Injectable, Cron } = require('../../core/index.js');
const { SecurityQuestionRepository } = require('./security-question.repository.js');
const { config, getConfig } = require('../../config/index.js');
const {
    sendOrUpdateCaptchaCard,
    buildCaptchaCardEmbed,
    buildCaptchaActionRow,
    sendCaptchaLog
} = require('./captcha-logger.js');
const DiscordCacheService = require('../../services/discordCacheService.js');
const logger = require('../../utils/logger.js');

class SecurityQuestionService {
    static inject = [SecurityQuestionRepository];

    constructor(repository) {
        this.repo = repository;
        this.activeTimers = new Map(); // `${userId}_${guildId}` -> setTimeout
        this.activeCards = new Map();  // `${userId}_${guildId}` -> cardData
    }

    /**
     * Nettoie tous les timers actifs (utile lors des arrêts ou tests)
     */
    clearActiveTimers() {
        for (const [key, timer] of this.activeTimers.entries()) {
            clearTimeout(timer);
        }
        this.activeTimers.clear();
    }

    getConfig() {
        const currentConfig = getConfig ? getConfig() : config;
        return currentConfig.captcha || {};
    }

    numberToFrench(num) {
        const numbers = {
            1: 'un', 2: 'deux', 3: 'trois', 4: 'quatre', 5: 'cinq',
            6: 'six', 7: 'sept', 8: 'huit', 9: 'neuf', 10: 'dix',
            11: 'onze', 12: 'douze', 13: 'treize', 14: 'quatorze', 15: 'quinze',
            16: 'seize', 17: 'dix-sept', 18: 'dix-huit', 19: 'dix-neuf', 20: 'vingt'
        };
        return numbers[num] || num.toString();
    }

    generateMathQuestion() {
        const captchaConfig = this.getConfig();
        const minNum = captchaConfig.min_number || 1;
        const maxNum = captchaConfig.max_number || 20;

        const operations = ['+', '-', '*'];
        const weights = { '+': 0.5, '-': 0.3, '*': 0.2 };

        const weightedOperations = [];
        for (const op of operations) {
            const count = Math.floor((weights[op] || 0.3) * 100);
            for (let i = 0; i < count; i++) {
                weightedOperations.push(op);
            }
        }

        const operator = weightedOperations[Math.floor(Math.random() * weightedOperations.length)] || '+';

        let num1, num2, answer;
        switch (operator) {
            case '+':
                num1 = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
                num2 = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
                answer = num1 + num2;
                break;
            case '-':
                num1 = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
                num2 = Math.floor(Math.random() * (num1 - minNum + 1)) + minNum;
                answer = num1 - num2;
                break;
            case '*':
                num1 = Math.floor(Math.random() * (Math.min(maxNum, 10) - minNum + 1)) + minNum;
                num2 = Math.floor(Math.random() * (Math.min(maxNum, 10) - minNum + 1)) + minNum;
                answer = num1 * num2;
                break;
            default:
                num1 = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
                num2 = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
                answer = num1 + num2;
        }

        const num1Str = this.numberToFrench(num1);
        const num2Str = this.numberToFrench(num2);

        const question = `Combien font ${num1Str} ${operator} ${num2Str} ?`;

        return {
            question,
            answer: answer.toString(),
            num1: num1Str,
            num2: num2Str,
            operator
        };
    }

    async getVerifiedRole(guild) {
        if (!guild) return null;
        const captchaConfig = this.getConfig();
        const roleId = captchaConfig.verified_role_id || process.env.VERIFIED_ROLE_ID;
        if (!roleId) return null;

        try {
            return await guild.roles.fetch(roleId);
        } catch (error) {
            console.error(`❌ [SecurityQuestion] Rôle vérifié (ID: ${roleId}) introuvable:`, error.message);
            return null;
        }
    }

    async createUserCaptchaChannel(member) {
        const everyoneId = member.guild.roles.everyone?.id || member.guild.id;
        const adminRoles = member.guild.roles.cache ? member.guild.roles.cache.filter(role => role.permissions?.has('Administrator')) : [];

        const permissionOverwrites = [
            {
                id: everyoneId,
                deny: ['ViewChannel']
            },
            {
                id: member.id,
                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
            }
        ];

        adminRoles.forEach(adminRole => {
            permissionOverwrites.push({
                id: adminRole.id,
                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages']
            });
        });

        try {
            const channel = await member.guild.channels.create({
                name: `captcha-${member.user.username.toLowerCase()}`,
                type: 0,
                topic: `Canal de vérification pour ${member.user.tag}`,
                permissionOverwrites
            });

            console.log(`[CAPTCHA] Salon créé: ${channel.name} (${channel.id}) pour ${member.user.tag}`);
            return channel;
        } catch (error) {
            console.error('❌ [SecurityQuestion] Erreur création canal:', error);
            throw error;
        }
    }

    async triggerWelcome(member) {
        try {
            const { container } = require('../../core/container.js');
            const { WelcomeService } = require('../feature_welcome/welcome.service.js');
            const welcomeService = container.resolve(WelcomeService);
            if (welcomeService && typeof welcomeService.handleWelcome === 'function') {
                await welcomeService.handleWelcome(member);
            }
        } catch (err) {
            console.error('❌ [SecurityQuestion] Erreur déclenchement accueil:', err.message);
        }
    }

    /**
     * Récupère les données de la carte de log pour un utilisateur
     */
    async getCardData(userId, guildId) {
        const key = `${userId}_${guildId}`;
        if (this.activeCards.has(key)) {
            return this.activeCards.get(key);
        }

        const fromDb = await this.repo.getCaptchaCard(userId, guildId);
        if (fromDb) {
            this.activeCards.set(key, fromDb);
            return fromDb;
        }

        // Reconstitution depuis user_captchas si inexistant
        const captcha = await this.repo.getUserCaptcha(userId, guildId);
        if (captcha) {
            const maxAttempts = this.getConfig().max_attempts || 3;
            let status = 'pending';
            if (captcha.is_verified) status = 'verified';
            else if (captcha.expired_at) status = 'timeout';
            else if (captcha.attempts >= maxAttempts) status = 'failed';

            const card = {
                userId,
                username: captcha.username || `Utilisateur ${userId}`,
                guildId,
                question: captcha.question,
                answer: captcha.answer,
                attempts: captcha.attempts || 0,
                maxAttempts,
                channelId: captcha.channel_id,
                channelName: `captcha-${captcha.username ? captcha.username.toLowerCase() : userId}`,
                status,
                expiresAt: captcha.expires_at,
                history: []
            };
            this.activeCards.set(key, card);
            return card;
        }

        return null;
    }

    /**
     * Sauvegarde les données de la carte en mémoire et en BDD
     */
    async saveCardData(userId, guildId, cardData) {
        const key = `${userId}_${guildId}`;
        this.activeCards.set(key, cardData);
        await this.repo.saveCaptchaCard(userId, guildId, cardData);
    }

    /**
     * Met à jour le statut, ajoute une entrée dans l'historique et synchronise le message Discord
     */
    async updateAndSyncCard(guild, cardData, newStatus = null, historyText = null) {
        if (!cardData) return;

        if (newStatus) {
            cardData.status = newStatus;
        }

        if (historyText) {
            if (!Array.isArray(cardData.history)) {
                cardData.history = [];
            }
            cardData.history.push({
                timestamp: Math.floor(Date.now() / 1000),
                text: historyText
            });
        }

        if (guild) {
            await sendOrUpdateCaptchaCard(guild, cardData);
        }

        await this.saveCardData(cardData.userId, cardData.guildId || guild?.id, cardData);
    }

    /**
     * Traite l'arrivée d'un nouveau membre
     */
    async handleMemberJoin(member) {
        if (member.user.bot) return;

        const captchaConfig = this.getConfig();
        if (captchaConfig.enabled === false) {
            console.log(`ℹ️ [SecurityQuestion] Captcha désactivé - ${member.user.tag} rejoint sans vérification`);
            await this.triggerWelcome(member);
            return;
        }

        const timerKey = `${member.id}_${member.guild.id}`;
        // Nettoyer un éventuel timer précédent pour cet utilisateur
        if (this.activeTimers.has(timerKey)) {
            clearTimeout(this.activeTimers.get(timerKey));
            this.activeTimers.delete(timerKey);
        }

        try {
            const existing = await this.repo.getUserCaptcha(member.id, member.guild.id);
            if (existing && existing.is_verified) {
                const role = await this.getVerifiedRole(member.guild);
                if (role) {
                    await member.roles.add(role.id).catch(() => {});
                }

                // Afficher une carte dans le salon de logs avec le bouton d'invalidation actif
                const cardData = {
                    userId: member.id,
                    username: member.user.username,
                    guildId: member.guild.id,
                    question: existing.question || 'N/A',
                    answer: existing.answer || 'N/A',
                    attempts: existing.attempts || 0,
                    maxAttempts: captchaConfig.max_attempts || 3,
                    channelId: null,
                    channelName: null,
                    status: 'already_verified',
                    expiresAt: null,
                    history: [
                        {
                            timestamp: Math.floor(Date.now() / 1000),
                            text: '🔄 Membre déjà vérifié — Rôle vérifié réattribué automatiquement'
                        }
                    ]
                };

                await sendOrUpdateCaptchaCard(member.guild, cardData);
                await this.saveCardData(member.id, member.guild.id, cardData);
                await this.triggerWelcome(member);
                return;
            }

            const channel = await this.createUserCaptchaChannel(member);
            const mathQuestion = this.generateMathQuestion();
            const timeoutMinutes = captchaConfig.captcha_timeout || captchaConfig.timeout_minutes || 10;
            const timeoutMs = timeoutMinutes * 60 * 1000;
            const expiresAt = new Date(Date.now() + timeoutMs).toISOString();

            await this.repo.createCaptcha(
                member.id,
                member.user.username,
                member.guild.id,
                mathQuestion.question,
                mathQuestion.answer,
                channel.id,
                timeoutMinutes
            );

            // Créer la carte de log dynamique
            const cardData = {
                userId: member.id,
                username: member.user.username,
                guildId: member.guild.id,
                question: mathQuestion.question,
                answer: mathQuestion.answer,
                channelId: channel.id,
                channelName: channel.name,
                attempts: 0,
                maxAttempts: captchaConfig.max_attempts || 3,
                status: 'pending',
                expiresAt,
                history: [
                    {
                        timestamp: Math.floor(Date.now() / 1000),
                        text: `🔒 Salon créé (<#${channel.id}>) et calcul envoyé`
                    }
                ]
            };

            await sendOrUpdateCaptchaCard(member.guild, cardData);
            await this.saveCardData(member.id, member.guild.id, cardData);

            // Message envoyé dans le salon captcha
            const welcomeMsg = captchaConfig.messages?.welcome_message || "Bienvenue sur le serveur ! Pour des raisons de sécurité, veuillez résoudre ce calcul :";
            const instructions = captchaConfig.messages?.instructions || `Répondez avec le nombre en chiffres uniquement (exemple: 12) dans les ${timeoutMinutes} minutes.`;

            const content = `${member.user}, ${welcomeMsg}\n\n**${mathQuestion.question}**\n\n${instructions}`;
            const sentMsg = await channel.send(content).catch(() => null);
            if (sentMsg) {
                try {
                    await DiscordCacheService.cacheDiscordMessage(sentMsg);
                } catch (_) {}
            }

            console.log(`🔒 [SecurityQuestion] Captcha envoyé à ${member.user.tag} dans ${channel.name} : "${mathQuestion.question}" (Réponse: ${mathQuestion.answer}, Timeout: ${timeoutMinutes}m)`);

            // ⏰ PLANIFICATION DE L'AUTO-KICK PAR TIMEOUT
            const timeoutTimer = setTimeout(async () => {
                await this.handleTimeout(member.guild, member.id);
            }, timeoutMs);

            this.activeTimers.set(timerKey, timeoutTimer);

        } catch (error) {
            console.error('❌ [SecurityQuestion] Erreur handleMemberJoin:', error);
        }
    }

    /**
     * Traite l'expiration du temps imparti (Auto-kick)
     */
    async handleTimeout(guild, userId) {
        if (!guild || !userId) return;

        const timerKey = `${userId}_${guild.id}`;
        if (this.activeTimers.has(timerKey)) {
            clearTimeout(this.activeTimers.get(timerKey));
            this.activeTimers.delete(timerKey);
        }

        try {
            const captcha = await this.repo.getUserCaptcha(userId, guild.id);
            if (!captcha || captcha.is_verified || captcha.expired_at) {
                return; // Déjà vérifié ou déjà expiré
            }

            // Marquer comme expiré dans la base de données
            await this.repo.markExpired(userId, guild.id);

            const timeoutMinutes = this.getConfig().captcha_timeout || this.getConfig().timeout_minutes || 10;
            const timeoutMsg = this.getConfig().messages?.timeout_message || "⏰ Temps écoulé ! Le captcha a expiré. Vous allez être expulsé.";

            let channel = null;
            if (captcha.channel_id) {
                channel = await guild.channels.fetch(captcha.channel_id).catch(() => null);
            }

            // Récupérer le membre pour l'expulser
            const member = await guild.members.fetch(userId).catch(() => null);
            if (member) {
                if (channel) {
                    await channel.send(`${member}, ${timeoutMsg}`).catch(() => {});
                }

                try {
                    await member.kick(`Captcha non validé dans le temps imparti (${timeoutMinutes} minutes - Timeout)`);
                    console.log(`⏰ [SecurityQuestion] ${member.user.tag} a été auto-kické (Timeout captcha).`);
                } catch (kickErr) {
                    console.warn(`⚠️ [SecurityQuestion] Échec kick timeout pour ${member.user.tag}:`, kickErr.message);
                }
            } else if (channel) {
                await channel.send(timeoutMsg).catch(() => {});
            }

            // Supprimer le salon après 3 secondes
            if (channel) {
                setTimeout(async () => {
                    await channel.delete().catch(() => {});
                }, 3000);
            }

            // Mettre à jour la carte dynamique de logs
            const cardData = await this.getCardData(userId, guild.id);
            if (cardData) {
                await this.updateAndSyncCard(
                    guild,
                    cardData,
                    'timeout',
                    `⏰ Temps écoulé (${timeoutMinutes} min) — Membre auto-kické et salon supprimé`
                );
            }

        } catch (error) {
            console.error(`❌ [SecurityQuestion] Erreur handleTimeout (${userId}):`, error);
        }
    }

    /**
     * Traite le départ d'un membre avant validation du captcha
     */
    async handleMemberLeave(member) {
        if (!member || !member.guild) return;

        const timerKey = `${member.id}_${member.guild.id}`;
        if (this.activeTimers.has(timerKey)) {
            clearTimeout(this.activeTimers.get(timerKey));
            this.activeTimers.delete(timerKey);
        }

        try {
            const captcha = await this.repo.getUserCaptcha(member.id, member.guild.id);
            if (!captcha || captcha.is_verified || captcha.expired_at) {
                return; // Rien à nettoyer si déjà vérifié ou déjà expiré
            }

            // Marquer comme expiré/abandonné en BDD
            await this.repo.markExpired(member.id, member.guild.id);

            // Supprimer immédiatement le canal captcha s'il existe
            if (captcha.channel_id) {
                const channel = await member.guild.channels.fetch(captcha.channel_id).catch(() => null);
                if (channel) {
                    await channel.delete().catch(() => {});
                }
            }

            // Mettre à jour la carte de logs dynamique
            const cardData = await this.getCardData(member.id, member.guild.id);
            if (cardData) {
                await this.updateAndSyncCard(
                    member.guild,
                    cardData,
                    'left',
                    '🚪 Membre parti du serveur avant validation — Salon supprimé'
                );
            }

            console.log(`🚪 [SecurityQuestion] ${member.user?.tag || member.id} a quitté le serveur avant de valider le captcha.`);

        } catch (error) {
            console.error(`❌ [SecurityQuestion] Erreur handleMemberLeave (${member.id}):`, error);
        }
    }

    /**
     * Traite les réponses envoyées dans le salon captcha
     */
    async handleIncomingMessage(message) {
        if (message.author.bot) return false;

        const isCaptchaChannel = message.channel.name?.includes('captcha') ||
            message.channel.name?.includes('verification') ||
            message.channel.topic?.includes('vérification') ||
            message.channel.topic?.includes('captcha');

        if (!isCaptchaChannel) return false;

        // Mettre en cache le message de l'utilisateur pour l'historique
        try {
            await DiscordCacheService.cacheDiscordMessage(message);
        } catch (_) {}

        try {
            const captcha = await this.repo.getUserCaptcha(message.author.id, message.guild?.id);
            if (!captcha) return false;

            if (captcha.is_verified) {
                const rep = await message.reply("Vous êtes déjà vérifié !");
                if (rep) {
                    try { await DiscordCacheService.cacheDiscordMessage(rep); } catch (_) {}
                }
                return true;
            }

            // Vérifier expiration
            if (captcha.expires_at && new Date() > new Date(captcha.expires_at)) {
                const rep = await message.reply("❌ Le temps imparti pour répondre au captcha a expiré.");
                if (rep) {
                    try { await DiscordCacheService.cacheDiscordMessage(rep); } catch (_) {}
                }
                return true;
            }

            const userAnswer = message.content.trim();
            const maxAttempts = this.getConfig().max_attempts || 3;
            const timerKey = `${message.author.id}_${message.guild.id}`;

            // Vérification réponse
            if (userAnswer === captcha.answer) {
                // ✅ Succès : annuler le timer d'auto-kick
                if (this.activeTimers.has(timerKey)) {
                    clearTimeout(this.activeTimers.get(timerKey));
                    this.activeTimers.delete(timerKey);
                }

                await this.repo.markVerified(message.author.id, message.guild.id);
                const rep = await message.reply("✅ Bravo ! Vous avez validé le captcha avec succès.");
                if (rep) {
                    try { await DiscordCacheService.cacheDiscordMessage(rep); } catch (_) {}
                }

                const role = await this.getVerifiedRole(message.guild);
                if (role && message.member) {
                    await message.member.roles.add(role.id).catch(() => {});
                }

                // Mettre à jour la carte dynamique de logs
                const cardData = await this.getCardData(message.author.id, message.guild.id);
                if (cardData) {
                    await this.updateAndSyncCard(
                        message.guild,
                        cardData,
                        'verified',
                        `✅ Captcha validé avec succès ("${userAnswer}") — Rôle vérifié attribué`
                    );
                }

                if (message.member) {
                    await this.triggerWelcome(message.member);
                }

                setTimeout(async () => {
                    await message.channel.delete().catch(() => {});
                }, 3000);

                console.log(`✅ [SecurityQuestion] ${message.author.tag} a validé son captcha !`);
                return true;

            } else {
                // ❌ Échec
                const nextAttempts = (captcha.attempts || 0) + 1;
                await this.repo.updateAttempts(message.author.id, message.guild.id, nextAttempts);

                if (nextAttempts >= maxAttempts) {
                    // Annuler le timer d'auto-kick
                    if (this.activeTimers.has(timerKey)) {
                        clearTimeout(this.activeTimers.get(timerKey));
                        this.activeTimers.delete(timerKey);
                    }

                    await this.repo.markExpired(message.author.id, message.guild.id);

                    const rep = await message.reply("❌ Trop de tentatives infructueuses. Vous allez être expulsé du serveur.");
                    if (rep) {
                        try { await DiscordCacheService.cacheDiscordMessage(rep); } catch (_) {}
                    }
                    if (message.member) {
                        await message.member.kick('Échec vérification captcha (Max tentatives atteint)').catch(() => {});
                    }

                    // Mettre à jour la carte dynamique de logs
                    const cardData = await this.getCardData(message.author.id, message.guild.id);
                    if (cardData) {
                        cardData.attempts = nextAttempts;
                        await this.updateAndSyncCard(
                            message.guild,
                            cardData,
                            'failed',
                            `❌ Réponse incorrecte ("${userAnswer}"). Max tentatives (${nextAttempts}/${maxAttempts}) dépassé — Membre kické et salon supprimé`
                        );
                    }

                    setTimeout(async () => {
                        await message.channel.delete().catch(() => {});
                    }, 3000);

                    console.log(`🚫 [SecurityQuestion] ${message.author.tag} a dépassé les tentatives max et a été expulsé.`);
                    return true;
                }

                const remaining = maxAttempts - nextAttempts;
                const rep = await message.reply(`❌ Réponse incorrecte. Il vous reste **${remaining}** tentative(s).`);
                if (rep) {
                    try { await DiscordCacheService.cacheDiscordMessage(rep); } catch (_) {}
                }

                // Mettre à jour la carte dynamique de logs pour cette tentative
                const cardData = await this.getCardData(message.author.id, message.guild.id);
                if (cardData) {
                    cardData.attempts = nextAttempts;
                    await this.updateAndSyncCard(
                        message.guild,
                        cardData,
                        null,
                        `⚠️ Tentative incorrecte ("${userAnswer}") — Tentative ${nextAttempts}/${maxAttempts}`
                    );
                }

                return true;
            }

        } catch (error) {
            console.error('❌ [SecurityQuestion] Erreur handleIncomingMessage:', error);
            return false;
        }
    }

    /**
     * Traite l'interaction avec le bouton "Invalider le rôle"
     */
    async handleButtonInteraction(interaction) {
        if (!interaction || !interaction.isButton()) return;
        if (!interaction.customId?.startsWith('captcha_revoke_')) return;

        const member = interaction.member;
        const hasPerm = member && (
            member.permissions.has('Administrator') ||
            member.permissions.has('ManageRoles') ||
            member.permissions.has('ManageGuild')
        );

        if (!hasPerm) {
            return await interaction.reply({
                content: "❌ Vous n'avez pas la permission d'invalider cette vérification (Permissions Administrateur / Gérer les rôles requises).",
                ephemeral: true
            });
        }

        const targetUserId = interaction.customId.replace('captcha_revoke_', '');
        const guild = interaction.guild;
        if (!guild) return;

        try {
            // Invalider en base de données
            await this.repo.invalidateVerification(targetUserId, guild.id);

            // Retirer le rôle du membre sur Discord
            const role = await this.getVerifiedRole(guild);
            const targetMember = await guild.members.fetch(targetUserId).catch(() => null);
            if (targetMember && role) {
                await targetMember.roles.remove(role.id).catch(() => {});
            }

            // Mettre à jour la carte dynamique de log
            const cardData = await this.getCardData(targetUserId, guild.id);
            if (cardData) {
                cardData.status = 'revoked';
                if (!Array.isArray(cardData.history)) cardData.history = [];
                cardData.history.push({
                    timestamp: Math.floor(Date.now() / 1000),
                    text: `🚫 Rôle révoqué manuellement par <@${interaction.user.id}>`
                });

                await this.saveCardData(targetUserId, guild.id, cardData);

                await interaction.update({
                    embeds: [buildCaptchaCardEmbed(cardData)],
                    components: [buildCaptchaActionRow(cardData)]
                });

                await interaction.followUp({
                    content: `✅ La vérification de <@${targetUserId}> a été invalidée avec succès par ${interaction.user}.`,
                    ephemeral: true
                }).catch(() => {});
            } else {
                await interaction.reply({
                    content: `✅ Vérification de <@${targetUserId}> invalidée en base de données.`,
                    ephemeral: true
                });
            }

            console.log(`🚫 [SecurityQuestion] Vérification de ${targetUserId} invalidée par ${interaction.user.tag}`);

        } catch (error) {
            console.error(`❌ [SecurityQuestion] Erreur handleButtonInteraction:`, error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: "❌ Une erreur est survenue lors de l'invalidation.",
                    ephemeral: true
                }).catch(() => {});
            }
        }
    }

    /**
     * Tâche de fond périodique (Cron) pour nettoyer les captchas expirés après redémarrage du bot
     */
    async checkExpiredCaptchas(client) {
        if (!client) return;

        const captchaConfig = this.getConfig();
        if (captchaConfig.enabled === false) return;

        try {
            const pendingExpired = await this.repo.getPendingExpiredCaptchas();
            if (!pendingExpired || pendingExpired.length === 0) return;

            for (const c of pendingExpired) {
                const guildId = c.guildId || c.guild_id;
                const userId = c.userId || c.user_id;

                try {
                    const guild = await client.guilds.fetch(guildId).catch(() => null);
                    if (guild) {
                        await this.handleTimeout(guild, userId);
                    }
                } catch (err) {
                    console.error(`❌ [SecurityQuestion] Erreur traitement captcha expiré (${userId}):`, err.message);
                }
            }
        } catch (error) {
            console.error('❌ [SecurityQuestion] Erreur checkExpiredCaptchas:', error);
        }
    }

    /**
     * Récupère l'historique et les statistiques pour le Dashboard
     */
    async getCaptchaOverview() {
        const rawCaptchas = await this.repo.getAllCaptchas(100);
        const captchaConfig = this.getConfig();
        const maxAttempts = captchaConfig.max_attempts || 3;

        const captchas = rawCaptchas.map(c => {
            const isExpired = c.expires_at ? new Date() > new Date(c.expires_at) : false;
            let status = 'pending';
            if (c.is_verified === 1) status = 'verified';
            else if (c.attempts >= maxAttempts) status = 'failed';
            else if (isExpired || c.expired_at) status = 'expired';

            return {
                id: `${c.user_id}_${c.guild_id}`,
                userId: c.user_id,
                username: c.username || `Utilisateur ${c.user_id}`,
                question: c.question,
                answer: c.answer,
                attempts: c.attempts || 0,
                maxAttempts,
                status,
                isVerified: c.is_verified === 1,
                channelId: c.channel_id,
                channelName: c.channel_name || (c.username ? `captcha-${c.username.toLowerCase()}` : `captcha-${c.user_id}`),
                channelDeletedAt: c.channel_deleted_at || null,
                isChannelDeleted: !!c.channel_deleted_at,
                createdAt: c.created_at,
                expiresAt: c.expires_at,
                verifiedAt: c.verified_at,
                expiredAt: c.expired_at
            };
        });

        const memoryLogs = logger.getMemoryLogs ? logger.getMemoryLogs(100) : [];
        const captchaLogs = memoryLogs.filter(l =>
            l.tag === 'CAPTCHA' ||
            (l.message && (l.message.toLowerCase().includes('captcha') || l.message.toLowerCase().includes('sécurité') || l.message.toLowerCase().includes('vérif')))
        );

        const total = captchas.length;
        const verifiedCount = captchas.filter(c => c.status === 'verified').length;
        const pendingCount = captchas.filter(c => c.status === 'pending').length;
        const failedCount = captchas.filter(c => c.status === 'failed' || c.status === 'expired').length;

        return {
            stats: {
                total,
                verifiedCount,
                pendingCount,
                failedCount,
                successRate: total > 0 ? Math.round((verifiedCount / total) * 100) : 100
            },
            config: {
                isEnabled: captchaConfig.enabled !== false,
                timeoutMinutes: captchaConfig.captcha_timeout || captchaConfig.timeout_minutes || 10,
                maxAttempts,
                verifiedRoleId: captchaConfig.verified_role_id || null,
                channelId: captchaConfig.channel_id || null
            },
            captchas,
            logs: captchaLogs
        };
    }

    /**
     * Récupère l'historique complet des messages et détails d'un salon Captcha
     */
    async getChannelHistory(channelId, userId = null, guildId = null) {
        return await this.repo.getCaptchaChannelDetails(channelId, userId);
    }
}

Injectable()(SecurityQuestionService);
Cron('* * * * *', { timezone: 'Europe/Paris', configKey: 'captcha' })(SecurityQuestionService.prototype, 'checkExpiredCaptchas');

module.exports = {
    SecurityQuestionService
};
