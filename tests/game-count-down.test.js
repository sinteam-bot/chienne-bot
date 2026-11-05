const { test, describe } = require('node:test');
const assert = require('node:assert');
const { container } = require('../src/core/container.js');
const { CountDownRepository } = require('../src/modules/game_count-down/count-down.repository.js');
const { CountDownService } = require('../src/modules/game_count-down/count-down.service.js');
const { CountDownController } = require('../src/modules/game_count-down/count-down.controller.js');

describe('Game: Count Down Module Tests', () => {

    const channelId = '1540356133913366538';

    test('Repository: should set, get and reset countdown state', async () => {
        const repo = container.resolve(CountDownRepository);
        await repo.updateState(channelId, 850, 1, 845, 'user_cd_1');

        const state = await repo.getState(channelId);
        assert.ok(state);
        assert.strictEqual(state.current_number, 850);
        assert.strictEqual(state.last_user_id, 'user_cd_1');
        assert.strictEqual(state.is_trap_active, 1);
        assert.strictEqual(state.trap_number, 845);

        await repo.updateState(channelId, 900, 0, null, null);
        const resetState = await repo.getState(channelId);
        assert.strictEqual(resetState.current_number, 900);
    });

    test('Service: should handle valid sequential countdown', async () => {
        const service = container.resolve(CountDownService);
        const repo = container.resolve(CountDownRepository);
        service.getConfig = () => ({ enabled: true, channel_id: channelId });

        await repo.updateState(channelId, 899, 0, null, 'user_alice');

        let reacted = null;
        const mockMessage = {
            id: 'msg_cd_1',
            guild: { id: 'guild_1', name: 'Test Guild' },
            channel: { id: channelId, send: async () => {} },
            author: { id: 'user_bob', username: 'Bob', bot: false },
            content: '898',
            react: async (r) => { reacted = r; }
        };

        await service.handleIncomingMessage(mockMessage);
        assert.ok(reacted !== null);

        const state = await repo.getState(channelId);
        assert.strictEqual(state.last_user_id, 'user_bob');
    });

    test('Service: should tolerate errors when max_errors > 1 and only reset on reaching limit', async () => {
        const service = container.resolve(CountDownService);
        const repo = container.resolve(CountDownRepository);
        service.getConfig = () => ({ enabled: true, channel_id: channelId, start_number: 900, max_errors: 2 });

        await repo.updateState(channelId, 850, 0, null, 'user_alice', 0);

        let sentMessages = [];
        const mockWrongMessage = {
            id: 'msg_cd_wrong_1',
            guild: { id: 'guild_1', name: 'Test Guild' },
            channel: { id: channelId, send: async (payload) => { sentMessages.push(payload); } },
            author: { id: 'user_bob', username: 'Bob', bot: false },
            content: '123', // Erreur (attendu: 849)
            react: async () => {}
        };

        // 1ère erreur : Tolérée
        await service.handleIncomingMessage(mockWrongMessage);
        let state = await repo.getState(channelId);
        assert.strictEqual(state.current_number, 850, 'Countdown number must stay at 850 after 1st error when max_errors=2');
        assert.strictEqual(state.error_count, 1, 'Error count must be 1');

        // 2ème erreur : Limite atteinte -> Reset à start_number (900)
        await service.handleIncomingMessage(mockWrongMessage);
        state = await repo.getState(channelId);
        assert.strictEqual(state.current_number, 900, 'Countdown must reset to 900 after reaching max_errors');
        assert.strictEqual(state.error_count, 0, 'Error count must reset to 0');
    });

    test('Controller: should return status and leaderboard', async () => {
        const controller = container.resolve(CountDownController);
        const resState = await controller.getState({ query: { channel_id: channelId } });
        assert.ok(resState.success);

        const resScores = await controller.getLeaderboard({ query: { channel_id: channelId } });
        assert.ok(resScores.success);
    });

    test('Service: should send embed with error and restart when game over even if show_ranked is false', async () => {
        const service = container.resolve(CountDownService);
        const repo = container.resolve(CountDownRepository);
        service.getConfig = () => ({
            enabled: true,
            channel_id: channelId,
            start_number: 900,
            max_errors: 1,
            show_ranked: false
        });

        await repo.updateState(channelId, 850, 0, null, 'user_alice', 0);
        await repo.addScore(channelId, 'user_winner', 'WinnerUser', 10);

        let sentMessages = [];
        const mockWrongMessage = {
            id: 'msg_cd_wrong_noranking',
            guild: { id: 'guild_1', name: 'Test Guild' },
            channel: {
                id: channelId,
                send: async (payload) => {
                    sentMessages.push(payload);
                }
            },
            author: { id: 'user_bob', username: 'Bob', bot: false },
            content: '123',
            react: async () => {}
        };

        await service.handleIncomingMessage(mockWrongMessage);
        assert.strictEqual(sentMessages.length, 1, 'Should send exactly 1 embed message');
        assert.ok(sentMessages[0].embeds?.[0], 'Message must be an embed');
        assert.strictEqual(sentMessages[0].embeds[0].data.title, "C'est moche !");
        assert.ok(sentMessages[0].embeds[0].data.description.includes('Oups'), 'Embed must include error message');
        assert.ok(sentMessages[0].embeds[0].data.description.includes('Allez la chienne commence'), 'Embed must include restart message');
        assert.ok(!sentMessages[0].embeds[0].data.description.includes('WinnerUser'), 'Should not include ranking when show_ranked is false');
    });

    test('Service: should treat double-post as error and reset when max_errors is 1', async () => {
        const service = container.resolve(CountDownService);
        const repo = container.resolve(CountDownRepository);
        service.getConfig = () => ({
            enabled: true,
            channel_id: channelId,
            start_number: 900,
            max_errors: 1,
            double_post_is_error: true,
            show_ranked: false
        });

        await repo.updateState(channelId, 850, 0, null, 'user_bob', 0);

        let sentMessages = [];
        const mockMessage = {
            id: 'msg_cd_double_reset',
            guild: { id: 'guild_1', name: 'Test Guild' },
            channel: { id: channelId, send: async (payload) => { sentMessages.push(payload); } },
            author: { id: 'user_bob', username: 'Bob', bot: false },
            content: '849',
            react: async () => {}
        };

        await service.handleIncomingMessage(mockMessage);
        assert.strictEqual(sentMessages.length, 1, 'Should send exactly 1 embed message');
        assert.ok(sentMessages[0].embeds?.[0], 'Message must be an embed');
        assert.strictEqual(sentMessages[0].embeds[0].data.title, "C'est moche !");
        assert.ok(sentMessages[0].embeds[0].data.description.includes('partager deux nombres à la suite'));
        assert.ok(sentMessages[0].embeds[0].data.description.includes('Allez la chienne commence'));
        assert.ok(!sentMessages[0].embeds[0].data.description.includes('Oups'), 'Should NOT send redundant Oups error message on double post');

        const state = await repo.getState(channelId);
        assert.strictEqual(state.current_number, 900, 'Countdown must reset to start_number (900)');
        assert.strictEqual(state.error_count, 0);
    });

    test('Service: should prevent double-post without error when double_post_is_error is false', async () => {
        const service = container.resolve(CountDownService);
        const repo = container.resolve(CountDownRepository);
        service.getConfig = () => ({
            enabled: true,
            channel_id: channelId,
            start_number: 900,
            max_errors: 1,
            double_post_is_error: false
        });

        await repo.updateState(channelId, 850, 0, null, 'user_bob', 0);

        let sentMessages = [];
        const mockMessage = {
            id: 'msg_cd_double_noerr',
            guild: { id: 'guild_1', name: 'Test Guild' },
            channel: { id: channelId, send: async (payload) => { sentMessages.push(payload); } },
            author: { id: 'user_bob', username: 'Bob', bot: false },
            content: '849',
            react: async () => {}
        };

        await service.handleIncomingMessage(mockMessage);
        assert.strictEqual(sentMessages.length, 1);

        const state = await repo.getState(channelId);
        assert.strictEqual(state.current_number, 850, 'Countdown must stay at 850');
        assert.strictEqual(state.error_count, 0);
    });

    test('Service: should trigger a trap when counting down from 900 and trap_chance triggers', async () => {
        const service = container.resolve(CountDownService);
        const repo = container.resolve(CountDownRepository);
        service.getConfig = () => ({
            enabled: true,
            channel_id: channelId,
            start_number: 900,
            trap_chance: 1.0 // 100% de chance de piège
        });

        // Le compteur est à 900
        await repo.updateState(channelId, 900, 0, null, 'user_a', 0);

        let sentMessages = [];
        const mockMessage = {
            id: 'msg_trap_trigger',
            guild: { id: 'guild_1', name: 'Test Guild' },
            channel: { id: channelId, send: async (msg) => { sentMessages.push(msg); } },
            author: { id: 'user_b', username: 'Bob', bot: false },
            content: '899',
            react: async () => {}
        };

        await service.handleIncomingMessage(mockMessage);

        // Le bot doit avoir validé 899 et envoyé le piège "898"
        assert.strictEqual(sentMessages.length, 1);
        assert.strictEqual(sentMessages[0], '898', 'Bot should post 898 as trap');

        const state = await repo.getState(channelId);
        assert.strictEqual(state.current_number, 898, 'Counter should be updated to trap number 898');
        assert.strictEqual(state.is_trap_active, 1, 'Trap must be active');
        assert.strictEqual(state.trap_number, 898, 'Trap number must be 898');
    });

    test('Service: should handle dodging an active trap in countdown', async () => {
        const service = container.resolve(CountDownService);
        const repo = container.resolve(CountDownRepository);
        service.getConfig = () => ({
            enabled: true,
            channel_id: channelId,
            start_number: 900,
            trap_chance: 0
        });

        // Piège actif sur 898
        await repo.updateState(channelId, 898, 1, 898, 'user_b', 0);

        let sentMessages = [];
        const mockMessage = {
            id: 'msg_trap_dodge',
            guild: { id: 'guild_1', name: 'Test Guild' },
            channel: { id: channelId, send: async (msg) => { sentMessages.push(msg); } },
            author: { id: 'user_c', username: 'Charlie', bot: false },
            content: '898', // Charlie esquive en postant le même nombre
            react: async () => {}
        };

        await service.handleIncomingMessage(mockMessage);

        assert.strictEqual(sentMessages.length, 1);
        assert.ok(sentMessages[0].includes('J’ai cru que j’allais vous avoir'));

        const state = await repo.getState(channelId);
        assert.strictEqual(state.current_number, 898);
        assert.strictEqual(state.is_trap_active, 0, 'Trap must be deactivated');
        assert.strictEqual(state.trap_number, null);
    });

    test('Service: should handle falling into an active trap with errors tolerated in countdown', async () => {
        const service = container.resolve(CountDownService);
        const repo = container.resolve(CountDownRepository);
        service.getConfig = () => ({
            enabled: true,
            channel_id: channelId,
            start_number: 900,
            max_errors: 2,
            trap_chance: 0
        });

        // Piège actif sur 898
        await repo.updateState(channelId, 898, 1, 898, 'user_b', 0);

        let sentMessages = [];
        const mockMessage = {
            id: 'msg_trap_fail',
            guild: { id: 'guild_1', name: 'Test Guild' },
            channel: { id: channelId, send: async (msg) => { sentMessages.push(msg); } },
            author: { id: 'user_c', username: 'Charlie', bot: false },
            content: '897', // Charlie se trompe et saute au nombre suivant
            react: async () => {}
        };

        await service.handleIncomingMessage(mockMessage);

        assert.strictEqual(sentMessages.length, 1);
        assert.ok(sentMessages[0].includes('Je t’ai eu'));
        assert.ok(sentMessages[0].includes('1/2 erreurs'));

        const state = await repo.getState(channelId);
        assert.strictEqual(state.error_count, 1, 'Error count must increment to 1');
        assert.strictEqual(state.is_trap_active, 0, 'Trap is consumed');
        assert.strictEqual(state.current_number, 898);
    });

    test('Service: should reset countdown when falling into a trap reaches max_errors', async () => {
        const service = container.resolve(CountDownService);
        const repo = container.resolve(CountDownRepository);
        service.getConfig = () => ({
            enabled: true,
            channel_id: channelId,
            start_number: 900,
            max_errors: 1,
            show_ranked: false
        });

        // Piège actif sur 898
        await repo.updateState(channelId, 898, 1, 898, 'user_b', 0);

        let sentMessages = [];
        const mockMessage = {
            id: 'msg_trap_reset',
            guild: { id: 'guild_1', name: 'Test Guild' },
            channel: { id: channelId, send: async (msg) => { sentMessages.push(msg); } },
            author: { id: 'user_c', username: 'Charlie', bot: false },
            content: '897',
            react: async () => {}
        };

        await service.handleIncomingMessage(mockMessage);

        assert.strictEqual(sentMessages.length, 1);
        assert.ok(sentMessages[0].embeds?.[0]);
        assert.strictEqual(sentMessages[0].embeds[0].data.title, "C'est moche !");
        assert.ok(sentMessages[0].embeds[0].data.description.includes('Je t’ai eu'));
        assert.ok(sentMessages[0].embeds[0].data.description.includes('Allez la chienne commence'));

        const state = await repo.getState(channelId);
        assert.strictEqual(state.current_number, 900, 'Countdown must be reset to 900');
        assert.strictEqual(state.is_trap_active, 0);
        assert.strictEqual(state.error_count, 0);
    });

});
