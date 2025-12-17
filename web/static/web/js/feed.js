// Feed Page - Alpine.js Component with Snap Scroll and Collapsible Nav
function feedApp() {
    return {
        // State
        activeTab: 'news',
        activeCategory: 'all',
        navExpanded: false, // Navigation starts collapsed
        showSubChips: false, // Sub-chips hidden by default
        navTimeout: null,
        hasNewNotifications: true,
        showProfile: false, // Profile modal
        showNotifications: false, // Notifications modal

        // Settings modals state
        showSettings: false,
        showTerms: false,
        showDeletePopup: false,
        pushEnabled: true,

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

        isLoading: false,
        playingId: null,
        activeCardIndex: 0,
        scrollContainer: null,
        cardHeight: 0,
        baseHue: Math.random() * 360,

        // Categories per tab
        newsCategories: [
            { id: 'all', name: 'All', emoji: '📰' },
            { id: 'politics', name: 'Politics', emoji: '🏛️' },
            { id: 'tech', name: 'Tech', emoji: '💻' },
            { id: 'sports', name: 'Sports', emoji: '⚽' },
            { id: 'entertainment', name: 'Entertainment', emoji: '🎬' },
            { id: 'health', name: 'Health', emoji: '🏥' },
        ],

        opportunityCategories: [
            { id: 'all', name: 'All', emoji: '🎯' },
            { id: 'scholarships', name: 'Scholarships', emoji: '🎓' },
            { id: 'jobs_abroad', name: 'Jobs Abroad', emoji: '🌍' },
            { id: 'jobs_local', name: 'Jobs Local', emoji: '🇨🇲' },
            { id: 'concours', name: 'Concours', emoji: '📝' },
            { id: 'competitions', name: 'Competitions', emoji: '🏆' },
        ],

        forYouCategories: [
            { id: 'all', name: 'All', emoji: '✨' },
            { id: 'recommended', name: 'Recommended', emoji: '💡' },
            { id: 'saved', name: 'Saved', emoji: '🔖' },
            { id: 'recent', name: 'Recently Viewed', emoji: '👁️' },
        ],

        // Check if current tab has sub-categories
        get hasSubCategories() {
            return this.activeTab === 'news' || this.activeTab === 'opportunities';
        },

        // Dummy articles data
        articles: [
            {
                id: 1,
                title: 'Cameroon Government Announces New Education Reforms for 2024',
                excerpt: 'The Ministry of Education has unveiled a comprehensive plan to modernize the education system across all regions. Students and teachers will benefit from new digital learning initiatives.',
                image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop',
                category: 'politics',
                categoryName: '🏛️ Politics',
                tab: 'news',
                bookmarked: false
            },
            {
                id: 2,
                title: 'Full Scholarship: Study Masters in Germany - No Tuition Fees',
                excerpt: 'DAAD announces fully funded scholarships for African students pursuing Master degrees in German universities. Application deadline is approaching fast.',
                image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=600&fit=crop',
                category: 'scholarships',
                categoryName: '🎓 Scholarship',
                tab: 'opportunities',
                bookmarked: true
            },
            {
                id: 3,
                title: 'Tech Startup in Douala Raises $2M to Revolutionize Agriculture',
                excerpt: 'AgriTech Cameroon secures funding to bring smart farming solutions to local farmers across the country. The startup plans to expand to 5 more African countries.',
                image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
                category: 'tech',
                categoryName: '💻 Tech',
                tab: 'news',
                bookmarked: false
            },
            {
                id: 4,
                title: 'ENAM Concours 2024: Application Deadline Extended',
                excerpt: 'The National School of Administration announces extension of application deadline for the upcoming entrance exam. All eligible candidates are encouraged to apply.',
                image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop',
                category: 'concours',
                categoryName: '📝 Concours',
                tab: 'opportunities',
                bookmarked: false
            },
            {
                id: 5,
                title: 'Lions Indomptables Prepare for AFCON Qualifiers',
                excerpt: 'The national football team gathers for intensive training ahead of crucial qualification matches. Coach reveals new tactical approach for upcoming games.',
                image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop',
                category: 'sports',
                categoryName: '⚽ Sports',
                tab: 'news',
                bookmarked: false
            },
            {
                id: 6,
                title: 'Remote Software Developer Jobs at Google - Cameroon Eligible',
                excerpt: 'Google opens remote positions for developers in Africa. Competitive salary, benefits, and career growth opportunities included.',
                image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop',
                category: 'jobs_abroad',
                categoryName: '🌍 Jobs Abroad',
                tab: 'opportunities',
                bookmarked: true
            },
            {
                id: 7,
                title: 'New Health Centers to Open Across Northern Regions',
                excerpt: 'Government initiative brings healthcare closer to rural communities with 50 new facilities planned. Construction begins next month.',
                image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop',
                category: 'health',
                categoryName: '🏥 Health',
                tab: 'news',
                bookmarked: false
            },
            {
                id: 8,
                title: 'African Innovation Challenge: Win $10,000 for Your Startup',
                excerpt: 'Submit your innovative business idea by January 2024 for a chance to win funding, mentorship, and access to global networks.',
                image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=600&fit=crop',
                category: 'competitions',
                categoryName: '🏆 Competition',
                tab: 'opportunities',
                bookmarked: false
            }
        ],

        // Computed
        get currentCategories() {
            if (this.activeTab === 'news') return this.newsCategories;
            if (this.activeTab === 'opportunities') return this.opportunityCategories;
            return this.forYouCategories;
        },

        get filteredArticles() {
            let filtered = this.articles.filter(a => {
                if (this.activeTab === 'foryou') return true;
                return a.tab === this.activeTab;
            });

            if (this.activeCategory !== 'all') {
                if (this.activeTab === 'foryou') {
                    if (this.activeCategory === 'saved') {
                        filtered = filtered.filter(a => a.bookmarked);
                    }
                } else {
                    filtered = filtered.filter(a => a.category === this.activeCategory);
                }
            }

            return filtered;
        },

        // Methods
        init() {
            this.$nextTick(() => {
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

        // Settings methods
        openSettings() {
            this.showProfile = false;
            this.showSettings = true;
        },

        closeSettings() {
            this.showSettings = false;
        },

        async saveSettings() {
            this.savingSettings = true;

            try {
                const response = await fetch('/save-settings/', {
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
                        quote_category: this.quoteCategory
                    })
                });

                const data = await response.json();

                if (data.success) {
                    this.showSettings = false;
                    this.showSaveToast = true;
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
            }, 5000); // Collapse after 5 seconds of inactivity
        },

        resetNavTimeout() {
            if (this.navTimeout) {
                clearTimeout(this.navTimeout);
            }
            this.startNavTimeout();
        },

        // Generate harmonious gradient background for each card
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

        setTab(tab) {
            this.activeTab = tab;
            this.activeCategory = 'all';
            this.activeCardIndex = 0;

            // Show sub-chips only if this tab has categories
            if (tab === 'news' || tab === 'opportunities') {
                this.showSubChips = true;
            } else {
                this.showSubChips = false;
            }

            this.resetNavTimeout();

            if (this.scrollContainer) {
                this.scrollContainer.scrollTop = 0;
            }
        },

        setCategory(categoryId) {
            this.activeCategory = categoryId;
            this.activeCardIndex = 0;
            this.resetNavTimeout();

            if (this.scrollContainer) {
                this.scrollContainer.scrollTop = 0;
            }
        },

        onScroll(event) {
            const scrollTop = event.target.scrollTop;

            if (this.cardHeight > 0) {
                const newIndex = Math.round(scrollTop / this.cardHeight);
                if (newIndex !== this.activeCardIndex && newIndex >= 0) {
                    this.activeCardIndex = Math.min(newIndex, this.filteredArticles.length - 1);
                }
            }
        },

        openArticle(article) {
            console.log('Opening article:', article.id);
        },

        toggleBookmark(article) {
            article.bookmarked = !article.bookmarked;
        },

        shareArticle(article) {
            if (navigator.share) {
                navigator.share({
                    title: article.title,
                    text: article.excerpt,
                    url: window.location.origin + '/article/' + article.id + '/'
                });
            } else {
                navigator.clipboard.writeText(window.location.origin + '/article/' + article.id + '/');
            }
        },

        playArticle(article) {
            if (this.playingId === article.id) {
                this.playingId = null;
            } else {
                this.playingId = article.id;
            }
        }
    }
}
