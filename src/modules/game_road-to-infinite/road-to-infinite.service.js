const { EmbedBuilder } = require('discord.js');
const { Injectable } = require('../../core/index.js');
const { RoadToInfiniteRepository } = require('./road-to-infinite.repository.js');
const { config, getConfig } = require('../../config/index.js');

class RoadToInfiniteService {
    static inject = [RoadToInfiniteRepository];

    constructor(repository) {
        this.repo = repository;
    }

    getConfig() {
        const currentConfig = getConfig ? getConfig() : config;
        return currentConfig.counter || {};
    }

    formatMessage(template, replacements = {}) {
        if (!template) return '';
        let res = template;
        for (const [key, val] of Object.entries(replacements)) {
            res = res.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
        }
        return res;
    }

    /**
     * Traite un message reçu dans le canal de la Route de l'Infini
     * @param {import('discord.js').Message} message
     */
    async handleIncomingMessage(message) {
        const counterConfig = this.getConfig();
        if (counterConfig.enabled === false) return;

        const COUNTER_CHANNEL_ID = counterConfig.channel_id || '1533492692825276598';
        const trapChance = counterConfig.trap_chance !== undefined ? counterConfig.trap_chance : 0.15;
        const emojis = counterConfig.emojis || {};
        const EMOJI_OBSYBON_ID = emojis.obsybon_id || '1524104068514189422';
        const EMOJI_OBSYDEMON_ID = emojis.obsydemon_id || '1488145689916473544';
        const messages = counterConfig.messages || {};

        if (message.channel.id !== COUNTER_CHANNEL_ID || message.author.bot) {
            return;
        }

        try {
            let state = await this.repo.getState(COUNTER_CHANNEL_ID);

            // Auto-initialisation si l'état n'existe pas en BDD
            if (!state) {
                console.log('🔄 [COUNTER] Initialisation automatique du compteur à partir de l\'historique...');
                let lastValidNum = 0;
                let lastUserId = null;

                const fetchedMessages = await message.channel.messages.fetch({ limit: 30 });
                const sortedMessages = Array.from(fetchedMessages.values())
                    .filter(m => m.id !== message.id && !m.author.bot)
                    .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

                for (const msg of sortedMessages) {
                    const text = msg.content.trim();
                    if (/^\d+$/.test(text)) {
                        lastValidNum = parseInt(text, 10);
                        lastUserId = msg.author.id;
                    }
                }

                state = await this.repo.updateState(COUNTER_CHANNEL_ID, lastValidNum, 0, null, lastUserId, 0);
                console.log(`✅ [COUNTER] Compteur initialisé au nombre: ${lastValidNum}`);
            }

            // 1. Vérification : Pas deux nombres consécutifs par le même utilisateur
            if (state.last_user_id === message.author.id) {
                try {
                    const obsyDemonEmoji = message.guild?.emojis.cache.get(EMOJI_OBSYDEMON_ID) || EMOJI_OBSYDEMON_ID;
                    await message.react(obsyDemonEmoji);
                } catch {
                    await message.react('❌').catch(() => {});
                }

                const doublePostIsError = counterConfig.double_post_is_error !== undefined
                    ? counterConfig.double_post_is_error !== false
                    : (counterConfig.double_post_as_error !== undefined
                        ? counterConfig.double_post_as_error !== false
                        : true);

                if (!doublePostIsError) {
                    const doublePostMsg = this.formatMessage(
                        messages.double_post_message || "<@{userId}>, **vous ne pouvez pas partager deux nombres à la suite** <:Obsydemoncouverture:{emojiObsydemon}>",
                        {
                            userId: message.author.id,
                            username: message.author.username,
                            emojiObsydemon: EMOJI_OBSYDEMON_ID
                        }
                    );

                    await message.channel.send(doublePostMsg);
                    console.log(`⚠️ [COUNTER] ${message.author.tag} a essayé de poster deux fois d'affilée.`);
                    return;
                }

                // Si le double-post est compté comme une erreur
                const currentNumber = state.current_number || 0;
                const expectedNumber = currentNumber + 1;
                const maxErrors = Math.max(1, parseInt(counterConfig.max_errors || 1, 10));
                const newErrorCount = (state.error_count || 0) + 1;

                if (newErrorCount < maxErrors) {
                    await this.repo.updateState(
                        COUNTER_CHANNEL_ID,
                        currentNumber,
                        state.is_trap_active ? 1 : 0,
                        state.trap_number,
                        state.last_user_id,
                        newErrorCount
                    );

                    let doublePostMsg = this.formatMessage(
                        messages.double_post_message || "<@{userId}>, **vous ne pouvez pas partager deux nombres à la suite** (**{errorsCount}/{maxErrors} erreurs** tolérées) <:Obsydemoncouverture:{emojiObsydemon}>. Le nombre attendu reste **{expectedNumber}**.",
                        {
                            userId: message.author.id,
                            username: message.author.username,
                            errorsCount: newErrorCount,
                            maxErrors,
                            remainingErrors: maxErrors - newErrorCount,
                            expectedNumber,
                            postedNumber: message.content,
                            emojiObsydemon: EMOJI_OBSYDEMON_ID
                        }
                    );

                    if (messages.double_post_message && !messages.double_post_message.includes('{errorsCount}')) {
                        doublePostMsg += ` (**${newErrorCount}/${maxErrors} erreurs** tolérées). Le nombre attendu reste **${expectedNumber}**.`;
                    }

                    await message.channel.send(doublePostMsg);
                    console.log(`⚠️ [COUNTER] ${message.author.tag} a fait une erreur de double-post (${newErrorCount}/${maxErrors} erreurs). Compteur maintenu à ${currentNumber}.`);
                    return;
                }

                // Seuil d'erreurs atteint -> Game Over & Reset avec embed d'erreur
                const doublePostMsg = this.formatMessage(
                    messages.double_post_message || "<@{userId}>, **tu ne peux pas partager deux nombres à la suite** <:Obsydemoncouverture:{emojiObsydemon}>",
                    {
                        userId: message.author.id,
                        username: message.author.username,
                        errorsCount: newErrorCount,
                        maxErrors,
                        remainingErrors: 0,
                        expectedNumber,
                        postedNumber: message.content,
                        emojiObsydemon: EMOJI_OBSYDEMON_ID
                    }
                );

                await this.handleGameOver(message, COUNTER_CHANNEL_ID, messages, newErrorCount, maxErrors, expectedNumber, { errorMessage: doublePostMsg });
                return;
            }

            const currentNumber = state.current_number || 0;
            const contentText = message.content.trim();
            const isNumberFormat = /^\d+$/.test(contentText);
            const postedNumber = isNumberFormat ? parseInt(contentText, 10) : null;

            // 2. Piège actif
            if (state.is_trap_active === 1) {
                const trapNum = state.trap_number;

                if (postedNumber !== null && postedNumber === trapNum) {
                    // 🎉 Esquivé !
                    try {
                        const obsybonEmoji = message.guild?.emojis.cache.get(EMOJI_OBSYBON_ID) || EMOJI_OBSYBON_ID;
                        await message.react(obsybonEmoji);
                    } catch {
                        await message.react('✅').catch(() => {});
                    }

                    const dodgeMsg = this.formatMessage(
                        messages.trap_dodge_message || "**J’ai cru que j’allais vous avoir <:Obsydemoncouverture:{emojiObsydemon}>**",
                        {
                            userId: message.author.id,
                            username: message.author.username,
                            emojiObsydemon: EMOJI_OBSYDEMON_ID
                        }
                    );
                    await message.channel.send(dodgeMsg);

                    await this.repo.addScore(COUNTER_CHANNEL_ID, message.author.id, message.author.username);
                    await this.repo.updateState(COUNTER_CHANNEL_ID, trapNum, 0, null, message.author.id, state.error_count || 0);

                    console.log(`🛡️ [COUNTER] ${message.author.tag} a esquivé le piège (${trapNum}) !`);
                    return;

                } else {
                    // ❌ Tombé dans le piège !
                    try {
                        const obsyDemonEmoji = message.guild?.emojis.cache.get(EMOJI_OBSYDEMON_ID) || EMOJI_OBSYDEMON_ID;
                        await message.react(obsyDemonEmoji);
                    } catch {
                        await message.react('❌').catch(() => {});
                    }

                    const maxErrors = Math.max(1, parseInt(counterConfig.max_errors || 1, 10));
                    const newErrorCount = (state.error_count || 0) + 1;

                    const trapFailMsg = this.formatMessage(
                        messages.trap_failed_message || "<@{userId}>**, Je t’ai eu !** (**{errorsCount}/{maxErrors} erreurs** tolérées) <:Obsydemoncouverture:{emojiObsydemon}>. Le prochain nombre attendu est **{expectedNumber}**.",
                        {
                            userId: message.author.id,
                            username: message.author.username,
                            errorsCount: newErrorCount,
                            maxErrors,
                            remainingErrors: Math.max(0, maxErrors - newErrorCount),
                            expectedNumber: currentNumber + 1,
                            emojiObsydemon: EMOJI_OBSYDEMON_ID
                        }
                    );

                    if (newErrorCount < maxErrors) {
                        await this.repo.updateState(COUNTER_CHANNEL_ID, currentNumber, 0, null, state.last_user_id, newErrorCount);
                        await message.channel.send(trapFailMsg);
                        console.log(`🪤 [COUNTER] ${message.author.tag} est tombé dans le piège (${newErrorCount}/${maxErrors} erreurs)`);
                        return;
                    }

                    // Seuil d'erreurs atteint lors du piège -> Reset de la partie
                    await this.handleGameOver(message, COUNTER_CHANNEL_ID, messages, newErrorCount, maxErrors, currentNumber + 1, { errorMessage: trapFailMsg });
                    return;
                }
            }

            // 3. Déroulement normal
            const expectedNumber = currentNumber + 1;

            if (postedNumber !== null && postedNumber === expectedNumber) {
                // ✅ Nombre correct
                try {
                    const obsybonEmoji = message.guild?.emojis.cache.get(EMOJI_OBSYBON_ID) || EMOJI_OBSYBON_ID;
                    await message.react(obsybonEmoji);
                } catch {
                    await message.react('✅').catch(() => {});
                }

                await this.repo.addScore(COUNTER_CHANNEL_ID, message.author.id, message.author.username);
                console.log(`🔢 [COUNTER] ${message.author.tag} a validé le nombre ${expectedNumber}`);

                // 4. Tirage aléatoire d'un piège
                const shouldTrap = (expectedNumber > 5) && (Math.random() < trapChance);

                if (shouldTrap) {
                    const trapNumber = expectedNumber + 1;
                    console.log(`🪤 [COUNTER] Piège déclenché par le bot ! Nombre posté : ${trapNumber}`);

                    await message.channel.send(`${trapNumber}`);
                    await this.repo.updateState(COUNTER_CHANNEL_ID, trapNumber, 1, trapNumber, message.author.id, state.error_count || 0);
                } else {
                    await this.repo.updateState(COUNTER_CHANNEL_ID, expectedNumber, 0, null, message.author.id, state.error_count || 0);
                }

            } else {
                // ❌ Erreur : Nombre incorrect
                try {
                    const obsyDemonEmoji = message.guild?.emojis.cache.get(EMOJI_OBSYDEMON_ID) || EMOJI_OBSYDEMON_ID;
                    await message.react(obsyDemonEmoji);
                } catch {
                    await message.react('❌').catch(() => {});
                }

                const maxErrors = Math.max(1, parseInt(counterConfig.max_errors || 1, 10));
                const newErrorCount = (state.error_count || 0) + 1;

                if (newErrorCount < maxErrors) {
                    await this.repo.updateState(COUNTER_CHANNEL_ID, currentNumber, 0, null, state.last_user_id, newErrorCount);

                    const warningMsg = this.formatMessage(
                        messages.warning_message || "⚠️ <@{userId}> s'est trompé(e) ! (**{errorsCount}/{maxErrors} erreurs** tolérées). Le nombre attendu reste **{expectedNumber}**.",
                        {
                            userId: message.author.id,
                            username: message.author.username,
                            errorsCount: newErrorCount,
                            maxErrors,
                            remainingErrors: maxErrors - newErrorCount,
                            expectedNumber,
                            postedNumber: message.content,
                            emojiObsydemon: EMOJI_OBSYDEMON_ID
                        }
                    );

                    await message.channel.send(warningMsg);
                    console.log(`⚠️ [COUNTER] ${message.author.tag} a fait une erreur (${newErrorCount}/${maxErrors} erreurs). Compteur maintenu à ${currentNumber}.`);
                    return;
                }

                const defaultErrorMsg = "**Oups <@{userId}> s'est trompé(e), je vais devoir mordre** <:Obsydemoncouverture:{emojiObsydemon}>";
                const errorMsg = this.formatMessage(
                    messages.error_message || defaultErrorMsg,
                    {
                        userId: message.author.id,
                        username: message.author.username,
                        expectedNumber,
                        postedNumber: message.content,
                        errorsCount: newErrorCount,
                        maxErrors,
                        emojiObsydemon: counterConfig.emojis?.obsydemon_id || '1488145689916473544'
                    }
                );

                // Seuil d'erreurs atteint -> Reset de la partie
                await this.handleGameOver(message, COUNTER_CHANNEL_ID, messages, newErrorCount, maxErrors, expectedNumber, { errorMessage: errorMsg });
            }

        } catch (error) {
            console.error('❌ [COUNTER Service] Erreur:', error);
        }
    }

