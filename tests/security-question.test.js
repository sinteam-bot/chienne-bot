const { test, describe } = require('node:test');
const assert = require('node:assert');
const { container } = require('../src/core/container.js');
const { SecurityQuestionRepository } = require('../src/modules/security_question/security-question.repository.js');
const { SecurityQuestionService } = require('../src/modules/security_question/security-question.service.js');
const { SecurityQuestionController } = require('../src/modules/security_question/security-question.controller.js');
const {
    buildCaptchaCardEmbed,
    buildCaptchaActionRow,
    STATUS_CONFIG
} = require('../src/modules/security_question/captcha-logger.js');

describe('Security Question (Captcha) Module Tests', () => {

    const userId = 'test_user_sec_1';
    const username = 'SecTester';
    const guildId = 'test_guild_sec_1';
    const channelId = 'test_chan_sec_1';

    test('Repository: should create, get and verify captcha in DB', async () => {
        const repo = container.resolve(SecurityQuestionRepository);
        const captcha = await repo.createCaptcha(userId, username, guildId, 'Combien font 3 plus 4 ?', '7', channelId, 10);

        assert.ok(captcha);
        assert.strictEqual(captcha.question, 'Combien font 3 plus 4 ?');
        assert.strictEqual(captcha.answer, '7');
        assert.strictEqual(captcha.attempts, 0);

        const userCaptcha = await repo.getUserCaptcha(userId, guildId);
        assert.ok(userCaptcha);
        assert.strictEqual(userCaptcha.answer, '7');

        await repo.markVerified(userId, guildId);
        const verified = await repo.getUserCaptcha(userId, guildId);
        assert.strictEqual(verified.is_verified, 1);

        const all = await repo.getAllCaptchas(5);
        assert.ok(Array.isArray(all));
        assert.ok(all.length >= 1);
    });

    test('Repository: should mark captcha as expired and invalidate verification', async () => {
        const repo = container.resolve(SecurityQuestionRepository);
        const uId = 'test_user_expire_1';
        await repo.createCaptcha(uId, 'ExpireTester', guildId, 'Calcul ?', '10', 'chan_exp', 10);

        // Vérifier markExpired
        await repo.markExpired(uId, guildId);
        let cap = await repo.getUserCaptcha(uId, guildId);
        assert.ok(cap.expired_at, 'expired_at should be populated');

        // Vérifier markVerified puis invalidateVerification
        await repo.markVerified(uId, guildId);
        cap = await repo.getUserCaptcha(uId, guildId);
        assert.strictEqual(cap.is_verified, 1);

        await repo.invalidateVerification(uId, guildId);
        cap = await repo.getUserCaptcha(uId, guildId);
        assert.strictEqual(cap.is_verified, 0);
        assert.strictEqual(cap.verified_at, null);
    });

    test('Repository: should save and retrieve dynamic captcha card in bot_state', async () => {
        const repo = container.resolve(SecurityQuestionRepository);
        const cardData = {
            userId: 'test_card_user',
            username: 'CardTester',
            guildId,
            status: 'pending',
            history: [{ timestamp: 1234567, text: 'Salon créé' }]
        };

        await repo.saveCaptchaCard(cardData.userId, guildId, cardData);
        const retrieved = await repo.getCaptchaCard(cardData.userId, guildId);
        assert.ok(retrieved);
        assert.strictEqual(retrieved.userId, cardData.userId);
        assert.strictEqual(retrieved.status, 'pending');
        assert.strictEqual(retrieved.history.length, 1);
    });

    test('Logger: should build rich embed and action buttons for dynamic card', () => {
        const cardData = {
            userId: '123456789',
            username: 'Bob',
            guildId: '987654321',
            channelId: '555555555',
            channelName: 'captcha-bob',
            question: 'Combien font deux + deux ?',
            answer: '4',
            attempts: 1,
            maxAttempts: 3,
            status: 'pending',
            expiresAt: new Date(Date.now() + 600000).toISOString(),
            history: [
                { timestamp: Math.floor(Date.now() / 1000), text: 'Salon créé' }
            ]
        };

        // 1. Pending status: button should be disabled
        const embedPending = buildCaptchaCardEmbed(cardData);
        assert.ok(embedPending.data.title.includes('Bob'));
        assert.strictEqual(embedPending.data.color, parseInt(STATUS_CONFIG.pending.color.replace('#', ''), 16));

        const rowPending = buildCaptchaActionRow(cardData);
        assert.strictEqual(rowPending.components[0].data.disabled, true);

        // 2. Verified status: button should be enabled
        cardData.status = 'verified';
        const rowVerified = buildCaptchaActionRow(cardData);
        assert.strictEqual(rowVerified.components[0].data.disabled, false);
        assert.strictEqual(rowVerified.components[0].data.custom_id, `captcha_revoke_${cardData.userId}`);

        // 3. Revoked status: button should be disabled
        cardData.status = 'revoked';
        const rowRevoked = buildCaptchaActionRow(cardData);
        assert.strictEqual(rowRevoked.components[0].data.disabled, true);
    });

    test('Service: should generate valid French math questions', () => {
        const service = container.resolve(SecurityQuestionService);
        const q = service.generateMathQuestion();

        assert.ok(q.question);
        assert.ok(typeof q.answer === 'string');
        assert.ok(q.answer.length > 0);
        assert.ok(q.question.includes('Combien font'));
    });

    test('Service: should convert numbers to French words', () => {
        const service = container.resolve(SecurityQuestionService);
        assert.strictEqual(service.numberToFrench(1), 'un');
        assert.strictEqual(service.numberToFrench(7), 'sept');
        assert.strictEqual(service.numberToFrench(10), 'dix');
    });

    test('Service: should handle member join, schedule auto-kick timer, and cleanup on leave', async () => {
        const service = container.resolve(SecurityQuestionService);
        const repo = container.resolve(SecurityQuestionRepository);

        let kicked = false;
        let channelDeleted = false;

        const fakeChannel = {
            id: 'chan_join_test',
            name: 'captcha-jointester',
            send: async () => ({ id: 'msg_welcome' }),
            delete: async () => { channelDeleted = true; }
        };

        const fakeMember = {
            id: 'user_join_test_1',
            user: { username: 'JoinTester', tag: 'JoinTester#0001', bot: false },
            guild: {
                id: guildId,
                name: 'Test Guild',
                channels: {
                    create: async () => fakeChannel,
                    fetch: async (id) => (id === fakeChannel.id ? fakeChannel : null)
                },
                roles: {
                    cache: { filter: () => [] },
                    fetch: async () => null
                },
                members: {
                    fetch: async (id) => (id === fakeMember.id ? fakeMember : null)
                }
            },
            roles: {
                add: async () => {}
            },
            kick: async () => { kicked = true; }
        };

        // 1. Simuler l'arrivée d'un membre
        await service.handleMemberJoin(fakeMember);

        // Vérifier que le timer d'auto-kick a bien été planifié
        const timerKey = `${fakeMember.id}_${guildId}`;
        assert.ok(service.activeTimers.has(timerKey), 'Timer should be active in activeTimers');

        const card = await service.getCardData(fakeMember.id, guildId);
        assert.ok(card);
        assert.strictEqual(card.status, 'pending');

        // 2. Simuler le départ du membre avant la validation (guildMemberRemove)
        await service.handleMemberLeave(fakeMember);

        // Le timer doit avoir été annulé
        assert.strictEqual(service.activeTimers.has(timerKey), false, 'Timer should have been cleared');
        assert.strictEqual(channelDeleted, true, 'Channel should have been deleted');

        // La carte doit être mise à jour avec le statut 'left'
        const updatedCard = await service.getCardData(fakeMember.id, guildId);
        assert.strictEqual(updatedCard.status, 'left');

        service.clearActiveTimers();
    });

    test('Service: should auto-kick user on timeout and delete channel', async () => {
        const service = container.resolve(SecurityQuestionService);
        const repo = container.resolve(SecurityQuestionRepository);

        const timeoutUserId = 'user_timeout_test_1';
        let memberKicked = false;
        let channelDeleted = false;

        const fakeChannel = {
            id: 'chan_timeout_test',
            name: 'captcha-timeouttester',
            send: async () => {},
            delete: async () => { channelDeleted = true; }
        };

        const fakeMember = {
            id: timeoutUserId,
            user: { username: 'TimeoutTester', tag: 'TimeoutTester#0001' },
            kick: async (reason) => {
                memberKicked = true;
                assert.ok(reason.includes('Timeout'));
            }
        };

        const fakeGuild = {
            id: guildId,
            channels: {
                fetch: async (id) => (id === fakeChannel.id ? fakeChannel : null)
            },
            members: {
                fetch: async (id) => (id === timeoutUserId ? fakeMember : null)
            }
        };

        await repo.createCaptcha(timeoutUserId, 'TimeoutTester', guildId, 'Calcul ?', '15', fakeChannel.id, 10);

        // Déclencher le timeout manuellement
        await service.handleTimeout(fakeGuild, timeoutUserId);

        assert.strictEqual(memberKicked, true, 'Member should be kicked');

        const cap = await repo.getUserCaptcha(timeoutUserId, guildId);
        assert.ok(cap.expired_at, 'Captcha should be marked expired in DB');

        const card = await service.getCardData(timeoutUserId, guildId);
        assert.strictEqual(card.status, 'timeout');
    });

    test('Service: should handle button interaction to revoke verification', async () => {
        const service = container.resolve(SecurityQuestionService);
        const repo = container.resolve(SecurityQuestionRepository);

        const revokeUserId = 'user_revoke_test_1';
        let roleRemoved = false;
        let updatedMessage = false;

        await repo.createCaptcha(revokeUserId, 'RevokeTester', guildId, 'Calcul ?', '12', 'chan_rev', 10);
        await repo.markVerified(revokeUserId, guildId);

        const fakeRole = { id: 'role_verified_123' };
        const fakeTargetMember = {
            id: revokeUserId,
            roles: {
                remove: async (roleId) => {
                    if (roleId === fakeRole.id) roleRemoved = true;
                }
            }
        };

        const fakeGuild = {
            id: guildId,
            roles: {
                fetch: async () => fakeRole
            },
            members: {
                fetch: async (id) => (id === revokeUserId ? fakeTargetMember : null)
            }
        };

        // Interaction avec un membre non autorisé
        const unauthorizedInteraction = {
            isButton: () => true,
            customId: `captcha_revoke_${revokeUserId}`,
            member: {
                permissions: { has: () => false }
            },
            guild: fakeGuild,
            reply: async (opts) => {
                assert.ok(opts.content.includes('permission'));
            }
        };

        await service.handleButtonInteraction(unauthorizedInteraction);
        assert.strictEqual(roleRemoved, false, 'Role should not be removed without permission');

        // Interaction avec un modérateur / admin
        const authorizedInteraction = {
            isButton: () => true,
            customId: `captcha_revoke_${revokeUserId}`,
            user: { id: 'admin_1', tag: 'Admin#0001' },
            member: {
                permissions: { has: (perm) => perm === 'Administrator' }
            },
            guild: fakeGuild,
            update: async (payload) => {
                updatedMessage = true;
                assert.ok(payload.embeds);
                assert.ok(payload.components);
            },
            followUp: async () => {}
        };

        await service.handleButtonInteraction(authorizedInteraction);
        assert.strictEqual(roleRemoved, true, 'Role should have been removed from member');
        assert.strictEqual(updatedMessage, true, 'Log message should have been updated');

        const capAfter = await repo.getUserCaptcha(revokeUserId, guildId);
        assert.strictEqual(capAfter.is_verified, 0, 'User should no longer be verified in DB');
    });

    test('Repository & Service: should retrieve channel details and message history', async () => {
        const repo = container.resolve(SecurityQuestionRepository);
        const service = container.resolve(SecurityQuestionService);

        const details = await repo.getCaptchaChannelDetails(channelId, userId);
        assert.ok(details);
        assert.ok(details.channel);
        assert.ok(Array.isArray(details.messages));
        assert.ok(Array.isArray(details.events));

        const serviceHistory = await service.getChannelHistory(channelId, userId);
        assert.ok(serviceHistory);
        assert.ok(serviceHistory.channel);
    });

    test('Controller: should return overview, status and channel messages', async () => {
        const controller = container.resolve(SecurityQuestionController);
        const resLogs = await controller.getLogs();
        assert.ok(resLogs.success);
        assert.ok(resLogs.data);
        assert.ok(Array.isArray(resLogs.data.captchas));

        const resStatus = await controller.getStatus();
        assert.ok(resStatus.success);

        const resMessages = await controller.getChannelMessages({
            query: { channel_id: channelId, user_id: userId }
        });
        assert.ok(resMessages.success);
        assert.ok(resMessages.data);
        assert.ok(Array.isArray(resMessages.data.messages));
    });
});
