/**
 * Mobile Frontend Framework
 * Cute iOS-style Mobile Interface
 */

class MobilePhone {
    constructor() {
        this.isVisible = false;
        this.currentApp = null;
        this.apps = {};
        this.appStack = []; // Add app stack to manage page navigation
        this.currentAppState = null; // Current app state
        this.dragHelper = null; // Drag helper (button)
        this.frameDragHelper = null; // Frame drag helper

        // Debounce related flags
        this._openingApp = null;
        this._goingHome = false;
        this._returningToApp = null;
        this._lastAppIconClick = 0;
        this._lastBackButtonClick = 0;

        // App loading state management
        this._loadingApps = new Set(); // Apps currently loading
        this._userNavigationIntent = null; // User navigation intent
        this._loadingStartTime = {}; // App loading start time

        this.init();
    }

    init() {
        this.loadDragHelper();
        this.clearPositionCache(); // Clear position cache
        this.createPhoneButton();
        this.createPhoneContainer();
        this.registerApps();
        this.startClock();
        this.initPageSwipe(); // Initialize page drag functionality

        // Initialize text color settings
        setTimeout(() => {
            this.initTextColor();
        }, 1000); // Delay initialization to ensure page loads completely
    }

    // Initialize page drag functionality
    initPageSwipe() {
        this.currentPageIndex = 0;
        this.totalPages = 2;
        this.isDragging = false;
        this.startX = 0;
        this.currentX = 0;
        this.threshold = 50; // Drag threshold

        // Wait for DOM elements to load
        setTimeout(() => {
            const wrapper = document.getElementById('app-pages-wrapper');
            const indicators = document.getElementById('page-indicators');

            if (!wrapper || !indicators) {
                console.log('[Mobile Phone] Page elements not found, delaying drag initialization');
                setTimeout(() => this.initPageSwipe(), 100);
                return;
            }

            // Mouse events (PC)
            wrapper.addEventListener('mousedown', this.handleStart.bind(this));
            wrapper.addEventListener('mousemove', this.handleMove.bind(this));
            wrapper.addEventListener('mouseup', this.handleEnd.bind(this));
            wrapper.addEventListener('mouseleave', this.handleEnd.bind(this));

            // Touch events (Mobile)
            wrapper.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
            wrapper.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
            wrapper.addEventListener('touchend', this.handleEnd.bind(this));

            // Indicator click events
            const indicatorElements = indicators.querySelectorAll('.indicator');
            indicatorElements.forEach((indicator, index) => {
                indicator.addEventListener('click', () => {
                    this.goToPage(index);
                });
            });

            console.log('[Mobile Phone] Page drag functionality initialized');
        }, 100);
    }

    // Handle drag start
    handleStart(e) {
        this.isDragging = true;
        this.startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        this.currentX = this.startX;

        const wrapper = document.getElementById('app-pages-wrapper');
        wrapper.style.transition = 'none';
    }

    // Handle drag movement
    handleMove(e) {
        if (!this.isDragging) return;

        e.preventDefault();
        this.currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const deltaX = this.currentX - this.startX;

        const wrapper = document.getElementById('app-pages-wrapper');
        const translateX = -this.currentPageIndex * 100 + (deltaX / wrapper.offsetWidth) * 100;
        wrapper.style.transform = `translateX(${translateX}%)`;
    }

    // Handle drag end
    handleEnd(e) {
        if (!this.isDragging) return;

        this.isDragging = false;
        const deltaX = this.currentX - this.startX;
        const wrapper = document.getElementById('app-pages-wrapper');

        // Restore transition effect
        wrapper.style.transition = 'transform 0.3s ease-out';

        // Determine if page switch is needed
        if (Math.abs(deltaX) > this.threshold) {
            if (deltaX > 0 && this.currentPageIndex > 0) {
                // Swipe right, go to previous page
                this.goToPage(this.currentPageIndex - 1);
            } else if (deltaX < 0 && this.currentPageIndex < this.totalPages - 1) {
                // Swipe left, go to next page
                this.goToPage(this.currentPageIndex + 1);
            } else {
                // Return to current page
                this.goToPage(this.currentPageIndex);
            }
        } else {
            // Return to current page
            this.goToPage(this.currentPageIndex);
        }
    }

