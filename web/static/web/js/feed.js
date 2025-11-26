function gistMeApp() {
    return {
        // State
        moodSelected: false,
        currentMood: '',
        currentIndex: 0,
        isLiked: false,
        showDrumEffect: false,
        showCommentModal: false,
        showReader: false,
        isPlaying: false,
        audioProgress: 0,
        // Language
        globalLang: localStorage.getItem('gist4u_language') || 'en',
        commentUser: localStorage.getItem('gistme_username') || 'Anonymous',
        commentText: '',
        quickCommentText: '',
        liveComments: [],
        allComments: [],
        currentArticle: null,
        likeBubbles: [],

        // Swipe Detection
        touchStartX: 0,
        touchStartY: 0,
        touchEndX: 0,
        touchEndY: 0,
        showCategoryPanel: false,
        showCommentsPanel: false,

        // Category Filter
        selectedCategory: 'all',

        // View counts for each article
        viewCounts: ['1.2k', '3.5k', '892', '5.1k', '2.8k', '1.9k'],

        // Category Groups
        // Category Groups
        categoryGroups: [
            {
                nameEn: 'News & Current Affairs',
                nameFr: 'Actualités',
                icon: '📰',
                categories: [
                    { id: 'politics', nameEn: 'Politics', nameFr: 'Politique' },
                    { id: 'crime', nameEn: 'Crime', nameFr: 'Crime' },
                    { id: 'international', nameEn: 'International', nameFr: 'International' },
                    { id: 'society', nameEn: 'Society', nameFr: 'Société' }
                ]
            },
            {
                nameEn: 'Business & Economy',
                nameFr: 'Économie',
                icon: '💼',
                categories: [
                    { id: 'business', nameEn: 'Business', nameFr: 'Affaires' },
                    { id: 'economy', nameEn: 'Economy', nameFr: 'Économie' },
                    { id: 'real_estate', nameEn: 'Real Estate', nameFr: 'Immobilier' }
                ]
            },
            {
                nameEn: 'Education & Jobs',
                nameFr: 'Éducation & Emploi',
                icon: '🎓',
                categories: [
                    { id: 'education', nameEn: 'Education', nameFr: 'Éducation' },
                    { id: 'university', nameEn: 'University', nameFr: 'Université' },
                    { id: 'exam_results', nameEn: 'Exam Results', nameFr: 'Résultats' },
                    { id: 'latest_jobs', nameEn: 'Latest Jobs', nameFr: 'Emplois' },
                    { id: 'scholarships cameroonians can apply', nameEn: 'Scholarships', nameFr: 'Bourses' }
                ]
            },
            {
                nameEn: 'Sports & Entertainment',
                nameFr: 'Sports & Loisirs',
                icon: '⚽',
                categories: [
                    { id: 'sports', nameEn: 'Sports', nameFr: 'Sports' },
                    { id: 'entertainment', nameEn: 'Entertainment', nameFr: 'Divertissement' },
                    { id: 'Mboko music', nameEn: 'Mboko Music', nameFr: 'Musique Mboko' },
                    { id: 'Mboa music', nameEn: 'Mboa Music', nameFr: 'Musique Mboa' },
                    { id: 'music artists', nameEn: 'Music Artists', nameFr: 'Artistes' }
                ]
            },
            {
                nameEn: 'Tech & Science',
                nameFr: 'Tech & Science',
                icon: '💻',
                categories: [
                    { id: 'technology', nameEn: 'Technology', nameFr: 'Technologie' },
                    { id: 'science', nameEn: 'Science', nameFr: 'Science' }
                ]
            },
            {
                nameEn: 'Lifestyle & Culture',
                nameFr: 'Art de vivre',
                icon: '🎨',
                categories: [
                    { id: 'culture', nameEn: 'Culture', nameFr: 'Culture' },
                    { id: 'lifestyle', nameEn: 'Lifestyle', nameFr: 'Mode de vie' },
                    { id: 'religion', nameEn: 'Religion', nameFr: 'Religion' },
                    { id: 'health', nameEn: 'Health', nameFr: 'Santé' }
                ]
            },
            {
                nameEn: 'Local News',
                nameFr: 'Infos Locales',
                icon: '📍',
                categories: [
                    { id: 'happened in Buea', nameEn: 'Buea', nameFr: 'Buea' },
                    { id: 'happened in any region', nameEn: 'Regional', nameFr: 'Régional' }
                ]
            },
            {
                nameEn: 'Environment & Agriculture',
                nameFr: 'Environnement',
                icon: '🌱',
                categories: [
                    { id: 'environment', nameEn: 'Environment', nameFr: 'Environnement' },
                    { id: 'agriculture', nameEn: 'Agriculture', nameFr: 'Agriculture' },
                    { id: 'transportation', nameEn: 'Transportation', nameFr: 'Transport' }
                ]
            },
            {
                nameEn: 'Special',
                nameFr: 'Spécial',
                icon: '⭐',
                categories: [
                    { id: 'concours_launch', nameEn: 'Concours', nameFr: 'Concours' },
                    { id: 'human_interest', nameEn: 'Human Interest', nameFr: 'Intérêt Humain' },
                    { id: 'disgusting', nameEn: 'Shocking', nameFr: 'Choquant' }
                ]
            }
        ],

        // Categories
        categories: [
            {
                id: 'DEVELOPMENT',
                nameEn: 'Development',
                nameFr: 'Développement',
                emoji: '🏗️',
                gradient: 'bg-gradient-to-br from-blue-600 to-blue-800',
                selectedGradient: 'bg-gradient-to-br from-blue-400 to-blue-600'
            },
            {
                id: 'BUSINESS',
                nameEn: 'Business',
                nameFr: 'Affaires',
                emoji: '💼',
                gradient: 'bg-gradient-to-br from-orange-600 to-orange-800',
                selectedGradient: 'bg-gradient-to-br from-orange-400 to-orange-600'
            },
            {
                id: 'SPORTS',
                nameEn: 'Sports',
                nameFr: 'Sports',
                emoji: '⚽',
                gradient: 'bg-gradient-to-br from-green-600 to-green-800',
                selectedGradient: 'bg-gradient-to-br from-green-400 to-green-600'
            },
            {
                id: 'TECH',
                nameEn: 'Technology',
                nameFr: 'Technologie',
                emoji: '💻',
                gradient: 'bg-gradient-to-br from-purple-600 to-purple-800',
                selectedGradient: 'bg-gradient-to-br from-purple-400 to-purple-600'
            },
            {
                id: 'POLITICS',
                nameEn: 'Politics',
                nameFr: 'Politique',
                emoji: '🏛️',
                gradient: 'bg-gradient-to-br from-red-600 to-red-800',
                selectedGradient: 'bg-gradient-to-br from-red-400 to-red-600'
            },
            {
                id: 'ENTERTAINMENT',
                nameEn: 'Entertainment',
                nameFr: 'Divertissement',
                emoji: '🎭',
                gradient: 'bg-gradient-to-br from-pink-600 to-pink-800',
                selectedGradient: 'bg-gradient-to-br from-pink-400 to-pink-600'
            },
        ],

        // Articles (loaded from API)
        articles: [],
        advertisements: [],
        isLoading: false,
        nextPage: null,
        adInterval: 3,
        showingFallback: false,
        hasAppliedFilters: false,

        // Computed
        get filteredArticles() {
            // Inject ads into article stream
            const result = [];
            for (let i = 0; i < this.articles.length; i++) {
                result.push(this.articles[i]);

                // Every N articles, inject an ad if available
                if ((i + 1) % this.adInterval === 0 && this.advertisements.length > 0) {
                    const adIndex = Math.floor((i + 1) / this.adInterval - 1) % this.advertisements.length;
                    result.push({
                        ...this.advertisements[adIndex],
                        isAd: true
                    });
                }
            }
            return result;
        },

        // Methods
        initApp() {
            console.log('GistMe App Initialized');
            this.startCommentSimulation();
            this.fetchAdvertisements();
        },

        async fetchAdvertisements() {
            try {
                const response = await fetch('/api/articles/?category=advertisement');
                if (!response.ok) return;
                const data = await response.json();

                this.advertisements = data.results.map(article => ({
                    id: article.id,
                    headline: this.globalLang === 'fr' ? (article.headline_fr || article.headline_en || article.headline) : (article.headline_en || article.headline_fr || article.headline),
                    headlineEn: article.headline_en,
                    headlineFr: article.headline_fr,
                    summary: this.globalLang === 'fr' ? article.french_summary : article.english_summary,
                    content: this.globalLang === 'fr' ? article.french_summary : article.english_summary,
                    frenchSummary: article.french_summary,
                    englishSummary: article.english_summary,
                    image: article.thumbnails && article.thumbnails.length > 0 ? article.thumbnails[0] : 'https://placehold.co/600x400/000000/FFF',
                    category: 'ADVERTISEMENT',
                    source: article.source_names && article.source_names.length > 0 ? article.source_names[0] : 'Sponsor',
                    timeAgo: this.formatTimeAgo(article.created_at),
                    audioUrl: this.globalLang === 'fr' ? article.french_audio : article.english_audio,
                    viewCount: this.formatNumber(article.view_count),
                    commentCount: this.formatNumber(article.comment_count)
                }));
            } catch (error) {
                console.log('No advertisements available');
            }
        },

        getCategoryName(categoryId) {
            // Find category in groups
            for (const group of this.categoryGroups) {
                const category = group.categories.find(c => c.id === categoryId);
                if (category) {
                    return this.globalLang === 'fr' ? category.nameFr : category.nameEn;
                }
            }
            // Find in main categories list
            const mainCat = this.categories.find(c => c.id === categoryId);
            if (mainCat) {
                return this.globalLang === 'fr' ? mainCat.nameFr : mainCat.nameEn;
            }
            return categoryId; // Fallback
        },

        getCategoryCount(categoryId) {
            // Can't easily calculate with server-side pagination
            return '';
        },

        selectMood(mood) {
            this.currentMood = mood;
            this.moodSelected = true;
            this.fetchArticles(true);
        },

        async fetchArticles(reset = true) {
            if (this.isLoading) return;
            this.isLoading = true;

            try {
                // For pagination, use nextPage URL
                if (!reset && this.nextPage) {
                    await this.fetchFromUrl(this.nextPage, false);
                    return;
                }

                // Progressive fallback sequence
                const hasMood = !!this.currentMood;
                const hasCategory = this.selectedCategory !== 'all';

                if (hasMood && hasCategory) {
                    // Try 1: Mood + Category
                    const results = await this.fetchFromUrl(this.buildUrl(this.currentMood, this.selectedCategory), true);
                    if (results > 0) {
                        console.log('✓ Showing: Mood + Category');
                        return;
                    }

                    // Try 2: Mood only
                    console.log('⚠ No results for Mood + Category, trying Mood only...');
                    const moodResults = await this.fetchFromUrl(this.buildUrl(this.currentMood, null), true);
                    if (moodResults > 0) {
                        console.log('✓ Showing: Mood only');
                        return;
                    }

                    // Try 3: Category only
                    console.log('⚠ No results for Mood, trying Category only...');
                    const categoryResults = await this.fetchFromUrl(this.buildUrl(null, this.selectedCategory), true);
                    if (categoryResults > 0) {
                        console.log('✓ Showing: Category only');
                        return;
                    }

                    // Try 4: All content
                    console.log('⚠ No results for Category, showing all content...');
                    await this.fetchFromUrl(this.buildUrl(null, null), true);
                    console.log('✓ Showing: All content');

                } else if (hasMood) {
                    // Try 1: Mood only
                    const results = await this.fetchFromUrl(this.buildUrl(this.currentMood, null), true);
                    if (results > 0) {
                        console.log('✓ Showing: Mood only');
                        return;
                    }

                    // Try 2: All content
                    console.log('⚠ No results for Mood, showing all content...');
                    await this.fetchFromUrl(this.buildUrl(null, null), true);
                    console.log('✓ Showing: All content');

                } else if (hasCategory) {
                    // Try 1: Category only
                    const results = await this.fetchFromUrl(this.buildUrl(null, this.selectedCategory), true);
                    if (results > 0) {
                        console.log('✓ Showing: Category only');
                        return;
                    }

                    // Try 2: All content
                    console.log('⚠ No results for Category, showing all content...');
                    await this.fetchFromUrl(this.buildUrl(null, null), true);
                    console.log('✓ Showing: All content');

                } else {
                    // No filters, just fetch all
                    await this.fetchFromUrl(this.buildUrl(null, null), true);
                    console.log('✓ Showing: All content');
                }

            } catch (error) {
                console.error('Error in fetchArticles:', error);
            } finally {
                this.isLoading = false;
            }
        },

        buildUrl(mood, category) {
            let url = '/api/articles/';
            const params = new URLSearchParams();

            if (mood) {
                params.append('mood', mood);
            }
            if (category) {
                params.append('category', category);
            }

            if (params.toString()) {
                url += '?' + params.toString();
            }

            return url;
        },

        async fetchFromUrl(url, reset) {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            const newArticles = data.results.map(article => ({
                id: article.id,
                headline: this.globalLang === 'fr' ? (article.headline_fr || article.headline_en || article.headline) : (article.headline_en || article.headline_fr || article.headline),
                headlineEn: article.headline_en,
                headlineFr: article.headline_fr,
                summary: this.globalLang === 'fr' ? article.french_summary : article.english_summary,
                content: this.globalLang === 'fr' ? article.french_summary : article.english_summary,
                frenchSummary: article.french_summary,
                englishSummary: article.english_summary,
                image: article.thumbnails && article.thumbnails.length > 0 ? article.thumbnails[0] : 'https://placehold.co/600x400/000000/FFF',
                category: this.getCategoryName(article.category),
                categoryId: article.category, // Store original ID for lookups
                source: article.source_names && article.source_names.length > 0 ? article.source_names[0] : 'Gist4u',
                sourceNames: article.source_names || [],
                timeAgo: this.formatTimeAgo(article.created_at),
                audioUrl: this.globalLang === 'fr' ? article.french_audio : article.english_audio,
                viewCount: this.formatNumber(article.view_count),
                commentCount: this.formatNumber(article.comment_count),
                rawCommentCount: article.comment_count || 0
            }));

            if (reset) {
                this.articles = newArticles;
                this.currentIndex = 0;
                if (this.articles.length > 0) {
                    this.currentViewCount = this.articles[0].viewCount;
                }
            } else {
                this.articles = [...this.articles, ...newArticles];
            }

            this.nextPage = data.next;

            // Load more if we reach the end of paginated results
            if (!data.next && this.articles.length > 0) {
                // We've reached the end, no more content to load
            }

            return newArticles.length;
        },

        formatTimeAgo(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const seconds = Math.floor((now - date) / 1000);

            let interval = seconds / 31536000;
            if (interval > 1) return Math.floor(interval) + "y ago";

            interval = seconds / 2592000;
            if (interval > 1) return Math.floor(interval) + "mo ago";

            interval = seconds / 86400;
            if (interval > 1) return Math.floor(interval) + "d ago";

            interval = seconds / 3600;
            if (interval > 1) return Math.floor(interval) + "h ago";

            interval = seconds / 60;
            if (interval > 1) return Math.floor(interval) + "m ago";

            return Math.floor(seconds) + "s ago";
        },

        formatNumber(num) {
            if (num >= 1000000) {
                return (num / 1000000).toFixed(1) + 'M';
            }
            if (num >= 1000) {
                return (num / 1000).toFixed(1) + 'k';
            }
            return num.toString();
        },

        switchLanguage(lang) {
            this.globalLang = lang;
            localStorage.setItem('gist4u_language', lang);

            // Update all loaded articles with new language content
            this.articles.forEach(article => {
                // Update headlines
                if (article.headlineEn || article.headlineFr) {
                    article.headline = lang === 'fr' ?
                        (article.headlineFr || article.headlineEn) :
                        (article.headlineEn || article.headlineFr);
                }

                // Update summaries
                article.summary = lang === 'fr' ? article.frenchSummary : article.englishSummary;
                article.content = lang === 'fr' ? article.frenchSummary : article.englishSummary;


                // Update category name
                if (article.categoryId) {
                    article.category = this.getCategoryName(article.categoryId);
                }
            });

            // Update advertisements
            this.advertisements.forEach(ad => {
                // Update headlines
                if (ad.headlineEn || ad.headlineFr) {
                    ad.headline = lang === 'fr' ?
                        (ad.headlineFr || ad.headlineEn) :
                        (ad.headlineEn || ad.headlineFr);
                }

                // Update summaries
                if (ad.frenchSummary && ad.englishSummary) {
                    ad.summary = lang === 'fr' ? ad.frenchSummary : ad.englishSummary;
                    ad.content = lang === 'fr' ? ad.frenchSummary : ad.englishSummary;
                }
            });
        },

        handleScroll(event) {
            const container = event.target;
            const articleHeight = container.clientHeight;
            const newIndex = Math.round(container.scrollTop / articleHeight);

            // Update current index when article changes
            if (newIndex !== this.currentIndex) {
                this.currentIndex = newIndex;
            }
        },

        handleTouchStart(e) {
            this.touchStartX = e.changedTouches[0].clientX;
            this.touchStartY = e.changedTouches[0].clientY;
        },

        handleTouchMove(e) {
            this.touchEndX = e.changedTouches[0].clientX;
            this.touchEndY = e.changedTouches[0].clientY;
        },

        handleTouchEnd() {
            const diffX = this.touchEndX - this.touchStartX;
            const diffY = this.touchEndY - this.touchStartY;
            const screenWidth = window.innerWidth;

            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 80) {
                if (diffX > 0 && this.touchStartX < 100) {
                    this.showCategoryPanel = true;
                }
                else if (diffX < 0 && this.touchStartX > (screenWidth - 100)) {
                    this.showCommentsPanel = true;
                }
            }
        },

        closeCategoryPanel() {
            this.showCategoryPanel = false;
        },

        closeCommentsPanel() {
            this.showCommentsPanel = false;
        },

        selectCategory(category) {
            this.selectedCategory = category;
            this.fetchArticles(true);
            // this.closeCategoryPanel();
            if (this.$refs.feedContainer) {
                this.$refs.feedContainer.scrollTop = 0;
            }
        },

        toggleLike(event) {
            this.isLiked = !this.isLiked;
            this.showDrumEffect = true;

            const rect = event.currentTarget.getBoundingClientRect();

            this.likeBubbles.push({
                x: rect.left + rect.width / 2 - 20,
                y: rect.top - 20
            });

            setTimeout(() => {
                this.likeBubbles.shift();
            }, 1500);

            setTimeout(() => {
                this.showDrumEffect = false;
            }, 800);
        },

        openCommentModal() {
            // Load saved username or default to Anonymous
            this.commentUser = localStorage.getItem('gistme_username') || 'Anonymous';
            this.showCommentModal = true;
        },

        closeCommentModal() {
            this.showCommentModal = false;
            this.commentUser = '';
            this.commentText = '';
        },

        async submitComment() {
            if (!this.commentText.trim() || !this.commentUser.trim()) return;

            const currentArticle = this.filteredArticles[this.currentIndex];
            if (!currentArticle) return;

            // Save username to localStorage if not "Anonymous"
            if (this.commentUser !== 'Anonymous') {
                localStorage.setItem('gistme_username', this.commentUser);
            }

            // Capture values before closing modal
            const commentData = {
                commenter_name: this.commentUser,
                comment_text: this.commentText
            };

            const tempId = 'temp_' + Date.now();
            const newComment = {
                id: tempId,
                commenter_name: commentData.commenter_name,
                comment_text: commentData.comment_text,
                timestamp: new Date().toISOString(),
                user: commentData.commenter_name,
                text: commentData.comment_text,
                time: 'Just now',
                delay: 0
            };

            // Optimistic update
            this.liveComments.push(newComment);
            this.allComments.unshift(newComment);

            // Optimistic count update
            if (currentArticle.rawCommentCount !== undefined) {
                currentArticle.rawCommentCount++;
                currentArticle.commentCount = this.formatNumber(currentArticle.rawCommentCount);
            }

            // Close modal with animation (handled by Alpine x-transition)
            this.closeCommentModal();

            // Send to API
            try {
                const response = await fetch(`/api/articles/${currentArticle.id}/comment/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(commentData)
                });

                if (!response.ok) throw new Error('Failed to post comment');

                // Remove temp comment after delay
                setTimeout(() => {
                    this.liveComments = this.liveComments.filter(c => c.id !== tempId);
                }, 5000);

            } catch (error) {
                console.error('Error posting comment:', error);
                // Revert optimistic update?
                if (currentArticle.rawCommentCount !== undefined) {
                    currentArticle.rawCommentCount--;
                    currentArticle.commentCount = this.formatNumber(currentArticle.rawCommentCount);
                }
            }
        },

        async submitQuickComment() {
            if (!this.quickCommentText.trim()) return;

            // Load saved username or default to Anonymous
            const username = localStorage.getItem('gistme_username') || 'Anonymous';
            const currentArticle = this.filteredArticles[this.currentIndex];

            if (!currentArticle) return;

            const tempId = 'temp_' + Date.now();
            const newComment = {
                id: tempId,
                commenter_name: username,
                comment_text: this.quickCommentText,
                timestamp: new Date().toISOString(),
                user: username,
                text: this.quickCommentText,
                time: 'Just now',
                delay: 0
            };

            // Optimistic update
            this.liveComments.push(newComment);
            this.allComments.unshift(newComment);

            // Optimistic count update
            if (currentArticle.rawCommentCount !== undefined) {
                currentArticle.rawCommentCount++;
                currentArticle.commentCount = this.formatNumber(currentArticle.rawCommentCount);
            }

            const commentText = this.quickCommentText;
            this.quickCommentText = '';

            // Close side panel with animation
            this.closeCommentsPanel();

            // Send to API
            try {
                const response = await fetch(`/api/articles/${currentArticle.id}/comment/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        commenter_name: username,
                        comment_text: commentText
                    })
                });

                if (!response.ok) throw new Error('Failed to post comment');

                // Remove temp comment after delay
                setTimeout(() => {
                    this.liveComments = this.liveComments.filter(c => c.id !== tempId);
                }, 5000);

            } catch (error) {
                console.error('Error posting comment:', error);
                // Revert optimistic update
                if (currentArticle.rawCommentCount !== undefined) {
                    currentArticle.rawCommentCount--;
                    currentArticle.commentCount = this.formatNumber(currentArticle.rawCommentCount);
                }
            }
        },

        async startCommentSimulation() {
            // Simulate incoming comments for "liveness"
            let dummyComments = [];

            try {
                const response = await fetch('/static/web/data/dummy_comments.json');
                if (response.ok) {
                    dummyComments = await response.json();
                } else {
                    console.warn('Failed to load dummy comments, using fallback');
                    dummyComments = [
                        { "user": "Sarah", "text": "This is wild! 😱" },
                        { "user": "Jean", "text": "Finally some good news." },
                        { "user": "Ahmed", "text": "Does anyone know when this starts?" },
                        { "user": "Chioma", "text": "Sharing this right now." },
                        { "user": "Paul", "text": "Cameroon to the moon! 🚀" },
                        { "user": "Marc", "text": "Enfin une bonne nouvelle !" },
                        { "user": "Aisha", "text": "Je vais partager ça." },
                        { "user": "Chantal", "text": "C'est incroyable !" },
                        { "user": "Boubacar", "text": "On verra si c'est vrai." },
                        { "user": "Grace", "text": "🇨🇲🇨🇲🇨🇲" },
                        { "user": "Eric", "text": "Na so we go see am." },
                        { "user": "Patience", "text": "I no too believe dis news oo." },
                        { "user": "Frank", "text": "Wahala for who no go read well." },
                        { "user": "Brenda", "text": "Na wa oo!" },
                        { "user": "Junior", "text": "Cette chose don chop money pass." },
                    ];
                }
            } catch (e) {
                console.error('Error fetching dummy comments:', e);
                return;
            }

            if (dummyComments.length === 0) return;

            setInterval(() => {
                if (Math.random() > 0.7) {
                    const randomComment = dummyComments[Math.floor(Math.random() * dummyComments.length)];
                    const newComment = {
                        ...randomComment,
                        time: 'Just now',
                        delay: 0,
                        id: Date.now()
                    };
                    this.liveComments.push(newComment);
                    this.allComments.unshift(newComment);

                    // Remove from floating stream after 5s
                    setTimeout(() => {
                        this.liveComments.shift();
                    }, 5000);
                }
            }, 3000);
        },

        openReader(article) {
            this.currentArticle = article;
            this.showReader = true;
            this.isPlaying = false;
            this.audioProgress = 0;
        },

        closeReader() {
            this.showReader = false;
            this.stopAudio();
        },

        toggleAudio() {
            this.isPlaying = !this.isPlaying;
            if (this.isPlaying) {
                this.simulateAudioProgress();
            }
        },

        stopAudio() {
            this.isPlaying = false;
            this.audioProgress = 0;
        },

        simulateAudioProgress() {
            if (!this.isPlaying) return;

            if (this.audioProgress < 100) {
                this.audioProgress += 0.5;
                requestAnimationFrame(() => this.simulateAudioProgress());
            } else {
                this.isPlaying = false;
                this.audioProgress = 0;
            }
        },

        getArticleSources() {
            if (!this.currentArticle || !this.currentArticle.sourceNames) {
                return [];
            }
            return this.currentArticle.sourceNames;
        },


        initLiquidButton(canvas) {
            const ctx = canvas.getContext('2d');
            let width, height;
            let time = Math.random() * 100; // Random start time for variety

            const resize = () => {
                width = canvas.width = canvas.offsetWidth;
                height = canvas.height = canvas.offsetHeight;
            };

            // Initial resize
            resize();

            // Observer for resize
            const observer = new ResizeObserver(resize);
            observer.observe(canvas);

            const animate = () => {
                // Check if canvas is still in DOM
                if (!canvas.isConnected) {
                    observer.disconnect();
                    return;
                }

                ctx.clearRect(0, 0, width, height);

                const centerX = width / 2;
                const centerY = height / 2;
                // Make the blob fill most of the canvas but leave room for movement
                const radius = (Math.min(width, height) / 2) * 0.75;

                ctx.beginPath();
                // Draw the blob
                for (let i = 0; i <= 360; i += 5) {
                    const angle = (i * Math.PI) / 180;

                    // Organic movement
                    const w1 = Math.sin(angle * 3 + time * 2) * (radius * 0.1);
                    const w2 = Math.cos(angle * 5 - time * 3) * (radius * 0.05);
                    const w3 = Math.sin(angle * 2 + time * 5) * (radius * 0.05);

                    const r = radius + w1 + w2 + w3;
                    const x = centerX + Math.cos(angle) * r;
                    const y = centerY + Math.sin(angle) * r;

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }

                ctx.closePath();
                ctx.fillStyle = '#FFDE00'; // Brand Yellow
                ctx.fill();

                // Add glow/shadow
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#FFDE00';

                time += 0.03;
                requestAnimationFrame(animate);
            };

            animate();
        },

        initWaveform(canvas) {
            const ctx = canvas.getContext('2d');
            let width, height;
            let time = 0;

            const resize = () => {
                width = canvas.width = canvas.offsetWidth;
                height = canvas.height = canvas.offsetHeight;
            };

            resize();
            const observer = new ResizeObserver(resize);
            observer.observe(canvas);

            const animate = () => {
                if (!canvas.isConnected) {
                    observer.disconnect();
                    return;
                }

                ctx.clearRect(0, 0, width, height);

                // Configuration
                const centerY = height / 2;
                const baseAmplitude = this.isPlaying ? height * 0.4 : height * 0.1;
                const speed = this.isPlaying ? 0.2 : 0.05;

                // Draw multiple waves
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255, 222, 0, ${1 - i * 0.2})`; // Brand yellow with fading opacity
                    ctx.lineWidth = 2;

                    for (let x = 0; x < width; x++) {
                        // Mix of sine waves for organic look
                        const frequency = 0.02 + i * 0.01;
                        const phase = time * speed + i * 2;

                        // Modulate amplitude based on x position (taper at ends)
                        const envelope = Math.sin((x / width) * Math.PI);

                        const y = centerY +
                            Math.sin(x * frequency + phase) * baseAmplitude * envelope *
                            (this.isPlaying ? (1 + Math.sin(time * 0.5) * 0.3) : 0.5); // Add "breathing" when playing

                        if (x === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                }

                time += 1;
                requestAnimationFrame(animate);
            };

            animate();
        }
    }
}
