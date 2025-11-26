const FeedAPI = {
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
    }
};
