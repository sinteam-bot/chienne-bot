const { test, describe } = require('node:test');
const assert = require('node:assert');
const { container } = require('../src/core/container.js');
const { RoadToInfiniteRepository } = require('../src/modules/game_road-to-infinite/road-to-infinite.repository.js');
const { RoadToInfiniteService } = require('../src/modules/game_road-to-infinite/road-to-infinite.service.js');
const { RoadToInfiniteController } = require('../src/modules/game_road-to-infinite/road-to-infinite.controller.js');

describe('Game: Road to Infinite Module Tests', () => {

    const channelId = '1533492692825276598';

    test('Repository: should set and get counter state', async () => {
        const repo = container.resolve(RoadToInfiniteRepository);
        await repo.updateState(channelId, 42, 'test_user_1');

        const state = await repo.getState(channelId);
        assert.ok(state);
        assert.strictEqual(state.current_number, 42);
        assert.strictEqual(state.last_user_id, 'test_user_1');
    });

    test('Repository: should log scores and get leaderboard', async () => {
        const repo = container.resolve(RoadToInfiniteRepository);
        await repo.addScore(channelId, 'test_user_1', 'TestUser', 5);

        const scores = await repo.getScores(channelId, 5);
        assert.ok(Array.isArray(scores));
    });

    test('Service: should handle valid sequential counting', async () => {
        const service = container.resolve(RoadToInfiniteService);
        const repo = container.resolve(RoadToInfiniteRepository);
        service.getConfig = () => ({ enabled: true, channel_id: channelId, trap_chance: 0 });

        await repo.updateState(channelId, 10, 'user_a');

        let reacted = null;
        const mockMessage = {
            id: 'msg_valid_1',
            guild: { id: 'guild_1', name: 'Test Guild' },
            channel: { id: channelId, send: async () => {}, messages: { fetch: async () => new Map() } },
            author: { id: 'user_b', username: 'Bob', bot: false },
            content: '11',
            react: async (r) => { reacted = r; }
        };

        await service.handleIncomingMessage(mockMessage);
        assert.ok(reacted !== null);

        const state = await repo.getState(channelId);
        assert.strictEqual(state.current_number, 11);
        assert.strictEqual(state.last_user_id, 'user_b');
    });

    test('Service: should prevent double-post without error when double_post_is_error is false', async () => {
        const service = container.resolve(RoadToInfiniteService);
        const repo = container.resolve(RoadToInfiniteRepository);
        service.getConfig = () => ({ enabled: true, channel_id: channelId, double_post_is_error: false });

        await repo.updateState(channelId, 11, 'user_b');

        let sentMsg = null;
        const mockMessage = {
            id: 'msg_double_1',
            guild: { id: 'guild_1', name: 'Test Guild' },
            channel: { id: channelId, send: async (payload) => { sentMsg = payload; }, messages: { fetch: async () => new Map() } },
            author: { id: 'user_b', username: 'Bob', bot: false },
            content: '12',
            react: async () => {}
        };

        await service.handleIncomingMessage(mockMessage);
        assert.ok(sentMsg, 'Should send double post warning message');

        const state = await repo.getState(channelId);
        assert.strictEqual(state.current_number, 11, 'Counter must stay unchanged on double post');
    });

    test('Service: should count double-post as error and tolerate when max_errors > 1', async () => {
        const service = container.resolve(RoadToInfiniteService);
        const repo = container.resolve(RoadToInfiniteRepository);
        service.getConfig = () => ({
            enabled: true,
            channel_id: channelId,
            max_errors: 2,
            double_post_is_error: true
        });

        await repo.updateState(channelId, 11, 'user_b', 0);

        let sentMsg = null;
        const mockMessage = {
            id: 'msg_double_err',
            guild: { id: 'guild_1', name: 'Test Guild' },
            channel: { id: channelId, send: async (payload) => { sentMsg = payload; }, messages: { fetch: async () => new Map() } },
            author: { id: 'user_b', username: 'Bob', bot: false },
            content: '12',
            react: async () => {}
        };

        await service.handleIncomingMessage(mockMessage);
        assert.ok(sentMsg, 'Should send double post warning message');

        const state = await repo.getState(channelId);
        assert.strictEqual(state.current_number, 11, 'Counter must stay at 11');
        assert.strictEqual(state.error_count, 1, 'Error count must increment to 1');
    });

    test('Service: should reset game on double-post when limit reached', async () => {
        const service = container.resolve(RoadToInfiniteService);
        const repo = container.resolve(RoadToInfiniteRepository);
        service.getConfig = () => ({
            enabled: true,
            channel_id: channelId,
            max_errors: 1,
            double_post_is_error: true,
            show_ranked: false
        });

        await repo.updateState(channelId, 11, 0, null, 'user_b', 0);

        let sentMessages = [];
        const mockMessage = {
            id: 'msg_double_reset',
            guild: { id: 'guild_1', name: 'Test Guild' },
            channel: { id: channelId, send: async (payload) => { sentMessages.push(payload); }, messages: { fetch: async () => new Map() } },
            author: { id: 'user_b', username: 'Bob', bot: false },
            content: '12',
            react: async () => {}
        };

        await service.handleIncomingMessage(mockMessage);
        assert.strictEqual(sentMessages.length, 1, 'Should send exactly 1 embed message');
        assert.ok(sentMessages[0].embeds?.[0], 'Message must be an embed');
        assert.strictEqual(sentMessages[0].embeds[0].data.title, "C'est moche !");
        assert.ok(sentMessages[0].embeds[0].data.description.includes('partager deux nombres à la suite'), 'Embed description must include double post message');
        assert.ok(sentMessages[0].embeds[0].data.description.includes('Allez la chienne commence'), 'Embed description must include restart message');
        assert.ok(!sentMessages[0].embeds[0].data.description.includes('Oups'), 'Should NOT send redundant Oups error message on double post');

        const state = await repo.getState(channelId);
        assert.strictEqual(state.current_number, 0, 'Counter must reset to 0');
        assert.strictEqual(state.error_count, 0, 'Error count must reset to 0');
    });

    test('Service: should tolerate errors when max_errors > 1 and only reset on reaching limit', async () => {
        const service = container.resolve(RoadToInfiniteService);
        const repo = container.resolve(RoadToInfiniteRepository);
        service.getConfig = () => ({ enabled: true, channel_id: channelId, max_errors: 3 });

        await repo.updateState(channelId, 25, 'user_b', 0);

        let sentMessages = [];
        const mockMessage1 = {
            id: 'msg_wrong_1',
            guild: { id: 'guild_1', name: 'Test Guild' },
            channel: { id: channelId, send: async (payload) => { sentMessages.push(payload); }, messages: { fetch: async () => new Map() } },
            author: { id: 'user_c', username: 'Charlie', bot: false },
            content: '999',
            react: async () => {}
        };

        // 1ère erreur : Tolérée
        await service.handleIncomingMessage(mockMessage1);
        let state = await repo.getState(channelId);
        assert.strictEqual(state.current_number, 25, 'Counter must stay unchanged on first error when max_errors=3');
        assert.strictEqual(state.error_count, 1, 'Error count must be 1');

        // 2ème erreur : Tolérée
        await service.handleIncomingMessage(mockMessage1);
        state = await repo.getState(channelId);
        assert.strictEqual(state.current_number, 25, 'Counter must stay unchanged on second error');
        assert.strictEqual(state.error_count, 2, 'Error count must be 2');

        // 3ème erreur : Seuil atteint -> Reset
        await service.handleIncomingMessage(mockMessage1);
        state = await repo.getState(channelId);
        assert.strictEqual(state.current_number, 0, 'Counter must reset to 0 after 3rd error');
        assert.strictEqual(state.error_count, 0, 'Error count must reset to 0');
    });

    test('Controller: should return status and leaderboard', async () => {
        const controller = container.resolve(RoadToInfiniteController);
        const resState = await controller.getState({ query: { channel_id: channelId } });
        assert.ok(resState.success);

        const resScores = await controller.getLeaderboard({ query: { channel_id: channelId } });
        assert.ok(resScores.success);
    });

    test('Service: should send embed with error and restart when game over even if show_ranked is false', async () => {
        const service = container.resolve(RoadToInfiniteService);
        const repo = container.resolve(RoadToInfiniteRepository);
        service.getConfig = () => ({
            enabled: true,
            channel_id: channelId,
            max_errors: 1,
            show_ranked: false
        });

        await repo.updateState(channelId, 15, 0, null, 'user_b', 0);
        await repo.addScore(channelId, 'user_winner', 'WinnerUser', 10);

        let sentMessages = [];
        const mockMessage = {
            id: 'msg_wrong_noranking',
            guild: { id: 'guild_1', name: 'Test Guild' },
            channel: {
                id: channelId,
                send: async (payload) => {
                    sentMessages.push(payload);
                },
                messages: { fetch: async () => new Map() }
            },
            author: { id: 'user_c', username: 'Charlie', bot: false },
            content: '999',
            react: async () => {}
        };

        await service.handleIncomingMessage(mockMessage);
        assert.strictEqual(sentMessages.length, 1, 'Should send exactly 1 embed message');
        assert.ok(sentMessages[0].embeds?.[0], 'First message must be an embed');
        assert.strictEqual(sentMessages[0].embeds[0].data.title, "C'est moche !");
        assert.ok(sentMessages[0].embeds[0].data.description.includes('Oups'), 'Embed must include error message');
        assert.ok(sentMessages[0].embeds[0].data.description.includes('Allez la chienne commence'), 'Embed must include restart message');
        assert.ok(!sentMessages[0].embeds[0].data.description.includes('WinnerUser'), 'Should not include ranking when show_ranked is false');
    });

    test('Repository: should store and retrieve trap state', async () => {
        const repo = container.resolve(RoadToInfiniteRepository);
        await repo.updateState(channelId, 50, 1, 51, 'user_trap_1', 0);

        const state = await repo.getState(channelId);
        assert.ok(state);
        assert.strictEqual(state.current_number, 50);
        assert.strictEqual(state.is_trap_active, 1);
        assert.strictEqual(state.trap_number, 51);
        assert.strictEqual(state.last_user_id, 'user_trap_1');

        await repo.updateState(channelId, 51, 0, null, 'user_trap_2', 0);
        const updated = await repo.getState(channelId);
        assert.strictEqual(updated.is_trap_active, 0);
        assert.strictEqual(updated.trap_number, null);
    });

    test('Service: should trigger a trap when valid number > 5 and trap_chance triggers', async () => {
        const service = container.resolve(RoadToInfiniteService);
        const repo = container.resolve(RoadToInfiniteRepository);
        service.getConfig = () => ({
            enabled: true,
            channel_id: channelId,
            trap_chance: 1.0 // Force le déclenchement du piège
        });

        await repo.updateState(channelId, 10, 0, null, 'user_a', 0);

        let sentMessages = [];
        const mockMessage = {
            id: 'msg_trap_trigger',
            guild: { id: 'guild_1', name: 'Test Guild' },
            channel: {
                id: channelId,
                send: async (msg) => { sentMessages.push(msg); },
                messages: { fetch: async () => new Map() }
            },
            author: { id: 'user_b', username: 'Bob', bot: false },
            content: '11',
            react: async () => {}
        };

        await service.handleIncomingMessage(mockMessage);

        // Le bot doit avoir posté le nombre piège 12
        assert.strictEqual(sentMessages.length, 1);
        assert.strictEqual(sentMessages[0], '12');

        const state = await repo.getState(channelId);
        assert.strictEqual(state.is_trap_active, 1);
        assert.strictEqual(state.trap_number, 12);
        assert.strictEqual(state.current_number, 12);
    });

    test('Service: should handle dodging an active trap', async () => {
        const service = container.resolve(RoadToInfiniteService);
        const repo = container.resolve(RoadToInfiniteRepository);
        service.getConfig = () => ({
            enabled: true,
            channel_id: channelId,
            messages: {
                trap_dodge_message: 'Esquive réussie !'
            }
        });

        // Simuler un piège actif sur le nombre 12
        await repo.updateState(channelId, 12, 1, 12, 'user_b', 0);

        let sentMessages = [];
        let reacted = null;
        const mockMessage = {
            id: 'msg_trap_dodge',
            guild: { id: 'guild_1', name: 'Test Guild' },
            channel: {
                id: channelId,
                send: async (msg) => { sentMessages.push(msg); },
                messages: { fetch: async () => new Map() }
            },
            author: { id: 'user_c', username: 'Charlie', bot: false },
            content: '12', // Joueur poste 12 pour esquiver le piège
            react: async (r) => { reacted = r; }
        };

        await service.handleIncomingMessage(mockMessage);

        assert.ok(reacted !== null);
        assert.strictEqual(sentMessages.length, 1);
        assert.strictEqual(sentMessages[0], 'Esquive réussie !');

        const state = await repo.getState(channelId);
        assert.strictEqual(state.is_trap_active, 0, 'Trap must be deactivated');
        assert.strictEqual(state.trap_number, null);
        assert.strictEqual(state.last_user_id, 'user_c');
    });

    test('Service: should handle falling into an active trap with errors tolerated', async () => {
        const service = container.resolve(RoadToInfiniteService);
        const repo = container.resolve(RoadToInfiniteRepository);
        service.getConfig = () => ({
            enabled: true,
            channel_id: channelId,
            max_errors: 2,
            messages: {
                trap_failed_message: 'Je t’ai eu ! ({errorsCount}/{maxErrors}) Prochain: {expectedNumber}'
            }
        });

        // Piège actif sur 12
        await repo.updateState(channelId, 12, 1, 12, 'user_b', 0);

        let sentMessages = [];
        const mockMessage = {
            id: 'msg_trap_fall',
            guild: { id: 'guild_1', name: 'Test Guild' },
            channel: {
                id: channelId,
                send: async (msg) => { sentMessages.push(msg); },
                messages: { fetch: async () => new Map() }
            },
            author: { id: 'user_c', username: 'Charlie', bot: false },
            content: '13', // Tombe dans le piège en postant 13
            react: async () => {}
        };

        await service.handleIncomingMessage(mockMessage);

        assert.strictEqual(sentMessages.length, 1);
        assert.ok(sentMessages[0].includes('Je t’ai eu ! (1/2) Prochain: 13'));

        const state = await repo.getState(channelId);
        assert.strictEqual(state.is_trap_active, 0, 'Trap must be deactivated');
        assert.strictEqual(state.error_count, 1);
        assert.strictEqual(state.current_number, 12);
    });

    test('Service: should reset game when falling into a trap reaches max_errors', async () => {
        const service = container.resolve(RoadToInfiniteService);
        const repo = container.resolve(RoadToInfiniteRepository);
        service.getConfig = () => ({
            enabled: true,
            channel_id: channelId,
            max_errors: 1,
            show_ranked: false
        });

        // Piège actif sur 12
        await repo.updateState(channelId, 12, 1, 12, 'user_b', 0);

        let sentMessages = [];
        const mockMessage = {
            id: 'msg_trap_reset',
            guild: { id: 'guild_1', name: 'Test Guild' },
            channel: {
                id: channelId,
                send: async (msg) => { sentMessages.push(msg); },
                messages: { fetch: async () => new Map() }
            },
            author: { id: 'user_c', username: 'Charlie', bot: false },
            content: '13',
            react: async () => {}
        };

        await service.handleIncomingMessage(mockMessage);

        // Seuil d'erreurs (1) atteint -> Game Over avec Embed
        assert.strictEqual(sentMessages.length, 1);
        assert.ok(sentMessages[0].embeds?.[0]);
        assert.strictEqual(sentMessages[0].embeds[0].data.title, "C'est moche !");
        assert.ok(sentMessages[0].embeds[0].data.description.includes('Je t’ai eu'));
        assert.ok(sentMessages[0].embeds[0].data.description.includes('Allez la chienne commence'));

        const state = await repo.getState(channelId);
        assert.strictEqual(state.current_number, 0, 'Game must be reset to 0');
        assert.strictEqual(state.is_trap_active, 0);
        assert.strictEqual(state.error_count, 0);
    });

});