    async handleGameOver(message, channelId, messages, errorsCount, maxErrors, expectedNumber, options = {}) {
        const counterConfig = this.getConfig();
        const showRanking = counterConfig.show_ranked !== undefined
            ? counterConfig.show_ranked !== false
            : (counterConfig.show_ranking !== false && counterConfig.ranking_enabled !== false && counterConfig.enable_ranking !== false);

        const startNumber = counterConfig.start_number || 1;
        const restartMsg = this.formatMessage(
            messages.start_message || "**Allez la chienne commence :** {number}",
            { number: startNumber }
        );

        const defaultErrorMsg = "**Oups <@{userId}> s'est trompé(e), je vais devoir mordre** <:Obsydemoncouverture:{emojiObsydemon}>";
        const errorText = options.errorMessage || this.formatMessage(
            messages.error_message || defaultErrorMsg,
            {
                userId: message.author.id,
                username: message.author.username,
                expectedNumber,
                postedNumber: message.content,
                errorsCount,
                maxErrors,
                emojiObsydemon: counterConfig.emojis?.obsydemon_id || '1488145689916473544'
            }
        );

        let description = '';

        if (showRanking) {
            const scores = await this.repo.getScores(channelId);

            let rankingText = messages.no_participation || "Aucune participation enregistrée pour cette session.";
            if (scores.length > 0) {
                rankingText = scores.map((s, index) => {
                    const medal = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : '👤'));
                    return `${medal} **${s.username}** : ${s.score} point(s)`;
                }).join('\n');
            }

