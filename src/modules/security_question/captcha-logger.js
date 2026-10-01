const CAPTCHA_CONFIG = require('./captcha.config.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const STATUS_CONFIG = {
    pending: {
        label: 'En attente de validation',
        emoji: '⏳',
        color: '#3498db'
    },
    verified: {
        label: 'Vérifié avec succès',
        emoji: '✅',
        color: '#2ecc71'
    },
    already_verified: {
        label: 'Déjà vérifié (Rôle réattribué)',
        emoji: '🔄',
        color: '#2ecc71'
    },
    timeout: {
        label: 'Expiré — Auto-kické (Timeout)',
        emoji: '⏰',
        color: '#e74c3c'
    },
    left: {
        label: 'Membre parti avant validation',
        emoji: '🚪',
        color: '#95a5a6'
    },
    failed: {
        label: 'Échec — Max tentatives dépassé (Kické)',
        emoji: '❌',
        color: '#c0392b'
    },
    revoked: {
        label: 'Rôle invalidé manuellement',
        emoji: '🚫',
        color: '#e67e22'
    }
};

/**
 * Construit l'embed de suivi dynamique pour le salon de logs
 */
function buildCaptchaCardEmbed(cardData) {
    const statusKey = cardData.status || 'pending';
    const statusDef = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;

    const embed = new EmbedBuilder()
        .setColor(statusDef.color)
        .setTitle(`🛡️ Suivi Captcha • ${cardData.username || cardData.userId}`)
        .setDescription(
            `**Membre :** <@${cardData.userId}> (\`${cardData.username || 'Inconnu'}\` • \`${cardData.userId}\`)\n` +
            `**Statut :** ${statusDef.emoji} **${statusDef.label}**\n` +
            `**Salon Captcha :** ${cardData.channelId ? `<#${cardData.channelId}>` : `\`#${cardData.channelName || 'captcha-' + cardData.userId}\``}`
        )
        .addFields(
            {
                name: '🔢 Calcul',
                value: `${cardData.question || 'N/A'}\n*Réponse :* ||${cardData.answer || 'N/A'}||`,
                inline: true
            },
            {
                name: '🎯 Tentatives',
                value: `**${cardData.attempts || 0}** / ${cardData.maxAttempts || 3}`,
                inline: true
            },
            {
                name: '⏱️ Échéance',
                value: statusKey === 'pending' && cardData.expiresAt
                    ? `<t:${Math.floor(new Date(cardData.expiresAt).getTime() / 1000)}:R>`
                    : `**${statusDef.label}**`,
                inline: true
            }
        )
        .setFooter({ text: 'Système Captcha & Sécurité • Chienne Bot' })
        .setTimestamp();

    if (Array.isArray(cardData.history) && cardData.history.length > 0) {
        const historyLines = cardData.history.slice(-8).map(h => {
            const timeStr = h.timestamp ? `<t:${h.timestamp}:T>` : '';
            return `${timeStr} ${h.text}`.trim();
        });
        embed.addFields({
            name: '📜 Historique des événements',
            value: historyLines.join('\n') || 'Aucun événement',
            inline: false
        });
    }

    return embed;
}

/**
 * Construit la ligne de boutons d'action (Invalider le rôle, etc.)
 */
function buildCaptchaActionRow(cardData) {
    const isVerified = (cardData.status === 'verified' || cardData.status === 'already_verified');
    const isRevoked = cardData.status === 'revoked';

    const row = new ActionRowBuilder();
    row.addComponents(
        new ButtonBuilder()
            .setCustomId(`captcha_revoke_${cardData.userId}`)
            .setLabel(isRevoked ? 'Rôle déjà invalidé' : 'Invalider le rôle')
            .setStyle(ButtonStyle.Danger)
            .setEmoji(isRevoked ? '✖️' : '🚫')
            .setDisabled(!isVerified || isRevoked)
    );

    return row;
}

/**
 * Envoie ou met à jour la carte dynamique de suivi dans le salon de logs
 */
async function sendOrUpdateCaptchaCard(guild, cardData) {
    const logChannelId = CAPTCHA_CONFIG.CAPTCHA_LOG_CHANNEL;
    if (!logChannelId || !guild) {
        console.log(`[CAPTCHA CARD] (${cardData.status}) pour ${cardData.username} (${cardData.userId})`);
        return null;
    }

    try {
        const logChannel = await guild.channels.fetch(logChannelId).catch(() => null);
        if (!logChannel || !logChannel.isTextBased()) {
            console.log(`[CAPTCHA CARD] (${cardData.status}) pour ${cardData.username} (Salon ${logChannelId} introuvable)`);
            return null;
        }

        const embed = buildCaptchaCardEmbed(cardData);
        const row = buildCaptchaActionRow(cardData);

        // Si nous avons déjà un message de log pour ce captcha, tentons de l'éditer dynamiquement
        if (cardData.logMessageId) {
            try {
                let targetChannel = logChannel;
                if (cardData.logChannelId && cardData.logChannelId !== logChannel.id) {
                    targetChannel = await guild.channels.fetch(cardData.logChannelId).catch(() => logChannel);
                }
                const existingMsg = await targetChannel.messages.fetch(cardData.logMessageId).catch(() => null);
                if (existingMsg) {
                    const edited = await existingMsg.edit({
                        embeds: [embed],
                        components: [row]
                    });
                    return edited;
                }
            } catch (err) {
                console.warn('⚠️ [CaptchaLogger] Erreur mise à jour message log existant:', err.message);
            }
        }

        // Sinon, envoyer un nouveau message
        const sent = await logChannel.send({
            embeds: [embed],
            components: [row]
        });

        cardData.logMessageId = sent.id;
        cardData.logChannelId = logChannel.id;
        return sent;

    } catch (error) {
        console.error('❌ [CaptchaLogger] Erreur sendOrUpdateCaptchaCard:', error.message);
        return null;
    }
}

/**
 * Envoyer un log simple dans le canal de logs captcha (compatibilité rétroactive)
 * @param {object} guild - L'objet Guild de Discord.js
 * @param {string} action - L'action à logger (ex: "Création", "Succès", "Échec", etc.)
 * @param {string} message - Le message de log
 * @param {string} color - La couleur de l'embed (optionnel)
 */
async function sendCaptchaLog(guild, action, message, color = '#e6d9e7') {
    if (!CAPTCHA_CONFIG.CAPTCHA_LOG_CHANNEL || !guild) {
        console.log(`[CAPTCHA LOG] ${action}: ${message}`);
        return;
    }
    
    try {
        const logChannel = await guild.channels.fetch(CAPTCHA_CONFIG.CAPTCHA_LOG_CHANNEL).catch(() => null);
        
        if (!logChannel || !logChannel.isTextBased()) {
            console.log(`[CAPTCHA LOG] ${action}: ${message}`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`⚡ ${action}`)
            .setDescription(message)
            .setTimestamp()
            .setFooter({ text: 'Système Captcha' });
        
        await logChannel.send({ embeds: [embed] });
        console.log(`[CAPTCHA LOG] ${action}: ${message}`);
    } catch (error) {
        console.error('❌ Erreur envoi log captcha:', error.message);
        console.log(`[CAPTCHA LOG] ${action}: ${message}`);
    }
}

module.exports = {
    STATUS_CONFIG,
    buildCaptchaCardEmbed,
    buildCaptchaActionRow,
    sendOrUpdateCaptchaCard,
    sendCaptchaLog
};
