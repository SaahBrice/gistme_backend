const FeedActions = {
    initApp() {
        console.log('GistMe App Initialized');
        this.startCommentSimulation();
        this.fetchAdvertisements();
        this.loadCategoryPreferences();
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
            frenchAudio: article.french_audio,
            englishAudio: article.english_audio,
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
            article.audioUrl = lang === 'fr' ? article.frenchAudio : article.englishAudio;


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

        // Calculate distance from bottom
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

        // Update current index when article changes
        if (newIndex !== this.currentIndex) {
            this.currentIndex = newIndex;

            // Track article views for Pro banner (only for non-ads)
            const currentItem = this.filteredArticles[newIndex];
            if (currentItem && !currentItem.isAd) {
                this.trackArticleView();
            }
        }

        // Load more articles when approaching the end (index-based OR scroll-based)
        const remainingArticles = this.filteredArticles.length - newIndex;
        const nearBottom = distanceFromBottom < 200; // Within 200px of bottom
        const shouldLoadMore = (remainingArticles <= 5 || nearBottom) && this.nextPage && !this.isLoading;

        if (shouldLoadMore) {
            console.log(`📥 Loading more articles... (remaining: ${remainingArticles}, distanceFromBottom: ${distanceFromBottom}px)`);
            this.fetchArticles(false);
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

    // Category Preferences Management
    async loadCategoryPreferences() {
        const token = localStorage.getItem('fcmToken');
        if (!token) {
            console.log('No FCM token found, cannot load preferences');
            return;
        }

        try {
            const response = await fetch(`/api/fcm/preferences/?token=${encodeURIComponent(token)}`);
            if (response.ok) {
                const data = await response.json();
                this.categoryPreferences = data.preferences || [];
                console.log('✓ Loaded category preferences:', this.categoryPreferences);
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    },

    async toggleCategoryPreference(categoryId) {
        const token = localStorage.getItem('fcmToken');

        if (!token) {
            // Show toast that they need to enable notifications
            this.showToast(this.globalLang === 'fr'
                ? 'Activez les notifications pour sauvegarder vos préférences'
                : 'Enable notifications to save your preferences');
            return;
        }

        // Optimistic UI update
        const wasPreferred = this.categoryPreferences.includes(categoryId);
        if (wasPreferred) {
            this.categoryPreferences = this.categoryPreferences.filter(id => id !== categoryId);
        } else {
            this.categoryPreferences = [...this.categoryPreferences, categoryId];
        }

        try {
            const response = await fetch('/api/fcm/preferences/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify({
                    token: token,
                    category_id: categoryId
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.categoryPreferences = data.preferences;

                // Show subtle feedback
                const categoryName = this.getCategoryName(categoryId);
                const message = data.status === 'added'
                    ? (this.globalLang === 'fr' ? `${categoryName} ajouté aux préférences` : `${categoryName} added to preferences`)
                    : (this.globalLang === 'fr' ? `${categoryName} retiré des préférences` : `${categoryName} removed from preferences`);
                this.showToast(message);
            } else {
                // Revert on error
                if (wasPreferred) {
                    this.categoryPreferences = [...this.categoryPreferences, categoryId];
                } else {
                    this.categoryPreferences = this.categoryPreferences.filter(id => id !== categoryId);
                }
                console.error('Failed to toggle preference');
            }
        } catch (error) {
            // Revert on error
            if (wasPreferred) {
                this.categoryPreferences = [...this.categoryPreferences, categoryId];
            } else {
                this.categoryPreferences = this.categoryPreferences.filter(id => id !== categoryId);
            }
            console.error('Error toggling preference:', error);
        }
    },

    isCategoryPreferred(categoryId) {
        return this.categoryPreferences.includes(categoryId);
    },

    showToast(message) {
        // Create a simple toast notification
        const existingToast = document.getElementById('preference-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.id = 'preference-toast';
        toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-900 text-yellow-500 text-sm font-semibold rounded-full shadow-lg z-50 animate-fade-in-up';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('animate-fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },

    getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
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
        // Keep the state toggle if needed for other logic, but UI is now static
        this.isLiked = !this.isLiked;
        this.showDrumEffect = true;

        // Play Drum Sound
        const drumSound = new Audio('/static/web/audio/drum.mp3');
        drumSound.volume = 0.5;
        drumSound.play().catch(e => console.log('Audio play failed:', e));

        // Trigger Vibration (Haptic Feedback)
        if (navigator.vibrate) {
            navigator.vibrate(50); // 50ms vibration
        }

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
        if (this.isPlaying) {
            this.pauseAudio();
        } else {
            this.playAudio();
        }
    },

    playAudio() {
        const url = this.currentArticle?.audioUrl;
        if (!url) {
            // Optional: Show a toast or alert
            console.log("Audio unavailable");
            return;
        }

        if (!this.audioPlayer || this.audioPlayer.src !== url) {
            if (this.audioPlayer) {
                this.audioPlayer.pause();
            }
            this.audioPlayer = new Audio(url);
            this.audioPlayer.addEventListener('timeupdate', () => {
                if (this.audioPlayer.duration) {
                    this.audioProgress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
                }
            });
            this.audioPlayer.addEventListener('ended', () => {
                this.isPlaying = false;
                this.audioProgress = 0;
            });
            this.audioPlayer.addEventListener('error', (e) => {
                console.error("Audio error", e);
                this.isPlaying = false;
            });
        }

        this.audioPlayer.play().catch(e => {
            console.error("Audio play failed", e);
            this.isPlaying = false;
        });
        this.isPlaying = true;
    },

    pauseAudio() {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
        }
        this.isPlaying = false;
    },

    stopAudio() {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer.currentTime = 0;
        }
        this.isPlaying = false;
        this.audioProgress = 0;
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
    },

    openShareModal() {
        this.showShareModal = true;
        // Wait for modal to render then generate card
        setTimeout(() => {
            this.generateGistCard();
        }, 100);
    },

    closeShareModal() {
        this.showShareModal = false;
        this.gistCardImage = null;
    },

    async generateGistCard() {
        const canvas = document.getElementById('gistCardCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const article = this.currentArticle || this.filteredArticles[this.currentIndex];

        // Set canvas size (Instagram Story ratio 9:16)
        canvas.width = 1080;
        canvas.height = 1920;

        // --- COLORS & FONTS ---
        const bgDark = '#0f0f0f';
        const bgCard = '#1a1a1a';
        const textWhite = '#ffffff';
        const textGray = '#a0a0a0';
        const accentColor = '#FFDE00'; // Brand Yellow

        // 1. Background
        ctx.fillStyle = bgDark;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Header (Top 10% - 192px)
        const headerHeight = 192;

        // Branding (Left)
        ctx.font = 'bold 60px "Black Ops One", sans-serif';
        ctx.fillStyle = accentColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('GIST4U', 60, headerHeight / 2);

        // Category Badge (Right)
        ctx.font = 'bold 40px Inter, sans-serif';
        ctx.fillStyle = textWhite;
        ctx.textAlign = 'right';
        const categoryText = article.category.toUpperCase();
        ctx.fillText(categoryText, canvas.width - 60, headerHeight / 2);

        // Category Underline
        const catWidth = ctx.measureText(categoryText).width;
        ctx.fillStyle = accentColor;
        ctx.fillRect(canvas.width - 60 - catWidth, (headerHeight / 2) + 25, catWidth, 4);


        // 3. Image Area (Next 45% - ~864px)
        const imageY = headerHeight;
        const imageHeight = 864;

        // Placeholder background for image area
        ctx.fillStyle = '#222';
        ctx.fillRect(0, imageY, canvas.width, imageHeight);

        if (article.image) {
            try {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = article.image;
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });

                // Draw image covering the area (object-fit: cover)
                const scale = Math.max(canvas.width / img.width, imageHeight / img.height);
                const x = (canvas.width / 2) - (img.width / 2) * scale;
                const y = (imageY + imageHeight / 2) - (img.height / 2) * scale;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

                // Gradient Overlay at the bottom of the image for smooth transition
                const gradient = ctx.createLinearGradient(0, imageY + imageHeight - 200, 0, imageY + imageHeight);
                gradient.addColorStop(0, 'rgba(15, 15, 15, 0)');
                gradient.addColorStop(1, bgDark);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, imageY + imageHeight - 200, canvas.width, 200);

            } catch (e) {
                console.error("Failed to load image for canvas", e);
                // Fallback text if image fails
                ctx.fillStyle = '#333';
                ctx.textAlign = 'center';
                ctx.font = '40px Inter';
                ctx.fillText('Image Unavailable', canvas.width / 2, imageY + imageHeight / 2);
            }
        }

        // 4. Content Area (Bottom 45%)
        let contentY = imageY + imageHeight + 40;
        const padding = 60;
        const contentWidth = canvas.width - (padding * 2);

        // Headline
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = textWhite;
        ctx.font = '900 70px Inter, sans-serif'; // Large bold headline

        // Wrap and truncate headline (Max 3 lines)
        contentY = this.wrapText(ctx, article.headline, padding, contentY, contentWidth, 85, 3);

        // Spacer
        contentY += 40;

        // Summary
        ctx.fillStyle = textGray;
        ctx.font = '400 45px Inter, sans-serif'; // Readable summary

        // Wrap and truncate summary (Max 5 lines)
        contentY = this.wrapText(ctx, article.summary, padding, contentY, contentWidth, 65, 5);

        // 5. Footer (Bottom)
        const footerY = canvas.height - 100;

        // Divider line
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, footerY - 40);
        ctx.lineTo(canvas.width - padding, footerY - 40);
        ctx.stroke();

        // "Read more"
        ctx.fillStyle = accentColor;
        ctx.font = 'bold 35px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Read more on Gist4u', padding, footerY);

        // Date/Time
        ctx.fillStyle = '#666';
        ctx.textAlign = 'right';
        ctx.fillText(article.timeAgo || 'Just now', canvas.width - padding, footerY);

        // Export
        this.gistCardImage = canvas.toDataURL('image/png');
    },

    wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
        const words = text.split(' ');
        let line = '';
        let lineCount = 1;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && n > 0) {
                // Check if we are at the last allowed line
                if (lineCount >= maxLines) {
                    // Truncate and add ellipsis
                    while (ctx.measureText(line + '...').width > maxWidth) {
                        line = line.slice(0, -1);
                    }
                    ctx.fillText(line.trim() + '...', x, y);
                    return y + lineHeight; // Stop processing
                }

                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
                lineCount++;
            } else {
                line = testLine;
            }
        }
        // Draw the last line
        ctx.fillText(line, x, y);
        return y + lineHeight;
    },

    async shareGistCard() {
        if (!this.gistCardImage) return;

        try {
            const blob = await (await fetch(this.gistCardImage)).blob();
            const file = new File([blob], 'gist-card.png', { type: 'image/png' });

            if (navigator.share) {
                await navigator.share({
                    title: 'Gist4u',
                    text: 'Check out this gist!',
                    files: [file]
                });
            } else {
                // Fallback: Download
                const link = document.createElement('a');
                link.download = 'gist-card.png';
                link.href = this.gistCardImage;
                link.click();
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    },

    // Pro Banner Methods
    trackArticleView() {
        // Don't track if banner was dismissed this session
        if (this.proBannerDismissed) return;

        this.articlesViewedCount++;
        sessionStorage.setItem('articlesViewedCount', this.articlesViewedCount.toString());

        // Show banner every N articles
        if (this.articlesViewedCount % this.proBannerInterval === 0) {
            this.showProBanner = true;
            // Auto-hide after 10 seconds if not interacted with
            setTimeout(() => {
                this.showProBanner = false;
            }, 10000);
        }
    },

    dismissProBanner() {
        this.showProBanner = false;
        this.proBannerDismissed = true;
        sessionStorage.setItem('proBannerDismissed', 'true');
    },

    openSubscriptionModal() {
        this.showProBanner = false;
        // Open pricing section with full URL (works in PWA)
        const pricingUrl = window.location.origin + '/#pricing';
        window.open(pricingUrl, '_blank');
    }
};

