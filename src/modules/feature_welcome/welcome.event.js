const { OnEvent } = require('../../core/index.js');
const { WelcomeService } = require('./welcome.service.js');
const { config, getConfig } = require('../../config/index.js');
const welcomeConfig = require('./welcome.config.js');

class WelcomeEvent {
    static inject = [WelcomeService];

    constructor(service) {
        this.service = service;
    }

    async onGuildMemberAdd(member) {
        if (!member || member.user?.bot) return;

        const currentConfig = getConfig ? getConfig() : config;
        const isCaptchaActive = currentConfig.captcha && currentConfig.captcha.enabled !== false;

        // Si le captcha est activé, SecurityQuestionService déclenchera l'accueil après validation
        // Si le captcha est désactivé, handleWelcome vérifiera si un rôle est requis avant d'afficher le message
        if (!isCaptchaActive) {
            await this.service.handleWelcome(member);
        }
    }

    async onGuildMemberUpdate(oldMember, newMember) {
        if (!newMember || newMember.user?.bot) return;

        const requiredRoleId = welcomeConfig.REQUIRED_ROLE_ID;
        if (!requiredRoleId) return;

        const hadRole = oldMember?.roles?.cache?.has ? oldMember.roles.cache.has(requiredRoleId) : false;
        const hasRole = newMember.roles?.cache?.has ? newMember.roles.cache.has(requiredRoleId) : false;

        // Détecter l'attribution du rôle requis après vérification
        if (!hadRole && hasRole) {
            console.log(`🎯 [Welcome] Membre ${newMember.user?.tag || newMember.id} a obtenu le rôle requis (${requiredRoleId}), déclenchement accueil.`);
            await this.service.handleWelcome(newMember);
        }
    }

    async onGuildMemberRemove(member) {
        if (!member || member.user?.bot) return;
        await this.service.resetWelcome(member.guild?.id, member.id);
    }

    async onInteractionCreate(interaction) {
        await this.service.handleDrinkInteraction(interaction);
    }
}

OnEvent('guildMemberAdd', { priority: 1, configKey: 'welcome' })(WelcomeEvent.prototype, 'onGuildMemberAdd');
OnEvent('guildMemberUpdate', { priority: 1, configKey: 'welcome' })(WelcomeEvent.prototype, 'onGuildMemberUpdate');
OnEvent('guildMemberRemove', { priority: 1, configKey: 'welcome' })(WelcomeEvent.prototype, 'onGuildMemberRemove');
OnEvent('interactionCreate', { priority: 10, configKey: 'welcome' })(WelcomeEvent.prototype, 'onInteractionCreate');

module.exports = {
    WelcomeEvent
};
