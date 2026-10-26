const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Injectable } = require('../../core/index.js');
const { config, getConfig } = require('../../config/index.js');
const welcomeConfig = require('./welcome.config.js');

class WelcomeService {
    constructor() {
        this.welcomedUsers = new Set();
    }

    getConfig() {
        const currentConfig = getConfig ? getConfig() : config;
        return currentConfig.welcome || {};
    }

    /**
     * Résout un emoji personnalisé Discord depuis le serveur ou le client, sinon renvoie le fallback
     */
    resolveEmoji(guild, nameOrId, fallback) {
        if (!guild) return fallback;
        try {
            // Recherche par ID direct
            if (nameOrId && guild.emojis?.cache?.has && guild.emojis.cache.has(nameOrId)) {
                const e = guild.emojis.cache.get(nameOrId);
                return `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`;
            }
            // Recherche par nom dans les émojis du serveur
            const cleanTarget = String(nameOrId || '').toLowerCase().replace(/[:_]/g, '');
            if (guild.emojis?.cache) {
                const list = typeof guild.emojis.cache.values === 'function'
                    ? Array.from(guild.emojis.cache.values())
                    : (Array.isArray(guild.emojis.cache) ? guild.emojis.cache : []);
                const found = list.find(e => {
                    const eName = String(e.name || '').toLowerCase().replace(/[:_]/g, '');
                    return eName === cleanTarget || eName.includes(cleanTarget) || cleanTarget.includes(eName);
                });
                if (found) {
                    return `<${found.animated ? 'a' : ''}:${found.name}:${found.id}>`;
                }
            }
            // Recherche dans les émojis du client Discord
            if (guild.client?.emojis?.cache) {
                const listClient = typeof guild.client.emojis.cache.values === 'function'
                    ? Array.from(guild.client.emojis.cache.values())
                    : (Array.isArray(guild.client.emojis.cache) ? guild.client.emojis.cache : []);
                const foundClient = listClient.find(e => {
                    const eName = String(e.name || '').toLowerCase().replace(/[:_]/g, '');
                    return eName === cleanTarget || eName.includes(cleanTarget) || cleanTarget.includes(eName);
                });
                if (foundClient) {
                    return `<${foundClient.animated ? 'a' : ''}:${foundClient.name}:${foundClient.id}>`;
                }
            }
        } catch (_) {}
        return fallback;
    }

    /**
     * Vérifie si un membre a déjà reçu le message de bienvenue
     */
    async isWelcomed(guildId, userId) {
        if (!guildId || !userId) return false;
        const key = `${guildId}_${userId}`;
        if (this.welcomedUsers.has(key)) return true;

        try {
            const { getBotState } = require('../../database.js');
            const state = await getBotState(`welcome_sent_${guildId}_${userId}`);
            if (state) {
                this.welcomedUsers.add(key);
                return true;
            }
        } catch (_) {}

        return false;
    }

    /**
     * Marque un membre comme ayant reçu son message de bienvenue
     */
    async markWelcomed(guildId, userId) {
        if (!guildId || !userId) return;
        const key = `${guildId}_${userId}`;
        this.welcomedUsers.add(key);

        try {
            const { setBotState } = require('../../database.js');
            await setBotState(`welcome_sent_${guildId}_${userId}`, Date.now().toString());
        } catch (_) {}
    }

    /**
     * Réinitialise le statut d'accueil (ex: si le membre quitte le serveur)
     */
    async resetWelcome(guildId, userId) {
        if (!guildId || !userId) return;
        const key = `${guildId}_${userId}`;
        this.welcomedUsers.delete(key);

        try {
            const { setBotState } = require('../../database.js');
            await setBotState(`welcome_sent_${guildId}_${userId}`, '');
        } catch (_) {}
    }

    /**
     * Vérifie si le membre possède le rôle requis pour l'accueil
     */
    async hasRequiredRole(member) {
        const requiredRoleId = welcomeConfig.REQUIRED_ROLE_ID;
        if (!requiredRoleId) return true;

        let hasRole = false;
        if (member.roles?.cache && typeof member.roles.cache.has === 'function') {
            hasRole = member.roles.cache.has(requiredRoleId);
        } else if (Array.isArray(member.roles)) {
            hasRole = member.roles.includes(requiredRoleId);
        } else if (member.roles?.has && typeof member.roles.has === 'function') {
            hasRole = member.roles.has(requiredRoleId);
        }

        // Si le cache Discord n'est pas encore à jour, tenter un rafraîchissement
        if (!hasRole && member.guild?.members?.fetch) {
            try {
                const refreshed = await member.guild.members.fetch(member.id);
                if (refreshed?.roles?.cache?.has && refreshed.roles.cache.has(requiredRoleId)) {
                    hasRole = true;
                }
            } catch (_) {}
        }

        return hasRole;
    }

