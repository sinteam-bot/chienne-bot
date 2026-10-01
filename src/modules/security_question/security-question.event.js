const { OnEvent } = require('../../core/index.js');
const { SecurityQuestionService } = require('./security-question.service.js');

class SecurityQuestionEvent {
    static inject = [SecurityQuestionService];

    constructor(service) {
        this.service = service;
    }

    async onGuildMemberAdd(member) {
        await this.service.handleMemberJoin(member);
    }

    async onGuildMemberRemove(member) {
        await this.service.handleMemberLeave(member);
    }

    async onMessageCreate(message) {
        await this.service.handleIncomingMessage(message);
    }

    async onInteractionCreate(interaction) {
        await this.service.handleButtonInteraction(interaction);
    }
}

OnEvent('guildMemberAdd', { configKey: 'captcha', priority: 20 })(SecurityQuestionEvent.prototype, 'onGuildMemberAdd');
OnEvent('guildMemberRemove', { configKey: 'captcha', priority: 20 })(SecurityQuestionEvent.prototype, 'onGuildMemberRemove');
OnEvent('messageCreate', { configKey: 'captcha', ignoreBots: true, priority: 20 })(SecurityQuestionEvent.prototype, 'onMessageCreate');
OnEvent('interactionCreate', { configKey: 'captcha', priority: 20 })(SecurityQuestionEvent.prototype, 'onInteractionCreate');

module.exports = {
    SecurityQuestionEvent
};
