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

        // Initialize
        init() {
            // Load dummy data if available
            if (typeof window.articleDummyData !== 'undefined') {
                this.article = window.articleDummyData.article;
                this.chatMessages = [...window.articleDummyData.chatMessages];
                this.aiResponses = [...window.articleDummyData.aiResponses];
                this.isBookmarked = this.article.bookmarked;
            } else {
                // Fallback article data
                this.article = {
                    id: 1001,
                    title: "Google Scholarship 2025: Full Funding for African Students",
                    headline: "SCHOLARSHIP",
                    description: "Google is offering fully-funded scholarships for students across Africa to pursue their dreams in technology and computer science at top universities worldwide.",
                    thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800",
                    source: "Google Africa",
                    published_date: "December 18, 2024",
                    read_time: "5 min read",
                    view_count: 2847
                };

                this.chatMessages = [{
                    id: 1,
                    role: "assistant",
                    content: "Hello! I'm here to help you understand this article better. What would you like to know?",
                    timestamp: this.formatTime(new Date())
                }];

                this.aiResponses = [
                    "That's a great question! The scholarship typically has a deadline in March.",
                    "The scholarship covers full tuition, accommodation, and living expenses.",
                    "You can apply through the official Google Africa portal.",
                    "All African citizens with strong academics are eligible.",
                    "Would you like me to explain any specific aspect in detail?"
                ];
            }

            console.log('[ArticleApp] Initialized with article:', this.article?.title);
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
                window.location.href = '/feed/';
            }
        },

        // ===============================================
        // PLAY/PAUSE FUNCTIONALITY
        // ===============================================
        togglePlay() {
            this.isPlaying = !this.isPlaying;

            if (this.isPlaying) {
                this.showToastMessage('Playing audio...', 'info');
                // In production, connect to actual audio playback
                console.log('[ArticleApp] Started audio playback');
            } else {
                this.showToastMessage('Paused', 'info');
                console.log('[ArticleApp] Paused audio playback');
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
            return `${window.location.origin}/article/${this.article.id}/`;
        },

        getShareText() {
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
            const container = document.querySelector('.chat-messages');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
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
            this.scrollChatToBottom();

            // Simulate AI typing
            this.isTyping = true;

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
