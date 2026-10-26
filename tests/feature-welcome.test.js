const { test, describe } = require('node:test');
const assert = require('node:assert');
const { container } = require('../src/core/container.js');
const { WelcomeService } = require('../src/modules/feature_welcome/welcome.service.js');
const { WelcomeEvent } = require('../src/modules/feature_welcome/welcome.event.js');
const { WelcomeController } = require('../src/modules/feature_welcome/welcome.controller.js');
const welcomeConfig = require('../src/modules/feature_welcome/welcome.config.js');

describe('Feature: Welcome Module Tests', () => {

    test('Service: should defer welcome message if member does not have required role', async () => {
        const service = new WelcomeService();
        service.getConfig = () => ({ enabled: true });

        let publicSent = null;
        const mockMember = {
            id: 'unverified_user_1',
            user: { id: 'unverified_user_1', username: 'NewUser', tag: 'NewUser#1234', bot: false },
            guild: {
                id: 'guild_123',
                name: 'Test Server',
                memberCount: 50,
                channels: {
                    fetch: async () => ({
                        isTextBased: () => true,
                        send: async (p) => { publicSent = p; }
                    })
                }
            },
            roles: {
                cache: new Set([]), // Rôle requis absent
                add: async () => {}
            }
        };

        await service.handleWelcome(mockMember);

        assert.strictEqual(publicSent, null, 'Le message public ne doit pas être envoyé tant que le rôle requis manque');
    });

    test('Service: should send welcome message with 3 buttons when member has required role', async () => {
        const service = new WelcomeService();
        service.getConfig = () => ({ enabled: true });

        let publicSent = null;
        let dmSent = null;
        const requiredRole = welcomeConfig.REQUIRED_ROLE_ID;

        const mockMember = {
            id: 'verified_user_2',
            user: { id: 'verified_user_2', username: 'VerifiedUser', tag: 'VerifiedUser#5678', bot: false },
            guild: {
                id: 'guild_123',
                name: 'Test Server',
                memberCount: 51,
                channels: {
                    fetch: async (id) => {
                        assert.strictEqual(id, '1337807772024180756', 'Doit envoyer dans le salon 1337807772024180756');
                        return {
                            isTextBased: () => true,
                            send: async (p) => { publicSent = p; }
                        };
                    }
                },
                emojis: {
                    cache: new Map([
                        ['slurp_id', { id: '999888777', name: 'slurp', animated: false }]
                    ])
                }
            },
            roles: {
                cache: new Set([requiredRole]), // Rôle vérifié présent
                add: async () => {}
            },
            send: async (payload) => { dmSent = payload; }
        };

        await service.handleWelcome(mockMember);

        assert.ok(publicSent, 'Le message de bienvenue doit être envoyé');
        assert.ok(publicSent.content.includes('@everyone'), 'Doit mentionner tous les membres');
        assert.ok(publicSent.content.includes('<@verified_user_2>'), 'Doit mentionner le nouveau membre');
        assert.ok(publicSent.content.includes('tu as prise notre invitation, alors installe toi confortablement avec ton plaid parmi nous.'), 'Doit contenir le texte exact');
        assert.ok(publicSent.content.includes('<:slurp:999888777>'), 'Doit résoudre l\'émoji slurp');

        // Vérification des 3 boutons
        assert.strictEqual(publicSent.components.length, 1);
        const row = publicSent.components[0];
        const buttons = row.components.map(b => b.data || b);
        assert.strictEqual(buttons.length, 3, 'Doit avoir 3 boutons');

        assert.strictEqual(buttons[0].label, 'Offrir un jus de fruits');
        assert.strictEqual(buttons[0].custom_id, 'welcome_drink_juice_verified_user_2');

        assert.strictEqual(buttons[1].label, 'Offrir un café');
        assert.strictEqual(buttons[1].custom_id, 'welcome_drink_coffee_verified_user_2');

        assert.strictEqual(buttons[2].label, 'Offrir un chocolat chaud');
        assert.strictEqual(buttons[2].custom_id, 'welcome_drink_chocolate_verified_user_2');
    });

    test('Service: should prevent duplicate welcome messages for the same member', async () => {
        const service = new WelcomeService();
        service.getConfig = () => ({ enabled: true });

        let sendCount = 0;
        const requiredRole = welcomeConfig.REQUIRED_ROLE_ID;

        const mockMember = {
            id: 'user_duplicate_check',
            user: { id: 'user_duplicate_check', username: 'DupUser', tag: 'DupUser#9999', bot: false },
            guild: {
                id: 'guild_dup',
                name: 'Test Server',
                channels: {
                    fetch: async () => ({
                        isTextBased: () => true,
                        send: async () => { sendCount++; }
                    })
                }
            },
            roles: {
                cache: new Set([requiredRole])
            }
        };

        await service.handleWelcome(mockMember);
        assert.strictEqual(sendCount, 1);

        // Deuxième appel pour le même membre
        await service.handleWelcome(mockMember);
        assert.strictEqual(sendCount, 1, 'Ne doit pas envoyer de deuxième message');
    });

    test('Service: should handle drink button interactions correctly', async () => {
        const service = new WelcomeService();

        // 1. Le nouveau membre clique sur son propre bouton -> Bloqué
        let selfReply = null;
        const selfInteraction = {
            isButton: () => true,
            customId: 'welcome_drink_juice_newbie_1',
            user: { id: 'newbie_1', tag: 'Newbie#0001' },
            guild: null,
            reply: async (p) => { selfReply = p; }
        };

        await service.handleDrinkInteraction(selfInteraction);
        assert.ok(selfReply, 'Doit recevoir une réponse éphémère');
        assert.strictEqual(selfReply.ephemeral, true);
        assert.strictEqual(selfReply.content, "Tu ne peux pas t'offrir une boisson à toi-même ! 😊");

        // 2. Un autre membre clique sur "Offrir un jus de fruits" -> Réponse privée dans le salon
        let otherReply = null;
        const otherInteraction = {
            isButton: () => true,
            customId: 'welcome_drink_juice_newbie_1',
            user: { id: 'friend_2', tag: 'Friend#0002' },
            guild: {
                emojis: {
                    cache: new Map([
                        ['1488145689916473544', { id: '1488145689916473544', name: 'Obsydemoncouverture', animated: false }]
                    ])
                }
            },
            reply: async (p) => { otherReply = p; }
        };

        await service.handleDrinkInteraction(otherInteraction);
        assert.ok(otherReply, 'Doit recevoir une réponse');
        assert.strictEqual(otherReply.ephemeral, true, 'Doit être en privé dans le salon (ephemeral: true)');
        assert.strictEqual(
            otherReply.content,
            '<@friend_2> a offert un jus de fruits à <@newbie_1> <:Obsydemoncouverture:1488145689916473544>'
        );

        // 3. Un autre membre offre un café
        let coffeeReply = null;
        const coffeeInteraction = {
            isButton: () => true,
            customId: 'welcome_drink_coffee_newbie_1',
            user: { id: 'friend_3', tag: 'Friend#0003' },
            guild: null,
            reply: async (p) => { coffeeReply = p; }
        };
        await service.handleDrinkInteraction(coffeeInteraction);
        assert.ok(coffeeReply.content.includes('<@friend_3> a offert un café à <@newbie_1>'));

        // 4. Un autre membre offre un chocolat chaud
        let chocoReply = null;
        const chocoInteraction = {
            isButton: () => true,
            customId: 'welcome_drink_chocolate_newbie_1',
            user: { id: 'friend_4', tag: 'Friend#0004' },
            guild: null,
            reply: async (p) => { chocoReply = p; }
        };
        await service.handleDrinkInteraction(chocoInteraction);
        assert.ok(chocoReply.content.includes('<@friend_4> a offert un chocolat chaud à <@newbie_1>'));
    });

    test('Event: should trigger handleWelcome on guildMemberUpdate when role is acquired', async () => {
        let welcomedMember = null;
        const mockService = {
            handleWelcome: async (m) => { welcomedMember = m; },
            handleDrinkInteraction: async () => {},
            resetWelcome: async () => {}
        };

        const eventHandler = new WelcomeEvent(mockService);
        const requiredRoleId = welcomeConfig.REQUIRED_ROLE_ID;

        const oldMember = {
            id: 'user_role_update',
            user: { id: 'user_role_update', tag: 'RoleUser#1111', bot: false },
            roles: {
                cache: new Set([])
            }
        };

        const newMember = {
            id: 'user_role_update',
            user: { id: 'user_role_update', tag: 'RoleUser#1111', bot: false },
            roles: {
                cache: new Set([requiredRoleId])
            }
        };

        await eventHandler.onGuildMemberUpdate(oldMember, newMember);
        assert.strictEqual(welcomedMember, newMember, 'Doit déclencher handleWelcome pour newMember');
    });

    test('Controller: should return status with requiredRoleId', async () => {
        const controller = container.resolve(WelcomeController);
        const res = await controller.getStatus();

        assert.ok(res.success);
        assert.ok(res.data);
        assert.strictEqual(typeof res.data.enabled, 'boolean');
        assert.strictEqual(res.data.channelId, '1337807772024180756');
        assert.strictEqual(res.data.requiredRoleId, '1337550070681174056');
    });

});
