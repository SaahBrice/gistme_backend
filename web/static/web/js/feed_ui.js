const FeedUI = {
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
    }
};
