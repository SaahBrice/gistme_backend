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
        audioPlayer: null,
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

        // Articles (loaded from API)
        articles: [],
        advertisements: [],
        isLoading: false,
        nextPage: null,
        adInterval: 3,
        showingFallback: false,
        hasAppliedFilters: false,

        // Spread static config
        ...FeedConfig,

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

        // Spread actions
        ...FeedActions
    }
}