    // Go to specified page
    goToPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= this.totalPages) return;

        this.currentPageIndex = pageIndex;
        const wrapper = document.getElementById('app-pages-wrapper');
        wrapper.style.transform = `translateX(-${pageIndex * 100}%)`;

        // Update indicators
        this.updateIndicators();
    }

    // Update page indicators
    updateIndicators() {
        const indicators = document.querySelectorAll('.indicator');
        indicators.forEach((indicator, index) => {
            if (index === this.currentPageIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }

    // Load drag helper plugin
    loadDragHelper() {
        // Load CSS styles
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = '/scripts/extensions/third-party/mobile/drag-helper.css';
        document.head.appendChild(cssLink);

        // Load JS plugin
        if (typeof DragHelper === 'undefined') {
            const script = document.createElement('script');
            script.src = '/scripts/extensions/third-party/mobile/drag-helper.js';
            script.onload = () => {
                console.log('[Mobile Phone] Drag plugin loaded successfully');
            };
            script.onerror = () => {
                console.error('[Mobile Phone] Drag plugin failed to load');
            };
            document.head.appendChild(script);
        }
    }

    // Create popup button
    createPhoneButton() {
        try {
            // Check if button already exists
            const existingButton = document.getElementById('mobile-phone-trigger');
            if (existingButton) {
                console.log('[Mobile Phone] Button already exists, removing old button');
                existingButton.remove();
            }

            const button = document.createElement('button');
            button.id = 'mobile-phone-trigger';
            button.className = 'mobile-phone-trigger';
            button.innerHTML = '📱';
            button.title = 'Open Mobile Interface';
            button.addEventListener('click', () => this.togglePhone());

            // Ensure body exists
            if (!document.body) {
                console.error('[Mobile Phone] document.body does not exist, delaying button creation');
                setTimeout(() => this.createPhoneButton(), 100);
                return;
            }

            document.body.appendChild(button);

            // Initialize drag functionality for button
            this.initDragForButton(button);

            console.log('[Mobile Phone] Mobile button created successfully');
        } catch (error) {
            console.error('[Mobile Phone] Error creating button:', error);
        }
    }

    // Initialize drag functionality for button
    initDragForButton(button) {
        // Delay initialization to ensure DragHelper is loaded
        const tryInitDrag = () => {
            if (typeof DragHelper !== 'undefined') {
                // Destroy old drag instance
                if (this.dragHelper) {
                    this.dragHelper.destroy();
                }

                // Create new drag instance
                this.dragHelper = new DragHelper(button, {
                    boundary: document.body,
                    clickThreshold: 8, // Slightly increase click threshold to ensure normal click functionality
                    dragClass: 'mobile-phone-trigger-dragging',
                    savePosition: false, // Do not save position
                    storageKey: 'mobile-phone-trigger-position',
                });

                console.log('[Mobile Phone] Drag functionality initialized successfully');
            } else {
                // If DragHelper not loaded yet, keep waiting
                setTimeout(tryInitDrag, 100);
            }
        };

        tryInitDrag();
    }

    // Clear position cache
    clearPositionCache() {
        try {
            // Clear button position cache
            localStorage.removeItem('mobile-phone-trigger-position');
            // Clear frame position cache
            localStorage.removeItem('mobile-phone-frame-position');
            console.log('[Mobile Phone] Position cache cleared');
        } catch (error) {
            console.warn('[Mobile Phone] Error clearing position cache:', error);
        }
    }

    // Initialize drag functionality for phone frame
    initFrameDrag() {
        // Delay initialization to ensure DragHelper is loaded
        const tryInitFrameDrag = () => {
            if (typeof DragHelper !== 'undefined') {
                const phoneFrame = document.querySelector('.mobile-phone-frame');
                if (phoneFrame) {
                    // Destroy old frame drag instance
                    if (this.frameDragHelper) {
                        this.frameDragHelper.destroy();
                    }

                    // Create new drag instance
                    this.frameDragHelper = new DragHelper(phoneFrame, {
                        boundary: document.body,
                        clickThreshold: 10, // Increase threshold to avoid accidental touches
                        dragClass: 'mobile-phone-frame-dragging',
                        savePosition: false, // Do not save position
                        storageKey: 'mobile-phone-frame-position',
                        touchTimeout: 300, // Increase touch timeout
                        dragHandle: '.mobile-status-bar', // Specify drag handle as status bar
                    });

                    console.log('[Mobile Phone] Frame drag functionality initialized successfully');
                }
            } else {
                // If DragHelper not loaded yet, keep waiting
                setTimeout(tryInitFrameDrag, 100);
            }
        };

        tryInitFrameDrag();
    }

    // Create phone container
    createPhoneContainer() {
        try {
            // Check if container already exists
            const existingContainer = document.getElementById('mobile-phone-container');
            if (existingContainer) {
                console.log('[Mobile Phone] Container already exists, removing old container');
                existingContainer.remove();
            }

            const container = document.createElement('div');
            container.id = 'mobile-phone-container';
            container.className = 'mobile-phone-container';
            container.style.display = 'none';

            container.innerHTML = `
                <div class="mobile-phone-overlay"></div>
                <div class="mobile-phone-frame">
                    <div class="mobile-phone-screen">
                        <!-- Status Bar -->
                        <div class="mobile-status-bar">
                            <div class="status-left">
                                <span class="time" id="mobile-time">08:08</span>
                            </div>
                            <div class="status-center">
                                <div class="dynamic-island"></div>
                            </div>
                            <div class="status-right">
                                <span class="battery">
                                    <span class="battery-icon">🔋</span>
                                    <span class="battery-text">100%</span>
                                </span>
                            </div>
                        </div>

                        <!-- Main Content Area -->
                        <div class="mobile-content" id="mobile-content">
                            <!-- Main Interface -->
                            <div class="home-screen" id="home-screen">
                                <!-- Time Weather Card -->
                                <div class="weather-card">
                                    <div class="weather-time">
                                        <span class="current-time" id="home-time">08:08</span>
                                        <span class="current-date" id="home-date">08/21</span>
                                    </div>
                                    <div class="weather-info">
                                        <span class="weather-desc">Cloudy to Light Rain</span>
                                    </div>
                                </div>


                                <!-- App Pages Container -->
                                <div class="app-pages-container">
                                    <div class="app-pages-wrapper" id="app-pages-wrapper">
                                        <!-- First Page -->
                                        <div class="app-page">
                                            <div class="app-grid">
                                                <!-- First Row: Messages, Shop, Task -->
                                                <div class="app-row">
                                                    <div class="app-icon" data-app="messages">
                                                        <div class="app-icon-bg pink">💬</div>
                                                        <span class="app-label">Messages</span>
                                                    </div>
                                                    <div class="app-icon" data-app="shop">
                                                        <div class="app-icon-bg purple">Shop</div>
                                                        <span class="app-label">Shop</span>
                                                    </div>
                                                    <div class="app-icon" data-app="task">
                                                        <div class="app-icon-bg purple">📰</div>
                                                        <span class="app-label">Tasks</span>
                                                    </div>
                                                </div>
                                                <!-- Second Row: Forum, Weibo, Live -->
                                                <div class="app-row">
                                                    <div class="app-icon" data-app="forum">
                                                        <div class="app-icon-bg red">📰</div>
                                                        <span class="app-label">Forum</span>
                                                    </div>
                                                    <div class="app-icon" data-app="weibo">
                                                        <div class="app-icon-bg orange" style="font-size: 22px;color:rgba(0,0,0,0.4)">Wei</div>
                                                        <span class="app-label">Weibo</span>
                                                    </div>
                                                    <div class="app-icon" data-app="live">
                                                        <div class="app-icon-bg red">🎬</div>
                                                        <span class="app-label">Live</span>
                                                    </div>
                                                </div>
                                                <!-- Third Row: Backpack, API, Settings -->
                                                <div class="app-row">
                                                    <div class="app-icon" data-app="backpack">
                                                        <div class="app-icon-bg orange">🎒</div>
                                                        <span class="app-label">Backpack</span>
                                                    </div>
                                                    <div class="app-icon" data-app="api">
                                                        <div class="app-icon-bg orange" style="font-size: 22px;color:rgba(0,0,0,0.4)">AI</div>
                                                        <span class="app-label">API</span>
                                                    </div>
                                                    <div class="app-icon" data-app="profile">
                                                        <div class="app-icon-bg green">📋</div>
                                                        <span class="app-label">Profile</span>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>

                                        <!-- Second Page -->
                                        <div class="app-page">
                                            <div class="app-grid">
                                                <!-- First Row: Album, Mail, Music -->
                                                <div class="app-row">
                                                    <div class="app-icon" data-app="settings">
                                                        <div class="app-icon-bg purple">⚙️</div>
                                                        <span class="app-label">Settings</span>
                                                    </div>
                                                    <div class="app-icon" data-app="status">
                                                        <div class="app-icon-bg blue">👤</div>
                                                        <span class="app-label">Status</span>
                                                    </div>
                                                    <div class="app-icon" data-app="diary">
                                                        <div class="app-icon-bg orange">📔</div>
                                                        <span class="app-label">Diary</span>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </div>

                                    <!-- Page Indicators -->
                                    <div class="page-indicators" id="page-indicators">
                                        <div class="indicator active"></div>
                                        <div class="indicator"></div>
                                    </div>
                                </div>

                            </div>

                            <!-- App Interface Container -->
                            <div class="app-screen" id="app-screen" style="display: none;">
                                <div class="app-header" id="app-header">
                                    <button class="back-button" id="back-button">
                                        <span class="back-icon">←</span>
                                    </button>
                                    <h1 class="app-title" id="app-title">App</h1>
                                    <div class="app-header-right" id="app-header-right">
                                        <!-- Dynamic function buttons will be added here -->
                                    </div>
                                </div>
                                <div class="app-content" id="app-content">
                                    <!-- App content will be dynamically loaded here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Ensure body exists
            if (!document.body) {
                console.error('[Mobile Phone] document.body does not exist, delaying container creation');
                setTimeout(() => this.createPhoneContainer(), 100);
                return;
            }

            document.body.appendChild(container);
            this.bindEvents();

            // Add drag functionality for phone frame
            this.initFrameDrag();

            console.log('[Mobile Phone] Mobile container created successfully');
        } catch (error) {
            console.error('[Mobile Phone] Error creating container:', error);
        }
    }

    // Bind events
    bindEvents() {
        // Click overlay to close (only effective in non-compatibility mode)
        document.querySelector('.mobile-phone-overlay').addEventListener('click', () => {
            // Check if compatibility mode is enabled
            const isCompatibilityMode =
                window.MobileContextPlugin &&
                window.MobileContextPlugin.getSettings &&
                window.MobileContextPlugin.getSettings().tavernCompatibilityMode;

            // Only allow closing by clicking outside in non-compatibility mode
            if (!isCompatibilityMode) {
                this.hidePhone();
            }
        });

        // Back button
        document.getElementById('back-button').addEventListener('click', () => {
            // Debounce: Avoid rapid consecutive clicks on back button
            if (this._lastBackButtonClick && Date.now() - this._lastBackButtonClick < 300) {
                console.log('[Mobile Phone] Debounce: Back button clicked too fast, skipping');
                return;
            }
            this._lastBackButtonClick = Date.now();

            this.handleBackButton();
        });

        // App icon click events
        document.querySelectorAll('.app-icon').forEach(icon => {
            icon.addEventListener('click', e => {
                const appName = e.currentTarget.getAttribute('data-app');

                // Debounce: Avoid rapid consecutive clicks
                if (this._lastAppIconClick && Date.now() - this._lastAppIconClick < 300) {
                    console.log('[Mobile Phone] Debounce: App icon clicked too fast, skipping:', appName);
                    return;
                }
                this._lastAppIconClick = Date.now();

                this.openApp(appName);
            });
        });
    }

    // Handle back button
    handleBackButton() {
        console.log('=== [Mobile Phone] Back button handling started ===');

        // Clear user navigation intent (user actively going back)
        this._userNavigationIntent = null;
        console.log('[Mobile Phone] Cleared user navigation intent');

        console.log('[Mobile Phone] Current app stack length:', this.appStack.length);
        console.log('[Mobile Phone] Current app stack:', JSON.stringify(this.appStack, null, 2));
        console.log('[Mobile Phone] Current app state:', JSON.stringify(this.currentAppState, null, 2));
        console.log('[Mobile Phone] Current app:', this.currentApp);

        // No current app state, directly return to main interface
        if (!this.currentAppState) {
            console.log('[Mobile Phone] No current app state, returning to main interface');
            this.goHome();
            return;
        }

        const currentApp = this.currentAppState.app;
        console.log('[Mobile Phone] App from state:', currentApp);

        // Prioritize judging if at root page based on each app's own running state
        const atRoot = this.isCurrentlyAtAppRoot(currentApp, this.currentAppState);
        console.log('[Mobile Phone] Current app:', currentApp, 'Is at root page (module detection):', atRoot);

        // Security check: Ensure current app state matches app
        if (this.currentApp && this.currentApp !== currentApp) {
            console.warn(
                '[Mobile Phone] ⚠️ App state inconsistent! currentApp:',
                this.currentApp,
                'vs currentAppState.app:',
                currentApp,
            );
            // Force synchronization
            this.currentApp = currentApp;
        }

        if (!atRoot) {
            // Secondary (or deeper) page: Uniformly return to current app main interface
            console.log('[Mobile Phone] Not at root page, returning to current app main interface:', currentApp);
            console.log('[Mobile Phone] State check before calling returnToAppMain:');
            console.log('  - currentApp:', this.currentApp);
            console.log('  - currentAppState.app:', this.currentAppState.app);
            console.log('  - appStack last item:', this.appStack[this.appStack.length - 1]);

            this.returnToAppMain(currentApp);

            console.log('[Mobile Phone] State after returnToAppMain call:');
            console.log('  - currentApp:', this.currentApp);
            console.log('  - currentAppState.app:', this.currentAppState.app);
            console.log('  - appStack last item:', this.appStack[this.appStack.length - 1]);
            return;
        }

        // Root page: Return to phone main interface
        console.log('[Mobile Phone] Already at app root page, returning to main interface');
        this.goHome();
        console.log('=== [Mobile Phone] Back button handling ended ===');
    }

    // Return to forum main list
    returnToForumMainList() {
        console.log('[Mobile Phone] Returning to forum main list');
        console.log('[Mobile Phone] App stack before return:', JSON.stringify(this.appStack, null, 2));

        // Create forum main list state
        const forumMainState = {
            app: 'forum',
            title: 'Forum',
            view: 'main',
        };

        // Completely clean app stack, only keep forum main list state
        // This avoids pollution from other app states
        this.appStack = [forumMainState];
        this.currentAppState = forumMainState;
        this.currentApp = 'forum';
        this.updateAppHeader(forumMainState);

        console.log('[Mobile Phone] App stack after return:', JSON.stringify(this.appStack, null, 2));

        // Reload the entire forum app interface, not just update forum-content
        if (window.getForumAppContent && window.bindForumEvents) {
            console.log('[Mobile Phone] Reloading forum main interface');

            // Get complete forum app HTML
            const forumContent = window.getForumAppContent();
            if (forumContent) {
                // Set to app content area
                document.getElementById('app-content').innerHTML = forumContent;

                // Bind events
                window.bindForumEvents();

                // Ensure forum UI state is completely reset
                if (window.forumUI) {
                    window.forumUI.currentThreadId = null;
                    window.forumUI.currentView = 'main';
                    // Clear any possible state cache
                    if (window.forumUI.resetState) {
                        window.forumUI.resetState();
                    }
                }

                console.log('[Mobile Phone] ✅ Forum main interface reloaded, state reset');
            } else {
                console.error('[Mobile Phone] Failed to get forum content');
                this.handleForumApp();
            }
        } else {
            // If forum module doesn't exist, reload forum app
            console.warn('[Mobile Phone] Forum module does not exist, reloading forum app');
            this.handleForumApp();
        }
    }

    // Return to message list
    returnToMessageList() {
        console.log('[Mobile Phone] Returning to message list');
        console.log('[Mobile Phone] App stack before return:', JSON.stringify(this.appStack, null, 2));

        // Create message list state
        const messageListState = {
            app: 'messages',
            title: 'Messages',
            view: 'messageList',
        };

        // Completely clean app stack, only keep message list state
        // This avoids pollution from other app states
        this.appStack = [messageListState];
        this.currentAppState = messageListState;
        this.updateAppHeader(messageListState);

        console.log('[Mobile Phone] App stack after return:', JSON.stringify(this.appStack, null, 2));

        // Call message app to show list
        if (window.messageApp && window.messageApp.showMessageList) {
            // Ensure message app state is completely reset
            window.messageApp.currentView = 'messageList';
            window.messageApp.currentFriendId = null;
            window.messageApp.currentFriendName = null;

            window.messageApp.showMessageList();
            console.log('[Mobile Phone] ✅ Message list displayed, state reset');
        } else {
            console.error('[Mobile Phone] messageApp instance does not exist or showMessageList method unavailable');
        }
    }

    // Determine if at app root page
    isAppRootPage(state) {
        if (!state) return false;

        // Message app root page is only message list
        if (state.app === 'messages') {
            return state.view === 'messageList' || state.view === 'main' || state.view === 'list';
            // addFriend, messageDetail, etc. are not root pages, should be able to return to message list
        }

        // Forum app root page is main view or no view attribute (main list)
        if (state.app === 'forum') {
            return state.view === 'main' || !state.view || state.view === 'list';
        }

        // Other apps root page is main view
        return state.view === 'main';
    }

    // Restore app state
    restoreAppState(state) {
        console.log('[Mobile Phone] Restoring app state:', JSON.stringify(state, null, 2));
        this.currentAppState = state;
        this.updateAppHeader(state);

        // If special state for message app
        if (state.app === 'messages') {
            if (state.view === 'messageList' || state.view === 'list') {
                // Directly call messageApp's internal method, don't trigger state push
                if (window.messageApp) {
                    window.messageApp.currentView = 'list';
                    window.messageApp.currentFriendId = null;
                    window.messageApp.currentFriendName = null;
                    window.messageApp.updateAppContent();
                }
            } else if (state.view === 'messageDetail') {
                // Directly call messageApp's internal method, don't trigger state push
                if (window.messageApp) {
                    window.messageApp.currentView = 'messageDetail';
                    window.messageApp.currentFriendId = state.friendId;
                    window.messageApp.currentFriendName = state.friendName;
                    window.messageApp.updateAppContent();
                }
            } else if (state.view === 'addFriend') {
                // Directly call messageApp's internal method, don't trigger state push
                if (window.messageApp) {
                    window.messageApp.currentView = 'addFriend';
                    window.messageApp.currentTab = 'add';
                    window.messageApp.updateAppContent();
                }
            } else if (state.view === 'friendsCircle') {
                // Restore friends circle state
                console.log('[Mobile Phone] Restoring friends circle state...');
                if (window.messageApp) {
                    // Set messageApp state
                    window.messageApp.currentMainTab = 'circle';
                    window.messageApp.currentView = 'list';

                    // Ensure friends circle is initialized and activated
                    if (window.messageApp.friendsCircle) {
                        console.log('[Mobile Phone] Activating existing friends circle instance');
                        window.messageApp.friendsCircle.activate();
                    } else {
                        console.log('[Mobile Phone] Friends circle not initialized, initialize and activate immediately');
                        window.messageApp.initFriendsCircle();
                        // Wait for initialization to complete then activate
                        setTimeout(() => {
                            if (window.messageApp.friendsCircle) {
                                window.messageApp.friendsCircle.activate();
                            }
                        }, 100);
                    }

                    // Update interface content
                    window.messageApp.updateAppContent();

                    // Delay to ensure header updates correctly
                    setTimeout(() => {
                        console.log('[Mobile Phone] Delayed update of friends circle header...');
                        const circleState = {
                            app: 'messages',
                            view: 'friendsCircle',
                            title: 'Friends Circle',
                            showBackButton: false,
                            showAddButton: true,
                            addButtonIcon: 'fas fa-camera',
                            addButtonAction: () => {
                                if (window.friendsCircle) {
                                    window.friendsCircle.showPublishModal();
                                }
                            },
                        };
                        this.currentAppState = circleState;
                        this.updateAppHeader(circleState);
                    }, 200);
                }
            }
        } else if (state.app === 'forum') {
            // If special state for forum app
            if (state.view === 'threadDetail' && state.threadId) {
                // Restore forum thread detail view
                if (window.forumUI) {
                    window.forumUI.currentThreadId = state.threadId;
                    const forumContent = document.getElementById('forum-content');
                    if (forumContent) {
                        forumContent.innerHTML = window.forumUI.getThreadDetailHTML(state.threadId);
                        window.forumUI.bindReplyEvents();
                    }
                }
            } else if (state.view === 'forumControl') {
                // Restore forum control interface
                this.handleForumApp();
            } else {
                // Default show main list (view === 'main' or other)
                if (window.forumUI) {
                    window.forumUI.currentThreadId = null;
                    const forumContent = document.getElementById('forum-content');
                    if (forumContent) {
                        forumContent.innerHTML = window.forumUI.getThreadListHTML();
                        // Rebind main list events
                        if (window.bindForumEvents) {
                            window.bindForumEvents();
                        }
                    }
                } else {
                    // If forumUI doesn't exist, reload forum app
                    console.warn('[Mobile Phone] forumUI does not exist, reloading forum app');
                    this.handleForumApp();
                }
            }
        }
    }

    // Update app header
    updateAppHeader(state) {
        const titleElement = document.getElementById('app-title');
        const headerRight = document.getElementById('app-header-right');

        if (!state) {
            titleElement.textContent = 'App';
            headerRight.innerHTML = '';
            return;
        }

        // Set title
        titleElement.textContent = state.title || this.apps[state.app]?.name || 'App';

        // Mark current app & view for styling and navigation judgment
        const appScreen = document.getElementById('app-screen');
        const appContent = document.getElementById('app-content');
        const appHeader = document.getElementById('app-header');
        if (appScreen) {
            appScreen.setAttribute('data-app', state.app || '');
            appScreen.setAttribute('data-view', state.view || 'main');
            // Clean old app-root-* marks
            Array.from(appScreen.classList).forEach(c => {
                if (c.startsWith('app-root-')) appScreen.classList.remove(c);
            });
            if (this.isAppRootPage(state)) {
                appScreen.classList.add(`app-root-${state.app}`);
            }
        }
        if (appContent) {
            appContent.setAttribute('data-app', state.app || '');
            appContent.setAttribute('data-view', state.view || 'main');
        }
        if (appHeader) {
            appHeader.setAttribute('data-app', state.app || '');
            appHeader.setAttribute('data-view', state.view || 'main');
        }

        // Clear old function buttons
        headerRight.innerHTML = '';

        // Add function buttons based on app state
        if (state.app === 'messages') {
            if (state.view === 'messageList' || state.view === 'list') {
                // Message list page: Add text color toggle button
                const textColorBtn = document.createElement('button');
                textColorBtn.className = 'app-header-btn text-color-toggle';
                // Show the color to switch to (opposite of current color)
                textColorBtn.innerHTML = this.getCurrentTextColor() === 'white' ? 'Black' : 'White';
                textColorBtn.title = 'Toggle Text Color';
                textColorBtn.addEventListener('click', () => this.toggleTextColor());
                headerRight.appendChild(textColorBtn);

                // Message list page: Add image settings button
                const imageConfigBtn = document.createElement('button');
                imageConfigBtn.className = 'app-header-btn';
                imageConfigBtn.innerHTML = '<i class="fas fa-image"></i>';
                imageConfigBtn.title = 'Image Settings';
                imageConfigBtn.addEventListener('click', () => this.showImageConfigModal());
                headerRight.appendChild(imageConfigBtn);

                // Message list page: Add friend button
                const addFriendBtn = document.createElement('button');
                addFriendBtn.className = 'app-header-btn';
                addFriendBtn.innerHTML = '➕';
                addFriendBtn.title = 'Add Friend';
                addFriendBtn.addEventListener('click', () => this.showAddFriend());
                headerRight.appendChild(addFriendBtn);
            } else if (state.view === 'messageDetail') {
                // Message detail page: Add photo button (only friends, not group chats)
                if (state.friendId && !this.isGroupChat(state.friendId)) {
                    const photoBtn = document.createElement('button');
                    photoBtn.className = 'app-header-btn';
                    photoBtn.innerHTML = '<i class="fas fa-image"></i>';
                    photoBtn.title = 'Photo Settings';
                    photoBtn.addEventListener('click', () => this.showFriendImageConfigModal(state.friendId, state.friendName));
                    headerRight.appendChild(photoBtn);
                }

                // Message detail page: Add refresh button
                const refreshBtn = document.createElement('button');
                refreshBtn.className = 'app-header-btn';
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
                refreshBtn.title = 'Refresh Messages';
                refreshBtn.addEventListener('click', () => this.refreshMessageDetail());
                headerRight.appendChild(refreshBtn);
            } else if (state.view === 'addFriend') {
                // Add friend page: Can add save button or other functions
                const saveBtn = document.createElement('button');
                saveBtn.className = 'app-header-btn';
                saveBtn.innerHTML = '✅';
                saveBtn.title = 'Save';
                saveBtn.addEventListener('click', () => this.saveAddFriend());
                headerRight.appendChild(saveBtn);
            } else if (state.view === 'friendsCircle') {
                // Friends circle page: Add generate friends circle button
                const generateBtn = document.createElement('button');
                generateBtn.className = 'app-header-btn';
                generateBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
                generateBtn.title = 'Generate Friends Circle';
                generateBtn.addEventListener('click', () => {
                    this.generateFriendsCircleContent();
                });
                headerRight.appendChild(generateBtn);

                // Friends circle page: Add camera publish button
                const cameraBtn = document.createElement('button');
                cameraBtn.className = 'app-header-btn';
                cameraBtn.innerHTML = '<i class="fas fa-camera"></i>';
                cameraBtn.title = 'Publish to Friends Circle';
                cameraBtn.addEventListener('click', () => {
                    if (window.friendsCircle) {
                        window.friendsCircle.showPublishModal();
                    }
                });
                headerRight.appendChild(cameraBtn);
            }
        } else if (state.app === 'gallery') {
            // Gallery app: Add select button
            const selectBtn = document.createElement('button');
            selectBtn.className = 'app-header-btn';
            selectBtn.innerHTML = '✓';
            selectBtn.title = 'Select';
            selectBtn.addEventListener('click', () => this.toggleGallerySelect());
            headerRight.appendChild(selectBtn);
        } else if (state.app === 'forum') {
            // Forum app: Add different buttons based on different views
            if (state.view === 'threadDetail') {
                // Thread detail page: Add refresh button
                const refreshBtn = document.createElement('button');
                refreshBtn.className = 'app-header-btn';
                refreshBtn.innerHTML = 'Refresh';
                refreshBtn.title = 'Refresh';
                refreshBtn.style.background = '#e5c9c7';
                refreshBtn.style.color = 'white';
                refreshBtn.addEventListener('click', () => {
                    if (window.forumUI) {
                        window.forumUI.refreshForum();
                    }
                });
                headerRight.appendChild(refreshBtn);
            } else {
                // Forum home page: Add generate, post, and refresh buttons
                const generateBtn = document.createElement('button');
                generateBtn.className = 'app-header-btn';
                generateBtn.innerHTML = 'Generate';
                generateBtn.title = 'Generate Forum Immediately';
                generateBtn.style.background = '#e5c9c7';
                generateBtn.style.color = 'white';
                generateBtn.addEventListener('click', () => {
                    if (window.forumManager) {
                        console.log('[Mobile Phone] 🔘 Header generate button clicked');

                        // Show generate status prompt
                        if (window.showMobileToast) {
                            window.showMobileToast('🚀 Generating forum content...', 'info');
                        }

                        // Call generate method
                        window.forumManager
                            .generateForumContent(true) // Force generate, don't check message increment
                            .then(() => {
                                if (window.showMobileToast) {
                                    window.showMobileToast('✅ Forum content generation completed', 'success');
                                }
                            })
                            .catch(error => {
                                console.error('[Mobile Phone] Failed to generate forum content:', error);
                                if (window.showMobileToast) {
                                    window.showMobileToast('❌ Generation failed: ' + error.message, 'error');
                                }
                            });
                    }
                });
                headerRight.appendChild(generateBtn);

                const postBtn = document.createElement('button');
                postBtn.className = 'app-header-btn';
                postBtn.innerHTML = 'Post';
                postBtn.title = 'Post';
                postBtn.style.background = '#e5c9c7';
                postBtn.style.color = 'white';
                postBtn.addEventListener('click', () => {
                    if (window.forumUI) {
                        window.forumUI.showPostDialog();
                    }
                });
                headerRight.appendChild(postBtn);

                const styleBtn = document.createElement('button');
                styleBtn.className = 'app-header-btn';
                styleBtn.innerHTML = 'Style';
                styleBtn.title = 'Forum Style Settings';
                styleBtn.style.background = '#e5c9c7';
                styleBtn.style.color = 'white';
                styleBtn.addEventListener('click', () => {
                    console.log('[Mobile Phone] 🎨 Style button clicked, jump to forum style settings');
                    // Switch to API settings app forum style tab
                    window.mobilePhone.openApp('api');
                    // Delay a bit to ensure page switch completes, then activate forum style tab
                    setTimeout(() => {
                        const forumStylesTab = document.querySelector('[data-tab="forum-styles"]');
                        if (forumStylesTab) {
                            forumStylesTab.click();
                            console.log('[Mobile Phone] Switched to forum style settings page');
                        } else {
                            console.warn('[Mobile Phone] Forum style settings tab not found');
                        }
                    }, 300);
                });
                headerRight.appendChild(styleBtn);

                const refreshBtn = document.createElement('button');
                refreshBtn.className = 'app-header-btn';
                refreshBtn.innerHTML = 'Refresh';
                refreshBtn.title = 'Refresh';
                refreshBtn.style.background = '#e5c9c7';
                refreshBtn.style.color = 'white';
                refreshBtn.addEventListener('click', () => {
                    if (window.forumUI) {
                        window.forumUI.refreshForum();
                    }
                });
                headerRight.appendChild(refreshBtn);
            }
        } else if (state.app === 'weibo') {
            // Weibo app: Add generate, refresh, post, switch account buttons
            const generateBtn = document.createElement('button');
            generateBtn.className = 'app-header-btn';
            generateBtn.innerHTML = 'Generate';
            generateBtn.title = 'Generate Weibo Immediately';
            generateBtn.style.background = '#ff8500';
            generateBtn.style.color = 'white';
            generateBtn.addEventListener('click', async () => {
                if (window.weiboManager) {
                    console.log('[Mobile Phone] Trigger immediate weibo generation');

                    // Show processing prompt
                    MobilePhone.showToast('🔄 Starting to generate weibo content...', 'processing');

                    try {
                        const result = await window.weiboManager.generateWeiboContent(true);
                        if (result) {
                            MobilePhone.showToast('✅ Weibo content generated successfully! Inserted to floor 1', 'success');
                        } else {
                            MobilePhone.showToast('⚠️ Weibo content generation failed or skipped', 'warning');
                        }
                    } catch (error) {
                        console.error('[Mobile Phone] Error generating weibo content:', error);
                        MobilePhone.showToast(`❌ Generation failed: ${error.message}`, 'error');
                    }
                } else {
                    console.error('[Mobile Phone] Weibo manager not found');
                }
            });
            headerRight.appendChild(generateBtn);

            const refreshBtn = document.createElement('button');
            refreshBtn.className = 'app-header-btn';
            refreshBtn.innerHTML = 'Refresh';
            refreshBtn.title = 'Refresh';
            refreshBtn.style.background = '#ff8500';
            refreshBtn.style.color = 'white';
            refreshBtn.addEventListener('click', () => {
                if (window.weiboUI && window.weiboUI.refreshWeiboList) {
                    window.weiboUI.refreshWeiboList();
                } else {
                    console.error('[Mobile Phone] Weibo UI not found');
                }
            });
            headerRight.appendChild(refreshBtn);

            // Post button
            const postBtn = document.createElement('button');
            postBtn.className = 'app-header-btn';
            postBtn.innerHTML = 'Post';
            postBtn.title = 'Post';
            postBtn.style.background = '#ff8500';
            postBtn.style.color = 'white';
            postBtn.addEventListener('click', () => {
                if (window.weiboControlApp && window.weiboControlApp.showPostDialog) {
                    window.weiboControlApp.showPostDialog();
                } else {
                    console.error('[Mobile Phone] Weibo control app not ready');
                }
            });
            headerRight.appendChild(postBtn);

            // Switch account button
            const switchAccountBtn = document.createElement('button');
            switchAccountBtn.className = 'app-header-btn';
            const isMainAccount = window.weiboManager ? window.weiboManager.currentAccount.isMainAccount : true;
            switchAccountBtn.innerHTML = isMainAccount ? 'Switch Alt' : 'Switch Main';
            switchAccountBtn.title = isMainAccount ? 'Switch to Alt Account' : 'Switch to Main Account';
            switchAccountBtn.style.background = '#ff8500';
            switchAccountBtn.style.color = 'white';
            switchAccountBtn.addEventListener('click', () => {
                if (window.weiboManager && window.weiboManager.switchAccount) {
                    const newIsMainAccount = window.weiboManager.switchAccount();

                    // Update button text
                    switchAccountBtn.innerHTML = newIsMainAccount ? 'Switch Alt' : 'Switch Main';
                    switchAccountBtn.title = newIsMainAccount ? 'Switch to Alt Account' : 'Switch to Main Account';

                    // Immediately update username display
                    if (window.weiboUI && window.weiboUI.updateUsernameDisplay) {
                        window.weiboUI.updateUsernameDisplay();
                    }

                    // Refresh current page
                    if (window.weiboUI) {
                        window.weiboUI.refreshWeiboList();
                    }

                    MobilePhone.showToast(`✅ Switched to ${newIsMainAccount ? 'Main' : 'Alt'} Account`, 'success');
                    console.log('[Mobile Phone] Account switched:', newIsMainAccount ? 'Main' : 'Alt');
                } else {
                    console.error('[Mobile Phone] Weibo manager not ready');
                }
            });
            headerRight.appendChild(switchAccountBtn);
        } else if (state.app === 'settings') {
            // Settings app: Add search button
            const searchBtn = document.createElement('button');
            searchBtn.className = 'app-header-btn';
            searchBtn.innerHTML = '🔍';
            searchBtn.title = 'Search';
            searchBtn.addEventListener('click', () => this.showSettingsSearch());
            headerRight.appendChild(searchBtn);
        } else if (state.app === 'shop') {
            // Shop app: View + Categories (orange theme), remove cart button
            const viewBtn = document.createElement('button');
            viewBtn.className = 'app-header-btn shop-accent-btn';
            viewBtn.innerHTML = 'View';
            viewBtn.title = 'View Products';
            viewBtn.addEventListener('click', () => {
                if (window.shopAppSendViewMessage) {
                    window.shopAppSendViewMessage();
                }
            });
            headerRight.appendChild(viewBtn);

            // Categories button
            const categoryBtn = document.createElement('button');
            categoryBtn.className = 'app-header-btn shop-accent-btn';
            categoryBtn.innerHTML = 'Categories';
            categoryBtn.title = 'Expand Categories';
            categoryBtn.addEventListener('click', () => {
                if (window.shopAppToggleCategories) {
                    window.shopAppToggleCategories();
                } else if (window.shopAppShowCategories) {
                    // Compatible with old naming
                    window.shopAppShowCategories();
                }
            });
            headerRight.appendChild(categoryBtn);
        } else if (state.app === 'task') {
            // Task app: Add view tasks button
            const viewBtn = document.createElement('button');
            viewBtn.className = 'app-header-btn';
            viewBtn.innerHTML = 'View';
            viewBtn.title = 'View Tasks';
            viewBtn.addEventListener('click', () => {
                if (window.taskAppSendViewMessage) {
                    window.taskAppSendViewMessage();
                }
            });
            headerRight.appendChild(viewBtn);
        } else if (state.app === 'backpack') {
            // Backpack app: Add categories, search, and refresh buttons

            // Categories button
            const categoryBtn = document.createElement('button');
            categoryBtn.className = 'app-header-btn';
            categoryBtn.innerHTML = 'Categories';
            categoryBtn.title = 'Expand Categories';
            categoryBtn.addEventListener('click', () => {
                if (window.backpackAppToggleCategories) {
                    window.backpackAppToggleCategories();
                }
            });
            headerRight.appendChild(categoryBtn);

            // Search button
            const searchBtn = document.createElement('button');
            searchBtn.className = 'app-header-btn';
            searchBtn.innerHTML = '🔍';
            searchBtn.title = 'Search Items';
            searchBtn.addEventListener('click', () => {
                if (window.backpackAppToggleSearch) {
                    window.backpackAppToggleSearch();
                }
            });
            headerRight.appendChild(searchBtn);

            // Refresh button
            const refreshBtn = document.createElement('button');
            refreshBtn.className = 'app-header-btn';
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            refreshBtn.title = 'Refresh Backpack';
            refreshBtn.addEventListener('click', () => {
                if (window.backpackAppRefresh) {
                    window.backpackAppRefresh();
                }
            });
            headerRight.appendChild(refreshBtn);
        } else if (state.app === 'live') {
            // Live app: Right side show Viewer Count, Gift List, End Live
            // Viewer count badge
            const viewerBadge = document.createElement('div');
            viewerBadge.className = 'viewer-count';
            viewerBadge.title = 'Current Viewers';
            viewerBadge.innerHTML = `<i class="fas fa-user-friends"></i><span class="viewer-count-num">${state.viewerCount || '-'
                }</span>`;
            headerRight.appendChild(viewerBadge);

            // Gift list button
            const giftBtn = document.createElement('button');
            giftBtn.className = 'app-header-btn gift-log-btn';
            giftBtn.title = 'Gift Log';
            giftBtn.innerHTML = '🎁';
            giftBtn.addEventListener('click', () => {
                if (window.liveAppShowModal) {
                    window.liveAppShowModal('gift-modal');
                }
            });
            headerRight.appendChild(giftBtn);

            // End live button
            const endBtn = document.createElement('button');
            endBtn.className = 'app-header-btn end-stream-btn';
            endBtn.title = 'End Live';
            endBtn.innerHTML = '⏻';
            endBtn.addEventListener('click', () => {
                if (window.liveAppEndLive) {
                    window.liveAppEndLive();
                }
            });
            headerRight.appendChild(endBtn);
        } else if (state.app === 'watch-live') {
            // Watch live app: Right side show Viewer Count, Exit Live Room
            // Viewer count badge
            const viewerBadge = document.createElement('div');
            viewerBadge.className = 'viewer-count';
            viewerBadge.title = 'Current Viewers';
            viewerBadge.innerHTML = `<i class="fas fa-user-friends"></i><span class="viewer-count-num">${state.viewerCount || '-'
                }</span>`;
            headerRight.appendChild(viewerBadge);

            // Exit live room button
            const exitBtn = document.createElement('button');
            exitBtn.className = 'app-header-btn end-stream-btn';
            exitBtn.title = 'Exit Live Room';
            exitBtn.innerHTML = '⏻';
            exitBtn.addEventListener('click', () => {
                if (window.watchLiveAppEndLive) {
                    window.watchLiveAppEndLive();
                }
            });
            headerRight.appendChild(exitBtn);
        }
    }

    // Add app state to stack
    pushAppState(state) {
        if (!state || !state.app) {
            console.warn('[Mobile Phone] Push state invalid, skip:', state);
            return;
        }

        // Check if same as current state, avoid duplicate push
        const currentState = this.currentAppState;
        if (currentState && this.isSameAppState(currentState, state)) {
            console.log('[Mobile Phone] State same, skip duplicate push:', JSON.stringify(state, null, 2));
            return;
        }

        // Check if same as top stack state
        const topState = this.appStack[this.appStack.length - 1];
        if (topState && this.isSameAppState(topState, state)) {
            console.log('[Mobile Phone] Same as top stack state, skip duplicate push:', JSON.stringify(state, null, 2));
            return;
        }

        console.log('[Mobile Phone] Push app state:', JSON.stringify(state, null, 2));
        this.appStack.push(state);
        this.currentAppState = state;
        this.currentApp = state.app; // Ensure synchronization
        this.updateAppHeader(state);
        console.log('[Mobile Phone] App stack length after push:', this.appStack.length);
    }

    // Compare if two app states are the same
    isSameAppState(state1, state2) {
        if (!state1 || !state2) return false;

        return state1.app === state2.app &&
            state1.view === state2.view &&
            state1.friendId === state2.friendId &&
            state1.threadId === state2.threadId &&
            state1.title === state2.title;
    }

    // Refresh message list
    refreshMessages() {
        if (window.messageApp && window.messageApp.refreshMessageList) {
            window.messageApp.refreshMessageList();
        }
    }

    // Refresh message detail
    refreshMessageDetail() {
        if (window.messageApp && window.messageApp.refreshMessageDetail) {
            window.messageApp.refreshMessageDetail();
        }
    }

    // Show message list
    showMessageList() {
        console.log('[Mobile Phone] Show message list');
        if (window.messageApp && window.messageApp.showMessageList) {
            window.messageApp.showMessageList();
        } else {
            console.error('[Mobile Phone] messageApp instance does not exist or showMessageList method unavailable');
        }
    }

    // Show message detail
    showMessageDetail(friendId, friendName) {
        console.log('[Mobile Phone] Show message detail:', friendId, friendName);
        if (window.messageApp && window.messageApp.showMessageDetail) {
            window.messageApp.showMessageDetail(friendId, friendName);
        } else {
            console.error('[Mobile Phone] messageApp instance does not exist or showMessageDetail method unavailable');
        }
    }

    // Toggle gallery select mode
    toggleGallerySelect() {
        console.log('[Mobile Phone] Toggle gallery select mode');
        // Implementation for gallery select mode can be added here
    }

    // Show settings search
    showSettingsSearch() {
        console.log('[Mobile Phone] Show settings search');
        // Implementation for settings search can be added here
    }

    // Show add friend interface
    showAddFriend() {
        console.log('[Mobile Phone] Show add friend interface');
        if (window.messageApp && window.messageApp.showAddFriend) {
            window.messageApp.showAddFriend();
        } else {
            console.error('[Mobile Phone] messageApp instance does not exist or showAddFriend method unavailable');
        }
    }

    // Generate friends circle content
    async generateFriendsCircleContent() {
        try {
            console.log('[Mobile Phone] 🎭 Generate friends circle button clicked');

            // Show generate status prompt
            if (window.showMobileToast) {
                window.showMobileToast('🎭 Generating friends circle content...', 'info');
            }

            // Build message to send to AI
            const message =
                'User is viewing friends circle, please generate 3-5 correct friends circle formats according to the friends circle rule system, and generate 0-5 replies for each post based on the relationships between characters. Replies should use the same id as the original floor. Please use correct three-digit floor ids, floor ids cannot duplicate historical floor ids. Please correctly use the prefix w. Strictly prohibit replying on behalf of the user. Prohibit using emoticons or emoticons, emojis are allowed.';

            // Send message to AI
            if (window.friendsCircle && window.friendsCircle.sendToAI) {
                await window.friendsCircle.sendToAI(message);

                if (window.showMobileToast) {
                    window.showMobileToast('✅ Friends circle content generation completed', 'success');
                }
            } else {
                console.error('[Mobile Phone] Friends circle functionality not ready');
                if (window.showMobileToast) {
                    window.showMobileToast('❌ Friends circle functionality not ready', 'error');
                }
            }
        } catch (error) {
            console.error('[Mobile Phone] Failed to generate friends circle content:', error);
            if (window.showMobileToast) {
                window.showMobileToast('❌ Generation failed: ' + error.message, 'error');
            }
        }
    }

    // Save add friend
    saveAddFriend() {
        console.log('[Mobile Phone] Save add friend');
        if (window.messageApp && window.messageApp.addFriend) {
            window.messageApp.addFriend();
        } else {
            console.error('[Mobile Phone] messageApp instance does not exist or addFriend method unavailable');
        }
    }

    // Register apps
    registerApps() {
        this.apps = {
            messages: {
                name: 'Messages',
                content: null, // Will be dynamically generated by message-app
                isCustomApp: true,
                customHandler: this.handleMessagesApp.bind(this),
            },
            gallery: {
                name: 'Gallery',
                content: `
                    <div class="gallery-app">
                        <div class="photo-grid">
                            <div class="photo-item">🖼️</div>
                            <div class="photo-item">🌸</div>
                            <div class="photo-item">🌙</div>
                            <div class="photo-item">⭐</div>
                            <div class="photo-item">🎀</div>
                            <div class="photo-item">💐</div>
                        </div>
                    </div>
                `,
            },
            settings: {
                name: 'Settings',
                content: null, // Will be dynamically generated by style config manager
                isCustomApp: true,
                customHandler: this.handleSettingsApp.bind(this),
            },
            forum: {
                name: 'Forum',
                content: null, // Will be dynamically generated by forum UI
                isCustomApp: true,
                customHandler: this.handleForumApp.bind(this),
            },
            weibo: {
                name: 'Weibo',
                content: null, // Will be dynamically generated by weibo UI
                isCustomApp: true,
                customHandler: this.handleWeiboApp.bind(this),
            },
            api: {
                name: 'API Settings',
                content: null, // Will be dynamically generated by unified API settings panel
                isCustomApp: true,
                customHandler: this.handleApiApp.bind(this),
            },
            diary: {
                name: 'Diary',
                content: `
                    <div class="diary-app">
                        <div class="diary-header">
                            <h3>My Diary 📝</h3>
                        </div>
                        <div class="diary-content">
                            <div class="diary-entry">
                                <div class="entry-date">Today</div>
                                <div class="entry-text">The weather is great today, feeling great too! Met many interesting characters in SillyTavern～</div>
                            </div>
                            <div class="diary-entry">
                                <div class="entry-date">Yesterday</div>
                                <div class="entry-text">Learned new frontend technology, feeling accomplished.</div>
                            </div>
                        </div>
                    </div>
                `,
            },
            mail: {
                name: 'Mail',
                content: `
                    <div class="mail-app">
                        <div class="mail-list">
                            <div class="mail-item unread">
                                <div class="mail-sender">SillyTavern</div>
                                <div class="mail-subject">Welcome to Mobile Interface</div>
                                <div class="mail-preview">This is a cute mobile interface framework...</div>
                                <div class="mail-time">1 hour ago</div>
                            </div>
                            <div class="mail-item">
                                <div class="mail-sender">System Notification</div>
                                <div class="mail-subject">Plugin Update Reminder</div>
                                <div class="mail-preview">Mobile Context plugin updated...</div>
                                <div class="mail-time">2 hours ago</div>
                            </div>
                        </div>
                    </div>
                `,
            },
            status: {
                name: 'Status',
                content: null, // Will be dynamically generated by status-app
                isCustomApp: true,
                customHandler: this.handleStatusApp.bind(this),
            },
            diary: {
                name: 'Diary',
                content: null, // Will be dynamically generated by diary-app
                isCustomApp: true,
                customHandler: this.handleDiaryApp.bind(this),
            },
            shop: {
                name: 'Shop',
                content: null, // Will be dynamically generated by shop-app
                isCustomApp: true,
                customHandler: this.handleShopApp.bind(this),
            },
            backpack: {
                name: 'Backpack',
                content: null, // Will be dynamically generated by backpack-app
                isCustomApp: true,
                customHandler: this.handleBackpackApp.bind(this),
            },
            task: {
                name: 'Tasks',
                content: null, // Will be dynamically generated by task-app
                isCustomApp: true,
                customHandler: this.handleTaskApp.bind(this),
            },
            live: {
                name: 'Live',
                content: null, // Will be dynamically generated by live-app
                isCustomApp: true,
                customHandler: this.handleLiveApp.bind(this),
            },
            'watch-live': {
                name: 'Watch Live',
                content: null, // Will be dynamically generated by watch-live
                isCustomApp: true,
                customHandler: this.handleWatchLiveApp.bind(this),
            },
            'parallel-events': {
                name: 'Parallel Events',
                content: null, // Will be dynamically generated by parallel-events-app
                isCustomApp: true,
                customHandler: this.handleParallelEventsApp.bind(this),
            },
            'profile': {
                name: 'Profile',
                content: null, // Will be dynamically generated by profile-app
                isCustomApp: true,
                customHandler: this.handleProfileApp.bind(this),
            },
        };
    }

    // Show/hide phone interface
    togglePhone() {
        if (this.isVisible) {
            this.hidePhone();
        } else {
            this.showPhone();
        }
    }

    showPhone() {
        const container = document.getElementById('mobile-phone-container');
        container.style.display = 'flex';
        setTimeout(() => {
            container.classList.add('active');
        }, 10);
        this.isVisible = true;
        this.isPhoneActive = true;

        // Initialize style config manager (if not already initialized)
        this.initStyleConfigManager();

        // If there is current app state, restore app interface
        if (this.currentAppState) {
            console.log('[Mobile Phone] Restore app interface state:', this.currentAppState);
            // Show app interface, hide main interface
            document.getElementById('home-screen').style.display = 'none';
            document.getElementById('app-screen').style.display = 'block';

            // Restore app state
            this.restoreAppState(this.currentAppState);
        }

        // Start app state synchronization polling
        this.startStateSyncLoop();

        // Apply pointer-events settings
        if (window.MobileContextPlugin && window.MobileContextPlugin.updatePointerEventsSettings) {
            window.MobileContextPlugin.updatePointerEventsSettings();
        }
    }

    hidePhone() {
        const container = document.getElementById('mobile-phone-container');
        container.classList.remove('active');
        setTimeout(() => {
            container.style.display = 'none';
        }, 300);
        this.isVisible = false;
        this.isPhoneActive = false;

        // Stop app state synchronization polling
        this.stopStateSyncLoop();
    }

    // Initialize style config manager
    initStyleConfigManager() {
        // Check if already initialized
        if (
            window.styleConfigManager &&
            window.styleConfigManager.isConfigReady &&
            window.styleConfigManager.isConfigReady()
        ) {
            console.log('[Mobile Phone] Style config manager already initialized and ready');
            return;
        }

        if (window.StyleConfigManager && !window.styleConfigManager) {
            console.log('[Mobile Phone] Create style config manager instance');
            try {
                window.styleConfigManager = new window.StyleConfigManager();
                console.log('[Mobile Phone] ✅ Style config manager instance created successfully');
            } catch (error) {
                console.error('[Mobile Phone] ❌ Failed to create style config manager instance:', error);
            }
        } else if (!window.StyleConfigManager) {
            // If StyleConfigManager class not loaded yet, try to load
            console.log('[Mobile Phone] StyleConfigManager class not loaded yet, try dynamic loading');
            this.loadStyleConfigManager();
        } else {
            console.log('[Mobile Phone] Style config manager instance already exists');
        }
    }

    // Dynamically load style config manager
    async loadStyleConfigManager() {
        try {
            console.log('[Mobile Phone] 🔄 Start dynamically loading style config manager...');

            // Check if script already exists
            const existingScript = document.querySelector('script[src*="style-config-manager.js"]');
            if (existingScript) {
                console.log('[Mobile Phone] Style config manager script already exists, wait for loading to complete');
                // Wait for script to finish loading
                setTimeout(() => {
                    if (window.StyleConfigManager && !window.styleConfigManager) {
                        window.styleConfigManager = new window.StyleConfigManager();
                        console.log('[Mobile Phone] ✅ Delayed creation of style config manager instance successful');
                    }
                }, 1000);
                return;
            }

            // Create script element
            const script = document.createElement('script');
            script.src = '/scripts/extensions/third-party/mobile/app/style-config-manager.js';
            script.type = 'text/javascript';

            // Set load complete callback
            script.onload = () => {
                console.log('[Mobile Phone] ✅ Style config manager script loaded');

                // Wait a bit to ensure script fully executed
                setTimeout(() => {
                    if (window.StyleConfigManager && !window.styleConfigManager) {
                        try {
                            window.styleConfigManager = new window.StyleConfigManager();
                            console.log('[Mobile Phone] ✅ Style config manager instance created successfully');
                        } catch (error) {
                            console.error('[Mobile Phone] ❌ Failed to create style config manager instance:', error);
                        }
                    } else if (window.styleConfigManager) {
                        console.log('[Mobile Phone] Style config manager instance already exists');
                    } else {
                        console.warn('[Mobile Phone] ⚠️ StyleConfigManager class not correctly loaded');
                    }
                }, 500);
            };

            // Set load failure callback
            script.onerror = error => {
                console.error('[Mobile Phone] ❌ Style config manager script load failed:', error);
            };

            // Add to page
            document.head.appendChild(script);
            console.log('[Mobile Phone] Style config manager script added to page');
        } catch (error) {
            console.error('[Mobile Phone] ❌ Dynamic loading of style config manager failed:', error);
        }
    }

    // Open app
    openApp(appName) {
        // Debounce check: If currently processing opening of same app, directly return
        if (this._openingApp === appName) {
            console.log('[Mobile Phone] Debounce: Opening same app, skip duplicate operation:', appName);
            return;
        }

        const app = this.apps[appName];
        if (!app) {
            console.warn('[Mobile Phone] App does not exist:', appName);
            return;
        }

        // Check if already at target app main interface
        if (this.currentApp === appName &&
            this.currentAppState &&
            this.currentAppState.app === appName &&
            this.isAppRootPage(this.currentAppState)) {
            console.log('[Mobile Phone] Already at target app main interface, skip duplicate opening:', appName);
            return;
        }

        // Record user navigation intent
        this._userNavigationIntent = {
            targetApp: appName,
            timestamp: Date.now(),
            fromApp: this.currentApp
        };

        // Set debounce flag
        this._openingApp = appName;

        try {
            console.log('[Mobile Phone] Open app:', appName);

            // Check if app needs async loading
            const needsAsyncLoading = ['forum', 'weibo', 'api'].includes(appName);

            if (needsAsyncLoading) {
                // Show loading state
                this.showAppLoadingState(appName, app.name);
                // Mark app as loading
                this._loadingApps.add(appName);
                this._loadingStartTime[appName] = Date.now();
            }

            this.currentApp = appName;

            // Create app state
            const appState = {
                app: appName,
                title: app.name,
                view: appName === 'messages' ? 'messageList' : 'main', // Message app directly set to messageList
            };

            // Clear app stack and add new state
            this.appStack = [appState];
            this.currentAppState = appState;
            this.updateAppHeader(appState);

            // Handle custom app
            if (app.isCustomApp && app.customHandler) {
                app.customHandler();
            } else {
                document.getElementById('app-content').innerHTML = app.content;
            }

            // Show app interface, hide main interface
            document.getElementById('home-screen').style.display = 'none';
            document.getElementById('app-screen').style.display = 'block';

            // Add animation effect
            document.getElementById('app-screen').classList.add('slide-in');
            setTimeout(() => {
                document.getElementById('app-screen').classList.remove('slide-in');
            }, 300);

        } finally {
            // Clear debounce flag
            setTimeout(() => {
                this._openingApp = null;
            }, 500); // Clear debounce flag after 500ms
        }
    }

    // Show app loading state
    showAppLoadingState(appName, appTitle) {
        console.log('[Mobile Phone] Show app loading state:', appName);

        const loadingContent = `
      <div class="app-loading-container">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
        </div>
        <div class="loading-text">Loading ${appTitle}...</div>
        <div class="loading-tip">First load may take a few seconds</div>
        <div class="loading-progress">
          <div class="progress-bar">
            <div class="progress-fill" id="loading-progress-${appName}"></div>
          </div>
        </div>
      </div>
    `;

        document.getElementById('app-content').innerHTML = loadingContent;

        // Simulate loading progress
        this.simulateLoadingProgress(appName);
    }

    // Simulate loading progress
    simulateLoadingProgress(appName) {
        const progressBar = document.getElementById(`loading-progress-${appName}`);
        if (!progressBar) return;

        let progress = 0;
        const interval = setInterval(() => {
            // If app already loaded or user switched to other app, stop progress bar
            if (!this._loadingApps.has(appName) || this._userNavigationIntent?.targetApp !== appName) {
                clearInterval(interval);
                return;
            }

            progress += Math.random() * 15 + 5; // Randomly increase 5-20%
            if (progress > 90) progress = 90; // Max 90%, wait for actual load completion

            progressBar.style.width = `${progress}%`;
        }, 200);

        // Force stop progress bar after 10 seconds (prevent stuck)
        setTimeout(() => {
            clearInterval(interval);
        }, 10000);
    }

    // Check if user navigation intent still valid
    isUserNavigationIntentValid(appName) {
        if (!this._userNavigationIntent) return false;

        const intent = this._userNavigationIntent;
        const now = Date.now();

        // Check if intent expired (over 30 seconds)
        if (now - intent.timestamp > 30000) {
            console.log('[Mobile Phone] User navigation intent expired:', intent);
            return false;
        }

        // Check if target app matches
        if (intent.targetApp !== appName) {
            console.log('[Mobile Phone] User navigation intent changed:', intent.targetApp, '->', appName);
            return false;
        }

        // Check if user already switched to other app
        if (this.currentApp !== appName) {
            console.log('[Mobile Phone] User switched to other app:', this.currentApp, '!==', appName);
            return false;
        }

        return true;
    }

    // Complete app loading
    completeAppLoading(appName) {
        console.log('[Mobile Phone] Complete app loading:', appName);

        // Remove loading state
        this._loadingApps.delete(appName);

        // Record load time
        if (this._loadingStartTime[appName]) {
            const loadTime = Date.now() - this._loadingStartTime[appName];
            console.log(`[Mobile Phone] ${appName} load time: ${loadTime}ms`);
            delete this._loadingStartTime[appName];
        }

        // Check if user navigation intent still valid
        if (!this.isUserNavigationIntentValid(appName)) {
            console.log('[Mobile Phone] User navigation intent invalid, cancel forced jump:', appName);
            return false; // Do not execute jump
        }

        // Complete progress bar
        const progressBar = document.getElementById(`loading-progress-${appName}`);
        if (progressBar) {
            progressBar.style.width = '100%';
        }

        console.log('[Mobile Phone] App loading complete, user navigation intent valid:', appName);
        return true; // Can execute jump
    }

    // Handle forum app
    async handleForumApp() {
        try {
            console.log('[Mobile Phone] Start handling forum app...');

            // Show loading state
            document.getElementById('app-content').innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-icon">⏳</div>
                    <div class="loading-text">Loading Forum...</div>
                </div>
            `;

            // Ensure forum UI module loaded, add timeout and retry mechanism
            console.log('[Mobile Phone] Load forum UI module...');

            const loadWithTimeout = (promise, timeout = 15000) => {
                return Promise.race([
                    promise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Forum module load timeout')), timeout)),
                ]);
            };

            try {
                await loadWithTimeout(this.loadForumApp());
            } catch (error) {
                console.error('[Mobile Phone] Forum module load failed, try reload:', error);
                // Clean failed load state
                window._forumAppLoading = null;
                await loadWithTimeout(this.loadForumApp());
            }

            // Check if user navigation intent still valid
            if (!this.completeAppLoading('forum')) {
                console.log('[Mobile Phone] Forum app loading complete, but user switched to other app, cancel render');
                return;
            }

            // Get current app state, if already in forum app, don't push state repeatedly
            let currentState = this.appStack[this.appStack.length - 1];

            // Only push initial state if not currently in forum app
            if (!currentState || currentState.app !== 'forum') {
                const initialState = {
                    app: 'forum',
                    title: 'Forum',
                    view: 'main',
                };
                this.pushAppState(initialState);
                currentState = initialState;
            }

            const view = currentState.view || 'main';

            console.log('[Mobile Phone] Current forum view:', view);

            let content = '';

            if (view === 'forumControl') {
                // Show forum control interface
                if (!window.getForumControlAppContent) {
                    throw new Error('getForumControlAppContent function not found');
                }
                console.log('[Mobile Phone] Get forum control content...');
                content = window.getForumControlAppContent();
            } else {
                // Show main forum interface
                if (!window.getForumAppContent) {
                    throw new Error('getForumAppContent function not found');
                }
                console.log('[Mobile Phone] Get forum main interface content...');
                content = window.getForumAppContent();
            }

            if (!content || content.trim() === '') {
                throw new Error(`Forum ${view === 'forumControl' ? 'control' : 'main interface'} content empty`);
            }

            document.getElementById('app-content').innerHTML = content;

            // Bind corresponding events
            console.log('[Mobile Phone] Bind forum events...');
            if (view === 'forumControl') {
                // Bind forum control events
                if (window.bindForumControlEvents) {
                    window.bindForumControlEvents();
                    console.log('[Mobile Phone] Forum control events bound');
                }
            } else {
                // Bind main forum events
                if (window.bindForumEvents) {
                    window.bindForumEvents();
                    console.log('[Mobile Phone] Forum main interface events bound');
                }
            }

            // Ensure style selector correctly initialized
            setTimeout(() => {
                const forumStyleSelect = document.getElementById('forum-style-select');
                if (forumStyleSelect) {
                    this.initializeForumStyleSelector(forumStyleSelect);
                    console.log('[Mobile Phone] Forum style selector initialized');
                }
            }, 500);

            console.log('[Mobile Phone] ✅ Forum app loading complete');
        } catch (error) {
            console.error('[Mobile Phone] Failed to handle forum app:', error);

            // Remove loading state
            this._loadingApps.delete('forum');

            document.getElementById('app-content').innerHTML = `
                <div class="error-placeholder">
                    <div class="error-icon">❌</div>
                    <div class="error-text">Forum load failed</div>
                    <div class="error-detail">${error.message}</div>
                    <button onclick="window.mobilePhone.handleForumApp()" class="retry-button">Retry</button>
                </div>
            `;
        }
    }

    // Handle weibo app
    async handleWeiboApp() {
        try {
            console.log('[Mobile Phone] Start handling weibo app...');

            // Show loading state
            document.getElementById('app-content').innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-icon">⏳</div>
                    <div class="loading-text">Loading Weibo...</div>
                </div>
            `;

            // Ensure weibo UI module loaded, add timeout and retry mechanism
            console.log('[Mobile Phone] Load weibo UI module...');

            const loadWithTimeout = (promise, timeout = 15000) => {
                return Promise.race([
                    promise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Weibo module load timeout')), timeout)),
                ]);
            };

            try {
                await loadWithTimeout(this.loadWeiboApp());
            } catch (error) {
                console.error('[Mobile Phone] Weibo module load failed, try reload:', error);
                // Clean failed load state
                window._weiboAppLoading = null;
                await loadWithTimeout(this.loadWeiboApp());
            }

            // Check if user navigation intent still valid
            if (!this.completeAppLoading('weibo')) {
                console.log('[Mobile Phone] Weibo app loading complete, but user switched to other app, cancel render');
                return;
            }

            // Get current app state
            const currentState = this.appStack[this.appStack.length - 1] || { view: 'main' };
            const view = currentState.view || 'main';

            console.log('[Mobile Phone] Current weibo view:', view);

            let content = '';

            if (view === 'weiboControl') {
                // Show weibo control interface
                if (!window.getWeiboControlAppContent) {
                    throw new Error('getWeiboControlAppContent function not found');
                }
                console.log('[Mobile Phone] Get weibo control content...');
                content = window.getWeiboControlAppContent();
            } else {
                // Show main weibo interface
                if (!window.getWeiboAppContent) {
                    throw new Error('getWeiboAppContent function not found');
                }
                console.log('[Mobile Phone] Get weibo main interface content...');
                content = window.getWeiboAppContent();
            }

            if (!content || content.trim() === '') {
                throw new Error(`Weibo ${view === 'weiboControl' ? 'control' : 'main interface'} content empty`);
            }

            document.getElementById('app-content').innerHTML = content;

            // Bind corresponding events
            console.log('[Mobile Phone] Bind weibo events...');
            if (view === 'weiboControl') {
                // Bind weibo control events
                if (window.bindWeiboControlEvents) {
                    window.bindWeiboControlEvents();
                    console.log('[Mobile Phone] Weibo control events bound');
                }
            } else {
                // Bind main weibo events
                if (window.bindWeiboEvents) {
                    window.bindWeiboEvents();
                    console.log('[Mobile Phone] Weibo main interface events bound');
                }
            }

            console.log('[Mobile Phone] ✅ Weibo app loading complete');
        } catch (error) {
            console.error('[Mobile Phone] Failed to handle weibo app:', error);

            // Remove loading state
            this._loadingApps.delete('weibo');

            document.getElementById('app-content').innerHTML = `
                <div class="error-placeholder">
                    <div class="error-icon">❌</div>
                    <div class="error-text">Weibo load failed</div>
                    <div class="error-detail">${error.message}</div>
                    <button onclick="window.mobilePhone.handleWeiboApp()" class="retry-button">Retry</button>
                </div>
            `;
        }
    }

    // Handle settings app
    async handleSettingsApp() {
        try {
            console.log('[Mobile Phone] Start handling settings app...');

            // Show loading state
            document.getElementById('app-content').innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-icon">⏳</div>
                    <div class="loading-text">Loading Style Settings...</div>
                </div>
            `;

            // Ensure style config manager loaded
            console.log('[Mobile Phone] Load style config manager module...');
            await this.loadStyleConfigApp();

            // Directly use global function to get content
            if (!window.getStyleConfigAppContent) {
                throw new Error('getStyleConfigAppContent function not found');
            }

            // Get style config app content
            console.log('[Mobile Phone] Get style config content...');
            const content = window.getStyleConfigAppContent();

            if (!content || content.trim() === '') {
                throw new Error('Style config app content empty');
            }

            document.getElementById('app-content').innerHTML = content;

            // Bind style config app events
            console.log('[Mobile Phone] Bind style config events...');
            if (window.bindStyleConfigEvents) {
                // bindStyleConfigEvents will now automatically wait for manager to be ready
                window.bindStyleConfigEvents();
            }

            // If style config manager not ready yet, show loading state
            if (window.styleConfigManager && !window.styleConfigManager.isConfigReady()) {
                console.log('[Mobile Phone] Wait for style config manager to be ready...');

                // Add loading hint
                const loadingHint = document.createElement('div');
                loadingHint.className = 'config-loading-hint';
                loadingHint.innerHTML = `
                    <div style="
                        position: fixed;
                        top: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: #2196F3;
                        color: white;
                        padding: 10px 20px;
                        border-radius: 20px;
                        font-size: 14px;
                        z-index: 10000;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    ">
                        ⏳ Initializing style config manager...
                    </div>
                `;
                document.body.appendChild(loadingHint);

                // Remove hint after ready
                window.styleConfigManager
                    .waitForReady()
                    .then(() => {
                        console.log('[Mobile Phone] Style config manager ready');
                        if (loadingHint.parentNode) {
                            loadingHint.remove();
                        }
                    })
                    .catch(error => {
                        console.error('[Mobile Phone] Wait for style config manager failed:', error);
                        if (loadingHint.parentNode) {
                            loadingHint.innerHTML = `
                            <div style="
                                position: fixed;
                                top: 20px;
                                left: 50%;
                                transform: translateX(-50%);
                                background: #ff4444;
                                color: white;
                                padding: 10px 20px;
                                border-radius: 20px;
                                font-size: 14px;
                                z-index: 10000;
                                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                            ">
                                ❌ Style config manager initialization failed
                            </div>
                        `;
                            setTimeout(() => loadingHint.remove(), 3000);
                        }
                    });
            }

            console.log('[Mobile Phone] ✅ Settings app loading complete');
        } catch (error) {
            console.error('[Mobile Phone] Failed to handle settings app:', error);
            document.getElementById('app-content').innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <div class="error-title">Settings app load failed</div>
                    <div class="error-message">${error.message}</div>
                    <button onclick="window.mobilePhone.handleSettingsApp()" class="retry-button">Retry</button>
                </div>
            `;
        }
    }

    // Handle messages app
    async handleMessagesApp() {
        try {
            console.log('[Mobile Phone] Start handling messages app...');

            // Show loading state
            document.getElementById('app-content').innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-icon">⏳</div>
                    <div class="loading-text">Loading Messages App...</div>
                </div>
            `;

            // Ensure message-app loaded
            console.log('[Mobile Phone] Load messages app module...');
            await this.loadMessageApp();

            // Directly use global function to get content
            if (!window.getMessageAppContent) {
                throw new Error('getMessageAppContent function not found');
            }

            // Get messages app content
            console.log('[Mobile Phone] Get app content...');
            const content = window.getMessageAppContent();

            if (!content || content.trim() === '') {
                throw new Error('Messages app content empty');
            }

            document.getElementById('app-content').innerHTML = content;

            // Bind messages app events
            console.log('[Mobile Phone] Bind events...');
            if (window.bindMessageAppEvents) {
                window.bindMessageAppEvents();
            }

            // Ensure app state correct (don't recreate, use existing state)
            if (!this.currentAppState || this.currentAppState.app !== 'messages') {
                const messageState = {
                    app: 'messages',
                    title: 'Messages',
                    view: 'messageList',
                };
                this.currentAppState = messageState;
                this.appStack = [messageState];
                this.updateAppHeader(messageState);
            }

            console.log('[Mobile Phone] Messages app loading complete');
        } catch (error) {
            console.error('[Mobile Phone] Failed to load messages app:', error);

            // Show friendly error message
            document.getElementById('app-content').innerHTML = `
                <div class="error-message">
                    <div class="error-icon">⚠️</div>
                    <div class="error-title">Load failed</div>
                    <div class="error-details">${error.message}</div>
                    <button class="retry-button" onclick="window.MobilePhone.openApp('messages')">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // Handle status app
    async handleStatusApp() {
        try {
            console.log('[Mobile Phone] Start handling status app...');

            // Show loading state
            document.getElementById('app-content').innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-icon">⏳</div>
                    <div class="loading-text">Loading Status App...</div>
                </div>
            `;

            // Ensure status-app loaded
            console.log('[Mobile Phone] Load status app module...');
            await this.loadStatusApp();

            // Directly use global function to get content
            if (!window.getStatusAppContent) {
                throw new Error('getStatusAppContent function not found');
            }

            // Get status app content
            console.log('[Mobile Phone] Get status app content...');
            const content = window.getStatusAppContent();

            if (!content || content.trim() === '') {
                throw new Error('Status app content empty');
            }

            document.getElementById('app-content').innerHTML = content;

            // Bind events
            console.log('[Mobile Phone] Bind status app events..');
            if (window.bindStatusAppEvents) {
                window.bindStatusAppEvents();
            }

            console.log('[Mobile Phone] ✅ Status app loading complete');
        } catch (error) {
            console.error('[Mobile Phone] ❌ Failed to handle status app:', error);
            document.getElementById('app-content').innerHTML = `
                <div class="error-message">
                    <div class="error-icon">⚠️</div>
                    <div class="error-text">Status app load failed</div>
                    <div class="error-details">${error.message}</div>
                    <button onclick="window.mobilePhone.handleStatusApp()" class="retry-button">Retry</button>
                </div>
            `;
        }
    }

    // Handle diary app
    async handleDiaryApp() {
        try {
            console.log('[Mobile Phone] Start handling diary app...');

            // Show loading state
            document.getElementById('app-content').innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-icon">⏳</div>
                    <div class="loading-text">Loading Diary App...</div>
                </div>
            `;

            // Ensure diary-app loaded
            console.log('[Mobile Phone] Load diary app module...');
            await this.loadDiaryApp();

            // Directly use global function to get content
            if (!window.getDiaryAppContent) {
                throw new Error('getDiaryAppContent function not found');
            }

            // Get diary app content
            console.log('[Mobile Phone] Get diary app content...');
            const content = window.getDiaryAppContent();

            if (!content || content.trim() === '') {
                throw new Error('Diary app content empty');
            }

            document.getElementById('app-content').innerHTML = content;

            // Bind events
            console.log('[Mobile Phone] Bind diary app events...');
            if (window.bindDiaryAppEvents) {
                window.bindDiaryAppEvents();
            }

            console.log('[Mobile Phone] ✅ Diary app loading complete');
        } catch (error) {
            console.error('[Mobile Phone] ❌ Failed to handle diary app:', error);
            document.getElementById('app-content').innerHTML = `
                <div class="error-message">
                    <div class="error-icon">⚠️</div>
                    <div class="error-text">Diary app load failed</div>
                    <div class="error-details">${error.message}</div>
                    <button onclick="window.mobilePhone.handleDiaryApp()" class="retry-button">Retry</button>
                </div>
            `;
        }
    }

    // Handle shop app
    async handleShopApp() {
        try {
            console.log('[Mobile Phone] Start handling shop app...');

            // Show loading state
            document.getElementById('app-content').innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-icon">⏳</div>
                    <div class="loading-text">Loading Shop App...</div>
                </div>
            `;

            // Ensure shop-app loaded
            console.log('[Mobile Phone] Load shop app module...');
            await this.loadShopApp();

            // Directly use global function to get content
            if (!window.getShopAppContent) {
                throw new Error('getShopAppContent function not found');
            }

            // Get shop app content
            console.log('[Mobile Phone] Get shop app content...');
            const content = window.getShopAppContent();

            if (!content || content.trim() === '') {
                throw new Error('Shop app content empty');
            }

            document.getElementById('app-content').innerHTML = content;

            // Bind shop app events
            console.log('[Mobile Phone] Bind shop app events...');
            if (window.bindShopAppEvents) {
                window.bindShopAppEvents();
            }

            console.log('[Mobile Phone] ✅ Shop app loading complete');
        } catch (error) {
            console.error('[Mobile Phone] Failed to handle shop app:', error);
            document.getElementById('app-content').innerHTML = `
                <div class="error-placeholder">
                    <div class="error-icon">❌</div>
                    <div class="error-text">Shop app load failed</div>
                    <div class="error-detail">${error.message}</div>
                    <button onclick="window.mobilePhone.handleShopApp()" class="retry-button">Retry</button>
                </div>
            `;
        }
    }

    // Handle backpack app
    async handleBackpackApp() {
        try {
            console.log('[Mobile Phone] Start handling backpack app...');

            // Show loading state
            document.getElementById('app-content').innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-icon">⏳</div>
                    <div class="loading-text">Loading Backpack App...</div>
                </div>
            `;

            // Ensure backpack-app loaded
            console.log('[Mobile Phone] Load backpack app module...');
            await this.loadBackpackApp();

            // Directly use global function to get content
            if (!window.getBackpackAppContent) {
                throw new Error('getBackpackAppContent function not found');
            }

            // Get backpack app content
            console.log('[Mobile Phone] Get backpack app content...');
            const content = window.getBackpackAppContent();

            if (!content || content.trim() === '') {
                throw new Error('Backpack app content empty');
            }

            document.getElementById('app-content').innerHTML = content;

            // Bind backpack app events
            console.log('[Mobile Phone] Bind backpack app events...');
            if (window.bindBackpackAppEvents) {
                window.bindBackpackAppEvents();
            }

            console.log('[Mobile Phone] ✅ Backpack app loading complete');
        } catch (error) {
            console.error('[Mobile Phone] Failed to handle backpack app:', error);
            document.getElementById('app-content').innerHTML = `
                <div class="error-placeholder">
                    <div class="error-icon">❌</div>
                    <div class="error-text">Backpack app load failed</div>
                    <div class="error-detail">${error.message}</div>
                    <button onclick="window.mobilePhone.handleBackpackApp()" class="retry-button">Retry</button>
                </div>
            `;
        }
    }

    // Handle task app
    async handleTaskApp() {
        try {
            console.log('[Mobile Phone] Start handling task app...');

            // Show loading state
            document.getElementById('app-content').innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-icon">⏳</div>
                    <div class="loading-text">Loading Task App...</div>
                </div>
            `;

            // Ensure task-app loaded
            console.log('[Mobile Phone] Load task app module...');
            await this.loadTaskApp();

            // Directly use global function to get content
            if (!window.getTaskAppContent) {
                throw new Error('getTaskAppContent function not found');
            }

            // Get task app content
            console.log('[Mobile Phone] Get task app content...');
            const content = window.getTaskAppContent();

            if (!content || content.trim() === '') {
                throw new Error('Task app content empty');
            }

            document.getElementById('app-content').innerHTML = content;

            // Bind task app events
            console.log('[Mobile Phone] Bind task app events...');
            if (window.bindTaskAppEvents) {
                window.bindTaskAppEvents();
            }

            console.log('[Mobile Phone] ✅ Task app loading complete');
        } catch (error) {
            console.error('[Mobile Phone] Failed to handle task app:', error);
            document.getElementById('app-content').innerHTML = `
                <div class="error-placeholder">
                    <div class="error-icon">❌</div>
                    <div class="error-text">Task app load failed</div>
                    <div class="error-detail">${error.message}</div>
                    <button onclick="window.mobilePhone.handleTaskApp()" class="retry-button">Retry</button>
                </div>
            `;
        }
    }

    // Handle live app
    async handleLiveApp() {
        try {
            console.log('[Mobile Phone] Start handling live app...');

            // Show loading state
            document.getElementById('app-content').innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-icon">⏳</div>
                    <div class="loading-text">Loading Live App...</div>
                </div>
            `;

            // Ensure live-app loaded
            console.log('[Mobile Phone] Load live app module...');
            await this.loadLiveApp();

            // Directly use global function to get content
            if (!window.getLiveAppContent) {
                throw new Error('getLiveAppContent function not found');
            }

            // Get live app content
            console.log('[Mobile Phone] Get live app content...');
            const content = window.getLiveAppContent();

            if (!content || content.trim() === '') {
                throw new Error('Live app content empty');
            }

            document.getElementById('app-content').innerHTML = content;

            // Bind live app events
            console.log('[Mobile Phone] Bind live app events...');
            if (window.bindLiveAppEvents) {
                window.bindLiveAppEvents();
            }

            console.log('[Mobile Phone] ✅ Live app loading complete');
        } catch (error) {
            console.error('[Mobile Phone] Failed to handle live app:', error);
            document.getElementById('app-content').innerHTML = `
                <div class="error-placeholder">
                    <div class="error-icon">❌</div>
                    <div class="error-text">Live app load failed</div>
                    <div class="error-detail">${error.message}</div>
                    <button onclick="window.mobilePhone.handleLiveApp()" class="retry-button">Retry</button>
                </div>
            `;
        }
    }

    // Handle watch live app
    async handleWatchLiveApp() {
        try {
            console.log('[Mobile Phone] Start handling watch live app...');

            // Show loading state
            document.getElementById('app-content').innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-icon">⏳</div>
                    <div class="loading-text">Loading Watch Live App...</div>
                </div>
            `;

            // Ensure watch-live loaded
            console.log('[Mobile Phone] Load watch live app module...');
            await this.loadWatchLiveApp();

            // Directly use global function to get content
            if (!window.getWatchLiveAppContent) {
                throw new Error('getWatchLiveAppContent function not found');
            }

            // Get watch live app content
            console.log('[Mobile Phone] Get watch live app content...');
            const content = window.getWatchLiveAppContent();

            if (!content || content.trim() === '') {
                throw new Error('Watch live app content empty');
            }

            document.getElementById('app-content').innerHTML = content;

            // Bind watch live app events
            console.log('[Mobile Phone] Bind watch live app events...');
            if (window.bindWatchLiveAppEvents) {
                window.bindWatchLiveAppEvents();
            }

            console.log('[Mobile Phone] ✅ Watch live app loading complete');
        } catch (error) {
            console.error('[Mobile Phone] Failed to handle watch live app:', error);
            document.getElementById('app-content').innerHTML = `
                <div class="error-placeholder">
                    <div class="error-icon">❌</div>
                    <div class="error-text">Watch live app load failed</div>
                    <div class="error-detail">${error.message}</div>
                    <button onclick="window.mobilePhone.handleWatchLiveApp()" class="retry-button">Retry</button>
                </div>
            `;
        }
    }

    // Handle parallel events app
    async handleParallelEventsApp() {
        try {
            console.log('[Mobile Phone] Start handling parallel events app...');

            // Show loading state
            document.getElementById('app-content').innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-icon">⏳</div>
                    <div class="loading-text">Loading Parallel Events App...</div>
                </div>
            `;

            // Ensure parallel-events-app loaded
            console.log('[Mobile Phone] Load parallel events app module...');

            // If global variables don't exist, try simple load
            if (!window.ParallelEventsApp || !window.getParallelEventsAppContent ||
                !window.bindParallelEventsAppEvents || !window.parallelEventsStyles) {
                console.log('[Mobile Phone] Parallel events app module not loaded, try simple load...');
                await this.simpleLoadParallelEventsApp();
            } else {
                console.log('[Mobile Phone] Parallel events app module already exists');
            }

            // Check necessary global variables
            console.log('[Mobile Phone] Check global variable status:');
            console.log('  - ParallelEventsApp:', typeof window.ParallelEventsApp);
            console.log('  - getParallelEventsAppContent:', typeof window.getParallelEventsAppContent);
            console.log('  - bindParallelEventsAppEvents:', typeof window.bindParallelEventsAppEvents);
            console.log('  - parallelEventsStyles:', typeof window.parallelEventsStyles);
            console.log('  - parallelEventsManager:', typeof window.parallelEventsManager);

            if (!window.getParallelEventsAppContent) {
                throw new Error('getParallelEventsAppContent function not found');
            }

            if (!window.bindParallelEventsAppEvents) {
                throw new Error('bindParallelEventsAppEvents function not found');
            }

            // Get parallel events app content
            console.log('[Mobile Phone] Get parallel events app content...');
            const content = window.getParallelEventsAppContent();

            if (!content || content.trim() === '') {
                throw new Error('Parallel events app content empty');
            }

            document.getElementById('app-content').innerHTML = content;

            // Bind parallel events app events
            console.log('[Mobile Phone] Bind parallel events app events...');
            if (window.bindParallelEventsAppEvents) {
                await window.bindParallelEventsAppEvents();
            }

            console.log('[Mobile Phone] Parallel events manager status:', {
                manager: !!window.parallelEventsManager,
                isListening: window.parallelEventsManager?.isListening,
                settings: window.parallelEventsManager?.currentSettings
            });

            console.log('[Mobile Phone] ✅ Parallel events app loading complete');
        } catch (error) {
            console.error('[Mobile Phone] Failed to handle parallel events app:', error);
            document.getElementById('app-content').innerHTML = `
                <div class="error-placeholder">
                    <div class="error-icon">❌</div>
                    <div class="error-text">Parallel events app load failed</div>
                    <div class="error-detail">${error.message}</div>
                    <button onclick="window.mobilePhone.handleParallelEventsApp()" class="retry-button">Retry</button>
                </div>
            `;
        }
    }

    // Handle profile management app
    async handleProfileApp() {
        try {
            console.log('[Mobile Phone] Start handling profile management app...');

            // Show loading state
            document.getElementById('app-content').innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-icon">⏳</div>
                    <div class="loading-text">Loading Profile Management...</div>
                </div>
            `;

            // Ensure profile app loaded
            console.log('[Mobile Phone] Load profile app module...');
            await this.loadProfileApp();

            // Check if profile app ready
            if (!window.profileApp) {
                throw new Error('Profile app not ready');
            }

            // Get profile app content
            console.log('[Mobile Phone] Get profile app content...');
            const content = window.profileApp.getAppContent();

            if (!content || content.trim() === '') {
                throw new Error('Profile app content empty');
            }

            document.getElementById('app-content').innerHTML = content;

            console.log('[Mobile Phone] ✅ Profile app loading complete');
        } catch (error) {
            console.error('[Mobile Phone] ❌ Profile app load failed:', error);
            document.getElementById('app-content').innerHTML = `
                <div class="error-placeholder">
                    <div class="error-icon">❌</div>
                    <div class="error-text">Profile app load failed</div>
                    <div class="error-detail">${error.message}</div>
                    <button onclick="window.mobilePhone.handleProfileApp()" class="retry-button">Retry</button>
                </div>
            `;
        }
    }

    // Handle unified API settings app
    async handleApiApp() {
        try {
            console.log('[Mobile Phone] Start handling unified API settings app...');

            // Show loading state
            document.getElementById('app-content').innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-icon">⏳</div>
                    <div class="loading-text">Loading API Settings...</div>
                </div>
            `;

            // Ensure necessary modules loaded, add timeout control
            console.log('[Mobile Phone] Ensure forum, weibo, and parallel events modules loaded...');

            const loadWithTimeout = (promise, timeout = 10000, name = '') => {
                return Promise.race([
                    promise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error(`${name} load timeout`)), timeout)),
                ]);
            };

            await Promise.all([
                loadWithTimeout(this.loadForumApp(), 10000, 'Forum module').catch(e =>
                    console.warn('[Mobile Phone] Forum module load failed:', e),
                ),
                loadWithTimeout(this.loadWeiboApp(), 10000, 'Weibo module').catch(e =>
                    console.warn('[Mobile Phone] Weibo module load failed:', e),
                ),
                loadWithTimeout(this.simpleLoadParallelEventsApp(), 10000, 'Parallel events module').catch(e =>
                    console.warn('[Mobile Phone] Parallel events module load failed:', e),
                ),
            ]);

            // Check if user navigation intent still valid
            if (!this.completeAppLoading('api')) {
                console.log('[Mobile Phone] API settings app loading complete, but user switched to other app, cancel render');
                return;
            }

            // Generate unified API settings panel HTML
            const content = this.getUnifiedApiSettingsHTML();

            document.getElementById('app-content').innerHTML = content;

            // Bind unified API settings events
            console.log('[Mobile Phone] Bind unified API settings events...');
            this.bindUnifiedApiEvents();

            // Ensure style selector correctly initialized
            setTimeout(() => {
                const forumStyleSelect = document.getElementById('forum-style-select');
                if (forumStyleSelect) {
                    this.initializeForumStyleSelector(forumStyleSelect);
                    console.log('[Mobile Phone] API settings page style selector initialized');
                }

                // Initialize parallel events settings (HTML already contains correct values, just need to bind events)
                console.log('[Mobile Phone] Parallel events settings correctly initialized via HTML');
            }, 500);

            console.log('[Mobile Phone] ✅ Unified API settings app loading complete');
        } catch (error) {
            console.error('[Mobile Phone] Failed to handle unified API settings app:', error);

            // Remove loading state
            this._loadingApps.delete('api');

            document.getElementById('app-content').innerHTML = `
                <div class="error-placeholder">
                    <div class="error-icon">❌</div>
                    <div class="error-text">API settings load failed</div>
                    <div class="error-detail">${error.message}</div>
                    <button onclick="window.mobilePhone.handleApiApp()" class="retry-button">Retry</button>
                </div>
            `;
        }
    }

    // Generate unified API settings panel HTML
    getUnifiedApiSettingsHTML() {
        // Get current settings
        const forumSettings = window.forumManager
            ? window.forumManager.currentSettings
            : {
                selectedStyle: '贴吧老哥',
                autoUpdate: true,
                threshold: 10,
            };

        const weiboSettings = window.weiboManager
            ? window.weiboManager.currentSettings
            : {
                autoUpdate: true,
                threshold: 10,
            };

        // Get parallel events settings
        let parallelEventsSettings = {
            threshold: 10,
            enabled: false,
            selectedStyle: '平行事件',
            customPrefix: ''
        };

        try {
            const saved = localStorage.getItem('parallelEventsSettings');
            if (saved) {
                parallelEventsSettings = { ...parallelEventsSettings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('[Mobile Phone] Failed to get parallel events settings:', error);
        }

        return `
            <div class="unified-api-settings">


                <div class="settings-tabs">
                    <div class="tab-buttons">
                        <button class="tab-btn active" data-tab="forum">Forum</button>
                        <button class="tab-btn" data-tab="forum-styles">Forum Styles</button>
                        <button class="tab-btn" data-tab="parallel-events">Parallel Events</button>
                        <button class="tab-btn" data-tab="weibo">Weibo</button>
                        <button class="tab-btn" data-tab="api">API</button>
                    </div>

                    <div class="m-tab-content" id="forum-tab" style="display: block;">
                        <div class="setting-group">
                            <label>Forum Style:</label>
                            <select id="forum-style-select">
                                <option value="贴吧老哥" ${forumSettings.selectedStyle === '贴吧老哥' ? 'selected' : ''
            }>贴吧老哥</option>
                                <option value="知乎精英" ${forumSettings.selectedStyle === '知乎精英' ? 'selected' : ''
            }>知乎精英</option>
                                <option value="小红书种草" ${forumSettings.selectedStyle === '小红书种草' ? 'selected' : ''
            }>小红书种草</option>
                                <option value="抖音达人" ${forumSettings.selectedStyle === '抖音达人' ? 'selected' : ''
            }>抖音达人</option>
                                <option value="B站UP主" ${forumSettings.selectedStyle === 'B站UP主' ? 'selected' : ''
            }>B站UP主</option>
                                <option value="海角老司机" ${forumSettings.selectedStyle === '海角老司机' ? 'selected' : ''
            }>海角老司机</option>
                                <option value="八卦小报记者" ${forumSettings.selectedStyle === '八卦小报记者' ? 'selected' : ''
            }>八卦小报记者</option>
                                <option value="天涯老涯友" ${forumSettings.selectedStyle === '天涯老涯友' ? 'selected' : ''
            }>天涯老涯友</option>
                                <option value="校园论坛" ${forumSettings.selectedStyle === '校园论坛' ? 'selected' : ''
            }>校园论坛</option>
                                <option value="微博" ${forumSettings.selectedStyle === '微博' ? 'selected' : ''
            }>微博</option>
                            </select>
                        </div>

                        <div class="setting-group">
                            <label>Custom Prefix:</label>
                            <textarea id="forum-custom-prefix" placeholder="Custom prompt for forum generation...">${window.forumStyles ? window.forumStyles.getCustomPrefix() : ''
            }</textarea>
                        </div>

                        <div class="setting-group">
                            <label>Message Threshold:</label>
                            <input type="number" id="forum-threshold" value="${forumSettings.threshold
            }" min="1" max="100">
                        </div>

                        <div class="setting-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="forum-auto-update" ${forumSettings.autoUpdate ? 'checked' : ''
            }>
                                Auto Generate Forum Content
                            </label>
                        </div>

                        <div class="action-buttons">
                            <button id="generate-forum-now" class="btn-primary">🚀 Generate Forum Now</button>
                            <button id="clear-forum-content" class="btn-danger">🗑️ Clear Forum Content</button>
                        </div>
                    </div>

                    <div class="m-tab-content" id="forum-styles-tab" style="display: none;">
                        <div class="forum-styles-container">
                            <div class="styles-header">
                                <h3>🎨 Forum Style Management</h3>
                                <p>Create and manage your custom forum styles</p>
                            </div>

                            <div class="styles-actions">
                                <button id="create-custom-style-btn" class="btn-primary">
                                    <i class="fas fa-plus"></i> Create Custom Style
                                </button>
                                <div class="import-export-actions">
                                    <button id="export-styles-btn" class="btn-secondary">
                                        <i class="fas fa-download"></i> Export Styles
                                    </button>
                                    <button id="import-styles-btn" class="btn-secondary">
                                        <i class="fas fa-upload"></i> Import Styles
                                    </button>
                                    <input type="file" id="import-styles-input" accept=".json" style="display: none;">
                                </div>
                            </div>

                            <div class="custom-styles-list">
                                <h4>Custom Styles List111</h4>
                                <div id="custom-styles-container">
                                    <div class="no-styles-placeholder">
                                        <div class="placeholder-icon">🎭</div>
                                        <div class="placeholder-text">No custom styles yet</div>
                                        <div class="placeholder-hint">Click the button above to create your first style</div>
                                    </div>
                                </div>
                            </div>

                            <div class="styles-info">
                                <h4>Usage Instructions</h4>
                                <ul>
                                    <li>Custom styles will appear in the forum style selector</li>
                                    <li>You can export style files for use on other devices</li>
                                    <li>Please maintain format integrity when editing styles</li>
                                    <li>Style content supports all forum functions and formats</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="m-tab-content" id="parallel-events-tab" style="display: none;">
                        <div class="parallel-events-container">
                            <div class="settings-header">
                                <h3>🌀 Parallel Events Settings</h3>
                                <p>Configure parallel events generation style and custom prefix</p>
                            </div>

                            <div class="setting-group">
                                <label>Event Style:</label>
                                <select id="parallel-events-style-select">
                                    <option value="被ntr" ${parallelEventsSettings.selectedStyle === '被ntr' ? 'selected' : ''}>被ntr</option>
                                    <option value="主人的任务" ${parallelEventsSettings.selectedStyle === '主人的任务' ? 'selected' : ''}>主人的任务</option>
                                    <option value="主动消息" ${parallelEventsSettings.selectedStyle === '主动消息' ? 'selected' : ''}>主动消息</option>
                                    <option value="平行事件" ${parallelEventsSettings.selectedStyle === '平行事件' ? 'selected' : ''}>平行事件</option>
                                    <option value="魅魔之体" ${parallelEventsSettings.selectedStyle === '魅魔之体' ? 'selected' : ''}>魅魔之体</option>
                                    <option value="随机新闻" ${parallelEventsSettings.selectedStyle === '随机新闻' ? 'selected' : ''}>随机新闻</option>
                                    <option value="自定义" ${parallelEventsSettings.selectedStyle === '自定义' ? 'selected' : ''}>Custom</option>
                                </select>
                            </div>

                            <div class="setting-group">
                                <label>Custom Prefix:</label>
                                <textarea id="parallel-events-custom-prefix" placeholder="When selecting 'Custom' style, please enter specific style requirements and generation guidance here...">${parallelEventsSettings.customPrefix || ''}</textarea>
                                <small>Tip: When selecting "Custom" style, this prefix will be the main style guidance</small>
                            </div>

                            <div class="setting-group">
                                <label>Listen Threshold:</label>
                                <input type="number" id="parallel-events-threshold" value="${parallelEventsSettings.threshold}" min="3" max="99">
                                <small>Trigger parallel events generation when floor changes reach this number</small>
                            </div>

                            <div class="setting-group">
                                <label>Enable Listening:</label>
                                <div class="toggle-switch2">
                                    <input type="checkbox" id="parallel-events-enabled" ${parallelEventsSettings.enabled ? 'checked' : ''}>

                                </div>
                                <small>After enabling, will continuously monitor floor changes, regardless of whether mobile interface is open</small>
                            </div>

                            <div class="setting-group">
                                <button id="test-parallel-events" class="btn-primary">🧪 Test Generation</button>
                            </div>

                            <div class="parallel-events-info">
                                <h4>Usage Instructions</h4>
                                <ul>
                                    <li>Parallel events generate related background events based on the last 5 floors of conversation content</li>
                                    <li>Generated content automatically inserted into the latest floor</li>
                                    <li>Select "Custom" style to fully customize generation requirements</li>
                                    <li>Custom prefix can further refine generation direction of any style</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="m-tab-content" id="weibo-tab" style="display: none;">


                        <div class="setting-group">
                            <label>Custom Prefix:</label>
                            <textarea id="weibo-custom-prefix" placeholder="Custom prompt for weibo generation...">${window.weiboStyles ? window.weiboStyles.getCustomPrefix() : ''
            }</textarea>
                        </div>

                        <div class="setting-group">
                            <label>Message Threshold:</label>
                            <input type="number" id="weibo-threshold" value="${weiboSettings.threshold
            }" min="1" max="100">
                        </div>

                        <div class="setting-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="weibo-auto-update" ${weiboSettings.autoUpdate ? 'checked' : ''
            }>
                                Auto Generate Weibo Content
                            </label>
                        </div>

                        <div class="action-buttons">
                            <button id="generate-weibo-now" class="btn-primary">🚀 Generate Weibo Now</button>
                            <button id="clear-weibo-content" class="btn-danger">🗑️ Clear Weibo Content</button>
                        </div>
                    </div>

                    <div class="m-tab-content" id="api-tab" style="display: none;">
                        <div class="setting-group">
                            <label>API Configuration:</label>
                            <button id="open-api-config" class="btn-secondary">🔧 Open API Config Panel</button>
                            <p class="setting-description">Configure API settings for generating forum and weibo content</p>
                        </div>

                        <div class="setting-group">
                            <label>Status Monitoring:</label>
                            <div class="status-display">
                                <div class="status-item">
                                    <span class="status-label">Forum Manager:</span>
                                    <span id="forum-status" class="status-value">Checking...</span>
                                </div>
                                <div class="status-item">
                                    <span class="status-label">Weibo Manager:</span>
                                    <span id="weibo-status" class="status-value">Checking...</span>
                                </div>
                                <div class="status-item">
                                    <span class="status-label">Parallel Events Manager:</span>
                                    <span id="parallel-events-status" class="status-value">Checking...</span>
                                </div>
                                <div class="status-item">
                                    <span class="status-label">API Configuration:</span>
                                    <span id="api-config-status" class="status-value">Checking...</span>
                                </div>
                            </div>
                        </div>

                        <div class="action-buttons">
                            <button id="refresh-status" class="btn-secondary">🔄 Refresh Status</button>
                            <button id="reset-all-settings" class="btn-warning">⚠️ Reset All Settings</button>
                        </div>
                    </div>
                </div>

                <style>
                    .unified-api-settings {
                        padding: 20px 0;
                        max-width: 100%;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }



                    .settings-tabs {
                        background: white;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }

                    .tab-buttons {
                        display: flex;
                        background: #f5f5f5;
                        border-bottom: 1px solid #e0e0e0;
                    }

                    .tab-btn {
                        flex: 1;
                        padding: 15px 10px;
                        border: none;
                        background: transparent;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        color: #666;
                        transition: all 0.3s ease;
                    }

                    .tab-btn.active {
                        background: white;
                        color: #333;
                        border-bottom: 3px solid #007AFF;
                    }

                    .tab-btn:hover {
                        background: rgba(0,122,255,0.1);
                        color: #007AFF;
                    }

                    .m-tab-content {
                        padding: 25px;
                    }

                    .setting-group {
                        margin-bottom: 25px;
                    }

                    .setting-group label {
                        display: block;
                        margin-bottom: 8px;
                        font-weight: 600;
                        color: #333;
                        font-size: 14px;
                    }

                    .setting-group select,
                    .setting-group input[type="number"],
                    .setting-group textarea {
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        font-size: 14px;
                        transition: border-color 0.3s ease;
                        box-sizing: border-box;
                    }

                    .setting-group select:focus,
                    .setting-group input:focus,
                    .setting-group textarea:focus {
                        outline: none;
                        border-color: #007AFF;
                        box-shadow: 0 0 0 3px rgba(0,122,255,0.1);
                    }

                    .setting-group textarea {
                        height: 80px;
                        resize: vertical;
                        font-family: monospace;
                    }

                    .checkbox-label {
                        display: flex !important;
                        align-items: center;
                        cursor: pointer;
                        font-weight: normal !important;
                    }

                    .checkbox-label input[type="checkbox"] {
                        width: auto !important;
                        margin-right: 10px;
                        transform: scale(1.2);
                    }

                    .action-buttons {
                        display: flex;
                        gap: 10px;
                        flex-wrap: wrap;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #e0e0e0;
                    }

                    .action-buttons button {
                        flex: 1;
                        min-width: 140px;
                        padding: 12px 16px;
                        border: none;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    }

                    .btn-primary {
                        background: #007AFF;
                        color: white;
                    }

                    .btn-primary:hover {
                        background: #0056CC;
                        transform: translateY(-1px);
                    }

                    .btn-danger {
                        background: #FF3B30;
                        color: white;
                    }

                    .btn-danger:hover {
                        background: #CC2E24;
                        transform: translateY(-1px);
                    }

                    .btn-secondary {
                        background: #8E8E93;
                        color: white;
                    }

                    .btn-secondary:hover {
                        background: #6D6D70;
                        transform: translateY(-1px);
                    }

                    .btn-warning {
                        background: #FF9500;
                        color: white;
                    }

                    .btn-warning:hover {
                        background: #CC7700;
                        transform: translateY(-1px);
                    }

                    .status-display {
                        background: #f8f9fa;
                        border: 1px solid #e0e0e0;
                        border-radius: 8px;
                        padding: 15px;
                    }

                    .status-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 8px;
                    }

                    .status-item:last-child {
                        margin-bottom: 0;
                    }

                    .status-label {
                        font-weight: 500;
                        color: #333;
                    }

                    .status-value {
                        font-family: monospace;
                        background: #e9ecef;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                    }

                    .setting-description {
                        margin-top: 5px;
                        font-size: 12px;
                        color: #666;
                        font-style: italic;
                    }

                    @media (max-width: 480px) {


                        .action-buttons {
                            flex-direction: column;
                        }

                        .action-buttons button {
                            flex: none;
                            width: 100%;
                        }
                    }
                </style>
            </div>
        `;
    }

    // Bind unified API settings events
    bindUnifiedApiEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchApiTab(tabName);
            });
        });

        // Forum settings events
        this.bindForumSettingsEvents();

        // Forum styles settings events
        this.bindForumStylesEvents();

        // Parallel events settings events
        this.bindParallelEventsEvents();

        // Weibo settings events
        this.bindWeiboSettingsEvents();

        // API config events
        this.bindApiConfigEvents();

        // Initialize status display
        this.updateApiStatus();

        // Start auto status refresh (check every 2 seconds, max 30 times)
        this.startApiStatusAutoRefresh();

        console.log('[Mobile Phone] Unified API settings events bound');
    }

    // Switch API settings tab
    switchApiTab(tabName) {
        // Switch button state
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Switch content display
        document.querySelectorAll('.m-tab-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById(`${tabName}-tab`).style.display = 'block';

        console.log('[Mobile Phone] Switch to API settings tab:', tabName);
    }

    // Bind forum settings events
    bindForumSettingsEvents() {
        // Forum style selection
        const forumStyleSelect = document.getElementById('forum-style-select');
        if (forumStyleSelect) {
            // Initialize style selector content
            this.initializeForumStyleSelector(forumStyleSelect);

            forumStyleSelect.addEventListener('change', e => {
                if (window.forumManager) {
                    window.forumManager.currentSettings.selectedStyle = e.target.value;
                    window.forumManager.saveSettings();
                    console.log('[Mobile Phone] Forum style updated:', e.target.value);
                }
            });
        }

        // Forum custom prefix
        const forumPrefixTextarea = document.getElementById('forum-custom-prefix');
        if (forumPrefixTextarea) {
            forumPrefixTextarea.addEventListener('blur', e => {
                if (window.forumStyles) {
                    window.forumStyles.setCustomPrefix(e.target.value);
                    console.log('[Mobile Phone] Forum custom prefix updated');
                }
            });
        }

        // Forum message threshold
        const forumThresholdInput = document.getElementById('forum-threshold');
        if (forumThresholdInput) {
            forumThresholdInput.addEventListener('change', e => {
                if (window.forumManager) {
                    window.forumManager.currentSettings.threshold = parseInt(e.target.value);
                    window.forumManager.saveSettings();
                    console.log('[Mobile Phone] Forum message threshold updated:', e.target.value);
                }
            });
        }

        // Forum auto update
        const forumAutoUpdateCheckbox = document.getElementById('forum-auto-update');
        if (forumAutoUpdateCheckbox) {
            forumAutoUpdateCheckbox.addEventListener('change', e => {
                if (window.forumManager) {
                    window.forumManager.currentSettings.autoUpdate = e.target.checked;
                    window.forumManager.saveSettings();
                    console.log('[Mobile Phone] Forum auto update updated:', e.target.checked);
                }
            });
        }

        // Generate forum now
        const generateForumBtn = document.getElementById('generate-forum-now');
        if (generateForumBtn) {
            generateForumBtn.addEventListener('click', async () => {
                if (window.forumManager) {
                    console.log('[Mobile Phone] Trigger generate forum now');

                    // Show processing prompt
                    MobilePhone.showToast('🔄 Starting to generate forum content...', 'processing');

                    try {
                        const result = await window.forumManager.generateForumContent(true);
                        if (result) {
                            MobilePhone.showToast('✅ Forum content generated successfully! Inserted to floor 1', 'success');
                            // Refresh status display
                            setTimeout(() => this.updateApiStatus(), 500);
                        } else {
                            MobilePhone.showToast('❌ Forum content generation failed, check console for details', 'error');
                        }
                    } catch (error) {
                        console.error('[Mobile Phone] Forum generation error:', error);
                        MobilePhone.showToast(`❌ Forum generation error: ${error.message}`, 'error');
                    }
                } else {
                    MobilePhone.showToast('❌ Forum manager not initialized', 'error');
                }
            });
        }

        // Clear forum content
        const clearForumBtn = document.getElementById('clear-forum-content');
        if (clearForumBtn) {
            clearForumBtn.addEventListener('click', async () => {
                if (window.forumManager) {
                    if (confirm('Confirm clear all forum content?')) {
                        console.log('[Mobile Phone] Trigger clear forum content');

                        // Show processing prompt
                        MobilePhone.showToast('🔄 Clearing forum content...', 'processing');

                        try {
                            await window.forumManager.clearForumContent();
                            MobilePhone.showToast('✅ Forum content cleared', 'success');
                            // Refresh status display
                            setTimeout(() => this.updateApiStatus(), 500);
                        } catch (error) {
                            console.error('[Mobile Phone] Clear forum content error:', error);
                            MobilePhone.showToast(`❌ Clear forum content error: ${error.message}`, 'error');
                        }
                    }
                } else {
                    MobilePhone.showToast('❌ Forum manager not initialized', 'error');
                }
            });
        }
    }

    // Bind forum styles settings events
    bindForumStylesEvents() {
        // Create custom style button
        const createStyleBtn = document.getElementById('create-custom-style-btn');
        if (createStyleBtn) {
            createStyleBtn.addEventListener('click', () => {
                this.showCreateStyleModal();
            });
        }

        // Export styles button
        const exportStylesBtn = document.getElementById('export-styles-btn');
        if (exportStylesBtn) {
            exportStylesBtn.addEventListener('click', () => {
                this.exportCustomStyles();
            });
        }

        // Import styles button
        const importStylesBtn = document.getElementById('import-styles-btn');
        if (importStylesBtn) {
            importStylesBtn.addEventListener('click', () => {
                document.getElementById('import-styles-input').click();
            });
        }

        // Import file selection
        const importInput = document.getElementById('import-styles-input');
        if (importInput) {
            importInput.addEventListener('change', e => {
                if (e.target.files.length > 0) {
                    this.importCustomStyles(e.target.files[0]);
                }
            });
        }

        // Load and display existing custom styles
        this.loadAndDisplayCustomStyles();

        // Update style selectors
        this.updateStyleSelectors();
    }

    // Bind weibo settings events
    bindWeiboSettingsEvents() {
        // Weibo custom prefix
        const weiboPrefixTextarea = document.getElementById('weibo-custom-prefix');
        if (weiboPrefixTextarea) {
            weiboPrefixTextarea.addEventListener('blur', e => {
                if (window.weiboStyles) {
                    window.weiboStyles.setCustomPrefix(e.target.value);
                    console.log('[Mobile Phone] Weibo custom prefix updated');
                }
            });
        }

        // Weibo message threshold
        const weiboThresholdInput = document.getElementById('weibo-threshold');
        if (weiboThresholdInput) {
            weiboThresholdInput.addEventListener('change', e => {
                if (window.weiboManager) {
                    window.weiboManager.currentSettings.threshold = parseInt(e.target.value);
                    window.weiboManager.saveSettings();
                    console.log('[Mobile Phone] Weibo message threshold updated:', e.target.value);
                }
            });
        }

        // Weibo auto update
        const weiboAutoUpdateCheckbox = document.getElementById('weibo-auto-update');
        if (weiboAutoUpdateCheckbox) {
            weiboAutoUpdateCheckbox.addEventListener('change', e => {
                if (window.weiboManager) {
                    window.weiboManager.currentSettings.autoUpdate = e.target.checked;
                    window.weiboManager.saveSettings();
                    console.log('[Mobile Phone] Weibo auto update updated:', e.target.checked);
                }
            });
        }

        // Generate weibo now
        const generateWeiboBtn = document.getElementById('generate-weibo-now');
        if (generateWeiboBtn) {
            generateWeiboBtn.addEventListener('click', async () => {
                if (window.weiboManager) {
                    console.log('[Mobile Phone] Trigger generate weibo now');

                    // Show processing prompt
                    MobilePhone.showToast('🔄 Starting to generate weibo content...', 'processing');

                    try {
                        const result = await window.weiboManager.generateWeiboContent(true);
                        if (result) {
                            MobilePhone.showToast('✅ Weibo content generated successfully! Inserted to floor 1', 'success');
                            // Refresh status display
                            setTimeout(() => this.updateApiStatus(), 500);
                        } else {
                            MobilePhone.showToast('❌ Weibo content generation failed, check console for details', 'error');
                        }
                    } catch (error) {
                        console.error('[Mobile Phone] Weibo generation error:', error);
                        MobilePhone.showToast(`❌ Weibo generation error: ${error.message}`, 'error');
                    }
                } else {
                    MobilePhone.showToast('❌ Weibo manager not initialized', 'error');
                }
            });
        }

        // Clear weibo content
        const clearWeiboBtn = document.getElementById('clear-weibo-content');
        if (clearWeiboBtn) {
            clearWeiboBtn.addEventListener('click', async () => {
                if (window.weiboManager) {
                    if (confirm('Confirm clear all weibo content?')) {
                        console.log('[Mobile Phone] Trigger clear weibo content');

                        // Show processing prompt
                        MobilePhone.showToast('🔄 Clearing weibo content...', 'processing');

                        try {
                            await window.weiboManager.clearWeiboContent();
                            MobilePhone.showToast('✅ Weibo content cleared', 'success');
                            // Refresh status display
                            setTimeout(() => this.updateApiStatus(), 500);
                        } catch (error) {
                            console.error('[Mobile Phone] Clear weibo content error:', error);
                            MobilePhone.showToast(`❌ Clear weibo content error: ${error.message}`, 'error');
                        }
                    }
                } else {
                    MobilePhone.showToast('❌ Weibo manager not initialized', 'error');
                }
            });
        }
    }

    // Bind parallel events settings events
    bindParallelEventsEvents() {
        // Initialize parallel events style selector
        this.initializeParallelEventsStyleSelector();

        // Parallel events style selection
        const parallelEventsStyleSelect = document.getElementById('parallel-events-style-select');
        if (parallelEventsStyleSelect) {
            parallelEventsStyleSelect.addEventListener('change', e => {
                if (window.parallelEventsManager) {
                    window.parallelEventsManager.currentSettings.selectedStyle = e.target.value;
                    window.parallelEventsManager.saveSettings();
                    console.log('[Mobile Phone] Parallel events style updated:', e.target.value);
                }
            });
        }

        // Parallel events custom prefix
        const parallelEventsCustomPrefix = document.getElementById('parallel-events-custom-prefix');
        if (parallelEventsCustomPrefix) {
            parallelEventsCustomPrefix.addEventListener('input', e => {
                if (window.parallelEventsManager) {
                    window.parallelEventsManager.currentSettings.customPrefix = e.target.value;
                    window.parallelEventsManager.saveSettings();
                    console.log('[Mobile Phone] Parallel events custom prefix updated');
                }
            });
        }

        // Parallel events listen threshold
        const parallelEventsThreshold = document.getElementById('parallel-events-threshold');
        if (parallelEventsThreshold) {
            parallelEventsThreshold.addEventListener('change', e => {
                if (window.parallelEventsManager) {
                    window.parallelEventsManager.currentSettings.threshold = parseInt(e.target.value);
                    window.parallelEventsManager.saveSettings();
                    console.log('[Mobile Phone] Parallel events listen threshold updated:', e.target.value);
                }
            });
        }

        // Parallel events enable switch
        const parallelEventsEnabled = document.getElementById('parallel-events-enabled');
        if (parallelEventsEnabled) {
            parallelEventsEnabled.addEventListener('change', e => {
                if (window.parallelEventsManager) {
                    window.parallelEventsManager.currentSettings.enabled = e.target.checked;
                    window.parallelEventsManager.saveSettings();

                    if (e.target.checked) {
                        console.log('[Mobile Phone] Parallel events listening enabled, start listening immediately');
                        window.parallelEventsManager.startListening();
                    } else {
                        console.log('[Mobile Phone] Parallel events listening disabled, stop listening');
                        window.parallelEventsManager.stopListening();
                    }

                    // Immediately update status display
                    setTimeout(() => {
                        this.updateApiStatus();
                        console.log('[Mobile Phone] Parallel events status updated');
                    }, 100);
                }
            });
        }

        // Parallel events custom prefix
        const parallelEventsPrefixTextarea = document.getElementById('parallel-events-custom-prefix');
        if (parallelEventsPrefixTextarea) {
            parallelEventsPrefixTextarea.addEventListener('blur', e => {
                if (window.parallelEventsManager) {
                    window.parallelEventsManager.currentSettings.customPrefix = e.target.value;
                    window.parallelEventsManager.saveSettings();
                    console.log('[Mobile Phone] Parallel events custom prefix updated');
                }
            });
        }



        // Parallel events enable switch
        const parallelEventsEnabledCheckbox = document.getElementById('parallel-events-enabled');
        if (parallelEventsEnabledCheckbox) {
            parallelEventsEnabledCheckbox.addEventListener('change', e => {
                if (window.parallelEventsManager) {
                    window.parallelEventsManager.currentSettings.enabled = e.target.checked;
                    window.parallelEventsManager.saveSettings();
                    console.log('[Mobile Phone] Parallel events enable status updated:', e.target.checked);

                    // Control listening based on enable status
                    if (e.target.checked) {
                        window.parallelEventsManager.startListening();
                    } else {
                        window.parallelEventsManager.stopListening();
                    }
                }
            });
        }

        // Test generation button
        const testParallelEventsBtn = document.getElementById('test-parallel-events');
        if (testParallelEventsBtn) {
            testParallelEventsBtn.addEventListener('click', async () => {
                if (window.parallelEventsManager) {
                    console.log('[Mobile Phone] Trigger test generate parallel events');
                    MobilePhone.showToast('🔄 Starting to generate parallel events content...', 'processing');

                    try {
                        await window.parallelEventsManager.generateParallelEvent();
                        MobilePhone.showToast('✅ Parallel events generation complete', 'success');
                        // Refresh status display
                        setTimeout(() => this.updateApiStatus(), 500);
                    } catch (error) {
                        console.error('[Mobile Phone] Generate parallel events error:', error);
                        MobilePhone.showToast(`❌ Generate parallel events error: ${error.message}`, 'error');
                    }
                } else {
                    MobilePhone.showToast('❌ Parallel events manager not initialized', 'error');
                }
            });
        }

        // Clear queue button
        const clearParallelEventsQueueBtn = document.getElementById('clear-parallel-events-queue');
        if (clearParallelEventsQueueBtn) {
            clearParallelEventsQueueBtn.addEventListener('click', () => {
                if (window.parallelEventsManager) {
                    console.log('[Mobile Phone] Clear parallel events queue');
                    window.parallelEventsManager.clearQueue();
                    MobilePhone.showToast('✅ Parallel events queue cleared', 'success');
                } else {
                    MobilePhone.showToast('❌ Parallel events manager not initialized', 'error');
                }
            });
        }
    }

    // Bind API config events
    bindApiConfigEvents() {
        // Initialize parallel events manager (if not yet)
        this.initializeParallelEventsManager();

        // Open API config panel
        const openApiConfigBtn = document.getElementById('open-api-config');
        if (openApiConfigBtn) {
            openApiConfigBtn.addEventListener('click', () => {
                if (window.mobileCustomAPIConfig) {
                    window.mobileCustomAPIConfig.showConfigPanel();
                } else {
                    alert('API config module not initialized');
                }
            });
        }

        // Refresh status
        const refreshStatusBtn = document.getElementById('refresh-status');
        if (refreshStatusBtn) {
            refreshStatusBtn.addEventListener('click', () => {
                this.updateApiStatus();
            });
        }

        // Reset all settings
        const resetAllBtn = document.getElementById('reset-all-settings');
        if (resetAllBtn) {
            resetAllBtn.addEventListener('click', () => {
                if (confirm('Confirm reset all forum and weibo settings? This will restore to default configuration.')) {
                    this.resetAllApiSettings();
                }
            });
        }
    }

    // Initialize parallel events manager
    async initializeParallelEventsManager() {
        try {
            // Check if already initialized
            if (window.parallelEventsManager && window.parallelEventsManager.isInitialized) {
                console.log('[Mobile Phone] Parallel events manager already initialized');
                return;
            }

            // Check if necessary global variables exist
            if (!window.ParallelEventsApp || !window.bindParallelEventsAppEvents) {
                console.log('[Mobile Phone] Parallel events app module not loaded, skip initialization');
                return;
            }

            console.log('[Mobile Phone] Start initializing parallel events manager...');

            // Create manager (if doesn't exist)
            if (!window.parallelEventsManager) {
                console.log('[Mobile Phone] Create parallel events manager instance...');
                window.parallelEventsManager = new window.ParallelEventsApp();
            }

            // Initialize manager
            if (!window.parallelEventsManager.isInitialized) {
                console.log('[Mobile Phone] Initialize parallel events manager...');
                await window.parallelEventsManager.initialize();
            }

            // Check if should automatically start listening
            if (window.parallelEventsManager.currentSettings.enabled) {
                console.log('[Mobile Phone] Parallel events listening enabled, automatically start listening');
                window.parallelEventsManager.startListening();
            } else {
                console.log('[Mobile Phone] Parallel events listening not enabled');
            }

            console.log('[Mobile Phone] ✅ Parallel events manager initialization complete');
        } catch (error) {
            console.error('[Mobile Phone] Parallel events manager initialization failed:', error);
        }
    }

    // Update API status display
    updateApiStatus() {
        const forumStatusEl = document.getElementById('forum-status');
        const weiboStatusEl = document.getElementById('weibo-status');
        const parallelEventsStatusEl = document.getElementById('parallel-events-status');
        const apiConfigStatusEl = document.getElementById('api-config-status');

        // Detailed status check and debug info
        console.log('[Mobile Phone] Start status check...');
        console.log('[Mobile Phone] Forum manager:', {
            exists: !!window.forumManager,
            isInitialized: window.forumManager ? window.forumManager.isInitialized : false,
        });
        console.log('[Mobile Phone] Weibo manager:', {
            exists: !!window.weiboManager,
            isInitialized: window.weiboManager ? window.weiboManager.isInitialized : false,
        });
        console.log('[Mobile Phone] Parallel events manager:', {
            exists: !!window.parallelEventsManager,
            isInitialized: window.parallelEventsManager ? window.parallelEventsManager.isInitialized : false,
            isListening: window.parallelEventsManager ? window.parallelEventsManager.isListening : false,
        });

        if (forumStatusEl) {
            if (window.forumManager && window.forumManager.isInitialized) {
                // Check if processing
                if (window.forumManager.isProcessing) {
                    forumStatusEl.textContent = '🔄 Generating Forum...';
                    forumStatusEl.style.color = '#007bff';
                } else {
                    forumStatusEl.textContent = '✅ Ready';
                    forumStatusEl.style.color = '#28a745';
                }
            } else if (window.forumManager) {
                forumStatusEl.textContent = '⚠️ Initializing...';
                forumStatusEl.style.color = '#ffc107';
            } else {
                forumStatusEl.textContent = '❌ Not Loaded';
                forumStatusEl.style.color = '#dc3545';
            }
        }

        if (weiboStatusEl) {
            if (window.weiboManager && window.weiboManager.isInitialized) {
                // Check if processing
                if (window.weiboManager.isProcessing) {
                    weiboStatusEl.textContent = '🔄 Generating Weibo...';
                    weiboStatusEl.style.color = '#007bff';
                } else {
                    weiboStatusEl.textContent = '✅ Ready';
                    weiboStatusEl.style.color = '#28a745';
                }
            } else if (window.weiboManager) {
                weiboStatusEl.textContent = '⚠️ Initializing...';
                weiboStatusEl.style.color = '#ffc107';
            } else {
                weiboStatusEl.textContent = '❌ Not Loaded';
                weiboStatusEl.style.color = '#dc3545';
            }
        }

        if (parallelEventsStatusEl) {
            if (window.parallelEventsManager && window.parallelEventsManager.isInitialized) {
                // Check if processing
                if (window.parallelEventsManager.isProcessing) {
                    parallelEventsStatusEl.textContent = '🔄 Generating Parallel Events...';
                    parallelEventsStatusEl.style.color = '#007bff';
                } else if (window.parallelEventsManager.isListening) {
                    parallelEventsStatusEl.textContent = '👂 Listening';
                    parallelEventsStatusEl.style.color = '#17a2b8';
                } else {
                    parallelEventsStatusEl.textContent = '✅ Ready';
                    parallelEventsStatusEl.style.color = '#28a745';
                }
            } else if (window.parallelEventsManager) {
                parallelEventsStatusEl.textContent = '⚠️ Initializing...';
                parallelEventsStatusEl.style.color = '#ffc107';
            } else {
                parallelEventsStatusEl.textContent = '❌ Not Loaded';
                parallelEventsStatusEl.style.color = '#dc3545';
            }
        }

        if (apiConfigStatusEl) {
            if (
                window.mobileCustomAPIConfig &&
                window.mobileCustomAPIConfig.isAPIAvailable &&
                window.mobileCustomAPIConfig.isAPIAvailable()
            ) {
                apiConfigStatusEl.textContent = '✅ Configured';
                apiConfigStatusEl.style.color = '#28a745';
            } else if (window.mobileCustomAPIConfig) {
                apiConfigStatusEl.textContent = '⚠️ Not Configured';
                apiConfigStatusEl.style.color = '#ffc107';
            } else {
                apiConfigStatusEl.textContent = '❌ Not Loaded';
                apiConfigStatusEl.style.color = '#dc3545';
            }
        }

        console.log('[Mobile Phone] API status check complete');
    }

    // Start API status auto refresh
    startApiStatusAutoRefresh() {
        let refreshCount = 0;
        const maxRefresh = 30; // Max refresh 30 times (1 minute)

        const refreshInterval = setInterval(() => {
            refreshCount++;

            // Check if all managers initialized
            const forumReady = window.forumManager && window.forumManager.isInitialized;
            const weiboReady = window.weiboManager && window.weiboManager.isInitialized;
            const apiReady =
                window.mobileCustomAPIConfig &&
                window.mobileCustomAPIConfig.isAPIAvailable &&
                window.mobileCustomAPIConfig.isAPIAvailable();

            console.log(`[Mobile Phone] Auto status refresh #${refreshCount}:`, {
                forumReady,
                weiboReady,
                apiReady,
            });

            // Update status display
            this.updateApiStatus();

            // If all services ready, or reached max refresh count, stop auto refresh
            if ((forumReady && weiboReady) || refreshCount >= maxRefresh) {
                clearInterval(refreshInterval);
                console.log('[Mobile Phone] Auto status refresh stopped:', {
                    reason: forumReady && weiboReady ? 'All services ready' : 'Reached max refresh count',
                    totalRefreshes: refreshCount,
                });
            }
        }, 2000); // Refresh every 2 seconds

        console.log('[Mobile Phone] API status auto refresh started');
    }

    // Show fade popup prompt
    static showToast(message, type = 'info', duration = 2000) {
        // Remove existing toast
        const existingToast = document.getElementById('mobile-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.id = 'mobile-toast';
        toast.className = `mobile-toast toast-${type}`;

        // Set icon based on type
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            processing: '🔄',
        };

        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icons[type] || icons.info}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .mobile-toast {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: white;
                border-radius: 12px;
                padding: 16px 24px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 10000;
                min-width: 300px;
                max-width: 500px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
                transition: all 0.3s ease;
            }

            .mobile-toast.show {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }

            .mobile-toast.hide {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }

            .toast-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .toast-icon {
                font-size: 18px;
                flex-shrink: 0;
            }

            .toast-message {
                color: #333;
                line-height: 1.4;
                word-break: break-word;
            }

            .toast-success {
                border-left: 4px solid #28a745;
                background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            }

            .toast-error {
                border-left: 4px solid #dc3545;
                background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
            }

            .toast-warning {
                border-left: 4px solid #ffc107;
                background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            }

            .toast-info {
                border-left: 4px solid #17a2b8;
                background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
            }

            .toast-processing {
                border-left: 4px solid #007bff;
                background: linear-gradient(135deg, #d1ecf1 0%, #c3e4f0 100%);
            }

            .toast-processing .toast-icon {
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;

        // Add style to head (if doesn't exist)
        if (!document.getElementById('mobile-toast-styles')) {
            style.id = 'mobile-toast-styles';
            document.head.appendChild(style);
        }

        // Add to body
        document.body.appendChild(toast);

        // Show animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Auto hide
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.add('hide');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 300);
            }, duration);
        }

        console.log(`[Mobile Phone] Toast shown: ${type} - ${message}`);
        return toast;
    }

    // Show create style popup
    showCreateStyleModal() {
        console.log('[Mobile Phone] Show create style popup');

        // Create popup HTML
        const modalHTML = `
      <div class="modal" id="create-style-modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>🎨 Create Custom Style</h3>
            <button class="modal-close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <form id="create-style-form">
              <div class="form-group">
                <label for="style-name-input">Style Name</label>
                <input
                  type="text"
                  id="style-name-input"
                  placeholder="e.g.: Gentle Girl, Domineering CEO, Anime Otaku..."
                  maxlength="20"
                  required
                >
                <div class="input-hint">Suggest using concise and clear names</div>
              </div>

              <div class="form-group">
                <label for="style-description-input">Style Description</label>
                <textarea
                  id="style-description-input"
                  placeholder="Describe the forum style you want, AI will help you improve and generate the corresponding forum style based on your description. For example: Xiaohongshu forum style, R18 forum style, etc. You can also describe the language habits, username characteristics, tone, etc. of the forum."
                  rows="6"
                  maxlength="500"
                  required
                ></textarea>
                <div class="input-hint">
                  <span class="char-count">0/500</span> - The more detailed the description, the more accurate the AI-generated style
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn-secondary" id="cancel-create-style">Cancel</button>
                <button type="submit" class="btn-primary" id="generate-style-btn">
                  <i class="fas fa-magic"></i> Generate Style
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

        // Remove existing popup
        const existingModal = document.getElementById('create-style-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add popup to mobile container
        const phoneContainer = document.querySelector('.mobile-phone-container');
        if (phoneContainer) {
            phoneContainer.insertAdjacentHTML('beforeend', modalHTML);
        } else {
            // If can't find mobile container, fallback to body
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        // Bind events
        this.bindCreateStyleModalEvents();

        // Show popup
        this.showModal('create-style-modal');
    }

    // Export custom styles
    exportCustomStyles() {
        try {
            if (!window.forumStyles) {
                throw new Error('ForumStyles not initialized');
            }

            const customStyles = window.forumStyles.getAllCustomStyles();
            if (customStyles.length === 0) {
                MobilePhone.showToast('No custom styles to export', 'warning');
                return;
            }

            const exportData = window.forumStyles.exportCustomStyles();

            // Create download link
            const blob = new Blob([exportData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `forum-styles-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            MobilePhone.showToast(`✅ Exported ${customStyles.length} custom styles`, 'success');
            console.log('[Mobile Phone] Export custom styles successful');
        } catch (error) {
            console.error('[Mobile Phone] Export custom styles failed:', error);
            MobilePhone.showToast('Export failed: ' + error.message, 'error');
        }
    }

    // Import custom styles
    importCustomStyles(file) {
        try {
            if (!window.forumStyles) {
                throw new Error('ForumStyles not initialized');
            }

            const reader = new FileReader();
            reader.onload = e => {
                try {
                    const jsonData = e.target.result;
                    const results = window.forumStyles.importCustomStyles(jsonData, { overwrite: false });

                    let message = `Import complete: Success ${results.success}`;
                    if (results.skipped > 0) {
                        message += `, Skipped ${results.skipped}`;
                    }
                    if (results.failed > 0) {
                        message += `, Failed ${results.failed}`;
                    }

                    if (results.success > 0) {
                        // Refresh display
                        this.loadAndDisplayCustomStyles();
                        this.updateStyleSelectors();
                        MobilePhone.showToast('✅ ' + message, 'success');
                    } else if (results.skipped > 0) {
                        MobilePhone.showToast('⚠️ ' + message + ' (Same name style already exists)', 'warning');
                    } else {
                        MobilePhone.showToast('❌ ' + message, 'error');
                    }

                    // Show detailed error info
                    if (results.errors.length > 0) {
                        console.warn('[Mobile Phone] Import error details:', results.errors);
                    }
                } catch (error) {
                    console.error('[Mobile Phone] Parse import file failed:', error);
                    MobilePhone.showToast('Import failed: File format error', 'error');
                }
            };

            reader.onerror = () => {
                console.error('[Mobile Phone] Read file failed');
                MobilePhone.showToast('Read file failed', 'error');
            };

            reader.readAsText(file);
        } catch (error) {
            console.error('[Mobile Phone] Import custom styles failed:', error);
            MobilePhone.showToast('Import failed: ' + error.message, 'error');
        }
    }

    // Load and display custom styles
    loadAndDisplayCustomStyles() {
        const container = document.getElementById('custom-styles-container');
        if (!container) return;

        try {
            if (!window.forumStyles) {
                throw new Error('ForumStyles not initialized');
            }

            const customStyles = window.forumStyles.getAllCustomStyles();

            if (customStyles.length === 0) {
                // Show placeholder
                container.innerHTML = `
          <div class="no-styles-placeholder">
            <div class="placeholder-icon">🎭</div>
            <div class="placeholder-text">No custom styles yet</div>
            <div class="placeholder-hint">Click the button above to create your first style</div>
          </div>
        `;
                return;
            }

            // Show custom styles list
            const stylesHTML = customStyles
                .map(style => {
                    const createdDate = new Date(style.createdAt).toLocaleDateString();
                    const updatedDate = new Date(style.updatedAt).toLocaleDateString();

                    return `
          <div class="custom-style-item" data-style-id="${style.id}">
            <div class="style-info">
              <div class="style-name">${this.escapeHtml(style.name)}</div>
              <div class="style-description">${this.escapeHtml(style.description || 'No description')}</div>
              <div class="style-meta">
                Created: ${createdDate} | Updated: ${updatedDate} | ${style.prompt.length} characters
              </div>
            </div>
            <div class="style-actions">
              <button class="style-action-btn edit" onclick="mobilePhone.editCustomStyle('${style.name}')">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button class="style-action-btn copy" onclick="mobilePhone.copyCustomStyle('${style.name}')">
                <i class="fas fa-copy"></i> Copy
              </button>
              <button class="style-action-btn delete" onclick="mobilePhone.deleteCustomStyle('${style.name}')">
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
        `;
                })
                .join('');

            container.innerHTML = stylesHTML;

            console.log(`[Mobile Phone] Showed ${customStyles.length} custom styles`);
        } catch (error) {
            console.error('[Mobile Phone] Load custom styles failed:', error);
            container.innerHTML = `
        <div class="no-styles-placeholder">
          <div class="placeholder-icon">❌</div>
          <div class="placeholder-text">Load styles failed</div>
          <div class="placeholder-hint">${error.message}</div>
        </div>
      `;
        }
    }

    // Bind create style popup events
    bindCreateStyleModalEvents() {
        const modal = document.getElementById('create-style-modal');
        if (!modal) return;

        // Close button
        const closeBtn = modal.querySelector('.modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideModal('create-style-modal');
            });
        }

        // Cancel button
        const cancelBtn = modal.querySelector('#cancel-create-style');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideModal('create-style-modal');
            });
        }

        // Click background to close
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                this.hideModal('create-style-modal');
            }
        });

        // Character count
        const textarea = modal.querySelector('#style-description-input');
        const charCount = modal.querySelector('.char-count');
        if (textarea && charCount) {
            textarea.addEventListener('input', () => {
                const count = textarea.value.length;
                charCount.textContent = `${count}/500`;
                if (count > 450) {
                    charCount.style.color = '#ff4757';
                } else {
                    charCount.style.color = 'var(--text-light)';
                }
            });
        }

        // Form submit
        const form = modal.querySelector('#create-style-form');
        if (form) {
            form.addEventListener('submit', e => {
                e.preventDefault();
                this.handleCreateStyleSubmit();
            });
        }
    }

    // Handle create style form submit
    handleCreateStyleSubmit() {
        const modal = document.getElementById('create-style-modal');
        if (!modal) return;

        const nameInput = modal.querySelector('#style-name-input');
        const descriptionInput = modal.querySelector('#style-description-input');
        const generateBtn = modal.querySelector('#generate-style-btn');

        const name = nameInput?.value.trim();
        const description = descriptionInput?.value.trim();

        if (!name || !description) {
            MobilePhone.showToast('Please fill complete style information', 'warning');
            return;
        }

        // Show loading state
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        }

        // Call AI to generate style
        this.generateCustomStyle(name, description)
            .then(generatedStyle => {
                this.hideModal('create-style-modal');
                this.showStylePreviewModal(name, description, generatedStyle);
            })
            .catch(error => {
                console.error('[Mobile Phone] Generate style failed:', error);
                MobilePhone.showToast('Generate style failed: ' + error.message, 'error');
            })
            .finally(() => {
                // Restore button state
                if (generateBtn) {
                    generateBtn.disabled = false;
                    generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Style';
                }
            });
    }

    // Show popup
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
            // Prevent background scrolling
            document.body.style.overflow = 'hidden';
        }
    }

    // Hide popup
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
            // Restore background scrolling
            document.body.style.overflow = '';

            // Delay remove DOM element to avoid animation interruption
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    // Generate custom style (call AI)
    async generateCustomStyle(name, description) {
        console.log('[Mobile Phone] Generate custom style:', { name, description });

        try {
            // Check API config
            if (!window.mobileCustomAPIConfig) {
                throw new Error('API config not initialized');
            }

            // Build style generation prompt
            const styleGenerationPrompt = this.buildStyleGenerationPrompt(description);

            console.log('[Mobile Phone] Style generation prompt:', styleGenerationPrompt);

            // Build API request messages
            const messages = [
                {
                    role: 'system',
                    content: styleGenerationPrompt,
                },
                {
                    role: 'user',
                    content: `Please create complete forum style definition for "${name}" style. User description: ${description}`,
                },
            ];

            console.log('[Mobile Phone] Send style generation request...');

            // Call API
            const response = await window.mobileCustomAPIConfig.callAPI(messages);

            if (!response || !response.content) {
                throw new Error('API return content empty');
            }

            const generatedStyle = response.content.trim();

            console.log('[Mobile Phone] Style generation successful, length:', generatedStyle.length);

            return generatedStyle;
        } catch (error) {
            console.error('[Mobile Phone] Generate custom style failed:', error);
            throw new Error(`Generation failed: ${error.message}`);
        }
    }

    // Build style generation prompt
    buildStyleGenerationPrompt(userDescription) {
        return `Forum Style Generation Specification:
#General Requirements
You are an AI proficient in online community culture and user persona construction.
Your task is to create a detailed, specific, executable "Forum Style Persona Prompt" based on the user's proposed **[Forum Theme or Community Name]**.
This "Style Persona Prompt" generated by you will be used to guide AI models to simulate the specific community's tone, style, and content, generating highly realistic posts, replies, and user interactions.

#Structure Requirements for Generated "Forum Style Persona Prompt"
Every "Style Persona Prompt" you generate must include the following core parts, strictly follow this structure. You can refer to the example formats of "贴吧老哥", "知乎精英", "小红书种草" provided by the user.

1. Core User Persona (Persona Definition)
Format: Start with "You are a..."

Content: This is the core description of the forum's typical users. You need to define:

Identity & Background: Who are they? (e.g.: Senior players, new mothers, tech geeks, opinion leaders)

Personality & Attitude: What is their speaking style and mindset? (e.g.: Warm and friendly, calm and objective, cynical, full of superiority, love sharing, love arguing)

Expertise & Behavior: What are they good at? (e.g.: Good at in-depth analysis, publishing reviews, emotional complaints, creating controversy, using memes)

2. Specific Generation Task (Task Instruction)
Format: Write in the format of "Please generate [number] [content form] based on the provided [information source]..."

Content: Clearly indicate what task the AI that ultimately uses this persona needs to complete.

Information Source: Usually "provided chat records" or "specified theme".

Number: e.g. 3-5.

Content Form: e.g. Post discussions, Q&A, notes, etc.

Structure: Specify elements contained in each generated content, e.g. each post contains title, body, and 2-3 replies.

3. Style Requirements (Style Requirements)
Format: Use unordered list (-) to detail style rules.

Content: This is the most critical part, need to break down the style sufficiently detailed for AI to imitate. Must include:

Titles: Describe typical title style. (e.g.: Provocative, professional, suspenseful, emotional, containing Emoji, etc.)

Content: Describe post body language, structure, and tone. (e.g.: Clear structure, strict logic, full of emotion,多用黑话/梗, clear paragraphs, etc.)

Replies: Describe comment section interaction style. (e.g.: Mutual arguing, rational discussion, empathetic support, witty remarks)

Usernames: Provide 3-5 username examples符合该社区风格.

Special Elements: Describe the community's unique language habits or formats. (e.g.: Start with "谢邀", end with #topic tags,大量使用特定Emoji,黑话词汇解释, etc.)

4. Final Command (Final Command)
Format: Please directly generate forum content, do not explain.

Content: This is a closing command to ensure final output is pure content, not explanation of content.

#Generation Style Examples:
贴吧老哥: \`You are a veteran Baidu Tieba user, high level, speaking with sarcasm and superiority. You are the "opinion leader" (self-proclaimed) in the bar, good at sharp comments, arguing, and using various internet slang and memes to set trends.

Please generate 3-5 Tieba-style post discussions based on provided chat records, each post contains title, body, and 2-3 replies.

Style Requirements:
- Titles要有挑衅性、争议性,如"不是，就这也能吵起来？"、"我真是服了某些人了"
- Content犀利毒舌,充满优越感,大量使用贴吧黑话、烂梗
- Replies要互相抬杠、阴阳怪气,如"乐"、"急了急了"、"典中典"、"孝"、"就这？"
- Usernames要体现老油条气质,如"专业抬杠二十年"、"键盘侠本侠"

Please directly generate forum content, do not explain.\`,

#Style Generation Format Requirements
Your response needs to be a complete forum style text, do not generate any information outside the style text.
Your generated style text禁止携带编号和标题, please directly generate appropriate content according to the core part instructions.

#Workflow Example
User Input: "Help me create a B站游戏区 forum style."

Your Output: You need to generate a complete "B站游戏区 Style Persona Prompt" according to the above structure,可能包含"UP主"、"三连"、"弹幕文化"、"游戏黑话"等要素.

Final Application: Other AIs or users will use this prompt generated by you to create B站游戏区-style virtual content.

Now, you understand your task. Please get ready, wait for user input **[Forum Theme or Community Name]**.`;
    }

    // Show style preview popup
    showStylePreviewModal(name, description, generatedStyle) {
        console.log('[Mobile Phone] Show style preview popup:', { name, description, generatedStyle });

        // Create preview popup HTML
        const modalHTML = `
      <div class="modal" id="style-preview-modal" style="display: none;">
        <div class="modal-content style-preview-content">
          <div class="modal-header">
            <h3>📝 Edit Style: ${this.escapeHtml(name)}</h3>
            <button class="modal-close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <div class="style-info">
              <div class="style-meta-info">
                <div class="meta-item">
                  <span class="meta-label">Style Name:</span>
                  <span class="meta-value">${this.escapeHtml(name)}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Original Description:</span>
                  <span class="meta-value">${this.escapeHtml(description)}</span>
                </div>
              </div>
            </div>

            <form id="style-preview-form">
              <div class="form-group">
                <label for="style-content-editor">AI Generated Style Content</label>
                <div class="editor-toolbar">
                  <button type="button" class="toolbar-btn" id="format-style-btn" title="Format Content">
                    <i class="fas fa-magic"></i> Format
                  </button>
                  <button type="button" class="toolbar-btn" id="validate-style-btn" title="Validate Format">
                    <i class="fas fa-check-circle"></i> Validate
                  </button>
                </div>
                <textarea
                  id="style-content-editor"
                  class="style-editor"
                  rows="12"
                  placeholder="AI generated style content will display here..."
                >${this.escapeHtml(generatedStyle)}</textarea>
                <div class="editor-hint">
                  <div class="hint-text">
                    <i class="fas fa-info-circle"></i>
                    You can edit AI generated content to ensure style meets your needs
                  </div>
                  <div class="char-count-preview">
                    <span id="preview-char-count">${generatedStyle.length}</span> characters
                  </div>
                </div>
              </div>

              <div class="preview-actions">
                <div class="action-group">
                  <button type="button" class="btn-secondary" id="regenerate-style-btn">
                    <i class="fas fa-redo"></i> Regenerate
                  </button>
                  <button type="button" class="btn-secondary" id="cancel-preview-btn">
                    Cancel
                  </button>
                </div>
                <div class="action-group">
                  <button type="submit" class="btn-primary" id="save-style-btn">
                    <i class="fas fa-save"></i> Save Style
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

        // Remove existing popup
        const existingModal = document.getElementById('style-preview-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add popup to mobile container
        const phoneContainer = document.querySelector('.mobile-phone-container');
        if (phoneContainer) {
            phoneContainer.insertAdjacentHTML('beforeend', modalHTML);
        } else {
            // If can't find mobile container, fallback to body
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        // Bind events
        this.bindStylePreviewModalEvents(name, description);

        // Show popup
        this.showModal('style-preview-modal');
    }

    // HTML escape function
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Bind style preview popup events
    bindStylePreviewModalEvents(styleName, styleDescription) {
        const modal = document.getElementById('style-preview-modal');
        if (!modal) return;

        // Close button
        const closeBtn = modal.querySelector('.modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideModal('style-preview-modal');
            });
        }

        // Cancel button
        const cancelBtn = modal.querySelector('#cancel-preview-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideModal('style-preview-modal');
            });
        }

        // Click background to close
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                this.hideModal('style-preview-modal');
            }
        });

        // Character count
        const editor = modal.querySelector('#style-content-editor');
        const charCount = modal.querySelector('#preview-char-count');
        if (editor && charCount) {
            editor.addEventListener('input', () => {
                charCount.textContent = editor.value.length;
            });
        }

        // Format button
        const formatBtn = modal.querySelector('#format-style-btn');
        if (formatBtn) {
            formatBtn.addEventListener('click', () => {
                this.formatStyleContent();
            });
        }

        // Validate button
        const validateBtn = modal.querySelector('#validate-style-btn');
        if (validateBtn) {
            validateBtn.addEventListener('click', () => {
                this.validateStyleContent();
            });
        }

        // Regenerate button
        const regenerateBtn = modal.querySelector('#regenerate-style-btn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => {
                this.handleRegenerateStyle(styleName, styleDescription);
            });
        }

        // Form submit (save style)
        const form = modal.querySelector('#style-preview-form');
        if (form) {
            form.addEventListener('submit', e => {
                e.preventDefault();
                this.handleSaveCustomStyle(styleName, styleDescription);
            });
        }
    }

    // Format style content
    formatStyleContent() {
        const editor = document.getElementById('style-content-editor');
        if (!editor) return;

        let content = editor.value;

        // Basic formatting: Ensure appropriate blank lines between paragraphs
        content = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n\n');

        editor.value = content;

        // Update character count
        const charCount = document.getElementById('preview-char-count');
        if (charCount) {
            charCount.textContent = content.length;
        }

        MobilePhone.showToast('Content formatted', 'success');
    }

    // Validate style content
    validateStyleContent() {
        const editor = document.getElementById('style-content-editor');
        if (!editor) return;

        const content = editor.value.trim();
        const issues = [];

        // Basic validation
        if (content.length < 50) {
            issues.push('Content too short, suggest at least 50 characters');
        }

        if (!content.includes('你是一位')) {
            issues.push('Suggest starting with "你是一位..." to set role');
        }

        if (!content.includes('请直接生成论坛内容，不要解释')) {
            issues.push('Suggest ending with "请直接生成论坛内容，不要解释。"');
        }

        if (issues.length === 0) {
            MobilePhone.showToast('✅ Style format validation passed', 'success');
        } else {
            const message = 'Format suggestions:\n' + issues.join('\n');
            MobilePhone.showToast(message, 'warning');
        }
    }

    // Handle regenerate style
    handleRegenerateStyle(styleName, styleDescription) {
        const regenerateBtn = document.getElementById('regenerate-style-btn');
        if (!regenerateBtn) return;

        // Show loading state
        regenerateBtn.disabled = true;
        regenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Regenerating...';

        // Call AI to regenerate
        this.generateCustomStyle(styleName, styleDescription)
            .then(newStyle => {
                const editor = document.getElementById('style-content-editor');
                if (editor) {
                    editor.value = newStyle;

                    // Update character count
                    const charCount = document.getElementById('preview-char-count');
                    if (charCount) {
                        charCount.textContent = newStyle.length;
                    }
                }
                MobilePhone.showToast('Style regenerated', 'success');
            })
            .catch(error => {
                console.error('[Mobile Phone] Regenerate style failed:', error);
                MobilePhone.showToast('Regenerate failed: ' + error.message, 'error');
            })
            .finally(() => {
                // Restore button state
                regenerateBtn.disabled = false;
                regenerateBtn.innerHTML = '<i class="fas fa-redo"></i> Regenerate';
            });
    }

    // Handle save custom style
    handleSaveCustomStyle(styleName, styleDescription) {
        const editor = document.getElementById('style-content-editor');
        const saveBtn = document.getElementById('save-style-btn');

        if (!editor) return;

        const content = editor.value.trim();
        if (!content) {
            MobilePhone.showToast('Style content cannot be empty', 'warning');
            return;
        }

        // Show save state
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        }

        try {
            // Create style data
            const styleData = {
                id: 'custom_' + Date.now(),
                name: styleName,
                description: styleDescription,
                prompt: content,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isCustom: true,
            };

            // Save to localStorage (this method will be implemented in subsequent tasks)
            this.saveCustomStyleToStorage(styleData);

            // Hide popup
            this.hideModal('style-preview-modal');

            // Refresh style list
            this.loadAndDisplayCustomStyles();

            // Update style selector (this method will be implemented in subsequent tasks)
            this.updateStyleSelectors();

            MobilePhone.showToast('✅ Style saved successfully', 'success');
        } catch (error) {
            console.error('[Mobile Phone] Save style failed:', error);
            MobilePhone.showToast('Save failed: ' + error.message, 'error');
        } finally {
            // Restore button state
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Style';
            }
        }
    }

    // Save custom style to storage
    saveCustomStyleToStorage(styleData) {
        try {
            if (window.forumStyles) {
                return window.forumStyles.saveCustomStyle(styleData);
            } else {
                throw new Error('ForumStyles not initialized');
            }
        } catch (error) {
            console.error('[Mobile Phone] Save style to storage failed:', error);
            throw error;
        }
    }

    // Update style selectors
    updateStyleSelectors() {
        try {
            // Update forum control panel style selector
            if (window.forumControlApp && window.forumControlApp.refreshStyleSelector) {
                window.forumControlApp.refreshStyleSelector();
            }

            // Update forum control panel style selector (backup method)
            const forumStyleSelect = document.getElementById('forum-style-select');
            if (forumStyleSelect && window.forumStyles) {
                this.updateSingleStyleSelector(forumStyleSelect);
            }

            // Update other possible style selectors
            const allStyleSelects = document.querySelectorAll('select[id*="style"]');
            allStyleSelects.forEach(select => {
                if (select.id.includes('forum') || select.id.includes('style')) {
                    this.updateSingleStyleSelector(select);
                }
            });

            console.log('[Mobile Phone] Style selectors updated');
        } catch (error) {
            console.error('[Mobile Phone] Update style selectors failed:', error);
        }
    }

    // Initialize forum style selector
    initializeForumStyleSelector(selectElement) {
        if (!selectElement) {
            console.warn('[Mobile Phone] Style selector element does not exist');
            return;
        }

        console.log('[Mobile Phone] Start initializing forum style selector...');

        // Wait for ForumStyles initialization to complete
        const initializeSelector = () => {
            if (!window.forumStyles) {
                console.log('[Mobile Phone] Wait for ForumStyles initialization...');
                // If ForumStyles not initialized yet, wait and try again
                setTimeout(initializeSelector, 100);
                return;
            }

            console.log('[Mobile Phone] ForumStyles initialized, start updating selector');

            // Get currently selected style
            let currentStyle = '贴吧老哥'; // Default style
            if (window.forumManager && window.forumManager.currentSettings) {
                currentStyle = window.forumManager.currentSettings.selectedStyle || '贴吧老哥';
                console.log('[Mobile Phone] Get current style from ForumManager:', currentStyle);
            }

            // Get custom styles count
            const customStyles = window.forumStyles.getAllCustomStyles();
            console.log('[Mobile Phone] Discovered custom styles count:', customStyles.length);

            // Update selector content
            this.updateSingleStyleSelector(selectElement);

            // Set currently selected style
            if (selectElement.querySelector(`option[value="${currentStyle}"]`)) {
                selectElement.value = currentStyle;
                console.log('[Mobile Phone] Successfully set current style:', currentStyle);
            } else {
                // If current style doesn't exist, fallback to default style
                console.warn('[Mobile Phone] Current style does not exist, fallback to default style:', currentStyle);
                selectElement.value = '贴吧老哥';
                if (window.forumManager) {
                    window.forumManager.currentSettings.selectedStyle = '贴吧老哥';
                    window.forumManager.saveSettings();
                }
            }

            console.log('[Mobile Phone] Forum style selector initialization complete, current style:', selectElement.value);
            console.log('[Mobile Phone] Selector option count:', selectElement.options.length);
        };

        initializeSelector();
    }

    // Initialize parallel events style selector
    initializeParallelEventsStyleSelector() {
        const selectElement = document.getElementById('parallel-events-style-select');
        if (!selectElement) {
            console.warn('[Mobile Phone] Parallel events style selector element does not exist');
            return;
        }

        console.log('[Mobile Phone] Start initializing parallel events style selector...');

        // Wait for parallel events style manager initialization to complete
        const initializeSelector = () => {
            if (!window.parallelEventsStyles) {
                console.log('[Mobile Phone] Wait for parallel events style manager initialization...');
                setTimeout(initializeSelector, 100);
                return;
            }

            console.log('[Mobile Phone] Parallel events style manager initialized, start updating selector');

            // Get currently selected style,优先从localStorage读取
            let currentStyle = '平行事件'; // Default style

            try {
                const saved = localStorage.getItem('parallelEventsSettings');
                if (saved) {
                    const settings = JSON.parse(saved);
                    if (settings.selectedStyle) {
                        currentStyle = settings.selectedStyle;
                        console.log('[Mobile Phone] Get current style from localStorage:', currentStyle);
                    }
                }
            } catch (error) {
                console.warn('[Mobile Phone] Read localStorage style settings failed:', error);
            }

            // If not in localStorage, get from manager
            if (currentStyle === '平行事件' && window.parallelEventsManager && window.parallelEventsManager.currentSettings) {
                currentStyle = window.parallelEventsManager.currentSettings.selectedStyle || '平行事件';
                console.log('[Mobile Phone] Get current style from parallel events manager:', currentStyle);
            }

            // Check if already has options (basic options already set in HTML)
            if (selectElement.options.length === 0) {
                console.log('[Mobile Phone] Selector empty, rebuild options');

                // Get parallel events available styles
                const availableStyles = window.parallelEventsStyles.getAvailableStyles();
                console.log('[Mobile Phone] Parallel events available styles:', availableStyles);

                // Add preset styles
                const presetGroup = document.createElement('optgroup');
                presetGroup.label = 'Preset Styles';

                availableStyles.forEach(styleName => {
                    const option = document.createElement('option');
                    option.value = styleName;
                    option.textContent = styleName;
                    presetGroup.appendChild(option);
                });

                selectElement.appendChild(presetGroup);
            } else {
                console.log('[Mobile Phone] Selector already has options, skip rebuild');
            }

            // Set currently selected style
            if (selectElement.querySelector(`option[value="${currentStyle}"]`)) {
                selectElement.value = currentStyle;
                console.log('[Mobile Phone] Successfully set parallel events current style:', currentStyle);
            } else {
                // If current style doesn't exist, fallback to default style
                console.warn('[Mobile Phone] Parallel events current style does not exist, fallback to default style:', currentStyle);
                selectElement.value = '平行事件';
                if (window.parallelEventsManager) {
                    window.parallelEventsManager.currentSettings.selectedStyle = '平行事件';
                    window.parallelEventsManager.saveSettings();
                }
            }

            console.log('[Mobile Phone] Parallel events style selector initialization complete, current style:', selectElement.value);
            console.log('[Mobile Phone] Selector option count:', selectElement.options.length);

            // Also initialize other parallel events settings
            this.initializeParallelEventsSettings();
        };

        initializeSelector();
    }

    // Initialize parallel events settings
    initializeParallelEventsSettings() {
        if (!window.parallelEventsManager) {
            return;
        }

        console.log('[Mobile Phone] Start synchronizing parallel events settings...');

        // Read current values from interface elements and synchronize to manager
        const thresholdInput = document.getElementById('parallel-events-threshold');
        const customPrefixInput = document.getElementById('parallel-events-custom-prefix');
        const enabledCheckbox = document.getElementById('parallel-events-enabled');

        let needsSave = false;

        // Synchronize threshold:优先使用界面值
        if (thresholdInput) {
            const htmlValue = parseInt(thresholdInput.value);
            const managerValue = window.parallelEventsManager.currentSettings.threshold;

            if (htmlValue !== managerValue) {
                console.log(`[Mobile Phone] Threshold out of sync - HTML: ${htmlValue}, Manager: ${managerValue}, use HTML value`);
                window.parallelEventsManager.currentSettings.threshold = htmlValue;
                needsSave = true;
            }
        }

        // Synchronize custom prefix
        if (customPrefixInput) {
            const htmlValue = customPrefixInput.value;
            const managerValue = window.parallelEventsManager.currentSettings.customPrefix;

            if (htmlValue !== managerValue && htmlValue) {
                console.log('[Mobile Phone] Custom prefix out of sync, use HTML value');
                window.parallelEventsManager.currentSettings.customPrefix = htmlValue;
                needsSave = true;
            } else if (!htmlValue && managerValue) {
                // If HTML empty but manager has value, update HTML
                customPrefixInput.value = managerValue;
            }
        }

        // Synchronize enable status
        if (enabledCheckbox) {
            const htmlValue = enabledCheckbox.checked;
            const managerValue = window.parallelEventsManager.currentSettings.enabled;

            if (htmlValue !== managerValue) {
                console.log(`[Mobile Phone] Enable status out of sync - HTML: ${htmlValue}, Manager: ${managerValue}, use HTML value`);
                window.parallelEventsManager.currentSettings.enabled = htmlValue;
                needsSave = true;
            }
        }

        // If changes, save settings
        if (needsSave) {
            window.parallelEventsManager.saveSettings();
            console.log('[Mobile Phone] Parallel events settings synchronized and saved:', window.parallelEventsManager.currentSettings);
        } else {
            console.log('[Mobile Phone] Parallel events settings synchronized, no need to save');
        }
    }

    // Synchronize parallel events UI display from localStorage
    syncParallelEventsUIFromStorage() {
        try {
            const saved = localStorage.getItem('parallelEventsSettings');
            if (!saved) {
                console.log('[Mobile Phone] No saved parallel events settings, skip UI synchronization');
                return;
            }

            const settings = JSON.parse(saved);
            console.log('[Mobile Phone] Start synchronizing parallel events UI display:', settings);

            // Synchronize threshold
            const thresholdInput = document.getElementById('parallel-events-threshold');
            if (thresholdInput && settings.threshold !== undefined) {
                thresholdInput.value = settings.threshold;
                console.log('[Mobile Phone] UI threshold synchronized:', settings.threshold);
            } else if (!thresholdInput) {
                console.warn('[Mobile Phone] Threshold input not found,可能DOM还未加载完成');
            }

            // Synchronize custom prefix
            const customPrefixInput = document.getElementById('parallel-events-custom-prefix');
            if (customPrefixInput && settings.customPrefix !== undefined) {
                customPrefixInput.value = settings.customPrefix;
                console.log('[Mobile Phone] UI custom prefix synchronized');
            } else if (!customPrefixInput) {
                console.warn('[Mobile Phone] Custom prefix input not found,可能DOM还未加载完成');
            }

            // Synchronize enable status
            const enabledCheckbox = document.getElementById('parallel-events-enabled');
            if (enabledCheckbox && settings.enabled !== undefined) {
                enabledCheckbox.checked = settings.enabled;
                console.log('[Mobile Phone] UI enable status synchronized:', settings.enabled);
            } else if (!enabledCheckbox) {
                console.warn('[Mobile Phone] Enable status checkbox not found,可能DOM还未加载完成');
            }

            // Synchronize style selection
            const styleSelect = document.getElementById('parallel-events-style-select');
            if (styleSelect && settings.selectedStyle) {
                // First check if option exists
                let optionExists = false;
                for (let i = 0; i < styleSelect.options.length; i++) {
                    if (styleSelect.options[i].value === settings.selectedStyle) {
                        optionExists = true;
                        break;
                    }
                }

                if (optionExists) {
                    styleSelect.value = settings.selectedStyle;
                    console.log('[Mobile Phone] UI style selection synchronized:', settings.selectedStyle);
                } else {
                    console.warn('[Mobile Phone] Style option does not exist:', settings.selectedStyle);
                    console.log('[Mobile Phone] Available options:', Array.from(styleSelect.options).map(opt => opt.value));
                }
            }

            console.log('[Mobile Phone] ✅ Parallel events UI synchronization complete');
        } catch (error) {
            console.error('[Mobile Phone] Parallel events UI synchronization failed:', error);
        }
    }



    // Update single style selector
    updateSingleStyleSelector(selectElement) {
        if (!selectElement || !window.forumStyles) return;

        // Get current actually applied style
        let currentValue = selectElement.value;
        if (window.forumManager && window.forumManager.currentSettings) {
            currentValue = window.forumManager.currentSettings.selectedStyle || currentValue;
        }



        // Add custom styles
        const customStyles = window.forumStyles.getAllCustomStyles();
        if (customStyles.length > 0) {
            const customGroup = document.createElement('optgroup');
            customGroup.label = 'Custom Styles';

            customStyles.forEach(style => {
                const option = document.createElement('option');
                option.value = style.name;
                option.textContent = `${style.name} (Custom)`;
                customGroup.appendChild(option);
            });

            selectElement.appendChild(customGroup);
        }

        // Set currently selected style
        if (currentValue && selectElement.querySelector(`option[value="${currentValue}"]`)) {
            selectElement.value = currentValue;
            console.log('[Mobile Phone] Style selector set to:', currentValue);
        } else {
            // If current style doesn't exist, fallback to default style
            selectElement.value = '贴吧老哥';
            console.log('[Mobile Phone] Style selector fallback to default style: 贴吧老哥');
        }
    }

    // Edit custom style
    editCustomStyle(styleName) {
        try {
            if (!window.forumStyles) {
                throw new Error('ForumStyles not initialized');
            }

            const style = window.forumStyles.getCustomStyle(styleName);
            if (!style) {
                throw new Error('Style does not exist');
            }

            // Show edit popup
            this.showStylePreviewModal(style.name, style.description, style.prompt);
        } catch (error) {
            console.error('[Mobile Phone] Edit custom style failed:', error);
            MobilePhone.showToast('Edit failed: ' + error.message, 'error');
        }
    }

    // Copy custom style
    copyCustomStyle(styleName) {
        try {
            if (!window.forumStyles) {
                throw new Error('ForumStyles not initialized');
            }

            const style = window.forumStyles.getCustomStyle(styleName);
            if (!style) {
                throw new Error('Style does not exist');
            }

            // Create copy
            const copyName = `${style.name} - Copy`;
            const copyData = {
                name: copyName,
                description: style.description,
                prompt: style.prompt,
            };

            // Check if copy name already exists
            let counter = 1;
            let finalName = copyName;
            while (window.forumStyles.getCustomStyle(finalName) || window.forumStyles.styles[finalName]) {
                finalName = `${copyName} (${counter})`;
                counter++;
            }
            copyData.name = finalName;

            // Save copy
            window.forumStyles.saveCustomStyle(copyData);

            // Refresh display
            this.loadAndDisplayCustomStyles();
            this.updateStyleSelectors();

            MobilePhone.showToast(`✅ Copied as "${finalName}"`, 'success');
        } catch (error) {
            console.error('[Mobile Phone] Copy custom style failed:', error);
            MobilePhone.showToast('Copy failed: ' + error.message, 'error');
        }
    }

    // Delete custom style
    deleteCustomStyle(styleName) {
        try {
            if (!window.forumStyles) {
                throw new Error('ForumStyles not initialized');
            }

            const style = window.forumStyles.getCustomStyle(styleName);
            if (!style) {
                throw new Error('Style does not exist');
            }

            // Confirm delete
            const confirmed = confirm(`Confirm delete style "${styleName}"? \n\nThis operation cannot be undone.`);
            if (!confirmed) {
                return;
            }

            // Delete style
            window.forumStyles.deleteCustomStyle(styleName);

            // Refresh display
            this.loadAndDisplayCustomStyles();
            this.updateStyleSelectors();

            MobilePhone.showToast(`✅ Deleted style "${styleName}"`, 'success');
        } catch (error) {
            console.error('[Mobile Phone] Delete custom style failed:', error);
            MobilePhone.showToast('Delete failed: ' + error.message, 'error');
        }
    }

    // Reset all API settings
    resetAllApiSettings() {
        try {
            // Reset forum settings
            if (window.forumManager) {
                window.forumManager.currentSettings = {
                    enabled: true,
                    selectedStyle: '贴吧老哥',
                    autoUpdate: true,
                    threshold: 10,
                    apiConfig: {
                        url: '',
                        apiKey: '',
                        model: '',
                    },
                };
                window.forumManager.saveSettings();
                console.log('[Mobile Phone] Forum settings reset');
            }

            // Reset weibo settings
            if (window.weiboManager) {
                window.weiboManager.currentSettings = {
                    enabled: true,
                    autoUpdate: true,
                    threshold: 10,
                    apiConfig: {
                        url: '',
                        apiKey: '',
                        model: '',
                    },
                };
                window.weiboManager.saveSettings();
                console.log('[Mobile Phone] Weibo settings reset');
            }

            // Reset custom prefixes
            if (window.forumStyles) {
                window.forumStyles.setCustomPrefix('');
            }
            if (window.weiboStyles) {
                window.weiboStyles.setCustomPrefix('');
            }

            // Refresh interface
            this.handleApiApp();

            alert('All settings reset to defaults');
            console.log('[Mobile Phone] All API settings reset');
        } catch (error) {
            console.error('[Mobile Phone] Error resetting settings:', error);
            alert('Error resetting settings, check console');
        }
    }

    // Load style config app
    async loadStyleConfigApp() {
        console.log('[Mobile Phone] Start loading style config manager module...');

        // Check if already loaded
        if (window.getStyleConfigAppContent && window.bindStyleConfigEvents) {
            console.log('[Mobile Phone] Style Config module already exists, skip loading');
            return Promise.resolve();
        }

        // Check if currently loading
        if (window._styleConfigLoading) {
            console.log('[Mobile Phone] Style Config currently loading, wait for completion');
            return window._styleConfigLoading;
        }

        // Mark as loading
        window._styleConfigLoading = new Promise((resolve, reject) => {
            let loadedCount = 0;
            const totalFiles = 2; // style-config-manager.css + style-config-manager.js

            const checkComplete = () => {
                loadedCount++;
                console.log(`[Mobile Phone] Loaded ${loadedCount}/${totalFiles} style config files`);
                if (loadedCount === totalFiles) {
                    console.log('[Mobile Phone] All style config files loaded, wait for module initialization...');

                    // Wait for module to fully initialize
                    setTimeout(() => {
                        if (window.getStyleConfigAppContent && window.bindStyleConfigEvents) {
                            console.log('[Mobile Phone] ✅ Style Config module loaded and initialized');
                            window._styleConfigLoading = null;
                            resolve();
                        } else {
                            console.error('[Mobile Phone] ❌ Style config module loaded but global variables not correctly set');
                            console.log('[Mobile Phone] Check results:', {
                                getStyleConfigAppContent: !!window.getStyleConfigAppContent,
                                bindStyleConfigEvents: !!window.bindStyleConfigEvents,
                            });
                            window._styleConfigLoading = null;
                            reject(new Error('Style config module initialization failed'));
                        }
                    }, 500); // Wait 0.5 seconds for module to complete initialization
                }
            };

            const handleError = name => {
                console.error(`[Mobile Phone] ${name} load failed`);
                window._styleConfigLoading = null;
                reject(new Error(`${name} load failed`));
            };

            // Check and remove existing style config tags
            const removeExistingTags = () => {
                const existingCss = document.querySelector('link[href*="style-config-manager.css"]');
                if (existingCss) {
                    console.log('[Mobile Phone] Remove existing style-config-manager.css');
                    existingCss.remove();
                }

                const existingScript = document.querySelector('script[src*="style-config-manager.js"]');
                if (existingScript) {
                    console.log('[Mobile Phone] Remove existing style-config-manager.js');
                    existingScript.remove();
                }
            };

            removeExistingTags();

            // Load CSS file
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = '/scripts/extensions/third-party/mobile/app/style-config-manager.css';
            cssLink.onload = () => {
                console.log('[Mobile Phone] style-config-manager.css loaded');
                checkComplete();
            };
            cssLink.onerror = () => handleError('style-config-manager.css');
            document.head.appendChild(cssLink);

            // Load JS file
            const jsScript = document.createElement('script');
            jsScript.src = '/scripts/extensions/third-party/mobile/app/style-config-manager.js';
            jsScript.onload = () => {
                console.log('[Mobile Phone] style-config-manager.js loaded');
                checkComplete();
            };
            jsScript.onerror = () => handleError('style-config-manager.js');
            document.head.appendChild(jsScript);
        });

        return window._styleConfigLoading;
    }

    // Load forum app
    async loadForumApp() {
        console.log('[Mobile Phone] Start loading forum app module...');

        // Check if already loaded - only check necessary global variables
        if (
            window.forumUI &&
            window.getForumAppContent &&
            window.bindForumEvents &&
            window.forumControlApp &&
            window.ForumAutoListener &&
            window.forumManager &&
            window.forumStyles
        ) {
            console.log('[Mobile Phone] Forum App module already exists, skip loading');
            return Promise.resolve();
        }

        // Check if currently loading
        if (window._forumAppLoading) {
            console.log('[Mobile Phone] Forum App currently loading, wait for completion');
            return window._forumAppLoading;
        }

        // Mark as loading
        window._forumAppLoading = new Promise((resolve, reject) => {
            let loadedCount = 0;
            const totalFiles = 8; // Font Awesome + forum-ui.css + forum-control-app.css + forum-manager.js + forum-styles.js + forum-ui.js + forum-control-app.js + forum-auto-listener.js

            const checkComplete = () => {
                loadedCount++;
                console.log(`[Mobile Phone] Loaded ${loadedCount}/${totalFiles} forum files`);
                if (loadedCount === totalFiles) {
                    console.log('[Mobile Phone] All forum files loaded, wait for module initialization...');

                    // Wait for forum module to fully initialize, add retry mechanism
                    let retryCount = 0;
                    const maxRetries = 5;
                    const checkInitialization = () => {
                        retryCount++;
                        if (
                            window.forumUI &&
                            window.getForumAppContent &&
                            window.bindForumEvents &&
                            window.forumControlApp &&
                            window.ForumAutoListener &&
                            window.forumManager &&
                            window.forumStyles
                        ) {
                            console.log('[Mobile Phone] ✅ Forum App module loaded and initialized');
                            window._forumAppLoading = null;
                            resolve();
                        } else if (retryCount < maxRetries) {
                            console.log(`[Mobile Phone] Forum module initializing... (${retryCount}/${maxRetries})`);
                            setTimeout(checkInitialization, 500); // Check every 500ms
                        } else {
                            console.error('[Mobile Phone] ❌ Forum module loaded but global variables not correctly set');
                            console.log('[Mobile Phone] Check results:', {
                                forumUI: !!window.forumUI,
                                getForumAppContent: !!window.getForumAppContent,
                                bindForumEvents: !!window.bindForumEvents,
                                forumControlApp: !!window.forumControlApp,
                                ForumAutoListener: !!window.ForumAutoListener,
                                forumManager: !!window.forumManager,
                                forumStyles: !!window.forumStyles,
                            });
                            window._forumAppLoading = null;
                            reject(new Error('Forum module initialization failed'));
                        }
                    };
                    setTimeout(checkInitialization, 500); // First wait 500ms
                }
            };

            const handleError = name => {
                console.error(`[Mobile Phone] ${name} load failed`);
                loadedCount++; // Count even if failed, avoid waiting forever
                // Check if all files attempted to load (success or failure)
                if (loadedCount === totalFiles) {
                    console.error('[Mobile Phone] ❌ Forum module load failed, some files cannot load');
                    window._forumAppLoading = null;
                    reject(new Error(`Forum module load failed: ${name} load failed`));
                }
            };

            // First load Font Awesome (if not loaded yet)
            if (!document.querySelector('link[href*="font-awesome"]')) {
                const fontAwesomeLink = document.createElement('link');
                fontAwesomeLink.rel = 'stylesheet';
                fontAwesomeLink.href = '';
                fontAwesomeLink.onload = () => {
                    console.log('[Mobile Phone] Font Awesome loaded (forum app)');
                    checkComplete();
                };
                fontAwesomeLink.onerror = () => handleError('Font Awesome');
                document.head.appendChild(fontAwesomeLink);
            } else {
                // If already loaded, directly count
                console.log('[Mobile Phone] Font Awesome already exists, skip loading (forum app)');
                checkComplete();
            }

            // Load CSS files
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = './scripts/extensions/third-party/mobile/app/forum-app/forum-ui.css';
            cssLink.onload = () => {
                console.log('[Mobile Phone] forum-ui.css loaded');
                checkComplete();
            };
            cssLink.onerror = () => handleError('forum-ui.css');
            document.head.appendChild(cssLink);

            // Load control app CSS file
            const controlCssLink = document.createElement('link');
            controlCssLink.rel = 'stylesheet';
            controlCssLink.href = './scripts/extensions/third-party/mobile/app/forum-app/forum-control-app.css';
            controlCssLink.onload = () => {
                console.log('[Mobile Phone] forum-control-app.css loaded');
                checkComplete();
            };
            controlCssLink.onerror = () => handleError('forum-control-app.css');
            document.head.appendChild(controlCssLink);

            // Load forum manager JS file
            const managerScript = document.createElement('script');
            managerScript.src = './scripts/extensions/third-party/mobile/app/forum-app/forum-manager.js';
            managerScript.onload = () => {
                console.log('[Mobile Phone] forum-manager.js loaded');
                checkComplete();
            };
            managerScript.onerror = () => handleError('forum-manager.js');
            document.head.appendChild(managerScript);

            // Load forum style manager JS file
            const stylesScript = document.createElement('script');
            stylesScript.src = './scripts/extensions/third-party/mobile/app/forum-app/forum-styles.js';
            stylesScript.onload = () => {
                console.log('[Mobile Phone] forum-styles.js loaded');
                checkComplete();
            };
            stylesScript.onerror = () => handleError('forum-styles.js');
            document.head.appendChild(stylesScript);

            // Load main UI JS file
            const jsScript = document.createElement('script');
            jsScript.src = './scripts/extensions/third-party/mobile/app/forum-app/forum-ui.js';
            jsScript.onload = () => {
                console.log('[Mobile Phone] forum-ui.js loaded');
                checkComplete();
            };
            jsScript.onerror = () => handleError('forum-ui.js');
            document.head.appendChild(jsScript);

            // Load forum control app JS file
            const controlScript = document.createElement('script');
            controlScript.src = './scripts/extensions/third-party/mobile/app/forum-app/forum-control-app.js';
            controlScript.onload = () => {
                console.log('[Mobile Phone] forum-control-app.js loaded');
                checkComplete();
            };
            controlScript.onerror = () => handleError('forum-control-app.js');
            document.head.appendChild(controlScript);

            // Load forum auto listener JS file
            const autoListenerScript = document.createElement('script');
            autoListenerScript.src = './scripts/extensions/third-party/mobile/app/forum-app/forum-auto-listener.js';
            autoListenerScript.onload = () => {
                console.log('[Mobile Phone] forum-auto-listener.js loaded');
                checkComplete();
            };
            autoListenerScript.onerror = () => handleError('forum-auto-listener.js');
            document.head.appendChild(autoListenerScript);
        });

        return window._forumAppLoading;
    }

    // Load weibo app
    async loadWeiboApp() {
        console.log('[Mobile Phone] Start loading weibo app module...');

        // Check if already loaded - only check necessary global variables
        if (
            window.weiboUI &&
            window.getWeiboAppContent &&
            window.bindWeiboEvents &&
            window.weiboControlApp &&
            window.WeiboAutoListener &&
            window.weiboManager &&
            window.weiboStyles
        ) {
            console.log('[Mobile Phone] Weibo App module already exists, skip loading');
            return Promise.resolve();
        }

        // Check if currently loading
        if (window._weiboAppLoading) {
            console.log('[Mobile Phone] Weibo App currently loading, wait for completion');
            return window._weiboAppLoading;
        }

        // Mark as loading
        window._weiboAppLoading = new Promise((resolve, reject) => {
            let loadedCount = 0;
            const totalFiles = 9; // Font Awesome + weibo-ui.css + weibo-control-app.css + weibo-manager.js + weibo-styles.js + weibo-styles-fix.js + weibo-ui.js + weibo-control-app.js + weibo-auto-listener.js

            const checkComplete = () => {
                loadedCount++;
                console.log(`[Mobile Phone] Loaded ${loadedCount}/${totalFiles} weibo files`);
                if (loadedCount === totalFiles) {
                    console.log('[Mobile Phone] All weibo files loaded, wait for module initialization...');

                    // Wait for weibo module to fully initialize, add retry mechanism
                    let retryCount = 0;
                    const maxRetries = 5;
                    const checkInitialization = () => {
                        retryCount++;
                        if (
                            window.weiboUI &&
                            window.getWeiboAppContent &&
                            window.bindWeiboEvents &&
                            window.weiboControlApp &&
                            window.WeiboAutoListener &&
                            window.weiboManager &&
                            window.weiboStyles
                        ) {
                            console.log('[Mobile Phone] ✅ Weibo App module loaded and initialized');
                            window._weiboAppLoading = null;
                            resolve();
                        } else if (retryCount < maxRetries) {
                            console.log(`[Mobile Phone] Weibo module initializing... (${retryCount}/${maxRetries})`);
                            setTimeout(checkInitialization, 500); // Check every 500ms
                        } else {
                            console.error('[Mobile Phone] ❌ Weibo module loaded but global variables not correctly set');
                            console.log('[Mobile Phone] Check results:', {
                                weiboUI: !!window.weiboUI,
                                getWeiboAppContent: !!window.getWeiboAppContent,
                                bindWeiboEvents: !!window.bindWeiboEvents,
                                weiboControlApp: !!window.weiboControlApp,
                                WeiboAutoListener: !!window.WeiboAutoListener,
                                weiboManager: !!window.weiboManager,
                                weiboStyles: !!window.weiboStyles,
                            });
                            window._weiboAppLoading = null;
                            reject(new Error('Weibo module initialization failed'));
                        }
                    };
                    setTimeout(checkInitialization, 500); // First wait 500ms
                }
            };

            const handleError = name => {
                console.error(`[Mobile Phone] ${name} load failed`);
                loadedCount++; // Count even if failed, avoid waiting forever
                // Check if all files attempted to load (success or failure)
                if (loadedCount === totalFiles) {
                    console.error('[Mobile Phone] ❌ Weibo module load failed, some files cannot load');
                    window._weiboAppLoading = null;
                    reject(new Error(`Weibo module load failed: ${name} load failed`));
                }
            };

            // First load Font Awesome (if not loaded yet)
            if (!document.querySelector('link[href*="font-awesome"]')) {
                const fontAwesomeLink = document.createElement('link');
                fontAwesomeLink.rel = 'stylesheet';
                fontAwesomeLink.href = '';
                fontAwesomeLink.onload = () => {
                    console.log('[Mobile Phone] Font Awesome loaded');
                    checkComplete();
                };
                fontAwesomeLink.onerror = () => handleError('Font Awesome');
                document.head.appendChild(fontAwesomeLink);
            } else {
                // If already loaded, directly count
                console.log('[Mobile Phone] Font Awesome already exists, skip loading');
                checkComplete();
            }

            // Load CSS file
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = './scripts/extensions/third-party/mobile/app/weibo-app/weibo-ui.css';
            cssLink.onload = () => {
                console.log('[Mobile Phone] weibo-ui.css loaded');
                checkComplete();
            };
            cssLink.onerror = () => handleError('weibo-ui.css');
            document.head.appendChild(cssLink);

            // Load control app CSS file
            const controlCssLink = document.createElement('link');
            controlCssLink.rel = 'stylesheet';
            controlCssLink.href = './scripts/extensions/third-party/mobile/app/weibo-app/weibo-control-app.css';
            controlCssLink.onload = () => {
                console.log('[Mobile Phone] weibo-control-app.css loaded');
                checkComplete();
            };
            controlCssLink.onerror = () => handleError('weibo-control-app.css');
            document.head.appendChild(controlCssLink);

            // Load weibo manager JS file
            const managerScript = document.createElement('script');
            managerScript.src = './scripts/extensions/third-party/mobile/app/weibo-app/weibo-manager.js';
            managerScript.onload = () => {
                console.log('[Mobile Phone] weibo-manager.js loaded');
                checkComplete();
            };
            managerScript.onerror = () => handleError('weibo-manager.js');
            document.head.appendChild(managerScript);

            // Load weibo style manager JS file
            const stylesScript = document.createElement('script');
            stylesScript.src = './scripts/extensions/third-party/mobile/app/weibo-app/weibo-styles.js';
            stylesScript.onload = () => {
                console.log('[Mobile Phone] weibo-styles.js loaded');
                // Verify if global variables correctly created
                if (typeof window.WeiboStyles !== 'undefined' && typeof window.weiboStyles !== 'undefined') {
                    console.log('[Mobile Phone] ✅ WeiboStyles class and instance correctly created');
                } else {
                    console.warn('[Mobile Phone] ⚠️ weibo-styles.js loaded but global variables not created');
                    console.log('[Mobile Phone] WeiboStyles type:', typeof window.WeiboStyles);
                    console.log('[Mobile Phone] weiboStyles type:', typeof window.weiboStyles);
                }
                checkComplete();
            };
            stylesScript.onerror = error => {
                console.error('[Mobile Phone] weibo-styles.js load failed:', error);
                handleError('weibo-styles.js');
            };
            console.log('[Mobile Phone] Start loading weibo-styles.js:', stylesScript.src);
            document.head.appendChild(stylesScript);

            // Load weibo style fix script (ensure weiboStyles available)
            const fixScript = document.createElement('script');
            fixScript.src = './scripts/extensions/third-party/mobile/weibo-styles-fix.js';
            fixScript.onload = () => {
                console.log('[Mobile Phone] weibo-styles-fix.js loaded');
                checkComplete();
            };
            fixScript.onerror = () => {
                console.warn('[Mobile Phone] weibo-styles-fix.js load failed,但不影响主要功能');
                checkComplete();
            };
            document.head.appendChild(fixScript);

            // Load main UI JS file
            const jsScript = document.createElement('script');
            jsScript.src = './scripts/extensions/third-party/mobile/app/weibo-app/weibo-ui.js';
            jsScript.onload = () => {
                console.log('[Mobile Phone] weibo-ui.js loaded');
                checkComplete();
            };
            jsScript.onerror = () => handleError('weibo-ui.js');
            document.head.appendChild(jsScript);

            // Load weibo control app JS file
            const controlScript = document.createElement('script');
            controlScript.src = './scripts/extensions/third-party/mobile/app/weibo-app/weibo-control-app.js';
            controlScript.onload = () => {
                console.log('[Mobile Phone] weibo-control-app.js loaded');
                checkComplete();
            };
            controlScript.onerror = () => handleError('weibo-control-app.js');
            document.head.appendChild(controlScript);

            // Load weibo auto listener JS file
            const autoListenerScript = document.createElement('script');
            autoListenerScript.src = './scripts/extensions/third-party/mobile/app/weibo-app/weibo-auto-listener.js';
            autoListenerScript.onload = () => {
                console.log('[Mobile Phone] weibo-auto-listener.js loaded');
                checkComplete();
            };
            autoListenerScript.onerror = () => handleError('weibo-auto-listener.js');
            document.head.appendChild(autoListenerScript);
        });

        return window._weiboAppLoading;
    }

    // Load messages app
    async loadMessageApp() {
        console.log('[Mobile Phone] Start loading messages app module...');

        // Check if already loaded - only check necessary global variables
        if (window.MessageApp && window.getMessageAppContent && window.bindMessageAppEvents) {
            console.log('[Mobile Phone] Message App module already exists, skip loading');
            return Promise.resolve();
        }

        // Check if currently loading
        if (window._messageAppLoading) {
            console.log('[Mobile Phone] Message App currently loading, wait for completion');
            return window._messageAppLoading;
        }

        // Mark as loading
        window._messageAppLoading = new Promise((resolve, reject) => {
            let loadedCount = 0;
            const totalFiles = 8; // message-app.css + message-renderer.css + friends-circle.css + friend-renderer.js + message-renderer.js + message-sender.js + friends-circle.js + message-app.js

            const checkComplete = () => {
                loadedCount++;
                console.log(`[Mobile Phone] Loaded ${loadedCount}/${totalFiles} files`);
                if (loadedCount === totalFiles) {
                    console.log('[Mobile Phone] All files loaded, wait for module initialization...');

                    // Wait for all modules to fully initialize
                    setTimeout(() => {
                        if (window.MessageApp && window.getMessageAppContent && window.bindMessageAppEvents) {
                            console.log('[Mobile Phone] ✅ Message App module loaded and initialized');
                            window._messageAppLoading = null;
                            resolve();
                        } else {
                            console.error('[Mobile Phone] ❌ Module loaded but global variables not correctly set');
                            console.log('[Mobile Phone] Check results:', {
                                MessageApp: !!window.MessageApp,
                                getMessageAppContent: !!window.getMessageAppContent,
                                bindMessageAppEvents: !!window.bindMessageAppEvents,
                            });
                            window._messageAppLoading = null;
                            reject(new Error('Module initialization failed'));
                        }
                    }, 1000); // Wait 1 second for all modules to complete initialization
                }
            };

            const handleError = name => {
                console.error(`[Mobile Phone] ${name} load failed`);
                window._messageAppLoading = null;
                reject(new Error(`${name} load failed`));
            };

            // Check and remove existing tags
            const removeExistingTags = () => {
                const existingCss = document.querySelector('link[href*="message-app.css"]');
                if (existingCss) {
                    console.log('[Mobile Phone] Remove existing message-app.css');
                    existingCss.remove();
                }

                const existingRendererCss = document.querySelector('link[href*="message-renderer.css"]');
                if (existingRendererCss) {
                    console.log('[Mobile Phone] Remove existing message-renderer.css');
                    existingRendererCss.remove();
                }

                const existingFriendsCircleCss = document.querySelector('link[href*="friends-circle.css"]');
                if (existingFriendsCircleCss) {
                    console.log('[Mobile Phone] Remove existing friends-circle.css');
                    existingFriendsCircleCss.remove();
                }

                const existingScripts = document.querySelectorAll('script[src*="mobile/app/"]');
                if (existingScripts.length > 0) {
                    console.log(`[Mobile Phone] Remove ${existingScripts.length} existing scripts`);
                    existingScripts.forEach(script => script.remove());
                }
            };

            removeExistingTags();

            // Load CSS files
            const cssFiles = [
                '/scripts/extensions/third-party/mobile/app/message-app.css',
                '/scripts/extensions/third-party/mobile/app/message-renderer.css',
                '/scripts/extensions/third-party/mobile/app/friends-circle.css',
            ];

            cssFiles.forEach(href => {
                const cssLink = document.createElement('link');
                cssLink.rel = 'stylesheet';
                cssLink.href = href;
                cssLink.onload = () => {
                    console.log(`[Mobile Phone] CSS loaded: ${href}`);
                    checkComplete();
                };
                cssLink.onerror = () => handleError(`CSS: ${href}`);
                document.head.appendChild(cssLink);
            });

            // Load JavaScript files - in correct order
            const jsFiles = [
                '/scripts/extensions/third-party/mobile/app/friend-renderer.js',
                '/scripts/extensions/third-party/mobile/app/message-renderer.js',
                '/scripts/extensions/third-party/mobile/app/message-sender.js',
                '/scripts/extensions/third-party/mobile/app/friends-circle.js',
                '/scripts/extensions/third-party/mobile/app/message-app.js',
            ];

            jsFiles.forEach(src => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => {
                    console.log(`[Mobile Phone] JS loaded: ${src}`);
                    checkComplete();
                };
                script.onerror = () => handleError(`JS: ${src}`);
                document.head.appendChild(script);
            });
        });

        return window._messageAppLoading;
    }

    // Load status app
    async loadStatusApp() {
        console.log('[Mobile Phone] Start loading status app module...');

        // Check if already loaded
        if (window.StatusApp && window.getStatusAppContent && window.bindStatusAppEvents) {
            console.log('[Mobile Phone] Status App module already exists, skip loading');
            return Promise.resolve();
        }

        // Check if currently loading
        if (window._statusAppLoading) {
            console.log('[Mobile Phone] Status App currently loading, wait for completion');
            return window._statusAppLoading;
        }

        // Mark as loading
        window._statusAppLoading = new Promise((resolve, reject) => {
            let loadedCount = 0;
            const totalFiles = 2; // status-app.css + status-app.js

            const checkComplete = () => {
                loadedCount++;
                console.log(`[Mobile Phone] Loaded ${loadedCount}/${totalFiles} status app files`);
                if (loadedCount === totalFiles) {
                    console.log('[Mobile Phone] All status app files loaded, wait for module initialization...');

                    setTimeout(() => {
                        if (window.StatusApp && window.getStatusAppContent && window.bindStatusAppEvents) {
                            console.log('[Mobile Phone] ✅ Status App module loaded and initialized');
                            window._statusAppLoading = null;
                            resolve();
                        } else {
                            console.error('[Mobile Phone] ❌ Status app module loaded but global variables not correctly set');
                            window._statusAppLoading = null;
                            reject(new Error('Status app module initialization failed'));
                        }
                    }, 500);
                }
            };

            const handleError = name => {
                console.error(`[Mobile Phone] ${name} load failed`);
                window._statusAppLoading = null;
                reject(new Error(`${name} load failed`));
            };

            // Check and remove existing tags
            const removeExistingTags = () => {
                const existingCss = document.querySelector('link[href*="status-app.css"]');
                if (existingCss) {
                    console.log('[Mobile Phone] Remove existing status-app.css');
                    existingCss.remove();
                }

                const existingScript = document.querySelector('script[src*="status-app.js"]');
                if (existingScript) {
                    console.log('[Mobile Phone] Remove existing status-app.js');
                    existingScript.remove();
                }
            };

            removeExistingTags();

            // Load CSS file
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = '/scripts/extensions/third-party/mobile/app/status-app.css';
            cssLink.onload = () => {
                console.log('[Mobile Phone] status-app.css loaded');
                checkComplete();
            };
            cssLink.onerror = () => handleError('status-app.css');
            document.head.appendChild(cssLink);

            // Load JS file
            const jsScript = document.createElement('script');
            jsScript.src = '/scripts/extensions/third-party/mobile/app/status-app.js';
            jsScript.onload = () => {
                console.log('[Mobile Phone] status-app.js loaded');
                checkComplete();
            };
            jsScript.onerror = () => handleError('status-app.js');
            document.head.appendChild(jsScript);
        });

        return window._statusAppLoading;
    }

    // Load diary app
    async loadDiaryApp() {
        console.log('[Mobile Phone] Start loading diary app module...');

        // Check if already loaded
        if (window.DiaryApp && window.getDiaryAppContent && window.bindDiaryAppEvents) {
            console.log('[Mobile Phone] Diary App module already exists, skip loading');
            return Promise.resolve();
        }

        // Check if currently loading
        if (window._diaryAppLoading) {
            console.log('[Mobile Phone] Diary App currently loading, wait for completion');
            return window._diaryAppLoading;
        }

        // Mark as loading
        window._diaryAppLoading = new Promise((resolve, reject) => {
            let loadedCount = 0;
            const totalFiles = 2; // diary-app.css + diary-app.js

            const checkComplete = () => {
                loadedCount++;
                console.log(`[Mobile Phone] Loaded ${loadedCount}/${totalFiles} diary app files`);
                if (loadedCount === totalFiles) {
                    console.log('[Mobile Phone] All diary app files loaded, wait for module initialization...');

                    setTimeout(() => {
                        if (window.DiaryApp && window.getDiaryAppContent && window.bindDiaryAppEvents) {
                            console.log('[Mobile Phone] ✅ Diary App module loaded and initialized');
                            window._diaryAppLoading = null;
                            resolve();
                        } else {
                            console.error('[Mobile Phone] ❌ Diary app module loaded but global variables not correctly set');
                            window._diaryAppLoading = null;
                            reject(new Error('Diary app module initialization failed'));
                        }
                    }, 500);
                }
            };

            const handleError = name => {
                console.error(`[Mobile Phone] ${name} load failed`);
                window._diaryAppLoading = null;
                reject(new Error(`${name} load failed`));
            };

            // Check and remove existing tags
            const removeExistingTags = () => {
                const existingCss = document.querySelector('link[href*="diary-app.css"]');
                if (existingCss) {
                    console.log('[Mobile Phone] Remove existing diary-app.css');
                    existingCss.remove();
                }

                const existingScript = document.querySelector('script[src*="diary-app.js"]');
                if (existingScript) {
                    console.log('[Mobile Phone] Remove existing diary-app.js');
                    existingScript.remove();
                }
            };

            removeExistingTags();

            // Load CSS file
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = '/scripts/extensions/third-party/mobile/app/diary-app.css';
            cssLink.onload = () => {
                console.log('[Mobile Phone] diary-app.css loaded');
                checkComplete();
            };
            cssLink.onerror = () => handleError('diary-app.css');
            document.head.appendChild(cssLink);

            // Load JS file
            const jsScript = document.createElement('script');
            jsScript.src = '/scripts/extensions/third-party/mobile/app/diary-app.js';
            jsScript.onload = () => {
                console.log('[Mobile Phone] diary-app.js loaded');
                checkComplete();
            };
            jsScript.onerror = () => handleError('diary-app.js');
            document.head.appendChild(jsScript);
        });

        return window._diaryAppLoading;
    }

    // Load shop app
    async loadShopApp() {
        console.log('[Mobile Phone] Start loading shop app module...');

        // Check if already loaded
        if (window.ShopApp && window.getShopAppContent && window.bindShopAppEvents) {
            console.log('[Mobile Phone] Shop App module already exists, skip loading');
            return Promise.resolve();
        }

        // Check if currently loading
        if (window._shopAppLoading) {
            console.log('[Mobile Phone] Shop App currently loading, wait for completion');
            return window._shopAppLoading;
        }

        // Mark as loading
        window._shopAppLoading = new Promise((resolve, reject) => {
            let loadedCount = 0;
            const totalFiles = 2; // shop-app.css + shop-app.js

            const checkComplete = () => {
                loadedCount++;
                console.log(`[Mobile Phone] Loaded ${loadedCount}/${totalFiles} shop app files`);
                if (loadedCount === totalFiles) {
                    console.log('[Mobile Phone] All shop app files loaded, wait for module initialization...');

                    // Wait for module to fully initialize
                    setTimeout(() => {
                        if (window.ShopApp && window.getShopAppContent && window.bindShopAppEvents) {
                            console.log('[Mobile Phone] ✅ Shop App module loaded and initialized');
                            window._shopAppLoading = null;
                            resolve();
                        } else {
                            console.error('[Mobile Phone] ❌ Shop app module loaded but global variables not correctly set');
                            console.log('[Mobile Phone] Check results:', {
                                ShopApp: !!window.ShopApp,
                                getShopAppContent: !!window.getShopAppContent,
                                bindShopAppEvents: !!window.bindShopAppEvents,
                            });
                            window._shopAppLoading = null;
                            reject(new Error('Shop app module initialization failed'));
                        }
                    }, 500); // Wait 0.5 seconds for module to complete initialization
                }
            };

            const handleError = name => {
                console.error(`[Mobile Phone] ${name} load failed`);
                window._shopAppLoading = null;
                reject(new Error(`${name} load failed`));
            };

            // Check and remove existing tags
            const removeExistingTags = () => {
                const existingCss = document.querySelector('link[href*="shop-app.css"]');
                if (existingCss) {
                    console.log('[Mobile Phone] Remove existing shop-app.css');
                    existingCss.remove();
                }

                const existingScript = document.querySelector('script[src*="shop-app.js"]');
                if (existingScript) {
                    console.log('[Mobile Phone] Remove existing shop-app.js');
                    existingScript.remove();
                }
            };

            removeExistingTags();

            // Load CSS file
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = '/scripts/extensions/third-party/mobile/app/shop-app.css';
            cssLink.onload = () => {
                console.log('[Mobile Phone] shop-app.css loaded');
                checkComplete();
            };
            cssLink.onerror = () => handleError('shop-app.css');
            document.head.appendChild(cssLink);

            // Load JS file
            const jsScript = document.createElement('script');
            jsScript.src = '/scripts/extensions/third-party/mobile/app/shop-app.js';
            jsScript.onload = () => {
                console.log('[Mobile Phone] shop-app.js loaded');
                checkComplete();
            };
            jsScript.onerror = () => handleError('shop-app.js');
            document.head.appendChild(jsScript);
        });

        return window._shopAppLoading;
    }

    // Load backpack app
    async loadBackpackApp() {
        console.log('[Mobile Phone] Start loading backpack app module...');

        // Check if already loaded
        if (window.BackpackApp && window.getBackpackAppContent && window.bindBackpackAppEvents) {
            console.log('[Mobile Phone] Backpack App module already exists, skip loading');
            return Promise.resolve();
        }

        // Check if currently loading
        if (window._backpackAppLoading) {
            console.log('[Mobile Phone] Backpack App currently loading, wait for completion');
            return window._backpackAppLoading;
        }

        // Mark as loading
        window._backpackAppLoading = new Promise((resolve, reject) => {
            let loadedCount = 0;
            const totalFiles = 2; // backpack-app.css + backpack-app.js

            const checkComplete = () => {
                loadedCount++;
                console.log(`[Mobile Phone] Loaded ${loadedCount}/${totalFiles} backpack app files`);
                if (loadedCount === totalFiles) {
                    console.log('[Mobile Phone] All backpack app files loaded, wait for module initialization...');

                    // Wait for module to fully initialize
                    setTimeout(() => {
                        if (window.BackpackApp && window.getBackpackAppContent && window.bindBackpackAppEvents) {
                            console.log('[Mobile Phone] ✅ Backpack App module loaded and initialized');
                            window._backpackAppLoading = null;
                            resolve();
                        } else {
                            console.error('[Mobile Phone] ❌ Backpack app module loaded but global variables not correctly set');
                            console.log('[Mobile Phone] Check results:', {
                                BackpackApp: !!window.BackpackApp,
                                getBackpackAppContent: !!window.getBackpackAppContent,
                                bindBackpackAppEvents: !!window.bindBackpackAppEvents,
                            });
                            window._backpackAppLoading = null;
                            reject(new Error('Backpack app module initialization failed'));
                        }
                    }, 500); // Wait 0.5 seconds for module to complete initialization
                }
            };

            const handleError = name => {
                console.error(`[Mobile Phone] ${name} load failed`);
                window._backpackAppLoading = null;
                reject(new Error(`${name} load failed`));
            };

            // Check and remove existing tags
            const removeExistingTags = () => {
                const existingCss = document.querySelector('link[href*="backpack-app.css"]');
                if (existingCss) {
                    console.log('[Mobile Phone] Remove existing backpack-app.css');
                    existingCss.remove();
                }

                const existingScript = document.querySelector('script[src*="backpack-app.js"]');
                if (existingScript) {
                    console.log('[Mobile Phone] Remove existing backpack-app.js');
                    existingScript.remove();
                }
            };

            removeExistingTags();

            // Load CSS file
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = '/scripts/extensions/third-party/mobile/app/backpack-app.css';
            cssLink.onload = () => {
                console.log('[Mobile Phone] backpack-app.css loaded');
                checkComplete();
            };
            cssLink.onerror = () => handleError('backpack-app.css');
            document.head.appendChild(cssLink);

            // Load JS file
            const jsScript = document.createElement('script');
            jsScript.src = '/scripts/extensions/third-party/mobile/app/backpack-app.js';
            jsScript.onload = () => {
                console.log('[Mobile Phone] backpack-app.js loaded');
                checkComplete();
            };
            jsScript.onerror = () => handleError('backpack-app.js');
            document.head.appendChild(jsScript);
        });

        return window._backpackAppLoading;
    }

    // Load task app
    async loadTaskApp() {
        console.log('[Mobile Phone] Start loading task app module...');

        // Check if already loaded
        if (window.TaskApp && window.getTaskAppContent && window.bindTaskAppEvents) {
            console.log('[Mobile Phone] Task App module already exists, skip loading');
            return Promise.resolve();
        }

        // Check if currently loading
        if (window._taskAppLoading) {
            console.log('[Mobile Phone] Task App currently loading, wait for completion');
            return window._taskAppLoading;
        }

        // Mark as loading
        window._taskAppLoading = new Promise((resolve, reject) => {
            let loadedCount = 0;
            const totalFiles = 2; // task-app.css + task-app.js

            const checkComplete = () => {
                loadedCount++;
                console.log(`[Mobile Phone] Loaded ${loadedCount}/${totalFiles} task app files`);
                if (loadedCount === totalFiles) {
                    console.log('[Mobile Phone] All task app files loaded, wait for module initialization...');

                    // Wait for module to fully initialize
                    setTimeout(() => {
                        if (window.TaskApp && window.getTaskAppContent && window.bindTaskAppEvents) {
                            console.log('[Mobile Phone] ✅ Task App module loaded and initialized');
                            window._taskAppLoading = null;
                            resolve();
                        } else {
                            console.error('[Mobile Phone] ❌ Task app module loaded but global variables not correctly set');
                            console.log('[Mobile Phone] Check results:', {
                                TaskApp: !!window.TaskApp,
                                getTaskAppContent: !!window.getTaskAppContent,
                                bindTaskAppEvents: !!window.bindTaskAppEvents,
                            });
                            window._taskAppLoading = null;
                            reject(new Error('Task app module initialization failed'));
                        }
                    }, 500); // Wait 0.5 seconds for module to complete initialization
                }
            };

            const handleError = name => {
                console.error(`[Mobile Phone] ${name} load failed`);
                window._taskAppLoading = null;
                reject(new Error(`${name} load failed`));
            };

            // Check and remove existing tags
            const removeExistingTags = () => {
                const existingCss = document.querySelector('link[href*="task-app.css"]');
                if (existingCss) {
                    console.log('[Mobile Phone] Remove existing task-app.css');
                    existingCss.remove();
                }

                const existingScript = document.querySelector('script[src*="task-app.js"]');
                if (existingScript) {
                    console.log('[Mobile Phone] Remove existing task-app.js');
                    existingScript.remove();
                }
            };

            removeExistingTags();

            // Load CSS file
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = '/scripts/extensions/third-party/mobile/app/task-app.css';
            cssLink.onload = () => {
                console.log('[Mobile Phone] task-app.css loaded');
                checkComplete();
            };
            cssLink.onerror = () => handleError('task-app.css');
            document.head.appendChild(cssLink);

            // Load JS file
            const jsScript = document.createElement('script');
            jsScript.src = '/scripts/extensions/third-party/mobile/app/task-app.js';
            jsScript.onload = () => {
                console.log('[Mobile Phone] task-app.js loaded');
                checkComplete();
            };
            jsScript.onerror = () => handleError('task-app.js');
            document.head.appendChild(jsScript);
        });

        return window._taskAppLoading;
    }

    // Load live app
    async loadLiveApp() {
        console.log('[Mobile Phone] Start loading live app module...');

        // Check if already loaded
        if (window.LiveApp && window.getLiveAppContent && window.bindLiveAppEvents) {
            console.log('[Mobile Phone] Live App module already exists, skip loading');
            return Promise.resolve();
        }

        // Check if currently loading
        if (window._liveAppLoading) {
            console.log('[Mobile Phone] Live App currently loading, wait for completion');
            return window._liveAppLoading;
        }

        // Mark as loading
        window._liveAppLoading = new Promise((resolve, reject) => {
            let loadedCount = 0;
            const totalFiles = 2; // live-app.css + live-app.js

            const checkComplete = () => {
                loadedCount++;
                console.log(`[Mobile Phone] Loaded ${loadedCount}/${totalFiles} live app files`);
                if (loadedCount === totalFiles) {
                    console.log('[Mobile Phone] All live app files loaded, wait for module initialization...');

                    // Wait for module to fully initialize
                    setTimeout(() => {
                        if (window.LiveApp && window.getLiveAppContent && window.bindLiveAppEvents) {
                            console.log('[Mobile Phone] ✅ Live App module loaded and initialized');
                            window._liveAppLoading = null;
                            resolve();
                        } else {
                            console.error('[Mobile Phone] ❌ Live app module loaded but global variables not correctly set');
                            console.log('[Mobile Phone] Check results:', {
                                LiveApp: !!window.LiveApp,
                                getLiveAppContent: !!window.getLiveAppContent,
                                bindLiveAppEvents: !!window.bindLiveAppEvents,
                            });
                            window._liveAppLoading = null;
                            reject(new Error('Live app module initialization failed'));
                        }
                    }, 500); // Wait 0.5 seconds for module to complete initialization
                }
            };

            const handleError = name => {
                console.error(`[Mobile Phone] ${name} load failed`);
                window._liveAppLoading = null;
                reject(new Error(`${name} load failed`));
            };

            // Check and remove existing tags
            const removeExistingTags = () => {
                const existingCss = document.querySelector('link[href*="live-app.css"]');
                if (existingCss) {
                    console.log('[Mobile Phone] Remove existing live-app.css');
                    existingCss.remove();
                }

                const existingScript = document.querySelector('script[src*="live-app.js"]');
                if (existingScript) {
                    console.log('[Mobile Phone] Remove existing live-app.js');
                    existingScript.remove();
                }
            };

            removeExistingTags();

            // Load CSS file
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = '/scripts/extensions/third-party/mobile/app/live-app.css';
            cssLink.onload = () => {
                console.log('[Mobile Phone] live-app.css loaded');
                checkComplete();
            };
            cssLink.onerror = () => handleError('live-app.css');
            document.head.appendChild(cssLink);

            // Load JS file
            const jsScript = document.createElement('script');
            jsScript.src = '/scripts/extensions/third-party/mobile/app/live-app.js';
            jsScript.onload = () => {
                console.log('[Mobile Phone] live-app.js loaded');
                checkComplete();
            };
            jsScript.onerror = () => handleError('live-app.js');
            document.head.appendChild(jsScript);
        });

        return window._liveAppLoading;
    }

    // Load watch live app
    async loadWatchLiveApp() {
        console.log('[Mobile Phone] Start loading watch live app module...');

        // Check if already loaded
        if (window.WatchLiveApp && window.getWatchLiveAppContent && window.bindWatchLiveAppEvents) {
            console.log('[Mobile Phone] Watch Live App module already exists, skip loading');
            return Promise.resolve();
        }

        // Check if currently loading
        if (window._watchLiveAppLoading) {
            console.log('[Mobile Phone] Watch Live App currently loading, wait for completion');
            return window._watchLiveAppLoading;
        }

        // Mark as loading
        window._watchLiveAppLoading = new Promise((resolve, reject) => {
            let loadedCount = 0;
            const totalFiles = 2; // watch-live.css + watch-live.js

            const checkComplete = () => {
                loadedCount++;
                console.log(`[Mobile Phone] Loaded ${loadedCount}/${totalFiles} watch live app files`);
                if (loadedCount === totalFiles) {
                    console.log('[Mobile Phone] All watch live app files loaded, wait for module initialization...');

                    // Wait for module to fully initialize
                    setTimeout(() => {
                        if (window.WatchLiveApp && window.getWatchLiveAppContent && window.bindWatchLiveAppEvents) {
                            console.log('[Mobile Phone] ✅ Watch Live App module loaded and initialized');
                            window._watchLiveAppLoading = null;
                            resolve();
                        } else {
                            console.error('[Mobile Phone] ❌ Watch live app module loaded but global variables not correctly set');
                            console.log('[Mobile Phone] Check results:', {
                                WatchLiveApp: !!window.WatchLiveApp,
                                getWatchLiveAppContent: !!window.getWatchLiveAppContent,
                                bindWatchLiveAppEvents: !!window.bindWatchLiveAppEvents,
                            });
                            window._watchLiveAppLoading = null;
                            reject(new Error('Watch live app module initialization failed'));
                        }
                    }, 500); // Wait 0.5 seconds for module to complete initialization
                }
            };

            const handleError = name => {
                console.error(`[Mobile Phone] ${name} load failed`);
                window._watchLiveAppLoading = null;
                reject(new Error(`${name} load failed`));
            };

            // Check and remove existing tags
            const removeExistingTags = () => {
                const existingCss = document.querySelector('link[href*="watch-live.css"]');
                if (existingCss) {
                    console.log('[Mobile Phone] Remove existing watch-live.css');
                    existingCss.remove();
                }

                const existingScript = document.querySelector('script[src*="watch-live.js"]');
                if (existingScript) {
                    console.log('[Mobile Phone] Remove existing watch-live.js');
                    existingScript.remove();
                }
            };

            removeExistingTags();

            // Load CSS file
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = '/scripts/extensions/third-party/mobile/app/watch-live.css';
            cssLink.onload = () => {
                console.log('[Mobile Phone] watch-live.css loaded');
                checkComplete();
            };
            cssLink.onerror = () => handleError('watch-live.css');
            document.head.appendChild(cssLink);

            // Load JS file
            const jsScript = document.createElement('script');
            jsScript.src = '/scripts/extensions/third-party/mobile/app/watch-live.js';
            jsScript.onload = () => {
                console.log('[Mobile Phone] watch-live.js loaded');
                checkComplete();
            };
            jsScript.onerror = () => handleError('watch-live.js');
            document.head.appendChild(jsScript);
        });

        return window._watchLiveAppLoading;
    }

    // Load parallel events app
    async loadParallelEventsApp() {
        console.log('[Mobile Phone] Start loading parallel events app module...');

        // Check if already loaded - only check necessary global variables
        if (window.ParallelEventsApp && window.getParallelEventsAppContent &&
            window.bindParallelEventsAppEvents && window.parallelEventsStyles) {
            console.log('[Mobile Phone] Parallel Events App module already exists, skip loading');
            return Promise.resolve();
        }

        // Check if currently loading
        if (window._parallelEventsAppLoading) {
            console.log('[Mobile Phone] Parallel Events App currently loading, wait for completion');
            return window._parallelEventsAppLoading;
        }

        // Mark as loading
        window._parallelEventsAppLoading = new Promise((resolve, reject) => {
            let loadedCount = 0;
            const totalFiles = 3; // parallel-events-app.css + parallel-events-styles.js + parallel-events-app.js

            const checkComplete = () => {
                loadedCount++;
                console.log(`[Mobile Phone] Loaded ${loadedCount}/${totalFiles} parallel events app files`);
                if (loadedCount === totalFiles) {
                    console.log('[Mobile Phone] All parallel events app files loaded, wait for module initialization...');

                    // Wait for module to fully initialize
                    const checkInitialization = (attempt = 1, maxAttempts = 10) => {
                        setTimeout(() => {
                            const hasClass = !!window.ParallelEventsApp;
                            const hasContent = !!window.getParallelEventsAppContent;
                            const hasEvents = !!window.bindParallelEventsAppEvents;
                            const hasStyles = !!window.parallelEventsStyles;
                            const hasManager = !!window.parallelEventsManager;

                            console.log(`[Mobile Phone] Initialization check ${attempt}/${maxAttempts}:`, {
                                ParallelEventsApp: hasClass,
                                getParallelEventsAppContent: hasContent,
                                bindParallelEventsAppEvents: hasEvents,
                                parallelEventsStyles: hasStyles,
                                parallelEventsManager: hasManager,
                            });

                            // Only check necessary modules, manager will be created asynchronously later
                            if (hasClass && hasContent && hasEvents && hasStyles) {
                                console.log('[Mobile Phone] ✅ Parallel Events App module loaded and initialized');
                                window._parallelEventsAppLoading = null;
                                resolve();
                            } else if (attempt < maxAttempts) {
                                console.log(`[Mobile Phone] Wait for initialization to complete... (${attempt}/${maxAttempts})`);
                                checkInitialization(attempt + 1, maxAttempts);
                            } else {
                                console.error('[Mobile Phone] ❌ Parallel events app module initialization timeout');
                                window._parallelEventsAppLoading = null;
                                reject(new Error('Parallel events app module initialization timeout'));
                            }
                        }, 500); // Check every 0.5 seconds
                    };

                    checkInitialization();
                }
            };

            const handleError = name => {
                console.error(`[Mobile Phone] ${name} load failed`);
                window._parallelEventsAppLoading = null;
                reject(new Error(`${name} load failed`));
            };

            // Load CSS file
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = './scripts/extensions/third-party/mobile/app/parallel-events-app/parallel-events-app.css';
            cssLink.onload = () => {
                console.log('[Mobile Phone] parallel-events-app.css loaded');
                checkComplete();
            };
            cssLink.onerror = () => handleError('parallel-events-app.css');
            document.head.appendChild(cssLink);

            // Load style manager JS file
            const stylesScript = document.createElement('script');
            stylesScript.src = './scripts/extensions/third-party/mobile/app/parallel-events-app/parallel-events-styles.js';
            stylesScript.onload = () => {
                console.log('[Mobile Phone] parallel-events-styles.js loaded');
                console.log('[Mobile Phone] parallelEventsStyles status:', typeof window.parallelEventsStyles);
                checkComplete();
            };
            stylesScript.onerror = () => handleError('parallel-events-styles.js');
            document.head.appendChild(stylesScript);

            // Load main JS file
            const jsScript = document.createElement('script');
            jsScript.src = './scripts/extensions/third-party/mobile/app/parallel-events-app/parallel-events-app.js';
            jsScript.onload = () => {
                console.log('[Mobile Phone] parallel-events-app.js loaded');
                console.log('[Mobile Phone] Global variable status:', {
                    ParallelEventsApp: typeof window.ParallelEventsApp,
                    getParallelEventsAppContent: typeof window.getParallelEventsAppContent,
                    bindParallelEventsAppEvents: typeof window.bindParallelEventsAppEvents,
                    debugParallelEventsApp: typeof window.debugParallelEventsApp
                });
                checkComplete();
            };
            jsScript.onerror = () => handleError('parallel-events-app.js');
            document.head.appendChild(jsScript);
        });

        return window._parallelEventsAppLoading;
    }

    // Simplified parallel events app loading method
    async simpleLoadParallelEventsApp() {
        console.log('[Mobile Phone] Use simplified method to load parallel events app...');

        return new Promise((resolve, reject) => {
            let loadedCount = 0;
            const totalFiles = 3;

            const checkComplete = () => {
                loadedCount++;
                console.log(`[Mobile Phone] Simplified load: ${loadedCount}/${totalFiles} complete`);
                if (loadedCount === totalFiles) {
                    // Wait a bit for module initialization
                    setTimeout(() => {
                        if (window.ParallelEventsApp && window.getParallelEventsAppContent &&
                            window.bindParallelEventsAppEvents && window.parallelEventsStyles) {
                            console.log('[Mobile Phone] ✅ Simplified load successful');
                            resolve();
                        } else {
                            console.error('[Mobile Phone] ❌ Simplified load failed, global variables not set');
                            reject(new Error('Simplified load failed'));
                        }
                    }, 1000);
                }
            };

            // Load CSS
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = './scripts/extensions/third-party/mobile/app/parallel-events-app/parallel-events-app.css';
            css.onload = checkComplete;
            css.onerror = () => reject(new Error('CSS load failed'));
            document.head.appendChild(css);

            // Load style JS
            const stylesJs = document.createElement('script');
            stylesJs.src = './scripts/extensions/third-party/mobile/app/parallel-events-app/parallel-events-styles.js';
            stylesJs.onload = checkComplete;
            stylesJs.onerror = () => reject(new Error('Style JS load failed'));
            document.head.appendChild(stylesJs);

            // Load main JS
            const mainJs = document.createElement('script');
            mainJs.src = './scripts/extensions/third-party/mobile/app/parallel-events-app/parallel-events-app.js';
            mainJs.onload = checkComplete;
            mainJs.onerror = () => reject(new Error('Main JS load failed'));
            document.head.appendChild(mainJs);
        });
    }

    // Load profile management app
    async loadProfileApp() {
        console.log('[Mobile Phone] Start loading profile management app module...');

        // Check if already loaded
        if (window.ProfileApp && window.profileApp) {
            console.log('[Mobile Phone] Profile App module already exists, skip loading');
            return Promise.resolve();
        }

        // Check if currently loading
        if (window._profileAppLoading) {
            console.log('[Mobile Phone] Profile App currently loading, wait for completion');
            return window._profileAppLoading;
        }

        // Mark as loading
        window._profileAppLoading = new Promise((resolve, reject) => {
            let loadedCount = 0;
            const totalFiles = 2; // profile-app.css + profile-app.js

            const checkComplete = () => {
                loadedCount++;
                console.log(`[Mobile Phone] Loaded ${loadedCount}/${totalFiles} profile app files`);
                if (loadedCount === totalFiles) {
                    console.log('[Mobile Phone] All profile app files loaded, wait for module initialization...');

                    // Wait for module to fully initialize
                    const checkInitialization = (attempt = 1, maxAttempts = 10) => {
                        setTimeout(() => {
                            const hasClass = !!window.ProfileApp;
                            const hasInstance = !!window.profileApp;

                            console.log(`[Mobile Phone] Initialization check ${attempt}/${maxAttempts}:`, {
                                ProfileApp: hasClass,
                                profileApp: hasInstance,
                            });

                            if (hasClass && hasInstance) {
                                console.log('[Mobile Phone] ✅ Profile App module loaded and initialized');
                                window._profileAppLoading = null;
                                resolve();
                            } else if (attempt < maxAttempts) {
                                console.log(`[Mobile Phone] Wait for initialization to complete... (${attempt}/${maxAttempts})`);
                                checkInitialization(attempt + 1, maxAttempts);
                            } else {
                                console.error('[Mobile Phone] ❌ Profile app module initialization timeout');
                                window._profileAppLoading = null;
                                reject(new Error('Profile app module initialization timeout'));
                            }
                        }, 500); // Check every 0.5 seconds
                    };

                    checkInitialization();
                }
            };

            const handleError = name => {
                console.error(`[Mobile Phone] ${name} load failed`);
                window._profileAppLoading = null;
                reject(new Error(`${name} load failed`));
            };

            // Load CSS file
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = './scripts/extensions/third-party/mobile/app/profile-app.css';
            cssLink.onload = () => {
                console.log('[Mobile Phone] profile-app.css loaded');
                checkComplete();
            };
            cssLink.onerror = () => handleError('profile-app.css');
            document.head.appendChild(cssLink);

            // Load JS file
            const jsScript = document.createElement('script');
            jsScript.src = './scripts/extensions/third-party/mobile/app/profile-app.js';
            jsScript.onload = () => {
                console.log('[Mobile Phone] profile-app.js loaded');
                console.log('[Mobile Phone] Global variable status:', {
                    ProfileApp: typeof window.ProfileApp,
                    profileApp: typeof window.profileApp,
                });
                checkComplete();
            };
            jsScript.onerror = () => handleError('profile-app.js');
            document.head.appendChild(jsScript);
        });

        return window._profileAppLoading;
    }

    // Return to main interface
    goHome() {
        // Debounce check: If currently returning to main interface, directly return
        if (this._goingHome) {
            console.log('[Mobile Phone] Debounce: Returning to main interface, skip duplicate operation');
            return;
        }

        // If already at main interface, directly return
        if (!this.currentApp && !this.currentAppState && this.appStack.length === 0) {
            console.log('[Mobile Phone] Already at main interface, skip duplicate operation');
            return;
        }

        // Set debounce flag
        this._goingHome = true;

        try {
            console.log('[Mobile Phone] Return to main interface');

            // Clear user navigation intent
            this._userNavigationIntent = null;

            this.currentApp = null;
            this.currentAppState = null;
            this.appStack = []; // Clear app stack
            document.getElementById('home-screen').style.display = 'block';
            document.getElementById('app-screen').style.display = 'none';

            // Stop state synchronization, avoid unnecessary polling
            this.stopStateSyncLoop();
        } finally {
            // Clear debounce flag
            setTimeout(() => {
                this._goingHome = false;
            }, 300);
        }
    }

    // Start clock
    startClock() {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            });
            const dateString = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

            // Update status bar time
            const mobileTime = document.getElementById('mobile-time');
            if (mobileTime) {
                mobileTime.textContent = timeString;
            }

            // Update main interface time
            const homeTime = document.getElementById('home-time');
            const homeDate = document.getElementById('home-date');
            if (homeTime) {
                homeTime.textContent = timeString;
            }
            if (homeDate) {
                homeDate.textContent = dateString;
            }
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    // Get app main interface view identifier
    getAppRootView(appName) {
        switch (appName) {
            case 'messages':
                return 'messageList';
            default:
                return 'main';
        }
    }

    // Return to specified app main interface (general)
    returnToAppMain(appName) {
        // Debounce check: If currently returning to same app main interface, directly return
        if (this._returningToApp === appName) {
            console.log('[Mobile Phone] Debounce: Returning to same app main interface, skip duplicate operation:', appName);
            return;
        }

        // Check if already at target app main interface
        if (this.currentApp === appName &&
            this.currentAppState &&
            this.currentAppState.app === appName &&
            this.isAppRootPage(this.currentAppState)) {
            console.log('[Mobile Phone] Already at target app main interface, skip duplicate operation:', appName);
            return;
        }

        console.log('=== [Mobile Phone] returnToAppMain start ===');
        console.log('[Mobile Phone] Target app:', appName);
        console.log('[Mobile Phone] State before call:');
        console.log('  - currentApp:', this.currentApp);
        console.log('  - currentAppState:', JSON.stringify(this.currentAppState, null, 2));

        // Set debounce flag
        this._returningToApp = appName;

        try {
            // Prioritize using existing dedicated methods to ensure internal state completely reset
            if (appName === 'forum') {
                console.log('[Mobile Phone] Use dedicated method returnToForumMainList');
                this.returnToForumMainList();
                return;
            }
            if (appName === 'messages') {
                console.log('[Mobile Phone] Use dedicated method returnToMessageList');
                this.returnToMessageList();
                return;
            }

            const app = this.apps[appName];
            if (!app) {
                console.warn('[Mobile Phone] App not found, return to main interface:', appName);
                this.goHome();
                return;
            }

            const rootView = this.getAppRootView(appName);
            const state = {
                app: appName,
                title: app.name,
                view: rootView,
            };

            console.log('[Mobile Phone] Create new state:', JSON.stringify(state, null, 2));

            // Reset app stack to this app's main interface
            this.appStack = [state];
            this.currentAppState = state;
            this.currentApp = appName; // Ensure current app set correctly
            this.updateAppHeader(state);

            console.log('[Mobile Phone] State after update:');
            console.log('  - currentApp:', this.currentApp);
            console.log('  - currentAppState:', JSON.stringify(this.currentAppState, null, 2));

            // Render main interface
            if (app.isCustomApp && app.customHandler) {
                console.log('[Mobile Phone] Call custom handler');
                app.customHandler();
            } else if (app.content) {
                console.log('[Mobile Phone] Use static content');
                const contentContainer = document.getElementById('app-content');
                if (contentContainer) contentContainer.innerHTML = app.content;
            }

            // Ensure show app interface
            const homeEl = document.getElementById('home-screen');
            const appEl = document.getElementById('app-screen');
            if (homeEl && appEl) {
                homeEl.style.display = 'none';
                appEl.style.display = 'block';
            }

            console.log(`[Mobile Phone] Returned to ${appName} main interface`);
            console.log('=== [Mobile Phone] returnToAppMain end ===');
        } catch (error) {
            console.error('[Mobile Phone] Return to app main interface failed:', error);
            this.goHome();
        } finally {
            // Clear debounce flag
            setTimeout(() => {
                this._returningToApp = null;
            }, 500);
        }
    }

    // Determine if at root page based on app module actual running state (prioritize module state,其次回退到state判断)
    isCurrentlyAtAppRoot(appName, state) {
        try {
            if (appName === 'messages') {
                const view = window.messageApp?.currentView;
                if (view) {
                    return view === 'list' || view === 'messageList';
                }
                return this.isAppRootPage(state);
            }
            if (appName === 'forum') {
                // DOM优先: If thread detail structure exists, then not root
                const detailEl = document.querySelector('#forum-content .thread-detail');
                if (detailEl) return false;

                // 其次使用模块状态
                const currentThreadId = window.forumUI?.currentThreadId;
                const view = window.forumUI?.currentView;
                if (typeof currentThreadId !== 'undefined' || typeof view !== 'undefined') {
                    if (currentThreadId) return false;
                    return !view || view === 'main' || view === 'list';
                }

                // 最后回退到state判断
                return this.isAppRootPage(state);
            }
            // 其他应用暂以本地state为准
            return this.isAppRootPage(state);
        } catch (e) {
            console.warn('[Mobile Phone] isCurrentlyAtAppRoot detection exception, fallback to state judgment:', e);
            return this.isAppRootPage(state);
        }
    }

    // Start app state synchronization polling (synchronize each module's actual view to currentAppState)
    startStateSyncLoop() {
        if (this._stateSyncTimer) return; // Already running

        let lastSignature = '';
        let syncCount = 0;
        const maxSyncCount = 10; // Max sync 10 times then reduce frequency

        const syncOnce = () => {
            try {
                if (!this.currentAppState || !this.isVisible) return;

                // If app switching operation in progress, skip sync to avoid conflict
                if (this._openingApp || this._goingHome) {
                    return;
                }

                const app = this.currentAppState.app;
                let nextView = this.currentAppState.view || 'main';
                let extra = {};

                if (app === 'messages' && window.messageApp) {
                    const view = window.messageApp.currentView;
                    if (view === 'messageDetail') {
                        nextView = 'messageDetail';
                        extra.friendId = window.messageApp.currentFriendId || null;
                        extra.friendName = window.messageApp.currentFriendName || null;
                    } else if (view === 'addFriend') {
                        nextView = 'addFriend';
                    } else if (view === 'list' || view === 'messageList') {
                        nextView = 'messageList';
                    }
                } else if (app === 'forum' && window.forumUI) {
                    const threadId = window.forumUI.currentThreadId;
                    const view = window.forumUI.currentView;
                    if (threadId) {
                        nextView = 'threadDetail';
                        extra.threadId = threadId;
                    } else if (!view || view === 'main' || view === 'list') {
                        nextView = 'main';
                    }
                }

                const signature = `${app}|${nextView}|${extra.friendId || ''}|${extra.threadId || ''}`;
                if (signature !== lastSignature) {
                    lastSignature = signature;

                    // Create new state object
                    const newState = {
                        ...this.currentAppState,
                        view: nextView,
                        ...extra,
                    };

                    // Only update if state truly changed
                    if (!this.isSameAppState(this.currentAppState, newState)) {
                        this.currentAppState = newState;
                        this.updateAppHeader(this.currentAppState);
                        syncCount++;
                        console.log('[Mobile Phone] Sync module view to state:', this.currentAppState);
                    }
                }
            } catch (e) {
                console.warn('[Mobile Phone] Sync module view failed:', e);
            }
        };

        // Execute immediately once, then enter polling
        syncOnce();

        // Dynamically adjust polling frequency: First 10 syncs use 500ms interval, then use 1000ms interval
        const getInterval = () => syncCount < maxSyncCount ? 500 : 1000;

        this._stateSyncTimer = setInterval(() => {
            syncOnce();
            // If sync count reaches threshold, reset timer to reduce frequency
            if (syncCount === maxSyncCount) {
                clearInterval(this._stateSyncTimer);
                this._stateSyncTimer = setInterval(syncOnce, getInterval());
                console.log('[Mobile Phone] State sync frequency reduced to 1000ms');
            }
        }, getInterval());

        console.log('[Mobile Phone] State sync polling started, initial interval:', getInterval(), 'ms');
    }

    stopStateSyncLoop() {
        if (this._stateSyncTimer) {
            clearInterval(this._stateSyncTimer);
            this._stateSyncTimer = null;
            console.log('[Mobile Phone] State sync polling stopped');
        }
    }

    // Get current text color settings
    getCurrentTextColor() {
        // Get from global CSS config Data Bank
        if (window.styleConfigManager && window.styleConfigManager.getConfig) {
            const config = window.styleConfigManager.getConfig();
            return config.messageTextColor || 'black';
        }

        // Get from localStorage (backup solution)
        return localStorage.getItem('messageTextColor') || 'black';
    }

    // Toggle text color
    toggleTextColor() {
        // Directly get current state from DOM, more reliable
        const body = document.body;
        const isCurrentlyWhite = body.classList.contains('text-color-white');
        const newColor = isCurrentlyWhite ? 'black' : 'white';

        console.log(`[Mobile Phone] Toggle text color: ${isCurrentlyWhite ? 'white' : 'black'} -> ${newColor}`);

        // Save to global CSS config Data Bank
        if (window.styleConfigManager && window.styleConfigManager.updateConfig) {
            window.styleConfigManager.updateConfig({
                messageTextColor: newColor,
            });
        } else {
            // Backup solution: Save to localStorage
            localStorage.setItem('messageTextColor', newColor);
        }

        // Apply color to page
        this.applyTextColor(newColor);

        // Update button text
        this.updateTextColorButton(newColor);

        // Show prompt
        MobilePhone.showToast(`Text color switched to ${newColor === 'white' ? 'white' : 'black'}`);
    }

    // Apply text color to page
    applyTextColor(color) {
        const root = document.documentElement;
        const body = document.body;

        // Remove previous color classes
        body.classList.remove('text-color-white', 'text-color-black');

        // Add new color class
        body.classList.add(`text-color-${color}`);

        // Set CSS variables
        root.style.setProperty('--message-text-color', color === 'white' ? '#fff' : '#000');

        console.log(`[Mobile Phone] Applied text color: ${color}`);
    }

    // Update text color button display
    updateTextColorButton(color) {
        const button = document.querySelector('.text-color-toggle');
        if (button) {
            // Show the color to switch to (opposite of current color)
            button.innerHTML = color === 'white' ? 'Black' : 'White';
            button.title = `Current: ${color === 'white' ? 'white' : 'black'} text, click to switch to ${color === 'white' ? 'black' : 'white'
                }`;
        }
    }

    // Initialize text color settings
    initTextColor() {
        const savedColor = this.getCurrentTextColor();
        this.applyTextColor(savedColor);
        console.log(`[Mobile Phone] Initialize text color: ${savedColor}`);
    }

    // Show image config popup
    showImageConfigModal() {
        console.log('[Mobile Phone] Show image config popup');

        // Ensure ImageConfigModal loaded
        if (!window.ImageConfigModal) {
            console.error('[Mobile Phone] ImageConfigModal not loaded');
            MobilePhone.showToast('Image config functionality not ready', 'error');
            return;
        }

        // Show popup
        window.ImageConfigModal.show();
    }

    // Show friend image config popup
    showFriendImageConfigModal(friendId, friendName) {
        console.log('[Mobile Phone] Show friend image config popup:', friendId, friendName);

        // Ensure FriendImageConfigModal loaded
        if (!window.FriendImageConfigModal) {
            console.error('[Mobile Phone] FriendImageConfigModal not loaded');
            console.log('[Mobile Phone] Current global object status:', {
                ImageConfigModal: typeof window.ImageConfigModal,
                FriendImageConfigModal: typeof window.FriendImageConfigModal,
                styleConfigManager: typeof window.styleConfigManager,
            });

            // Try delayed retry
            setTimeout(() => {
                if (window.FriendImageConfigModal) {
                    console.log('[Mobile Phone] Delayed retry successful, show friend popup');
                    window.FriendImageConfigModal.show(friendId, friendName);
                } else {
                    MobilePhone.showToast('Friend image config functionality not ready, please refresh page and retry', 'error');
                }
            }, 500);
            return;
        }

        // Show popup
        window.FriendImageConfigModal.show(friendId, friendName);
    }

    // Determine if group chat
    isGroupChat(friendId) {
        // Group chat IDs usually start with specific prefix or have specific format
        // Can adjust based on actual group chat ID format
        if (!friendId) return false;

        // Example judgment logic: Group chat ID may contain specific characters or format
        // Can adjust based on actual situation
        return friendId.includes('group') || friendId.includes('群') || friendId.length > 10;
    }
}

// Initialize mobile interface
function initMobilePhone() {
    if (document.readyState === 'loading') {
        // If document still loading, wait for DOMContentLoaded
        document.addEventListener('DOMContentLoaded', () => {
            window.mobilePhone = new MobilePhone();
            console.log('[Mobile Phone] Mobile interface initialization complete');
        });
    } else {
        // If document already loaded, directly initialize
        window.mobilePhone = new MobilePhone();
        console.log('[Mobile Phone] Mobile interface initialization complete');
    }
}

// Immediately execute initialization
initMobilePhone();

// Create global showToast function for other modules to use
window.showMobileToast = MobilePhone.showToast.bind(MobilePhone);
