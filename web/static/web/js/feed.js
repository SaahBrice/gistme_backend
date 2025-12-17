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
        showBookmarks: false,
        showSponsors: false,
        bookmarksList: [],
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

        // Dummy quotes data by category
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

                // Merge dummy articles if available
                if (typeof dummyArticles !== 'undefined') {
                    this.articles = [...this.articles, ...dummyArticles];
                }

                // Global handler for removing bookmarks from x-html rendered content
                const self = this;
                window.removeBookmarkHandler = (articleId) => {
                    self.removeBookmark(articleId);
                };
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

        // Bookmark methods
        openBookmarks() {
            this.bookmarksList = this.articles.filter(a => a.bookmarked);
            this.showProfile = false;
            this.showBookmarks = true;
        },

        removeBookmark(articleId) {
            // Guard against double execution
            if (this._processingBookmark) return;
            this._processingBookmark = true;

            const article = this.articles.find(a => a.id === articleId);
            if (article) {
                article.bookmarked = false;
                this.bookmarksList = this.articles.filter(a => a.bookmarked);
            }

            // Reset guard after short delay
            setTimeout(() => {
                this._processingBookmark = false;
            }, 100);
        },

        renderBookmarksHtml() {
            return this.bookmarksList.map(article => `
                <div class="bookmark-card">
                    <a href="/article/${article.id}/" class="bookmark-link">
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

        toggleBookmark(articleId) {
            const article = this.articles.find(a => a.id === articleId);
            if (article) {
                article.bookmarked = !article.bookmarked;
            }
        },

        openSponsors() {
            this.showProfile = false;
            this.sponsorError = '';
            this.sponsorSubmitted = false;
            this.showSponsors = true;
        },

        async submitSponsorInquiry() {
            this.sponsorError = '';

            // Validation
            if (!this.sponsorName || !this.sponsorEmail || !this.sponsorPhone || !this.sponsorDescription) {
                this.sponsorError = 'Please fill in all required fields';
                return;
            }

            this.sponsorSubmitting = true;

            try {
                const response = await fetch('/submit-sponsor-partner/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
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
                    // Reset form
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

        // Color palettes for random variation
        quoteColorPalettes: {
            GENERAL: [
                { bg: 'linear-gradient(145deg, #92400E 0%, #B45309 100%)' },
                { bg: 'linear-gradient(145deg, #78350F 0%, #A16207 100%)' },
                { bg: 'linear-gradient(145deg, #7C2D12 0%, #C2410C 100%)' },
                { bg: 'linear-gradient(145deg, #713F12 0%, #A16207 100%)' },
                { bg: 'linear-gradient(145deg, #854D0E 0%, #CA8A04 100%)' }
            ],
            CHRISTIAN: [
                { bg: 'linear-gradient(145deg, #1E3A8A 0%, #1D4ED8 100%)' },
                { bg: 'linear-gradient(145deg, #1E40AF 0%, #2563EB 100%)' },
                { bg: 'linear-gradient(145deg, #312E81 0%, #4338CA 100%)' },
                { bg: 'linear-gradient(145deg, #1E3A5F 0%, #1E40AF 100%)' },
                { bg: 'linear-gradient(145deg, #172554 0%, #1D4ED8 100%)' }
            ],
            ISLAMIC: [
                { bg: 'linear-gradient(145deg, #065F46 0%, #047857 100%)' },
                { bg: 'linear-gradient(145deg, #064E3B 0%, #059669 100%)' },
                { bg: 'linear-gradient(145deg, #14532D 0%, #166534 100%)' },
                { bg: 'linear-gradient(145deg, #134E4A 0%, #0F766E 100%)' },
                { bg: 'linear-gradient(145deg, #065F46 0%, #10B981 100%)' }
            ]
        },

        getNewQuote() {
            const category = this.quoteCategory || 'GENERAL';
            const categoryQuotes = this.quotes[category] || this.quotes.GENERAL;
            const randomIndex = Math.floor(Math.random() * categoryQuotes.length);

            // Pick random color from palette
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
            // Create canvas for image generation - compact square format
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Fixed width, dynamic height
            canvas.width = 500;

            // First pass: calculate content height
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

            // Calculate dynamic height: padding + quote mark + quote lines + author + bottom section + padding
            const lineHeight = 32;
            const startY = 100;
            const authorY = startY + (lines.length * lineHeight) + 25;
            const bottomY = authorY + 45;
            const canvasHeight = bottomY + 35; // Add bottom padding

            canvas.height = canvasHeight;

            // Multiple dark color variations per category
            const colorPalettes = {
                GENERAL: [
                    ['#92400E', '#B45309'],
                    ['#78350F', '#A16207'],
                    ['#7C2D12', '#C2410C'],
                    ['#713F12', '#A16207'],
                    ['#854D0E', '#CA8A04']
                ],
                CHRISTIAN: [
                    ['#1E3A8A', '#1D4ED8'],
                    ['#1E40AF', '#2563EB'],
                    ['#312E81', '#4338CA'],
                    ['#1E3A5F', '#1E40AF'],
                    ['#172554', '#1D4ED8']
                ],
                ISLAMIC: [
                    ['#065F46', '#047857'],
                    ['#064E3B', '#059669'],
                    ['#14532D', '#166534'],
                    ['#134E4A', '#0F766E'],
                    ['#065F46', '#10B981']
                ]
            };

            // Pick random colors from the category palette
            const palettes = colorPalettes[this.currentQuote.category] || colorPalettes.GENERAL;
            const randomPalette = palettes[Math.floor(Math.random() * palettes.length)];

            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, randomPalette[0]);
            gradient.addColorStop(1, randomPalette[1]);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Quote mark (large, subtle)
            ctx.font = 'bold 60px Georgia, serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.textAlign = 'left';
            ctx.fillText('"', 25, 70);

            // Draw quote text
            ctx.font = 'bold 22px Georgia, serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            lines.forEach((line, index) => {
                ctx.fillText(line, 35, startY + (index * lineHeight));
            });

            // Author
            ctx.font = 'italic 18px Georgia, serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.fillText('— ' + this.currentQuote.author, 35, authorY);

            // Bottom section

            // Username at bottom left
            ctx.font = '14px Arial, sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            const username = this.settingsName || 'A Gist4U User';
            ctx.fillText('Shared by ' + username, 35, bottomY);

            // Gist4U branding - bottom right
            ctx.textAlign = 'right';
            ctx.font = 'bold 20px Arial, sans-serif';
            ctx.fillStyle = '#FACC15';
            ctx.fillText('Gist4U', 465, bottomY);

            // Convert to blob and share/download
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

                // Fallback: download
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'gist4u-quote.png';
                link.click();
            }, 'image/png');
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
