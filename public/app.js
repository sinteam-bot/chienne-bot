/**
 * Client JavaScript Vanilla pour l'interface Discord Chienne Bot
 * Sans framework JS (Vanilla JS pur, ultra-léger et fluide)
 */

document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // ÉTAT DE L'APPLICATION
    // ============================================
    const AppState = {
        guild: null,
        channels: [],
        currentChannel: null,
        messages: {},         // channelId -> Array de messages
        oldestMessageId: {},  // channelId -> string
        hasMoreMessages: {},  // channelId -> boolean
        isLoadingOlder: false,
        
        // Logs
        logs: [],
        autoScrollLogs: true,
        logLevelFilter: 'ALL',
        logSearch: '',
        logEventSource: null,

        // Users & Roles
        users: [],
        roles: [],
        userSearch: '',
        userRoleFilter: 'ALL',
        userBotFilter: 'all',
        userSortBy: 'joined',

        // Config
        config: null,
        activeConfigTab: 'tab-welcome',

        // Maps pour les mentions
        usersMap: {},
        rolesMap: {},
        channelsMap: {}
    };

    // ============================================
    // ÉLÉMENTS DU DOM
    // ============================================
    const DOM = {
        // Rail serveur
        guildAvatarRail: document.getElementById('guild-avatar-rail'),
        guildInitials: document.getElementById('guild-initials'),
        homeGuildBtn: document.getElementById('home-guild-btn'),
        btnVirtualLogsQuick: document.getElementById('btn-virtual-logs-quick'),
        btnVirtualConfigQuick: document.getElementById('btn-virtual-config-quick'),
        btnVirtualUsersQuick: document.getElementById('btn-virtual-users-quick'),

        // Sidebar
        serverNameLabel: document.getElementById('server-name-label'),
        channelsList: document.getElementById('channels-list'),
        botAvatarImg: document.getElementById('bot-avatar-img'),
        botUsernameLabel: document.getElementById('bot-username-label'),
        botStatusDot: document.getElementById('bot-status-dot'),
        botCustomStatus: document.getElementById('bot-custom-status'),
        btnRefreshAll: document.getElementById('btn-refresh-all'),
        btnOpenSettings: document.getElementById('btn-open-settings'),

        // Header Chat
        headerChannelIcon: document.getElementById('header-channel-icon'),
        headerChannelName: document.getElementById('header-channel-name'),
        headerChannelTopic: document.getElementById('header-channel-topic'),
        logsLiveBadge: document.getElementById('logs-live-badge'),
        btnScrollBottom: document.getElementById('btn-scroll-bottom'),
        btnRefreshChannel: document.getElementById('btn-refresh-channel'),

        // Vues
        viewMessages: document.getElementById('view-messages'),
        viewVirtualLogs: document.getElementById('view-virtual-logs'),
        viewVirtualConfig: document.getElementById('view-virtual-config'),
        viewVirtualUsers: document.getElementById('view-virtual-users'),

        // Vue Messages
        messagesContainer: document.getElementById('messages-container'),
        messagesList: document.getElementById('messages-list'),
        bannerChannelIcon: document.getElementById('banner-channel-icon'),
        bannerChannelTitle: document.getElementById('banner-channel-title'),
        loadingOlderMessages: document.getElementById('loading-older-messages'),
        sendMessageForm: document.getElementById('send-message-form'),
        messageTextInput: document.getElementById('message-text-input'),

        // Vue Logs
        logLevelFilter: document.getElementById('log-level-filter'),
        logSearchInput: document.getElementById('log-search-input'),
        btnClearLogSearch: document.getElementById('btn-clear-log-search'),
        btnToggleAutoscroll: document.getElementById('btn-toggle-autoscroll'),
        btnCopyLogs: document.getElementById('btn-copy-logs'),
        btnClearLogs: document.getElementById('btn-clear-logs'),
        logsContainer: document.getElementById('logs-container'),
        logEntriesList: document.getElementById('log-entries-list'),

        // Vue Config
        configNavItems: document.querySelectorAll('.config-nav-item'),
        configTabPanels: document.querySelectorAll('.config-tab-panel'),
        formConfigWelcome: document.getElementById('form-config-welcome'),
        formConfigCaptcha: document.getElementById('form-config-captcha'),
        formConfigXp: document.getElementById('form-config-xp'),
        welcomeChannelSelect: document.getElementById('welcome-channel-select'),
        captchaRoleSelect: document.getElementById('captcha-role-select'),
        captchaLogChannelSelect: document.getElementById('captcha-log-channel-select'),
        welcomeColor: document.getElementById('welcome-color'),
        welcomeColorHex: document.getElementById('welcome-color-hex'),

        // Vue Users
        userSearchInput: document.getElementById('user-search-input'),
        btnClearUserSearch: document.getElementById('btn-clear-user-search'),
        userRoleFilter: document.getElementById('user-role-filter'),
        userBotFilter: document.getElementById('user-bot-filter'),
        userSortFilter: document.getElementById('user-sort-filter'),
        userCountDisplay: document.getElementById('user-count-display'),
        usersGridContainer: document.getElementById('users-grid-container'),

        // Modale User
        userDetailModal: document.getElementById('user-detail-modal'),
        btnCloseModal: document.getElementById('btn-close-modal'),
        modalUserAvatar: document.getElementById('modal-user-avatar'),
        modalUserDisplayname: document.getElementById('modal-user-displayname'),
        modalUserTag: document.getElementById('modal-user-tag'),
        modalUserId: document.getElementById('modal-user-id'),
        modalRolesContainer: document.getElementById('modal-roles-container'),
        modalStatLevel: document.getElementById('modal-stat-level'),
        modalStatXp: document.getElementById('modal-stat-xp'),
        modalStatMessages: document.getElementById('modal-stat-messages'),
        modalStatVoice: document.getElementById('modal-stat-voice'),
        modalDateJoined: document.getElementById('modal-date-joined'),
        modalDateCreated: document.getElementById('modal-date-created'),

        // Toasts
        toastContainer: document.getElementById('toast-container')
    };

    // ============================================
    // NOTIFICATIONS TOAST
    // ============================================
    function showToast(message, type = 'info', duration = 3500) {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';

        toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
        DOM.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ============================================
    // 1. INITIALISATION & CHARGEMENT DES DONNÉES
    // ============================================
    async function init() {
        setupEventListeners();
        await fetchGuildInfo();
        await fetchRoles();
        await fetchChannels();
        await fetchBotConfig();
        initLogsStream();

        // Sélectionner par défaut le salon virtuel Logs ou le 1er salon
        selectChannel('virtual-logs');
    }

    // Récupérer les infos du serveur & bot
    async function fetchGuildInfo() {
        try {
            const res = await fetch('/api/guild');
            const json = await res.json();
            if (json.success && json.data) {
                AppState.guild = json.data;
                DOM.serverNameLabel.textContent = AppState.guild.name || 'Serveur Discord';
                document.title = `${AppState.guild.name} - Chienne Bot`;

                if (AppState.guild.icon) {
                    DOM.guildAvatarRail.innerHTML = `<img src="${AppState.guild.icon}" alt="Guild Icon">`;
                } else {
                    const initials = AppState.guild.name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
                    DOM.guildInitials.textContent = initials || 'CB';
                }

                if (AppState.guild.bot) {
                    DOM.botAvatarImg.src = AppState.guild.bot.avatar;
                    DOM.botUsernameLabel.textContent = AppState.guild.bot.username;
                    DOM.botStatusDot.className = `status-indicator ${AppState.guild.botOnline ? 'online' : 'offline'}`;
                    DOM.botCustomStatus.textContent = AppState.guild.botOnline ? 'En ligne' : 'Déconnecté';
                }
            }
        } catch (e) {
            console.error('Erreur chargement guild:', e);
        }
    }

    // Récupérer les rôles du serveur
    async function fetchRoles() {
        try {
            const res = await fetch('/api/roles');
            const json = await res.json();
            if (json.success && json.data) {
                AppState.roles = json.data;
                AppState.rolesMap = {};
                
                // Mettre à jour les dropdowns de rôles
                DOM.userRoleFilter.innerHTML = '<option value="ALL">Tous les rôles</option>';
                DOM.captchaRoleSelect.innerHTML = '<option value="">-- Aucun rôle spécifique --</option>';

                AppState.roles.forEach(role => {
                    AppState.rolesMap[role.id] = role.name;

                    const opt = document.createElement('option');
                    opt.value = role.id;
                    opt.textContent = `${role.name} (${role.memberCount} membres)`;
                    DOM.userRoleFilter.appendChild(opt);

                    const optCaptcha = document.createElement('option');
                    optCaptcha.value = role.id;
                    optCaptcha.textContent = role.name;
                    DOM.captchaRoleSelect.appendChild(optCaptcha);
                });
            }
        } catch (e) {
            console.error('Erreur chargement rôles:', e);
        }
    }

    // Récupérer la liste des catégories et salons
    async function fetchChannels() {
        try {
            const res = await fetch('/api/channels');
            const json = await res.json();
            if (json.success && json.data) {
                AppState.channels = json.data;
                renderChannelsSidebar(AppState.channels);
                populateChannelSelects(AppState.channels);
            }
        } catch (e) {
            console.error('Erreur chargement salons:', e);
        }
    }

    // Remplir les dropdowns de salons pour la configuration
    function populateChannelSelects(categories) {
        DOM.welcomeChannelSelect.innerHTML = '<option value="">-- Sélectionner un salon --</option>';
        DOM.captchaLogChannelSelect.innerHTML = '<option value="">-- Sélectionner un salon --</option>';

        AppState.channelsMap = {};

        categories.forEach(cat => {
            if (cat.channels) {
                cat.channels.forEach(ch => {
                    AppState.channelsMap[ch.id] = ch.name;
                    if (ch.type !== 'voice' && !ch.id.startsWith('virtual-')) {
                        const optWelcome = document.createElement('option');
                        optWelcome.value = ch.id;
                        optWelcome.textContent = `# ${ch.name}`;
                        DOM.welcomeChannelSelect.appendChild(optWelcome);

                        const optCaptcha = document.createElement('option');
                        optCaptcha.value = ch.id;
                        optCaptcha.textContent = `# ${ch.name}`;
                        DOM.captchaLogChannelSelect.appendChild(optCaptcha);
                    }
                });
            }
        });
    }

    // ============================================
    // 2. RENDU DE LA SIDEBAR DES SALONS
    // ============================================
    function renderChannelsSidebar(categories) {
        DOM.channelsList.innerHTML = '';

        categories.forEach(cat => {
            const catEl = document.createElement('div');
            catEl.className = `channel-category ${cat.isVirtual ? 'virtual-category' : ''}`;

            // En-tête de catégorie
            const catHeader = document.createElement('div');
            catHeader.className = 'category-header';
            catHeader.innerHTML = `
                <span class="category-arrow">▼</span>
                <span class="category-name">${cat.name}</span>
                ${cat.isVirtual ? '<span class="category-badge">MODULES</span>' : ''}
            `;

            catHeader.addEventListener('click', () => {
                catEl.classList.toggle('collapsed');
            });

            // Liste des salons de la catégorie
            const catChannels = document.createElement('div');
            catChannels.className = 'category-channels';

            if (cat.channels && cat.channels.length > 0) {
                cat.channels.forEach(ch => {
                    const chItem = document.createElement('div');
                    chItem.className = `channel-item ${ch.id.startsWith('virtual-') ? 'virtual-channel' : ''}`;
                    chItem.dataset.channelId = ch.id;

                    let iconSymbol = '#';
                    if (ch.icon === 'scroll') iconSymbol = '📜';
                    else if (ch.icon === 'gear') iconSymbol = '⚙️';
                    else if (ch.icon === 'users') iconSymbol = '👥';
                    else if (ch.icon === 'volume-2') iconSymbol = '🔊';
                    else if (ch.icon === 'megaphone') iconSymbol = '📢';
                    else if (ch.icon === 'message-square') iconSymbol = '💬';

                    chItem.innerHTML = `
                        <span class="channel-icon">${iconSymbol}</span>
                        <span class="channel-name">${ch.name}</span>
                    `;

                    chItem.addEventListener('click', () => {
                        selectChannel(ch.id);
                    });

                    catChannels.appendChild(chItem);
                });
            }

            catEl.appendChild(catHeader);
            catEl.appendChild(catChannels);
            DOM.channelsList.appendChild(catEl);
        });
    }

    // ============================================
    // 3. SÉLECTION ET CHANGEMENT DE SALON
    // ============================================
    async function selectChannel(channelId) {
        // Trouver les métadonnées du salon
        let targetChannel = null;
        for (const cat of AppState.channels) {
            if (cat.channels) {
                const found = cat.channels.find(c => c.id === channelId);
                if (found) {
                    targetChannel = found;
                    break;
                }
            }
        }

        if (!targetChannel) {
            // Salon par défaut virtuel si introuvable
            targetChannel = { id: channelId, name: channelId, type: 'virtual', icon: 'hash', topic: '' };
        }

        AppState.currentChannel = targetChannel;

        // Mettre à jour l'état actif dans la sidebar
        document.querySelectorAll('.channel-item').forEach(el => {
            el.classList.toggle('active', el.dataset.channelId === channelId);
        });

        // Mettre à jour l'en-tête
        let iconSymbol = '#';
        if (targetChannel.icon === 'scroll') iconSymbol = '📜';
        else if (targetChannel.icon === 'gear') iconSymbol = '⚙️';
        else if (targetChannel.icon === 'users') iconSymbol = '👥';
        else if (targetChannel.icon === 'volume-2') iconSymbol = '🔊';
        else if (targetChannel.icon === 'megaphone') iconSymbol = '📢';

        DOM.headerChannelIcon.textContent = iconSymbol;
        DOM.headerChannelName.textContent = targetChannel.name;
        DOM.headerChannelTopic.textContent = targetChannel.topic || (targetChannel.type === 'virtual' ? 'Salon virtuel Chienne Bot' : `Bienvenue dans le salon ${targetChannel.name}`);

        // Masquer toutes les vues
        DOM.viewMessages.classList.remove('active');
        DOM.viewVirtualLogs.classList.remove('active');
        DOM.viewVirtualConfig.classList.remove('active');
        DOM.viewVirtualUsers.classList.remove('active');
        DOM.logsLiveBadge.classList.add('hidden');

        // Basculer vers la vue appropriée
        if (channelId === 'virtual-logs') {
            DOM.viewVirtualLogs.classList.add('active');
            DOM.logsLiveBadge.classList.remove('hidden');
            renderLogsList();
            if (AppState.autoScrollLogs) {
                DOM.logsContainer.scrollTop = DOM.logsContainer.scrollHeight;
            }
        } else if (channelId === 'virtual-config') {
            DOM.viewVirtualConfig.classList.add('active');
            await fetchBotConfig();
        } else if (channelId === 'virtual-users') {
            DOM.viewVirtualUsers.classList.add('active');
            await fetchUsers();
        } else {
            // Salon Discord classique avec historique de messages
            DOM.viewMessages.classList.add('active');
            DOM.bannerChannelIcon.textContent = iconSymbol;
            DOM.bannerChannelTitle.textContent = `Bienvenue dans #${targetChannel.name} !`;
            DOM.messageTextInput.placeholder = `Envoyer un message dans #${targetChannel.name} en tant que Bot...`;

            if (!AppState.messages[channelId] || AppState.messages[channelId].length === 0) {
                await loadChannelMessages(channelId);
            } else {
                renderMessagesList(channelId);
                scrollMessagesToBottom();
            }
        }
    }

    // ============================================
    // 4. CHARGEMENT PAGINÉ DES MESSAGES (SCROLLING INFINI)
    // ============================================
    async function loadChannelMessages(channelId, before = null) {
        if (AppState.isLoadingOlder) return;
        AppState.isLoadingOlder = true;

        if (before) {
            DOM.loadingOlderMessages.classList.remove('hidden');
        }

        try {
            let url = `/api/channels/${channelId}/messages?limit=50`;
            if (before) {
                url += `&before=${before}`;
            }

            const res = await fetch(url);
            const json = await res.json();

            if (json.success && json.data) {
                const { messages, hasMore, oldestId } = json.data;

                if (!AppState.messages[channelId]) {
                    AppState.messages[channelId] = [];
                }

                if (before) {
                    // Sauvegarder la position du scroll avant d'insérer les anciens messages
                    const prevScrollHeight = DOM.messagesContainer.scrollHeight;
                    const prevScrollTop = DOM.messagesContainer.scrollTop;

                    // Ajouter les messages plus anciens au début
                    AppState.messages[channelId] = [...messages, ...AppState.messages[channelId]];
                    AppState.oldestMessageId[channelId] = oldestId || (messages.length > 0 ? messages[0].id : null);
                    AppState.hasMoreMessages[channelId] = hasMore;

                    renderMessagesList(channelId);

                    // Restaurer le scroll pour éviter les sauts visuels
                    const newScrollHeight = DOM.messagesContainer.scrollHeight;
                    DOM.messagesContainer.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
                } else {
                    // Premier chargement
                    AppState.messages[channelId] = messages;
                    AppState.oldestMessageId[channelId] = oldestId;
                    AppState.hasMoreMessages[channelId] = hasMore;

                    renderMessagesList(channelId);
                    scrollMessagesToBottom();
                }
            }
        } catch (e) {
            console.error('Erreur chargement messages:', e);
            showToast('Impossible de charger les messages', 'error');
        } finally {
            AppState.isLoadingOlder = false;
            DOM.loadingOlderMessages.classList.add('hidden');
        }
    }

    // Rendu de l'historique des messages dans le salon
    function renderMessagesList(channelId) {
        const messages = AppState.messages[channelId] || [];
        DOM.messagesList.innerHTML = '';

        if (messages.length === 0) {
            DOM.messagesList.innerHTML = `
                <div style="padding: 20px; color: var(--text-muted); text-align: center;">
                    Aucun message récent dans ce salon.
                </div>
            `;
            return;
        }

        let previousAuthorId = null;
        let previousTimestamp = null;

        messages.forEach(msg => {
            const msgDate = new Date(msg.createdAt);
            const isSameAuthor = previousAuthorId === msg.author.id;
            const isCloseTime = previousTimestamp && (msgDate.getTime() - previousTimestamp.getTime() < 5 * 60 * 1000);
            const isGrouped = isSameAuthor && isCloseTime;

            previousAuthorId = msg.author.id;
            previousTimestamp = msgDate;

            const groupEl = document.createElement('div');
            groupEl.className = `message-group ${isGrouped ? 'grouped' : ''}`;
            groupEl.dataset.messageId = msg.id;

            const timeFormatted = formatMessageTime(msgDate);

            // Formater le markdown
            const renderedContent = window.DiscordMarkdown.render(msg.content, {
                usersMap: AppState.usersMap,
                rolesMap: AppState.rolesMap,
                channelsMap: AppState.channelsMap
            });

            // Rendu des Embeds
            let embedsHtml = '';
            if (msg.embeds && msg.embeds.length > 0) {
                msg.embeds.forEach(emb => {
                    const embedBorderColor = emb.color || 'var(--brand)';
                    let fieldsHtml = '';

                    if (emb.fields && emb.fields.length > 0) {
                        fieldsHtml = `<div class="embed-fields-grid">` + emb.fields.map(f => `
                            <div class="embed-field">
                                <div class="embed-field-name">${window.DiscordMarkdown.escapeHtml(f.name)}</div>
                                <div class="embed-field-value">${window.DiscordMarkdown.render(f.value)}</div>
                            </div>
                        `).join('') + `</div>`;
                    }

                    embedsHtml += `
                        <div class="discord-embed" style="border-left-color: ${embedBorderColor}">
                            ${emb.author ? `
                                <div class="embed-author">
                                    ${emb.author.iconURL ? `<img src="${emb.author.iconURL}" alt="Author">` : ''}
                                    <span>${window.DiscordMarkdown.escapeHtml(emb.author.name)}</span>
                                </div>
                            ` : ''}
                            ${emb.title ? `<div class="embed-title">${window.DiscordMarkdown.escapeHtml(emb.title)}</div>` : ''}
                            ${emb.description ? `<div class="embed-desc">${window.DiscordMarkdown.render(emb.description)}</div>` : ''}
                            ${fieldsHtml}
                            ${emb.image ? `<div class="embed-image"><img src="${emb.image.url}" alt="Embed Image"></div>` : ''}
                            ${emb.footer ? `
                                <div class="embed-footer">
                                    ${emb.footer.iconURL ? `<img src="${emb.footer.iconURL}" alt="Footer">` : ''}
                                    <span>${window.DiscordMarkdown.escapeHtml(emb.footer.text)}</span>
                                </div>
                            ` : ''}
                        </div>
                    `;
                });
            }

            // Rendu des Pièces Jointes (Images)
            let attachmentsHtml = '';
            if (msg.attachments && msg.attachments.length > 0) {
                msg.attachments.forEach(att => {
                    const isImg = att.contentType?.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(att.url);
                    if (isImg) {
                        attachmentsHtml += `
                            <div class="message-attachment">
                                <a href="${att.url}" target="_blank" rel="noopener noreferrer">
                                    <img class="message-attachment-image" src="${att.proxyUrl || att.url}" alt="${att.name}">
                                </a>
                            </div>
                        `;
                    } else {
                        attachmentsHtml += `
                            <div class="message-attachment-file">
                                📁 <a href="${att.url}" target="_blank" class="discord-link">${att.name}</a>
                            </div>
                        `;
                    }
                });
            }

            // Rendu des Réactions
            let reactionsHtml = '';
            if (msg.reactions && msg.reactions.length > 0) {
                reactionsHtml = `<div class="message-reactions">` + msg.reactions.map(r => `
                    <div class="reaction-pill">
                        <span>${r.emoji}</span>
                        <span>${r.count}</span>
                    </div>
                `).join('') + `</div>`;
            }

            if (isGrouped) {
                groupEl.innerHTML = `
                    <div class="message-avatar-col">
                        <span class="grouped-timestamp">${timeFormatted.short}</span>
                    </div>
                    <div class="message-content-col">
                        <div class="message-text">${renderedContent}</div>
                        ${embedsHtml}
                        ${attachmentsHtml}
                        ${reactionsHtml}
                    </div>
                `;
            } else {
                const authorColorStyle = msg.author.roleColor ? `style="color: ${msg.author.roleColor}"` : '';
                groupEl.innerHTML = `
                    <div class="message-avatar-col">
                        <img class="message-avatar" src="${msg.author.avatar}" alt="Avatar" onclick="AppState.showUserModal('${msg.author.id}')">
                    </div>
                    <div class="message-content-col">
                        <div class="message-header">
                            <span class="message-author" ${authorColorStyle} onclick="AppState.showUserModal('${msg.author.id}')">
                                ${window.DiscordMarkdown.escapeHtml(msg.author.displayName || msg.author.username)}
                            </span>
                            ${msg.author.bot ? '<span class="bot-badge">BOT</span>' : ''}
                            <span class="message-timestamp">${timeFormatted.full}</span>
                        </div>
                        <div class="message-text">${renderedContent}</div>
                        ${embedsHtml}
                        ${attachmentsHtml}
                        ${reactionsHtml}
                    </div>
                `;
            }

            DOM.messagesList.appendChild(groupEl);
        });
    }

    function scrollMessagesToBottom() {
        setTimeout(() => {
            DOM.messagesContainer.scrollTop = DOM.messagesContainer.scrollHeight;
        }, 50);
    }

    function formatMessageTime(date) {
        const now = new Date();
        const isToday = now.toDateString() === date.toDateString();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const isYesterday = yesterday.toDateString() === date.toDateString();

        const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        let full = `${date.toLocaleDateString('fr-FR')} à ${timeStr}`;
        if (isToday) full = `Aujourd'hui à ${timeStr}`;
        else if (isYesterday) full = `Hier à ${timeStr}`;

        return { short: timeStr, full: full };
    }

    // ============================================
    // 5. ENVOI DE MESSAGE DEPUIS LE WEB
    // ============================================
    async function handleSendMessage(e) {
        e.preventDefault();
        const text = DOM.messageTextInput.value.trim();
        if (!text || !AppState.currentChannel || AppState.currentChannel.id.startsWith('virtual-')) return;

        const channelId = AppState.currentChannel.id;
        DOM.messageTextInput.value = '';

        try {
            const res = await fetch(`/api/channels/${channelId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: text })
            });

            const json = await res.json();
            if (json.success) {
                showToast('Message envoyé avec succès', 'success');
                // Recharger les derniers messages
                await loadChannelMessages(channelId);
            } else {
                showToast(json.error || 'Erreur lors de l\'envoi du message', 'error');
            }
        } catch (e) {
            showToast('Erreur de connexion au serveur', 'error');
        }
    }

    // ============================================
    // 6. SALON VIRTUEL : LOGS EN DIRECT (SSE)
    // ============================================
    function initLogsStream() {
        if (AppState.logEventSource) {
            AppState.logEventSource.close();
        }

        try {
            AppState.logEventSource = new EventSource('/api/logs/stream');

            AppState.logEventSource.addEventListener('log', (e) => {
                const log = JSON.parse(e.data);
                AppState.logs.push(log);
                if (AppState.logs.length > 1000) AppState.logs.shift();

                if (AppState.currentChannel && AppState.currentChannel.id === 'virtual-logs') {
                    appendLogEntry(log);
                }
            });

            AppState.logEventSource.addEventListener('clear', () => {
                AppState.logs = [];
                DOM.logEntriesList.innerHTML = '';
            });

            AppState.logEventSource.onerror = () => {
                // En cas de coupure SSE, retenter automatiquement
            };
        } catch (e) {
            console.error('Erreur init SSE logs:', e);
        }
    }

    function renderLogsList() {
        DOM.logEntriesList.innerHTML = '';
        const filtered = getFilteredLogs();

        filtered.forEach(log => {
            const line = createLogElement(log);
            DOM.logEntriesList.appendChild(line);
        });
    }

    function appendLogEntry(log) {
        // Vérifier si le log correspond aux filtres actifs
        if (AppState.logLevelFilter !== 'ALL' && log.level !== AppState.logLevelFilter && log.category !== AppState.logLevelFilter) {
            return;
        }
        if (AppState.logSearch && !log.message.toLowerCase().includes(AppState.logSearch.toLowerCase())) {
            return;
        }

        const line = createLogElement(log);
        DOM.logEntriesList.appendChild(line);

        if (AppState.autoScrollLogs) {
            DOM.logsContainer.scrollTop = DOM.logsContainer.scrollHeight;
        }
    }

    function createLogElement(log) {
        const line = document.createElement('div');
        line.className = 'log-line';

        const timeStr = new Date(log.timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const badgeClass = `badge-${(log.category || log.level || 'info').toLowerCase()}`;

        line.innerHTML = `
            <span class="log-time">${timeStr}</span>
            <span class="log-badge ${badgeClass}">${log.category || log.level}</span>
            <span class="log-msg">${window.DiscordMarkdown.escapeHtml(log.message)}</span>
        `;
        return line;
    }

    function getFilteredLogs() {
        return AppState.logs.filter(l => {
            if (AppState.logLevelFilter !== 'ALL') {
                if (l.level !== AppState.logLevelFilter && l.category !== AppState.logLevelFilter) {
                    return false;
                }
            }
            if (AppState.logSearch) {
                return l.message.toLowerCase().includes(AppState.logSearch.toLowerCase()) ||
                       l.category.toLowerCase().includes(AppState.logSearch.toLowerCase());
            }
            return true;
        });
    }

    // ============================================
    // 7. SALON VIRTUEL : CONFIGURATION DU BOT
    // ============================================
    async function fetchBotConfig() {
        try {
            const res = await fetch('/api/config');
            const json = await res.json();
            if (json.success && json.data) {
                AppState.config = json.data;
                populateConfigForms(AppState.config);
            }
        } catch (e) {
            console.error('Erreur chargement config:', e);
        }
    }

    function populateConfigForms(config) {
        // 1. Welcome
        if (config.welcome) {
            const w = config.welcome;
            document.getElementById('welcome-enabled').checked = !!w.ENABLED;
            DOM.welcomeChannelSelect.value = w.WELCOME_CHANNEL_ID || '';
            document.getElementById('welcome-title').value = w.WELCOME_MESSAGE?.title || '';
            document.getElementById('welcome-desc').value = w.WELCOME_MESSAGE?.description || '';
            const col = w.WELCOME_MESSAGE?.color || '#00FF00';
            DOM.welcomeColor.value = col.startsWith('#') ? col : '#00FF00';
            DOM.welcomeColorHex.value = col;
            document.getElementById('welcome-send-dm').checked = !!w.SEND_DM;
        }

        // 2. Captcha
        if (config.captcha) {
            const c = config.captcha;
            document.getElementById('captcha-enabled').checked = !!c.ENABLED;
            DOM.captchaRoleSelect.value = c.VERIFIED_ROLE_ID || '';
            DOM.captchaLogChannelSelect.value = c.CAPTCHA_LOG_CHANNEL || '';
            document.getElementById('captcha-timeout').value = c.CAPTCHA_TIMEOUT || 10;
            document.getElementById('captcha-max-attempts').value = c.MAX_ATTEMPTS || 3;
        }

        // 3. XP
        if (config.xp) {
            const x = config.xp;
            document.getElementById('xp-min-msg').value = x.MESSAGE_XP?.MIN || 15;
            document.getElementById('xp-max-msg').value = x.MESSAGE_XP?.MAX || 25;
            document.getElementById('xp-cooldown').value = x.MESSAGE_XP?.COOLDOWN || 10;
            document.getElementById('xp-voice-per-min').value = x.VOICE_XP?.PER_MINUTE || 2;
            document.getElementById('xp-voice-interval').value = x.VOICE_XP?.CHECK_INTERVAL || 5;
            document.getElementById('xp-daily-first').value = x.BONUS?.DAILY_FIRST_MESSAGE || 50;
            document.getElementById('xp-max-per-day').value = x.LIMITS?.MAX_XP_PER_DAY || 5000;
        }

        // 4. Daily
        if (config.env) {
            document.getElementById('daily-channel-id').value = config.env.dailyMessageChannelId || 'Non défini';
            document.getElementById('daily-ai-model').value = config.env.openaiModel || 'gpt-4o-mini';
        }
    }

    async function saveConfigModule(moduleName, data) {
        try {
            const res = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ module: moduleName, config: data })
            });
            const json = await res.json();
            if (json.success) {
                showToast(`Configuration ${moduleName.toUpperCase()} enregistrée avec succès !`, 'success');
            } else {
                showToast(json.error || 'Erreur lors de la sauvegarde', 'error');
            }
        } catch (e) {
            showToast('Erreur de connexion', 'error');
        }
    }

    // ============================================
    // 8. SALON VIRTUEL : USERS (LISTE & RECHERCHE)
    // ============================================
    async function fetchUsers() {
        try {
            let url = `/api/users?search=${encodeURIComponent(AppState.userSearch)}&role=${encodeURIComponent(AppState.userRoleFilter)}&isBot=${AppState.userBotFilter}&sortBy=${AppState.userSortBy}`;
            const res = await fetch(url);
            const json = await res.json();
            if (json.success && json.data) {
                AppState.users = json.data.users;
                AppState.users.forEach(u => {
                    AppState.usersMap[u.id] = u.displayName || u.username;
                });
                renderUsersGrid(AppState.users, json.data.total);
            }
        } catch (e) {
            console.error('Erreur chargement users:', e);
        }
    }

    function renderUsersGrid(users, total) {
        DOM.userCountDisplay.textContent = `${total} membre(s)`;
        DOM.usersGridContainer.innerHTML = '';

        if (users.length === 0) {
            DOM.usersGridContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
                    Aucun membre trouvé avec ces critères de recherche.
                </div>
            `;
            return;
        }

        users.forEach(u => {
            const card = document.createElement('div');
            card.className = 'user-card';

            const rolesHtml = u.roles && u.roles.length > 0
                ? u.roles.slice(0, 3).map(r => `
                    <span class="role-pill">
                        <span class="role-dot" style="background-color: ${r.color || '#5865F2'}"></span>
                        <span>${window.DiscordMarkdown.escapeHtml(r.name)}</span>
                    </span>
                `).join('') + (u.roles.length > 3 ? `<span class="role-pill">+${u.roles.length - 3}</span>` : '')
                : '<span class="role-pill">Membre</span>';

            card.innerHTML = `
                <div class="user-card-banner"></div>
                <div class="user-card-body">
                    <div class="user-card-avatar-wrapper">
                        <img class="user-card-avatar" src="${u.avatar}" alt="Avatar">
                    </div>
                    <div class="user-card-header-info">
                        <div class="user-card-displayname">
                            <span>${window.DiscordMarkdown.escapeHtml(u.displayName || u.username)}</span>
                            ${u.isBot ? '<span class="bot-badge">BOT</span>' : ''}
                        </div>
                        <div class="user-card-tag">${window.DiscordMarkdown.escapeHtml(u.tag || u.username)}</div>
                    </div>
                    <div class="user-card-roles">${rolesHtml}</div>
                    <div class="user-card-xp-badge">
                        <span>Niveau <strong>${u.level || 1}</strong></span>
                        <span><strong>${(u.xp || 0).toLocaleString()}</strong> XP</span>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                showUserModal(u);
            });

            DOM.usersGridContainer.appendChild(card);
        });
    }

    function showUserModal(userOrId) {
        let user = typeof userOrId === 'object' ? userOrId : AppState.users.find(u => u.id === userOrId);
        if (!user) return;

        DOM.modalUserAvatar.src = user.avatar;
        DOM.modalUserDisplayname.textContent = user.displayName || user.username;
        DOM.modalUserTag.textContent = user.tag || `${user.username}#${user.discriminator || '0000'}`;
        DOM.modalUserId.textContent = `ID: ${user.id}`;

        // Rôles
        DOM.modalRolesContainer.innerHTML = '';
        if (user.roles && user.roles.length > 0) {
            user.roles.forEach(r => {
                const pill = document.createElement('span');
                pill.className = 'role-pill';
                pill.innerHTML = `
                    <span class="role-dot" style="background-color: ${r.color || '#5865F2'}"></span>
                    <span>${window.DiscordMarkdown.escapeHtml(r.name)}</span>
                `;
                DOM.modalRolesContainer.appendChild(pill);
            });
        } else {
            DOM.modalRolesContainer.innerHTML = '<span class="role-pill">Aucun rôle</span>';
        }

        // Stats
        DOM.modalStatLevel.textContent = user.level || 1;
        DOM.modalStatXp.textContent = (user.xp || 0).toLocaleString();
        DOM.modalStatMessages.textContent = (user.messagesCount || 0).toLocaleString();
        DOM.modalStatVoice.textContent = `${user.voiceMinutes || 0} min`;

        // Dates
        DOM.modalDateJoined.textContent = user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Inconnue';
        DOM.modalDateCreated.textContent = user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Inconnue';

        DOM.userDetailModal.classList.remove('hidden');
    }

    AppState.showUserModal = showUserModal;

    // ============================================
    // 9. EVENT LISTENERS
    // ============================================
    function setupEventListeners() {
        // Envoi de message
        DOM.sendMessageForm.addEventListener('submit', handleSendMessage);
        DOM.messageTextInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
            }
        });

        // Défilement infini vers le haut pour charger les anciens messages
        DOM.messagesContainer.addEventListener('scroll', () => {
            if (DOM.messagesContainer.scrollTop < 60 && !AppState.isLoadingOlder && AppState.currentChannel) {
                const channelId = AppState.currentChannel.id;
                if (!channelId.startsWith('virtual-') && AppState.hasMoreMessages[channelId]) {
                    const oldestId = AppState.oldestMessageId[channelId];
                    if (oldestId) {
                        loadChannelMessages(channelId, oldestId);
                    }
                }
            }
        });

        // Boutons outils d'en-tête
        DOM.btnScrollBottom.addEventListener('click', scrollMessagesToBottom);
        DOM.btnRefreshChannel.addEventListener('click', () => {
            if (AppState.currentChannel) selectChannel(AppState.currentChannel.id);
        });

        // Boutons rapides du rail gauche
        DOM.homeGuildBtn.addEventListener('click', () => selectChannel('virtual-logs'));
        DOM.btnVirtualLogsQuick.addEventListener('click', () => selectChannel('virtual-logs'));
        DOM.btnVirtualConfigQuick.addEventListener('click', () => selectChannel('virtual-config'));
        DOM.btnVirtualUsersQuick.addEventListener('click', () => selectChannel('virtual-users'));
        DOM.btnOpenSettings.addEventListener('click', () => selectChannel('virtual-config'));

        DOM.btnRefreshAll.addEventListener('click', async () => {
            showToast('Rafraîchissement des données...', 'info', 1500);
            await fetchGuildInfo();
            await fetchRoles();
            await fetchChannels();
            if (AppState.currentChannel) selectChannel(AppState.currentChannel.id);
        });

        // Filtres Logs
        DOM.logLevelFilter.addEventListener('change', (e) => {
            AppState.logLevelFilter = e.target.value;
            renderLogsList();
        });

        DOM.logSearchInput.addEventListener('input', (e) => {
            AppState.logSearch = e.target.value;
            DOM.btnClearLogSearch.classList.toggle('hidden', !e.target.value);
            renderLogsList();
        });

        DOM.btnClearLogSearch.addEventListener('click', () => {
            DOM.logSearchInput.value = '';
            AppState.logSearch = '';
            DOM.btnClearLogSearch.classList.add('hidden');
            renderLogsList();
        });

        DOM.btnToggleAutoscroll.addEventListener('click', () => {
            AppState.autoScrollLogs = !AppState.autoScrollLogs;
            DOM.btnToggleAutoscroll.classList.toggle('active', AppState.autoScrollLogs);
            DOM.btnToggleAutoscroll.innerHTML = `<span class="toggle-icon">📌</span> Auto-scroll : ${AppState.autoScrollLogs ? 'ON' : 'OFF'}`;
        });

        DOM.btnCopyLogs.addEventListener('click', () => {
            const filtered = getFilteredLogs();
            const text = filtered.map(l => `[${l.timestamp}] [${l.category || l.level}] ${l.message}`).join('\n');
            navigator.clipboard.writeText(text).then(() => {
                showToast('Logs copiés dans le presse-papier !', 'success');
            });
        });

        DOM.btnClearLogs.addEventListener('click', async () => {
            await fetch('/api/logs', { method: 'DELETE' });
            AppState.logs = [];
            DOM.logEntriesList.innerHTML = '';
            showToast('Logs effacés', 'info');
        });

        // Navigation Tabs Config
        DOM.configNavItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetTab = item.dataset.tab;
                DOM.configNavItems.forEach(i => i.classList.toggle('active', i === item));
                DOM.configTabPanels.forEach(panel => {
                    panel.classList.toggle('active', panel.dataset.tabContent === targetTab);
                });
            });
        });

        // Formulaires de Configuration
        DOM.welcomeColor.addEventListener('input', (e) => {
            DOM.welcomeColorHex.value = e.target.value.toUpperCase();
        });
        DOM.welcomeColorHex.addEventListener('input', (e) => {
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                DOM.welcomeColor.value = e.target.value;
            }
        });

        DOM.formConfigWelcome.addEventListener('submit', (e) => {
            e.preventDefault();
            const configData = {
                WELCOME_CHANNEL_ID: DOM.welcomeChannelSelect.value,
                AUTO_ROLES: AppState.config?.welcome?.AUTO_ROLES || [],
                WELCOME_MESSAGE: {
                    title: document.getElementById('welcome-title').value,
                    description: document.getElementById('welcome-desc').value,
                    color: DOM.welcomeColorHex.value || '#00FF00',
                    footer: 'Membre #{memberCount}',
                    fields: AppState.config?.welcome?.WELCOME_MESSAGE?.fields || [],
                    thumbnail: 'user',
                    image: null
                },
                ENABLED: document.getElementById('welcome-enabled').checked,
                SEND_DM: document.getElementById('welcome-send-dm').checked,
                DM_MESSAGE: AppState.config?.welcome?.DM_MESSAGE || {},
                LOG_TO_CONSOLE: true
            };
            saveConfigModule('welcome', configData);
        });

        DOM.formConfigCaptcha.addEventListener('submit', (e) => {
            e.preventDefault();
            const configData = {
                ENABLED: document.getElementById('captcha-enabled').checked,
                CAPTCHA_LOG_CHANNEL: DOM.captchaLogChannelSelect.value,
                CAPTCHA_CHANNEL_ID: AppState.config?.captcha?.CAPTCHA_CHANNEL_ID || null,
                CAPTCHA_CHANNEL_NAME: '✅-verification-captcha',
                VERIFIED_ROLE_ID: DOM.captchaRoleSelect.value,
                CAPTCHA_TIMEOUT: parseInt(document.getElementById('captcha-timeout').value) || 10,
                MAX_ATTEMPTS: parseInt(document.getElementById('captcha-max-attempts').value) || 3,
                MATH_QUESTIONS: AppState.config?.captcha?.MATH_QUESTIONS || {},
                MESSAGES: AppState.config?.captcha?.MESSAGES || {}
            };
            saveConfigModule('captcha', configData);
        });

        DOM.formConfigXp.addEventListener('submit', (e) => {
            e.preventDefault();
            const configData = {
                MESSAGE_XP: {
                    MIN: parseInt(document.getElementById('xp-min-msg').value) || 15,
                    MAX: parseInt(document.getElementById('xp-max-msg').value) || 25,
                    COOLDOWN: parseInt(document.getElementById('xp-cooldown').value) || 10
                },
                VOICE_XP: {
                    PER_MINUTE: parseInt(document.getElementById('xp-voice-per-min').value) || 2,
                    CHECK_INTERVAL: parseInt(document.getElementById('xp-voice-interval').value) || 5,
                    MIN_DURATION: 1
                },
                LEVEL: AppState.config?.xp?.LEVEL || {},
                BONUS: {
                    DAILY_FIRST_MESSAGE: parseInt(document.getElementById('xp-daily-first').value) || 50,
                    STREAK_MULTIPLIER: 1.1,
                    EVENT_MULTIPLIER: 2
                },
                LIMITS: {
                    MAX_XP_PER_DAY: parseInt(document.getElementById('xp-max-per-day').value) || 5000,
                    MAX_MESSAGES_PER_MINUTE: 5
                },
                LEVEL_ROLES: AppState.config?.xp?.LEVEL_ROLES || {}
            };
            saveConfigModule('xp', configData);
        });

        // Filtres Users
        let searchDebounce = null;
        DOM.userSearchInput.addEventListener('input', (e) => {
            AppState.userSearch = e.target.value;
            DOM.btnClearUserSearch.classList.toggle('hidden', !e.target.value);
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(fetchUsers, 250);
        });

        DOM.btnClearUserSearch.addEventListener('click', () => {
            DOM.userSearchInput.value = '';
            AppState.userSearch = '';
            DOM.btnClearUserSearch.classList.add('hidden');
            fetchUsers();
        });

        DOM.userRoleFilter.addEventListener('change', (e) => {
            AppState.userRoleFilter = e.target.value;
            fetchUsers();
        });

        DOM.userBotFilter.addEventListener('change', (e) => {
            AppState.userBotFilter = e.target.value;
            fetchUsers();
        });

        DOM.userSortFilter.addEventListener('change', (e) => {
            AppState.userSortBy = e.target.value;
            fetchUsers();
        });

        // Modale Fermeture
        DOM.btnCloseModal.addEventListener('click', () => {
            DOM.userDetailModal.classList.add('hidden');
        });

        DOM.userDetailModal.addEventListener('click', (e) => {
            if (e.target === DOM.userDetailModal) {
                DOM.userDetailModal.classList.add('hidden');
            }
        });
    }

    // Démarrer l'application
    init();
});
