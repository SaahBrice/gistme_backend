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
        showProfile: false,
        showNotifications: false,

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

        // Quote of the Day state
        showQuote: false,
        currentQuote: null,
        quotes: {
            GENERAL: [
                { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
                { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
                { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" }
            ],
            CHRISTIAN: [
                { text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.", author: "Jeremiah 29:11" },
                { text: "I can do all things through Christ who strengthens me.", author: "Philippians 4:13" },
                { text: "Trust in the Lord with all your heart and lean not on your own understanding.", author: "Proverbs 3:5" }
            ],
            ISLAMIC: [
                { text: "Indeed, with hardship comes ease.", author: "Quran 94:6" },
                { text: "The best among you are those who have the best manners and character.", author: "Prophet Muhammad (PBUH)" },
                { text: "Tie your camel first, then put your trust in Allah.", author: "Prophet Muhammad (PBUH)" }
            ]
        },

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
            const hueShift = 35;
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
            const text = this.getArticleExcerpt(article);
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

        // Notifications/Gist modal
        openNotifications() {
            const customDesires = (this.settingsCustomDesires || '').toLowerCase();
            const keywords = customDesires.split(',').map(k => k.trim()).filter(k => k.length > 0);

            if (keywords.length === 0) {
                this.gistList = this.articles.slice(0, 10).map(a => ({
                    ...a,
                    title: this.getArticleTitle(a),
                    excerpt: this.getArticleExcerpt(a),
                    image: this.getArticleImage(a)
                }));
            } else {
                this.gistList = this.articles.filter(article => {
                    const title = this.getArticleTitle(article).toLowerCase();
                    const excerpt = this.getArticleExcerpt(article).toLowerCase();
                    return keywords.some(keyword =>
                        title.includes(keyword) || excerpt.includes(keyword)
                    );
                }).map(a => ({
                    ...a,
                    title: this.getArticleTitle(a),
                    excerpt: this.getArticleExcerpt(a),
                    image: this.getArticleImage(a)
                }));
            }

            this.hasNewNotifications = false;
            this.showNotifications = true;
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

        // Quote of the Day methods
        openQuote() {
            this.showProfile = false;
            this.getNewQuote();
            this.showQuote = true;
        },

        quoteColorPalettes: {
            GENERAL: [
                { bg: 'linear-gradient(145deg, #92400E 0%, #B45309 100%)' },
                { bg: 'linear-gradient(145deg, #78350F 0%, #A16207 100%)' },
                { bg: 'linear-gradient(145deg, #7C2D12 0%, #C2410C 100%)' }
            ],
            CHRISTIAN: [
                { bg: 'linear-gradient(145deg, #1E3A8A 0%, #1D4ED8 100%)' },
                { bg: 'linear-gradient(145deg, #1E40AF 0%, #2563EB 100%)' },
                { bg: 'linear-gradient(145deg, #312E81 0%, #4338CA 100%)' }
            ],
            ISLAMIC: [
                { bg: 'linear-gradient(145deg, #065F46 0%, #047857 100%)' },
                { bg: 'linear-gradient(145deg, #064E3B 0%, #059669 100%)' },
                { bg: 'linear-gradient(145deg, #14532D 0%, #166534 100%)' }
            ]
        },

        getNewQuote() {
            const category = this.quoteCategory || 'GENERAL';
            const categoryQuotes = this.quotes[category] || this.quotes.GENERAL;
            const randomIndex = Math.floor(Math.random() * categoryQuotes.length);
            const palettes = this.quoteColorPalettes[category] || this.quoteColorPalettes.GENERAL;
            const colorIndex = Math.floor(Math.random() * palettes.length);

            this.currentQuote = {
                ...categoryQuotes[randomIndex],
                category: category,
                date: this.getFormattedDate(),
                colorIndex: colorIndex
            };
        },

        getFormattedDate() {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date().toLocaleDateString('en-US', options);
        },

        async shareQuoteAsImage() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 500;

            ctx.font = 'bold 22px Georgia, serif';
            const words = this.currentQuote.text.split(' ');
            let lines = [];
            let currentLine = '';
            const maxWidth = 430;

            words.forEach(word => {
                const testLine = currentLine + word + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && currentLine !== '') {
                    lines.push(currentLine.trim());
                    currentLine = word + ' ';
                } else {
                    currentLine = testLine;
                }
            });
            lines.push(currentLine.trim());

            const lineHeight = 32;
            const startY = 100;
            const authorY = startY + (lines.length * lineHeight) + 25;
            const bottomY = authorY + 45;
            const canvasHeight = bottomY + 35;
            canvas.height = canvasHeight;

            const colorPalettes = {
                GENERAL: [['#92400E', '#B45309'], ['#78350F', '#A16207'], ['#7C2D12', '#C2410C']],
                CHRISTIAN: [['#1E3A8A', '#1D4ED8'], ['#1E40AF', '#2563EB'], ['#312E81', '#4338CA']],
                ISLAMIC: [['#065F46', '#047857'], ['#064E3B', '#059669'], ['#14532D', '#166534']]
            };

            const palettes = colorPalettes[this.currentQuote.category] || colorPalettes.GENERAL;
            const randomPalette = palettes[Math.floor(Math.random() * palettes.length)];

            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, randomPalette[0]);
            gradient.addColorStop(1, randomPalette[1]);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = 'bold 60px Georgia, serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.textAlign = 'left';
            ctx.fillText('"', 25, 70);

            ctx.font = 'bold 22px Georgia, serif';
            ctx.fillStyle = '#ffffff';
            lines.forEach((line, index) => {
                ctx.fillText(line, 35, startY + (index * lineHeight));
            });

            ctx.font = 'italic 18px Georgia, serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.fillText('— ' + this.currentQuote.author, 35, authorY);

            ctx.font = '14px Arial, sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            const username = this.settingsName || 'A Gist4U User';
            ctx.fillText('Shared by ' + username, 35, bottomY);

            ctx.textAlign = 'right';
            ctx.font = 'bold 20px Arial, sans-serif';
            ctx.fillStyle = '#FACC15';
            ctx.fillText('Gist4U', 465, bottomY);

            canvas.toBlob(async (blob) => {
                if (navigator.share && navigator.canShare) {
                    try {
                        const file = new File([blob], 'quote-of-the-day.png', { type: 'image/png' });
                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                files: [file],
                                title: 'Quote of the Day',
                                text: this.currentQuote.text + ' — ' + this.currentQuote.author
                            });
                            return;
                        }
                    } catch (err) {
                        console.log('Share failed, downloading instead');
                    }
                }
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'gist4u-quote.png';
                link.click();
            }, 'image/png');
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
        }
    }
}