            const defaultHeader = options.errorMessage
                ? `🏆 **Classement de la Route de l'Infini**`
                : (messages.ranking_header || "**<@{userId}> a ruiné la Route de l'Infini après {maxErrors} erreur(s) !** \n\n 🏆 **Classement de la Route de l'Infini**");

            const rankingHeader = this.formatMessage(
                defaultHeader,
                {
                    userId: message.author.id,
                    username: message.author.username,
                    expectedNumber,
                    postedNumber: message.content,
                    errorsCount,
                    maxErrors,
                    emojiObsydemon: counterConfig.emojis?.obsydemon_id || '1488145689916473544'
                }
            );

            const rankingFooter = messages.ranking_footer ? `\n\n${messages.ranking_footer}` : '';

            if (options.errorMessage) {
                description = `${errorText}\n\n${rankingHeader}\n${rankingText}${rankingFooter}\n\n${restartMsg}`;
            } else {
                description = `${rankingHeader}\n${rankingText}${rankingFooter}\n\n${restartMsg}`;
            }
        } else {
            description = `${errorText}\n\n${restartMsg}`;
        }

        const useEmbed = counterConfig.use_embed !== false && messages.use_embed !== false;
        if (!useEmbed) {
            await message.channel.send(errorText);
            await message.channel.send(restartMsg);
        } else {
            const embed = new EmbedBuilder()
                .setColor(messages.embed_color || '#F2C7CE')
                .setTitle(messages.embed_title || "C'est moche !")
                .setDescription(description)
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });
        }

        await this.repo.resetScores(channelId);
        await this.repo.updateState(channelId, 0, 0, null, null, 0);

        console.log(`❌ [COUNTER] ${message.author.tag} a atteint la limite d'erreurs (${errorsCount}/${maxErrors}). Compteur réinitialisé.`);
    }

    async getGameState(channelId = null) {
        const conf = this.getConfig();
        const targetChannel = channelId || conf.channel_id || '1533492692825276598';
        const state = await this.repo.getState(targetChannel);
        const showRanking = conf.show_ranked !== undefined
            ? conf.show_ranked !== false
            : (conf.show_ranking !== false && conf.ranking_enabled !== false && conf.enable_ranking !== false);
        return {
            channelId: targetChannel,
            currentNumber: state?.current_number || 0,
            errorCount: state?.error_count || 0,
            maxErrors: conf.max_errors || 1,
            isTrapActive: state?.is_trap_active === 1,
            trapNumber: state?.trap_number || null,
            lastUserId: state?.last_user_id || null,
            updatedAt: state?.updated_at || null,
            enabled: conf.enabled !== false,
            showRanking
        };
    }

    async getLeaderboard(channelId = null, limit = 10) {
        const targetChannel = channelId || this.getConfig().channel_id || '1533492692825276598';
        const scores = await this.repo.getScores(targetChannel, limit);
        return scores;
    }

    async resetGame(channelId = null) {
        const targetChannel = channelId || this.getConfig().channel_id || '1533492692825276598';
        await this.repo.resetScores(targetChannel);
        await this.repo.updateState(targetChannel, 0, 0, null, null, 0);
        return { success: true, message: 'Compteur réinitialisé avec succès.' };
    }
}

Injectable()(RoadToInfiniteService);

module.exports = {
    RoadToInfiniteService
};
