const { getConfig, saveModuleConfig } = require('../../config/index.js');

function getWelcomeConfig() {
    const fullConfig = getConfig();
    const w = fullConfig.welcome || {};

    return {
        get WELCOME_CHANNEL_ID() {
            return w.channel_id || '1337807772024180756';
        },
        set WELCOME_CHANNEL_ID(val) {
            w.channel_id = val;
            saveModuleConfig('welcome', w);
        },
        get channel_id() {
            return w.channel_id || '1337807772024180756';
        },
        set channel_id(val) {
            w.channel_id = val;
            saveModuleConfig('welcome', w);
        },

        get REQUIRED_ROLE_ID() {
            return w.required_role_id !== undefined ? w.required_role_id : '1337550070681174056';
        },
        set REQUIRED_ROLE_ID(val) {
            w.required_role_id = val;
            saveModuleConfig('welcome', w);
        },
        get required_role_id() {
            return this.REQUIRED_ROLE_ID;
        },
        set required_role_id(val) {
            this.REQUIRED_ROLE_ID = val;
        },

        get WELCOME_TEXT_TEMPLATE() {
            return w.welcome_text_template || w.message_template || '{everyone} {user} tu as prise notre invitation, alors installe toi confortablement avec ton plaid parmi nous. On papote et on partage tout ce dont nous avons besoin {slurp}';
        },
        set WELCOME_TEXT_TEMPLATE(val) {
            w.welcome_text_template = val;
            saveModuleConfig('welcome', w);
        },
        get welcome_text_template() {
            return this.WELCOME_TEXT_TEMPLATE;
        },
        set welcome_text_template(val) {
            this.WELCOME_TEXT_TEMPLATE = val;
        },

        get EMOJI_SLURP() {
            return w.emoji_slurp || 'slurp';
        },
        set EMOJI_SLURP(val) {
            w.emoji_slurp = val;
            saveModuleConfig('welcome', w);
        },
        get emoji_slurp() {
            return this.EMOJI_SLURP;
        },
        set emoji_slurp(val) {
            this.EMOJI_SLURP = val;
        },

        get EMOJI_DEMON() {
            return w.emoji_demon || '1488145689916473544';
        },
        set EMOJI_DEMON(val) {
            w.emoji_demon = val;
            saveModuleConfig('welcome', w);
        },
        get emoji_demon() {
            return this.EMOJI_DEMON;
        },
        set emoji_demon(val) {
            this.EMOJI_DEMON = val;
        },

        get DRINK_MESSAGE_EPHEMERAL() {
            return w.drink_message_ephemeral !== undefined ? w.drink_message_ephemeral : true;
        },
        set DRINK_MESSAGE_EPHEMERAL(val) {
            w.drink_message_ephemeral = val;
            saveModuleConfig('welcome', w);
        },
        get drink_message_ephemeral() {
            return this.DRINK_MESSAGE_EPHEMERAL;
        },
        set drink_message_ephemeral(val) {
            this.DRINK_MESSAGE_EPHEMERAL = val;
        },

        get DRINK_SELF_CLICK_MESSAGE() {
            return w.drink_self_click_message || "Tu ne peux pas t'offrir une boisson à toi-même ! 😊";
        },
        set DRINK_SELF_CLICK_MESSAGE(val) {
            w.drink_self_click_message = val;
            saveModuleConfig('welcome', w);
        },
        get drink_self_click_message() {
            return this.DRINK_SELF_CLICK_MESSAGE;
        },
        set drink_self_click_message(val) {
            this.DRINK_SELF_CLICK_MESSAGE = val;
        },

        get welcome_channel_name() {
            return w.welcome_channel_name || 'bienvenue';
        },
        get welcome_color() {
            return w.welcome_color || '#f2c7ce';
        },

        get AUTO_ROLES() {
            return w.AUTO_ROLES || w.auto_roles || [];
        },
        set AUTO_ROLES(val) {
            w.AUTO_ROLES = val;
            saveModuleConfig('welcome', w);
        },
        get auto_roles() {
            return w.AUTO_ROLES || w.auto_roles || [];
        },

        get WELCOME_MESSAGE() {
            return w.welcome_message || {
                title: '🎉 Bienvenue sur {server} !',
                description: 'Bienvenue {user} !\n\nNous sommes ravis de t\'accueillir parmi nous ! 🎊',
                color: '#f2c7ce',
                footer: 'Membre #{memberCount}',
                thumbnail: 'user',
                image: null,
                fields: [
                    {
                        name: '📚 Pour commencer',
                        value: '• Lis les règles dans <#CHANNEL_REGLES_ID>\n• Présente-toi dans <#CHANNEL_PRESENTATION_ID>\n• N\'hésite pas à poser des questions !',
                        inline: false
                    },
                    {
                        name: '🎮 Commandes utiles',
                        value: '`/help` - Liste des commandes\n`/rank` - Voir ton niveau',
                        inline: true
                    }
                ]
            };
        },
        set WELCOME_MESSAGE(val) {
            w.welcome_message = val;
            saveModuleConfig('welcome', w);
        },
        get welcome_message() {
            return this.WELCOME_MESSAGE;
        },

        get ENABLED() {
            return w.enabled !== undefined ? w.enabled : true;
        },
        set ENABLED(val) {
            w.enabled = val;
            saveModuleConfig('welcome', w);
        },
        get enabled() {
            return this.ENABLED;
        },

        get SEND_DM() {
            return w.dm_message?.enabled !== undefined ? w.dm_message.enabled : (w.SEND_DM ?? true);
        },
        set SEND_DM(val) {
            w.SEND_DM = val;
            if (w.dm_message) w.dm_message.enabled = val;
            saveModuleConfig('welcome', w);
        },

        get DM_MESSAGE() {
            return w.dm_message || {
                title: '👋 Bienvenue !',
                description: 'Salut {username} !\n\nBienvenue sur **{server}** ! Nous espérons que tu vas t\'amuser avec nous. 😊',
                color: '#f2c7ce',
                fields: [
                    {
                        name: '💡 Conseil',
                        value: 'N\'oublie pas de te présenter pour que la communauté apprenne à te connaître !',
                        inline: false
                    }
                ]
            };
        },
        set DM_MESSAGE(val) {
            w.dm_message = val;
            saveModuleConfig('welcome', w);
        },
        get dm_message() {
            return this.DM_MESSAGE;
        },

        get LOG_TO_CONSOLE() {
            return w.LOG_TO_CONSOLE !== undefined ? w.LOG_TO_CONSOLE : true;
        }
    };
}

module.exports = new Proxy({}, {
    get(target, prop) {
        const conf = getWelcomeConfig();
        if (prop in conf) {
            return conf[prop];
        }
        return getConfig().welcome?.[prop];
    },
    set(target, prop, value) {
        const conf = getWelcomeConfig();
        conf[prop] = value;
        return true;
    },
    ownKeys() {
        const conf = getWelcomeConfig();
        return Array.from(new Set([...Object.keys(conf), ...Object.keys(getConfig().welcome || {})]));
    },
    getOwnPropertyDescriptor(target, prop) {
        return {
            enumerable: true,
            configurable: true,
            value: this.get(target, prop)
        };
    }
});
