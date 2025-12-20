// Article Reader Page - AlpineJS Logic
// Handles play/pause, share, bookmark, and AI chat functionality

function articleApp() {
    return {
        // Article data
        article: null,

        // State
        isPlaying: false,
        isBookmarked: false,
        showShareModal: false,
        showChatModal: false,
        linkCopied: false,
        shareImageUrl: null,

        // Chat state
        chatMessages: [],
        chatInput: '',
        isTyping: false,
        aiResponses: [],
        currentResponseIndex: 0,

        // Quick questions for chat
        quickQuestions: [
            "What's the deadline?",
            "Am I eligible?",
            "How do I apply?",
            "What does it cover?",
            "Tell me more"
        ],

        // Toast state
        showToast: false,
        toastMessage: '',
        toastType: 'success',

        // Related articles
        relatedArticles: [],

        // Timeline items
        timelineItems: [],

        // Initialize
        async init() {
            // Get article ID from URL (e.g., /en/article/123/)
            const pathMatch = window.location.pathname.match(/\/article\/(\d+)\/?/);
            const articleId = pathMatch ? pathMatch[1] : null;

            // Get language from URL
            const langMatch = window.location.pathname.match(/^\/(en|fr)\//);
            this.lang = langMatch ? langMatch[1] : 'en';

            if (articleId) {
                await this.loadArticle(articleId);
                await this.loadRelatedArticles();
            } else {
                console.error('[ArticleApp] No article ID found in URL');
            }

            // Check if bookmarked
            const bookmarks = JSON.parse(localStorage.getItem('gist4u_bookmarks') || '[]');
            this.isBookmarked = bookmarks.includes(parseInt(articleId));

            console.log('[ArticleApp] Initialized with article:', this.article?.title);
        },

        // Language helper
        lang: 'en',

        // Load article from API
        async loadArticle(articleId) {
            try {
                const response = await fetch(`/api/articles/${articleId}/`);
                if (response.ok) {
                    const data = await response.json();

                    // Transform API data to component format
                    this.article = {
                        id: data.id,
                        title: this.lang === 'fr'
                            ? (data.headline_fr || data.headline_en || data.headline)
                            : (data.headline_en || data.headline_fr || data.headline),
                        headline: data.category_details?.name_en || 'NEWS',
                        description: this.lang === 'fr'
                            ? (data.french_summary || data.english_summary)
                            : (data.english_summary || data.french_summary),
                        thumbnail: data.thumbnails && data.thumbnails.length > 0
                            ? data.thumbnails[0]
                            : 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800',
                        source: data.source_names && data.source_names.length > 0
                            ? data.source_names[0]
                            : 'Gist4U',
                        published_date: this.formatDate(data.created_at),
                        read_time: this.estimateReadTime(data.english_summary || data.french_summary),
                        view_count: data.view_count || 0,
                        audio_url: this.lang === 'fr' ? data.french_audio : data.english_audio,
                        deadline: data.deadline,
                        category_emoji: data.category_details?.emoji || ''
                    };

                    // Store raw data for audio
                    this.articleData = data;

                    // Initialize chat with welcome message
                    this.chatMessages = [{
                        id: 1,
                        role: "assistant",
                        content: this.lang === 'fr'
                            ? "Bonjour! Je suis là pour vous aider à mieux comprendre cet article. Que voulez-vous savoir?"
                            : "Hello! I'm here to help you understand this article better. What would you like to know?",
                        timestamp: this.formatTime(new Date())
                    }];
                } else {
                    console.error('[ArticleApp] Failed to load article:', response.status);
                    this.showToastMessage('Failed to load article', 'error');
                }
            } catch (error) {
                console.error('[ArticleApp] Error loading article:', error);
                this.showToastMessage('Error loading article', 'error');
            }
        },

        // Load related articles from API
        async loadRelatedArticles() {
            try {
                // Get articles from same category
                let url = '/api/articles/?page_size=5';
                if (this.article && this.articleData?.category) {
                    url += `&category=${this.articleData.category}`;
                }

                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    const articles = data.results || data;

                    // Filter out current article and limit to 4
                    this.relatedArticles = articles
                        .filter(a => a.id !== this.article?.id)
                        .slice(0, 4)
                        .map(a => ({
                            id: a.id,
                            title: this.lang === 'fr'
                                ? (a.headline_fr || a.headline_en || a.headline)
                                : (a.headline_en || a.headline_fr || a.headline),
                            headline: a.category_details?.name_en || 'NEWS',
                            thumbnail: a.thumbnails && a.thumbnails.length > 0
                                ? a.thumbnails[0]
                                : 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=400'
                        }));
                }
            } catch (error) {
                console.error('[ArticleApp] Error loading related articles:', error);
            }

            // Load timeline items (recent articles from same main category)
            await this.loadTimeline();
        },

        // Load timeline (recent articles)
        async loadTimeline() {
            try {
                const mainCategory = this.articleData?.category_details?.main_category;
                let url = '/api/articles/?page_size=4';
                if (mainCategory) {
                    url += `&main_category=${mainCategory}`;
                }

                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    const articles = data.results || data;

                    // Filter out current article
                    this.timelineItems = articles
                        .filter(a => a.id !== this.article?.id)
                        .slice(0, 4)
                        .map(a => ({
                            id: a.id,
                            title: this.lang === 'fr'
                                ? (a.headline_fr || a.headline_en || a.headline)
                                : (a.headline_en || a.headline_fr || a.headline),
                            category: a.category_details?.name_en || 'NEWS',
                            date: this.getRelativeDate(a.created_at)
                        }));
                }
            } catch (error) {
                console.error('[ArticleApp] Error loading timeline:', error);
            }
        },

        // Get relative date (Today, Yesterday, Dec 15)
        getRelativeDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            const now = new Date();
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return this.lang === 'fr' ? "Aujourd'hui" : 'Today';
            if (diffDays === 1) return this.lang === 'fr' ? 'Hier' : 'Yesterday';

            return date.toLocaleDateString(this.lang === 'fr' ? 'fr-FR' : 'en-US', {
                month: 'short',
                day: 'numeric'
            });
        },

        // Format date helper
        formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString(this.lang === 'fr' ? 'fr-FR' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },

        // Estimate read time
        estimateReadTime(text) {
            if (!text) return '2 min read';
            const words = text.split(/\s+/).length;
            const minutes = Math.ceil(words / 200); // Average reading speed
            return `${minutes} min read`;
        },

        // Format time helper
        formatTime(date) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        },

        // Go back to previous page
        goBack() {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = `/${this.lang}/feed/`;
            }
        },

        // Navigate to related article
        goToArticle(articleId) {
            window.location.href = `/${this.lang}/article/${articleId}/`;
        },

        // Audio element
        currentAudio: null,

        // ===============================================
        // PLAY/PAUSE FUNCTIONALITY
        // ===============================================
        togglePlay() {
            const audioUrl = this.article?.audio_url;

            if (!audioUrl) {
                this.showToastMessage(this.lang === 'fr' ? 'Audio non disponible' : 'Audio not available', 'info');
                return;
            }

            if (this.isPlaying && this.currentAudio) {
                this.currentAudio.pause();
                this.isPlaying = false;
                this.showToastMessage(this.lang === 'fr' ? 'Pause' : 'Paused', 'info');
            } else {
                if (!this.currentAudio) {
                    this.currentAudio = new Audio(audioUrl);
                    this.currentAudio.onended = () => {
                        this.isPlaying = false;
                    };
                }
                this.currentAudio.play();
                this.isPlaying = true;
                this.showToastMessage(this.lang === 'fr' ? 'Lecture en cours...' : 'Playing audio...', 'info');
            }
        },

        // ===============================================
        // BOOKMARK FUNCTIONALITY
        // ===============================================
        toggleBookmark() {
            this.isBookmarked = !this.isBookmarked;

            // Save to localStorage for persistence
            const bookmarks = JSON.parse(localStorage.getItem('gist4u_bookmarks') || '[]');

            if (this.isBookmarked) {
                if (!bookmarks.includes(this.article.id)) {
                    bookmarks.push(this.article.id);
                }
                this.showToastMessage('Bookmarked!', 'success');
            } else {
                const index = bookmarks.indexOf(this.article.id);
                if (index > -1) {
                    bookmarks.splice(index, 1);
                }
                this.showToastMessage('Removed from bookmarks', 'info');
            }

            localStorage.setItem('gist4u_bookmarks', JSON.stringify(bookmarks));
            console.log('[ArticleApp] Bookmark toggled:', this.isBookmarked);
        },

        // ===============================================
        // SHARE FUNCTIONALITY
        // ===============================================
        openShareModal() {
            this.showShareModal = true;
            this.linkCopied = false;
            this.shareImageUrl = null;
        },

        closeShareModal() {
            this.showShareModal = false;
        },

        getShareUrl() {
            if (!this.article?.id) return window.location.href;
            return `${window.location.origin}/${this.lang}/article/${this.article.id}/`;
        },

        getShareText() {
            if (!this.article?.title) return 'Read on Gist4U';
            return `${this.article.title} - Read on Gist4U`;
        },

        async copyLink() {
            try {
                await navigator.clipboard.writeText(this.getShareUrl());
                this.linkCopied = true;
                this.showToastMessage('Link copied!', 'success');

                setTimeout(() => {
                    this.linkCopied = false;
                }, 3000);
            } catch (error) {
                console.error('[ArticleApp] Failed to copy:', error);
                this.showToastMessage('Failed to copy link', 'info');
            }
        },

        shareToWhatsApp() {
            const text = encodeURIComponent(this.getShareText() + '\n' + this.getShareUrl());
            window.open(`https://wa.me/?text=${text}`, '_blank');
        },

        shareToTwitter() {
            const text = encodeURIComponent(this.getShareText());
            const url = encodeURIComponent(this.getShareUrl());
            window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
        },

        async shareNative() {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: this.article.title,
                        text: this.article.description.substring(0, 100) + '...',
                        url: this.getShareUrl()
                    });
                    console.log('[ArticleApp] Shared successfully');
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        console.error('[ArticleApp] Share failed:', error);
                    }
                }
            } else {
                this.openShareModal();
            }
        },

        // Share as image - generates a card image
        async generateShareImage() {
            this.showToastMessage('Generating image...', 'info');

            // Create canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = 800;
            canvas.height = 600;

            // Draw background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#111111');
            gradient.addColorStop(1, '#1f1f1f');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Load and draw thumbnail
            try {
                const img = await this.loadImage(this.article.thumbnail);
                const imgWidth = canvas.width - 80;
                const imgHeight = 300;

                // Draw rounded image
                ctx.save();
                this.roundRect(ctx, 40, 40, imgWidth, imgHeight, 20);
                ctx.clip();
                ctx.drawImage(img, 40, 40, imgWidth, imgHeight);
                ctx.restore();
            } catch (e) {
                // Draw placeholder if image fails
                ctx.fillStyle = '#333';
                this.roundRect(ctx, 40, 40, canvas.width - 80, 300, 20);
                ctx.fill();
            }

            // Draw category badge
            ctx.fillStyle = '#FACC15';
            this.roundRect(ctx, 40, 360, 120, 28, 14);
            ctx.fill();

            ctx.fillStyle = '#111';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.fillText(this.article.headline || 'ARTICLE', 58, 378);

            // Draw title
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 28px Inter, sans-serif';
            this.wrapText(ctx, this.article.title, 40, 420, canvas.width - 80, 36);

            // Draw footer
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '14px Inter, sans-serif';
            ctx.fillText('gist4u.reepls.com', 40, 560);

            // Draw Gist4U logo
            ctx.fillStyle = '#FACC15';
            ctx.font = 'bold 18px Inter, sans-serif';
            ctx.fillText('Gist4U', canvas.width - 100, 560);

            // Convert to image URL
            this.shareImageUrl = canvas.toDataURL('image/png');
            console.log('[ArticleApp] Share image generated');
        },

        loadImage(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        },

        roundRect(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        },

        wrapText(ctx, text, x, y, maxWidth, lineHeight) {
            const words = text.split(' ');
            let line = '';
            let currentY = y;

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);

                if (metrics.width > maxWidth && n > 0) {
                    ctx.fillText(line, x, currentY);
                    line = words[n] + ' ';
                    currentY += lineHeight;

                    if (currentY > y + lineHeight * 2) {
                        ctx.fillText(line.trim() + '...', x, currentY);
                        return;
                    }
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, x, currentY);
        },

        downloadShareImage() {
            if (!this.shareImageUrl) return;

            const link = document.createElement('a');
            link.download = `gist4u-${this.article.id}.png`;
            link.href = this.shareImageUrl;
            link.click();

            this.showToastMessage('Image downloaded!', 'success');
        },

        // ===============================================
        // AI CHAT FUNCTIONALITY
        // ===============================================
        openChatModal() {
            this.showChatModal = true;

            // Scroll to bottom after modal opens
            setTimeout(() => {
                this.scrollChatToBottom();
            }, 100);
        },

        closeChatModal() {
            this.showChatModal = false;
        },

        scrollChatToBottom() {
            // Use $refs if available, fallback to querySelector
            this.$nextTick(() => {
                const container = this.$refs.chatMessages || document.querySelector('.chat-messages');
                if (container) {
                    container.scrollTo({
                        top: container.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            });
        },

        sendMessage() {
            const message = this.chatInput.trim();
            if (!message) return;

            // Add user message
            this.chatMessages.push({
                id: Date.now(),
                role: 'user',
                content: message,
                timestamp: this.formatTime(new Date())
            });

            this.chatInput = '';

            // Scroll after user message
            this.scrollChatToBottom();

            // Simulate AI typing
            this.isTyping = true;
            this.scrollChatToBottom();

            setTimeout(() => {
                this.isTyping = false;

                // Add AI response
                const responseIndex = this.currentResponseIndex % this.aiResponses.length;
                this.chatMessages.push({
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: this.aiResponses[responseIndex],
                    timestamp: this.formatTime(new Date())
                });

                this.currentResponseIndex++;

                setTimeout(() => {
                    this.scrollChatToBottom();
                }, 50);
            }, 1200 + Math.random() * 800);
        },

        sendQuickQuestion(question) {
            this.chatInput = question;
            this.sendMessage();
        },

        handleChatKeydown(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.sendMessage();
            }
        },

        // Quick message from inline input (bottom bar)
        sendQuickMessage() {
            const message = this.chatInput.trim();
            if (!message) return;

            // Open chat modal and send message
            this.showChatModal = true;

            // Wait for modal to open, then send
            setTimeout(() => {
                this.sendMessage();
                this.scrollChatToBottom();
            }, 150);
        },

        // Input focus handler
        onInputFocus() {
            // Optional: could show a hint or expand the input
            console.log('[ArticleApp] Chat input focused');
        },

        // Auto-resize textarea for chat modal
        autoResizeTextarea(event) {
            const textarea = event.target;
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        },

        // ===============================================
        // TOAST NOTIFICATIONS
        // ===============================================
        showToastMessage(message, type = 'success') {
            this.toastMessage = message;
            this.toastType = type;
            this.showToast = true;

            setTimeout(() => {
                this.showToast = false;
            }, 2500);
        }
    };
}

// Auto-register when included
if (typeof window !== 'undefined') {
    window.articleApp = articleApp;
}