    /**
     * Traite l'accueil complet d'un nouveau membre (rôles, message public, DM)
     */
    async handleWelcome(member) {
        if (!member || member.user?.bot) return;

        const conf = this.getConfig();
        if (conf.enabled === false) return;

        // Condition : Le message de bienvenue n'est affiché qu'une fois le rôle requis obtenu
        const roleOk = await this.hasRequiredRole(member);
        if (!roleOk) {
            const requiredRoleId = welcomeConfig.REQUIRED_ROLE_ID;
            console.log(`⏳ [Welcome] Membre ${member.user?.tag || member.id} n'a pas encore le rôle requis (${requiredRoleId}), accueil différé.`);
            return;
        }

        const guildId = member.guild?.id;
        const userId = member.id;

        // Anti-doublon : Ne pas renvoyer le message s'il a déjà été accueilli
        if (await this.isWelcomed(guildId, userId)) {
            return;
        }

        await this.markWelcomed(guildId, userId);

        await this.assignAutoRoles(member);
        await this.sendPublicWelcome(member);
        await this.sendDmWelcome(member);
    }

    /**
     * Attribue les rôles automatiques à l'arrivée
     */
    async assignAutoRoles(member) {
        const autoRoles = welcomeConfig.AUTO_ROLES || [];
        if (!Array.isArray(autoRoles) || autoRoles.length === 0) return;

        for (const roleId of autoRoles) {
            try {
                if (roleId && member.roles?.add) {
                    await member.roles.add(roleId);
                    console.log(`🎖️ [Welcome] Rôle auto (${roleId}) attribué à ${member.user?.tag || member.id}`);
                }
            } catch (err) {
                console.error(`❌ [Welcome] Erreur ajout rôle auto (${roleId}):`, err.message);
            }
        }
    }

    /**
     * Envoie le message de bienvenue avec les 3 boutons dans le salon public
     */
    async sendPublicWelcome(member) {
        const welcomeMsgConf = welcomeConfig.WELCOME_MESSAGE;
        const channelId = welcomeConfig.WELCOME_CHANNEL_ID;

        if (welcomeMsgConf?.enabled === false || !channelId) return;

        try {
            const channel = await member.guild.channels.fetch(channelId);
            if (!channel || !channel.isTextBased()) return;

            const slurpEmoji = this.resolveEmoji(member.guild, welcomeConfig.EMOJI_SLURP, ':slurp:');

            const template = welcomeConfig.WELCOME_TEXT_TEMPLATE;
            const content = template
                .replace('{Mentionner tous les membres}', '@everyone')
                .replace('{everyone}', '@everyone')
                .replace('{mentionner le nouveau membre}', `<@${member.id}>`)
                .replace('{user}', `<@${member.id}>`)
                .replace(':Propertyslurp:', slurpEmoji)
                .replace('{slurp}', slurpEmoji);

            const buttonsRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`welcome_drink_juice_${member.id}`)
                    .setLabel('Offrir un jus de fruits')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🧃'),
                new ButtonBuilder()
                    .setCustomId(`welcome_drink_coffee_${member.id}`)
                    .setLabel('Offrir un café')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('☕'),
                new ButtonBuilder()
                    .setCustomId(`welcome_drink_chocolate_${member.id}`)
                    .setLabel('Offrir un chocolat chaud')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🍫')
            );

            const payload = {
                content,
                components: [buttonsRow],
                allowedMentions: { parse: ['everyone', 'users'] }
            };

