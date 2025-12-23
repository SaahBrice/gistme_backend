// Feed Page - Alpine.js Component with API Integration, Dynamic Categories, and Infinite Scroll
function feedApp() {
    return {
        // State
        activeTab: 'ACTUALITY', // ACTUALITY, OPPORTUNITY, FOR_YOU
        activeCategory: 'all',  // 'all' or category slug
        navExpanded: false,
        showSubChips: false,
        navTimeout: null,
        hasNewNotifications: true,
        unreadCount: 0,  // Real notification count from API
        notifications: [],  // Notifications list from API
        showProfile: false,
        showNotifications: false,
        loadingNotifications: false,

        // Settings modals state
        showSettings: false,
        showTerms: false,
        showDeletePopup: false,
        showBookmarks: false,
        showSponsors: false,
        bookmarksList: [],
        gistList: [],
        pushEnabled: true,

        // Sponsor form fields
        sponsorType: 'SPONSOR',
        sponsorName: '',
        sponsorEmail: '',
        sponsorPhone: '',
        sponsorOrg: '',
        sponsorWebsite: '',
        sponsorDescription: '',
        sponsorSubmitting: false,
        sponsorSubmitted: false,
        sponsorError: '',

        // Settings form fields
        settingsName: '',
        settingsPhone: '',
        settingsRegion: '',
        settingsNotifTime: '08:00',
        settingsLanguage: 'en',
        settingsEducation: '',
        settingsBackground: '',
        settingsInterests: [],
        settingsCustomDesires: '',
        receiveQuotes: true,
        quoteCategory: 'GENERAL',
        interestOptions: [],
        savingSettings: false,
        showSaveToast: false,

        // Feed state
        isLoading: false,
        isLoadingMore: false,
        playingId: null,
        activeCardIndex: 0,
        scrollContainer: null,
        cardHeight: 0,
        baseHue: Math.random() * 360,
        currentAudio: null,

        // API data
        articles: [],
        categories: [],  // All categories from API
        currentPage: 1,
        hasNextPage: true,
        pageSize: 10,

        // Language (from URL)
        get lang() {
            const match = window.location.pathname.match(/^\/(en|fr)\//);
            return match ? match[1] : 'en';
        },

        // Computed: Categories for current tab
        get currentCategories() {
            const tabCats = this.categories.filter(c => c.main_category === this.activeTab);
            // Add "All" option at the beginning
            const allOption = {
                slug: 'all',
                name_en: 'All',
                name_fr: 'Tout',
                emoji: this.activeTab === 'ACTUALITY' ? '📰' : (this.activeTab === 'OPPORTUNITY' ? '🎯' : '✨')
            };
            return [allOption, ...tabCats];
        },

        // Computed: Category name in current language
        getCategoryName(cat) {
            return this.lang === 'fr' ? cat.name_fr : cat.name_en;
        },

        // Check if current tab has sub-categories (FOR_YOU does not)
        get hasSubCategories() {
            return this.activeTab !== 'FOR_YOU';
        },

        // Get article title in current language
        getArticleTitle(article) {
            return this.lang === 'fr'
                ? (article.headline_fr || article.headline_en || article.headline)
                : (article.headline_en || article.headline_fr || article.headline);
        },

        // Get article excerpt in current language
        getArticleExcerpt(article) {
            return this.lang === 'fr'
                ? (article.french_summary || article.english_summary)
                : (article.english_summary || article.french_summary);
        },

        // Get article image
        getArticleImage(article) {
            if (article.thumbnails && article.thumbnails.length > 0) {
                return article.thumbnails[0];
            }
            return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=600&fit=crop';
        },

        // Get audio URL for current language
        getArticleAudio(article) {
            return this.lang === 'fr' ? article.french_audio : article.english_audio;
        },

        // Methods
        async init() {
            this.$nextTick(async () => {
                this.scrollContainer = document.getElementById('feed-scroll');
                this.calculateCardHeight();
                window.addEventListener('resize', () => this.calculateCardHeight());

                // Load profile data if available
                const profileDataEl = document.getElementById('profile-data');
                if (profileDataEl) {
                    try {
                        const data = JSON.parse(profileDataEl.textContent);
                        this.settingsName = data.first_name || '';
                        this.settingsPhone = data.phone || '';
                        this.settingsRegion = data.region || '';
                        this.settingsNotifTime = data.notification_time || '08:00';
                        this.settingsEducation = data.education_level || '';
                        this.settingsBackground = data.background || '';
                        this.settingsInterests = data.interests || [];
                        this.settingsCustomDesires = data.custom_desires || '';
                        this.receiveQuotes = data.receive_quotes !== false;
                        this.quoteCategory = data.quote_category || 'GENERAL';
                    } catch (e) {
                        console.log('No profile data');
                    }
                }

                // Load interest options
                const interestOptionsEl = document.getElementById('interest-options');
                if (interestOptionsEl) {
                    try {
                        this.interestOptions = JSON.parse(interestOptionsEl.textContent);
                    } catch (e) {
                        console.log('No interest options');
                    }
                }

                // Initialize language from URL
                this.settingsLanguage = this.lang;

                // Global handler for removing bookmarks
                const self = this;
                window.removeBookmarkHandler = (articleId) => {
                    self.removeBookmark(articleId);
                };

                // Load categories and articles from API
                await this.loadCategories();
                await this.loadArticles();

                // Fetch notification count for badge
                await this.fetchUnreadCount();

                // Setup infinite scroll
                this.setupInfiniteScroll();
            });
        },

        async loadCategories() {
            try {
                const response = await fetch('/api/categories/');
                if (response.ok) {
                    this.categories = await response.json();
                }
            } catch (e) {
                console.error('Failed to load categories:', e);
            }
        },

        async loadArticles(append = false) {
            if (this.isLoading || this.isLoadingMore) return;

            if (append) {
                this.isLoadingMore = true;
            } else {
                this.isLoading = true;
                this.currentPage = 1;
            }

            try {
                let url = `/api/articles/?page=${this.currentPage}&page_size=${this.pageSize}`;

                // Add main category filter
                if (this.activeTab !== 'FOR_YOU') {
                    url += `&main_category=${this.activeTab}`;
                }

                // Add sub-category filter
                if (this.activeCategory !== 'all') {
                    url += `&category__slug=${this.activeCategory}`;
                }

                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();

                    // Transform articles to include bookmarked state
                    const newArticles = (data.results || data).map(article => ({
                        ...article,
                        bookmarked: this.isBookmarked(article.id)
                    }));

                    if (append) {
                        this.articles = [...this.articles, ...newArticles];
                    } else {
                        this.articles = newArticles;
                        // Reset scroll position
                        if (this.scrollContainer) {
                            this.scrollContainer.scrollTop = 0;
                        }
                        this.activeCardIndex = 0;
                    }

                    // Check if there's a next page
                    this.hasNextPage = data.next !== null;

                    // Recalculate card height after new cards are rendered
                    this.$nextTick(() => this.calculateCardHeight());
                }
            } catch (e) {
                console.error('Failed to load articles:', e);
            } finally {
                this.isLoading = false;
                this.isLoadingMore = false;
            }
        },

        setupInfiniteScroll() {
            if (!this.scrollContainer) return;

            this.scrollContainer.addEventListener('scroll', () => {
                const { scrollTop, scrollHeight, clientHeight } = this.scrollContainer;

                // Load more when user is near the bottom (80% scrolled)
                if (scrollTop + clientHeight >= scrollHeight * 0.8) {
                    if (this.hasNextPage && !this.isLoadingMore) {
                        this.currentPage++;
                        this.loadArticles(true);
                    }
                }
            });
        },

        calculateCardHeight() {
            if (this.scrollContainer) {
                const cards = this.scrollContainer.querySelectorAll('.feed-card');
                if (cards.length > 0) {
                    this.cardHeight = cards[0].offsetHeight + 20;
                }
            }
        },

        // Tab navigation
        setTab(tab) {
            if (this.activeTab === tab) return;

            this.activeTab = tab;
            this.activeCategory = 'all';
            this.activeCardIndex = 0;

            // Show sub-chips only if tab has subcategories
            if (tab === 'FOR_YOU') {
                this.showSubChips = false;
            } else {
                this.showSubChips = true;
            }

            this.resetNavTimeout();

            // Reload articles for new tab
            this.loadArticles();
        },

        setCategory(categorySlug) {
            if (this.activeCategory === categorySlug) return;

            this.activeCategory = categorySlug;
            this.activeCardIndex = 0;
            this.resetNavTimeout();

            // Reload articles for new category
            this.loadArticles();
        },

        // Navigation toggle
        toggleNav() {
            if (this.navExpanded) {
                this.collapseNav();
            } else {
                this.expandNav();
            }
        },

        expandNav() {
            this.navExpanded = true;
            this.resetNavTimeout();
        },

        collapseNav() {
            this.showSubChips = false;
            setTimeout(() => {
                this.navExpanded = false;
            }, 100);
        },

        startNavTimeout() {
            this.navTimeout = setTimeout(() => {
                this.collapseNav();
            }, 5000);
        },

        resetNavTimeout() {
            if (this.navTimeout) {
                clearTimeout(this.navTimeout);
            }
            this.startNavTimeout();
        },

        // Card styling with gradient backgrounds
        getCardBackground(index) {
            const hueShift = 60;
            const hue = (this.baseHue + (index * hueShift)) % 360;
            const saturation = 20 + (index % 4) * 8;
            const lightness = 18 + (index % 3) * 4;
            const hue2 = (hue + 20) % 360;
            const lightness2 = lightness + 6;

            return `linear-gradient(145deg, 
                hsl(${hue}, ${saturation}%, ${lightness}%) 0%, 
                hsl(${hue2}, ${saturation - 3}%, ${lightness2}%) 100%)`;
        },

        getCardStyle(index) {
            const diff = index - this.activeCardIndex;
            const background = this.getCardBackground(index);

            if (diff === 0) {
                return { background, transform: 'scale(1)', filter: 'blur(0)', opacity: 1 };
            } else if (diff === 1) {
                return { background, transform: 'scale(0.92)', filter: 'blur(2px)', opacity: 0.7 };
            } else if (diff === -1) {
                return { background, transform: 'scale(0.92)', opacity: 0.5 };
            } else {
                return { background, transform: 'scale(0.85)', opacity: 0.3 };
            }
        },

        onScroll(event) {
            const scrollTop = event.target.scrollTop;

            if (this.cardHeight > 0) {
                const newIndex = Math.round(scrollTop / this.cardHeight);
                if (newIndex !== this.activeCardIndex && newIndex >= 0) {
                    this.activeCardIndex = Math.min(newIndex, this.articles.length - 1);
                }
            }
        },

        // Article actions
        openArticle(article) {
            window.location.href = `/${this.lang}/article/${article.id}/`;
        },

        async playArticle(article) {
            const audioUrl = this.getArticleAudio(article);

            if (!audioUrl) {
                console.log('No audio available for this article');
                return;
            }

            // If same article is playing, toggle pause/play
            if (this.playingId === article.id && this.currentAudio) {
                if (this.currentAudio.paused) {
                    this.currentAudio.play();
                } else {
                    this.currentAudio.pause();
                    this.playingId = null;
                }
                return;
            }

            // Stop current audio if any
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }

            // Start new audio
            this.currentAudio = new Audio(audioUrl);
            this.playingId = article.id;

            this.currentAudio.play().catch(e => {
                console.error('Audio playback failed:', e);
                this.playingId = null;
            });

            this.currentAudio.onended = () => {
                this.playingId = null;
            };
        },

        shareArticle(article) {
            const title = this.getArticleTitle(article);
            const fullText = this.getArticleExcerpt(article) || '';
            const text = fullText.length > 100 ? fullText.substring(0, 100) + '...' : fullText;
            const url = window.location.origin + `/${this.lang}/article/${article.id}/`;

            if (navigator.share) {
                navigator.share({ title, text, url });
            } else {
                navigator.clipboard.writeText(url);
            }
        },

        // Bookmark management (localStorage based for now)
        getBookmarks() {
            try {
                return JSON.parse(localStorage.getItem('gist4u_bookmarks') || '[]');
            } catch {
                return [];
            }
        },

        saveBookmarks(bookmarks) {
            localStorage.setItem('gist4u_bookmarks', JSON.stringify(bookmarks));
        },

        isBookmarked(articleId) {
            return this.getBookmarks().includes(articleId);
        },

        toggleBookmark(article) {
            const bookmarks = this.getBookmarks();
            const index = bookmarks.indexOf(article.id);

            if (index > -1) {
                bookmarks.splice(index, 1);
                article.bookmarked = false;
            } else {
                bookmarks.push(article.id);
                article.bookmarked = true;
            }

            this.saveBookmarks(bookmarks);
        },

        removeBookmark(articleId) {
            if (this._processingBookmark) return;
            this._processingBookmark = true;

            const bookmarks = this.getBookmarks();
            const index = bookmarks.indexOf(articleId);
            if (index > -1) {
                bookmarks.splice(index, 1);
                this.saveBookmarks(bookmarks);
            }

            const article = this.articles.find(a => a.id === articleId);
            if (article) {
                article.bookmarked = false;
            }

            // Update bookmarks list if modal is open
            this.bookmarksList = this.bookmarksList.filter(a => a.id !== articleId);

            setTimeout(() => {
                this._processingBookmark = false;
            }, 100);
        },

        // Settings methods
        openSettings() {
            this.showProfile = false;
            this.showSettings = true;
        },

        closeSettings() {
            this.showSettings = false;
        },

        // Bookmark modal
        async openBookmarks() {
            this.showProfile = false;

            // Load bookmarked articles
            const bookmarkIds = this.getBookmarks();
            if (bookmarkIds.length === 0) {
                this.bookmarksList = [];
                this.showBookmarks = true;
                return;
            }

            // Fetch bookmarked articles from API
            try {
                const promises = bookmarkIds.slice(0, 20).map(id =>
                    fetch(`/api/articles/${id}/`).then(r => r.ok ? r.json() : null)
                );
                const results = await Promise.all(promises);
                this.bookmarksList = results.filter(Boolean).map(a => ({
                    ...a,
                    bookmarked: true,
                    title: this.getArticleTitle(a),
                    excerpt: this.getArticleExcerpt(a),
                    image: this.getArticleImage(a)
                }));
            } catch (e) {
                console.error('Failed to load bookmarks:', e);
                this.bookmarksList = [];
            }

            this.showBookmarks = true;
        },

        renderBookmarksHtml() {
            return this.bookmarksList.map(article => `
                <div class="bookmark-card">
                    <a href="/${this.lang}/article/${article.id}/" class="bookmark-link">
                        <img src="${article.image}" alt="${article.title}" class="bookmark-image">
                        <div class="bookmark-info">
                            <h3 class="bookmark-title">${article.title}</h3>
                            <p class="bookmark-excerpt">${article.excerpt}</p>
                        </div>
                    </a>
                    <button class="bookmark-remove-btn" onclick="event.stopPropagation(); window.removeBookmarkHandler(${article.id}); return false;" title="Remove bookmark">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                        </svg>
                    </button>
                </div>
            `).join('');
        },

        // Notifications from API
        getCSRFToken() {
            return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
        },

        async fetchUnreadCount() {
            try {
                const response = await fetch(`/api/notifications/unread-count/?lang=${this.lang}`, {
                    credentials: 'include',
                    headers: {
                        'X-CSRFToken': this.getCSRFToken()
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    this.unreadCount = data.unread_count || 0;
                    this.hasNewNotifications = this.unreadCount > 0;
                }
            } catch (e) {
                console.log('Could not fetch notification count');
            }
        },

        async openNotifications() {
            this.showNotifications = true;
            this.loadingNotifications = true;

            try {
                const response = await fetch(`/api/notifications/?lang=${this.lang}&ordering=-created_at`, {
                    credentials: 'include',
                    headers: {
                        'X-CSRFToken': this.getCSRFToken()
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    this.notifications = data.results || data;
                }
            } catch (e) {
                console.error('Failed to fetch notifications:', e);
                this.notifications = [];
            } finally {
                this.loadingNotifications = false;
            }
        },

        async markNotificationRead(notificationId) {
            try {
                await fetch(`/api/notifications/${notificationId}/read/`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'X-CSRFToken': this.getCSRFToken()
                    }
                });
                // Update local state
                const notif = this.notifications.find(n => n.id === notificationId);
                if (notif) notif.is_read = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.hasNewNotifications = this.unreadCount > 0;
            } catch (e) {
                console.error('Failed to mark as read:', e);
            }
        },

        async markAllNotificationsRead() {
            try {
                await fetch('/api/notifications/read-all/', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'X-CSRFToken': this.getCSRFToken()
                    }
                });
                this.notifications.forEach(n => n.is_read = true);
                this.unreadCount = 0;
                this.hasNewNotifications = false;
            } catch (e) {
                console.error('Failed to mark all as read:', e);
            }
        },

        getNotificationLink(notification) {
            if (notification.article) {
                return `/${this.lang}/article/${notification.article}/`;
            }
            return notification.link_url || '#';
        },

        formatNotificationTime(dateStr) {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            const now = new Date();
            const diff = now - date;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (minutes < 1) return this.lang === 'fr' ? 'à l\'instant' : 'just now';
            if (minutes < 60) return `${minutes}m`;
            if (hours < 24) return `${hours}h`;
            if (days < 7) return `${days}d`;
            return date.toLocaleDateString(this.lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' });
        },

        renderGistHtml() {
            if (this.gistList.length === 0) return '';

            return this.gistList.map(article => `
                <div class="bookmark-item">
                    <a href="/${this.lang}/article/${article.id}/" class="bookmark-link">
                        <img src="${article.image}" alt="${article.title}" class="bookmark-image">
                        <div class="bookmark-info">
                            <h3 class="bookmark-title">${article.title}</h3>
                            <p class="bookmark-excerpt">${article.excerpt}</p>
                        </div>
                    </a>
                </div>
            `).join('');
        },

        openSponsors() {
            this.showProfile = false;
            this.sponsorError = '';
            this.sponsorSubmitted = false;
            this.showSponsors = true;
        },

        async submitSponsorInquiry() {
            this.sponsorError = '';

            if (!this.sponsorName || !this.sponsorEmail || !this.sponsorPhone || !this.sponsorDescription) {
                this.sponsorError = 'Please fill in all required fields';
                return;
            }

            this.sponsorSubmitting = true;

            try {
                const langPrefix = `/${this.lang}/`;

                const response = await fetch(`${langPrefix}submit-sponsor-partner/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: this.sponsorName,
                        email: this.sponsorEmail,
                        phone: this.sponsorPhone,
                        organization_name: this.sponsorOrg,
                        website: this.sponsorWebsite,
                        inquiry_type: this.sponsorType,
                        description: this.sponsorDescription
                    })
                });

                const data = await response.json();

                if (data.success) {
                    this.sponsorSubmitted = true;
                    this.sponsorName = '';
                    this.sponsorEmail = '';
                    this.sponsorPhone = '';
                    this.sponsorOrg = '';
                    this.sponsorWebsite = '';
                    this.sponsorDescription = '';
                    this.sponsorType = 'SPONSOR';
                } else {
                    this.sponsorError = data.message || 'Something went wrong';
                }
            } catch (error) {
                this.sponsorError = 'Connection error. Please try again.';
            }

            this.sponsorSubmitting = false;
        },

        async saveSettings() {
            this.savingSettings = true;

            try {
                const langPrefix = `/${this.lang}/`;

                const response = await fetch(`${langPrefix}save-settings/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || ''
                    },
                    body: JSON.stringify({
                        first_name: this.settingsName,
                        phone: this.settingsPhone,
                        region: this.settingsRegion,
                        education_level: this.settingsEducation,
                        background: this.settingsBackground,
                        notification_time: this.settingsNotifTime,
                        interests: this.settingsInterests,
                        custom_desires: this.settingsCustomDesires,
                        receive_quotes: this.receiveQuotes,
                        quote_category: this.quoteCategory,
                        language: this.settingsLanguage
                    })
                });

                const data = await response.json();

                if (data.success) {
                    this.showSettings = false;
                    this.showSaveToast = true;

                    if (this.settingsLanguage !== this.lang) {
                        const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
                        document.cookie = `django_language=${this.settingsLanguage}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
                        const newPath = window.location.pathname.replace(/^\/(en|fr)\//, `/${this.settingsLanguage}/`);
                        window.location.href = newPath;
                        return;
                    }

                    setTimeout(() => {
                        this.showSaveToast = false;
                    }, 2500);
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (e) {
                alert('Failed to save settings');
            }

            this.savingSettings = false;
        },

        // Search navigation
        goToSearch() {
            window.location.href = `/${this.lang}/search/`;
        },

        // Deadline formatting helpers
        formatDeadline(deadline) {
            if (!deadline) return '';

            const date = new Date(deadline);
            const now = new Date();
            const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

            // Show relative time for nearby deadlines
            if (diffDays < 0) {
                return this.lang === 'fr' ? 'Expiré' : 'Expired';
            } else if (diffDays === 0) {
                return this.lang === 'fr' ? "Aujourd'hui" : 'Today';
            } else if (diffDays === 1) {
                return this.lang === 'fr' ? 'Demain' : 'Tomorrow';
            } else if (diffDays <= 7) {
                return diffDays + (this.lang === 'fr' ? ' jours' : ' days');
            } else {
                // Format as short date
                const options = { month: 'short', day: 'numeric' };
                return date.toLocaleDateString(this.lang === 'fr' ? 'fr-FR' : 'en-US', options);
            }
        },

        isDeadlineUrgent(deadline) {
            if (!deadline) return false;

            const date = new Date(deadline);
            const now = new Date();
            const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

            // Urgent if deadline is within 3 days
            return diffDays >= 0 && diffDays <= 3;
        },

        // Navigation functions
        goToSearch() {
            window.location.href = `/${this.lang}/search/`;
        },

        goToCategories() {
            window.location.href = `/${this.lang}/categories/`;
        }
    }
}