            // Support rétrocompatible pour un embed si explicitement demandé dans la configuration
            if (welcomeMsgConf && welcomeMsgConf.use_embed === true) {
                const embed = new EmbedBuilder()
                    .setColor(welcomeMsgConf.color || welcomeConfig.welcome_color || '#f2c7ce')
                    .setTitle(welcomeMsgConf.title?.replace('{server}', member.guild.name) || `🎉 Bienvenue sur ${member.guild.name} !`)
                    .setDescription(
                        welcomeMsgConf.description
                            ?.replace('{user}', `<@${member.id}>`)
                            ?.replace('{username}', member.user?.username || '')
                            ?.replace('{server}', member.guild.name)
                            ?.replace('{memberCount}', member.guild.memberCount) || `Bienvenue <@${member.id}> !`
                    )
                    .setFooter({ text: welcomeMsgConf.footer?.replace('{memberCount}', member.guild.memberCount) || `Membre #${member.guild.memberCount}` })
                    .setTimestamp();

                if (welcomeMsgConf.thumbnail === 'user' && member.user?.displayAvatarURL) {
                    embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true }));
                } else if (welcomeMsgConf.thumbnail) {
                    embed.setThumbnail(welcomeMsgConf.thumbnail);
                }

                if (welcomeMsgConf.image) {
                    embed.setImage(welcomeMsgConf.image);
                }

                if (Array.isArray(welcomeMsgConf.fields)) {
                    for (const f of welcomeMsgConf.fields) {
                        embed.addFields({ name: f.name, value: f.value, inline: !!f.inline });
                    }
                }

                payload.embeds = [embed];
            }

            await channel.send(payload);
            console.log(`🎉 [Welcome] Message de bienvenue public envoyé pour ${member.user?.tag || member.id}`);
        } catch (err) {
            console.error('❌ [Welcome] Erreur envoi message public:', err.message);
        }
    }

    /**
     * Traite les clics sur les 3 boutons de boisson de bienvenue
     */
    async handleDrinkInteraction(interaction) {
        if (!interaction.isButton || !interaction.isButton()) return;
        const customId = interaction.customId;
        if (!customId || !customId.startsWith('welcome_drink_')) return;

        const match = customId.match(/^welcome_drink_(juice|coffee|chocolate)_(.+)$/);
        if (!match) return;

        const drinkType = match[1];
        const newMemberId = match[2];

        // Règle : Si le nouveau membre clique sur son propre bouton, on bloque
        if (interaction.user.id === newMemberId) {
            const selfClickMsg = welcomeConfig.DRINK_SELF_CLICK_MESSAGE || "Tu ne peux pas t'offrir une boisson à toi-même ! 😊";
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: selfClickMsg, ephemeral: true });
                } else {
                    await interaction.reply({ content: selfClickMsg, ephemeral: true });
                }
            } catch (_) {}
            return;
        }

        const drinkLabels = {
            juice: 'un jus de fruits',
            coffee: 'un café',
            chocolate: 'un chocolat chaud'
        };
        const drinkLabel = drinkLabels[drinkType] || 'une boisson';

        const demonEmoji = this.resolveEmoji(
            interaction.guild,
            welcomeConfig.EMOJI_DEMON,
            '<:Obsydemoncouverture:1488145689916473544>'
        );

        const replyContent = `<@${interaction.user.id}> a offert ${drinkLabel} à <@${newMemberId}> ${demonEmoji}`;
        const isEphemeral = welcomeConfig.DRINK_MESSAGE_EPHEMERAL !== false;

        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: replyContent, ephemeral: isEphemeral });
            } else {
                await interaction.reply({ content: replyContent, ephemeral: isEphemeral });
            }
            console.log(`☕ [Welcome] ${interaction.user?.tag || interaction.user.id} a offert ${drinkLabel} à ${newMemberId}`);
        } catch (err) {
            console.error('❌ [Welcome] Erreur interaction boisson:', err.message);
        }
    }

    /**
     * Envoie le message de bienvenue en message privé
     */
    async sendDmWelcome(member) {
        const dmConf = welcomeConfig.DM_MESSAGE;
        if (!welcomeConfig.SEND_DM || !dmConf || dmConf.enabled === false) return;

        try {
            const dmEmbed = new EmbedBuilder()
                .setColor(dmConf.color || '#f2c7ce')
                .setTitle(dmConf.title?.replace('{server}', member.guild?.name || '') || '👋 Bienvenue !')
                .setDescription(
                    dmConf.description
                        ?.replace('{user}', `<@${member.id}>`)
                        ?.replace('{username}', member.user?.username || '')
                        ?.replace('{server}', member.guild?.name || '') || `Salut ${member.user?.username || ''} !`
                );

            if (Array.isArray(dmConf.fields)) {
                for (const f of dmConf.fields) {
                    dmEmbed.addFields({ name: f.name, value: f.value, inline: !!f.inline });
                }
            }

            if (typeof member.send === 'function') {
                await member.send({ embeds: [dmEmbed] });
                console.log(`📩 [Welcome] DM de bienvenue envoyé à ${member.user?.tag || member.id}`);
            }
        } catch (err) {
            console.warn(`⚠️ [Welcome] Impossible d'envoyer un DM de bienvenue à ${member.user?.tag || member.id}:`, err.message);
        }
    }

    getStatus() {
        const conf = this.getConfig();
        return {
            enabled: conf.enabled !== false,
            channelId: welcomeConfig.WELCOME_CHANNEL_ID || null,
            requiredRoleId: welcomeConfig.REQUIRED_ROLE_ID || null,
            autoRoles: welcomeConfig.AUTO_ROLES || [],
            sendDm: welcomeConfig.SEND_DM
        };
    }
}

Injectable()(WelcomeService);

module.exports = {
    WelcomeService
};
