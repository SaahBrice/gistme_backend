// Quote of the Day Page - Alpine.js Component
function quoteApp() {
    return {
        // State
        loading: true,
        error: false,
        errorMessage: '',
        quote: null,
        previousQuotes: [],  // Previous 3 quotes
        expandedTimeline: null,  // ID of expanded timeline item

        // Config (loaded from page)
        category: 'GENERAL',
        userName: '',
        lang: 'en',

        // UI State
        showShareModal: false,
        showToast: false,
        toastMessage: '',
        toastIcon: '✓',

        // Initialize
        init() {
            // Load config from page
            const configEl = document.getElementById('quote-config');
            if (configEl) {
                try {
                    const config = JSON.parse(configEl.textContent);
                    this.category = config.category || 'GENERAL';
                    this.userName = config.userName || '';
                    this.lang = config.lang || 'en';
                } catch (e) {
                    console.error('Failed to parse quote config:', e);
                }
            }

            // Fetch today's quote and previous quotes
            this.fetchQuote();
            this.fetchPreviousQuotes();
        },

        // Fetch today's quote from API
        async fetchQuote() {
            this.loading = true;
            this.error = false;

            try {
                const response = await fetch(`/api/quotes/today/?category=${this.category}&lang=${this.lang}`);

                if (response.ok) {
                    this.quote = await response.json();
                } else if (response.status === 404) {
                    this.error = true;
                    this.errorMessage = this.lang === 'fr'
                        ? 'Aucune citation disponible pour le moment.'
                        : 'No quote available at the moment.';
                } else {
                    throw new Error('Failed to fetch quote');
                }
            } catch (e) {
                console.error('Error fetching quote:', e);
                this.error = true;
                this.errorMessage = this.lang === 'fr'
                    ? 'Impossible de charger la citation. Réessayez plus tard.'
                    : 'Unable to load quote. Please try again later.';
            } finally {
                this.loading = false;
            }
        },

        // Get category emoji
        getCategoryEmoji() {
            const emojis = {
                'GENERAL': '💡',
                'CHRISTIAN': '✝️',
                'ISLAMIC': '☪️'
            };
            return emojis[this.quote?.category] || '💭';
        },

        // Format date for display
        formatDate(dateStr) {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            return date.toLocaleDateString(this.lang === 'fr' ? 'fr-FR' : 'en-US', options);
        },

        // Fetch previous 3 quotes
        async fetchPreviousQuotes() {
            try {
                // Fetch quotes for this category, ordered by date descending
                const response = await fetch(`/api/quotes/?category=${this.category}&ordering=-date&lang=${this.lang}`);

                if (response.ok) {
                    const data = await response.json();
                    const quotes = data.results || data;

                    // Skip today's quote and take next 3
                    const today = new Date().toISOString().split('T')[0];
                    this.previousQuotes = quotes
                        .filter(q => q.date !== today)
                        .slice(0, 3);
                }
            } catch (e) {
                console.error('Error fetching previous quotes:', e);
                // Silently fail - timeline is optional
            }
        },

        // Get category icon for timeline
        getCategoryIcon(category) {
            const icons = {
                'GENERAL': '💡',
                'CHRISTIAN': '✝️',
                'ISLAMIC': '☪️'
            };
            return icons[category] || '💭';
        },

        // Format short date for timeline
        formatShortDate(dateStr) {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            const options = {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            };
            return date.toLocaleDateString(this.lang === 'fr' ? 'fr-FR' : 'en-US', options);
        },

        // Get "X days ago" label
        getDayAgo(daysAgo) {
            if (daysAgo === 1) {
                return this.lang === 'fr' ? '-1j' : '-1d';
            }
            return this.lang === 'fr' ? `-${daysAgo}j` : `-${daysAgo}d`;
        },

        // Show toast notification
        showToastMessage(message, icon = '✓') {
            this.toastMessage = message;
            this.toastIcon = icon;
            this.showToast = true;
            setTimeout(() => {
                this.showToast = false;
            }, 3000);
        },

        // Share as image
        async shareAsImage() {
            this.showShareModal = false;

            // Create canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 600;

            // Measure text to determine height
            ctx.font = 'bold 28px Playfair Display, Georgia, serif';
            const words = this.quote.quote_text.split(' ');
            let lines = [];
            let currentLine = '';
            const maxWidth = 520;

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

            // Calculate canvas height
            const lineHeight = 42;
            const startY = 120;
            const authorY = startY + (lines.length * lineHeight) + 40;
            const bottomY = authorY + 80;
            canvas.height = bottomY + 50;

            // Get gradient colors based on category
            const gradients = {
                'GENERAL': ['#92400E', '#B45309'],
                'CHRISTIAN': ['#1E3A8A', '#2563EB'],
                'ISLAMIC': ['#065F46', '#059669']
            };
            const colors = gradients[this.quote.category] || gradients['GENERAL'];

            // Draw gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, colors[0]);
            gradient.addColorStop(1, colors[1]);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw quote mark
            ctx.font = 'bold 80px Georgia, serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.textAlign = 'left';
            ctx.fillText('"', 30, 90);

            // Draw quote text
            ctx.font = 'bold 28px Georgia, serif';
            ctx.fillStyle = '#ffffff';
            lines.forEach((line, index) => {
                ctx.fillText(line, 40, startY + (index * lineHeight));
            });

            // Draw author
            ctx.font = 'italic 22px Georgia, serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillText('— ' + this.quote.author, 40, authorY);

            // Draw source reference if exists
            if (this.quote.source_reference) {
                ctx.font = 'italic 16px Arial, sans-serif';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.fillText(this.quote.source_reference, 40, authorY + 30);
            }

            // Draw footer
            ctx.font = '14px Arial, sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            const sharedBy = this.lang === 'fr' ? 'Partagé par' : 'Shared by';
            ctx.fillText(sharedBy + ' ' + (this.userName || 'Gist4U User'), 40, bottomY);

            // Draw Gist4U branding
            ctx.textAlign = 'right';
            ctx.font = 'bold 22px Arial, sans-serif';
            ctx.fillStyle = '#FACC15';
            ctx.fillText('Gist4U', 560, bottomY);

            // Convert to blob and share/download
            canvas.toBlob(async (blob) => {
                const fileName = `gist4u-quote-${this.quote.date}.png`;

                if (navigator.share && navigator.canShare) {
                    try {
                        const file = new File([blob], fileName, { type: 'image/png' });
                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                files: [file],
                                title: this.lang === 'fr' ? 'Citation du Jour' : 'Quote of the Day',
                                text: this.quote.quote_text + ' — ' + this.quote.author
                            });
                            return;
                        }
                    } catch (e) {
                        console.log('Share failed, falling back to download:', e);
                    }
                }

                // Fallback: download the image
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                this.showToastMessage(
                    this.lang === 'fr' ? 'Image téléchargée!' : 'Image downloaded!',
                    '📥'
                );
            }, 'image/png');
        },

        // Share as text
        async shareAsText() {
            this.showShareModal = false;

            const text = `"${this.quote.quote_text}"\n\n— ${this.quote.author}${this.quote.source_reference ? '\n' + this.quote.source_reference : ''}\n\n📱 Gist4U - Your Daily Inspiration`;

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: this.lang === 'fr' ? 'Citation du Jour' : 'Quote of the Day',
                        text: text
                    });
                    return;
                } catch (e) {
                    console.log('Share failed, falling back to clipboard:', e);
                }
            }

            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(text);
                this.showToastMessage(
                    this.lang === 'fr' ? 'Copié dans le presse-papier!' : 'Copied to clipboard!',
                    '📋'
                );
            } catch (e) {
                console.error('Failed to copy:', e);
                this.showToastMessage(
                    this.lang === 'fr' ? 'Échec de la copie' : 'Failed to copy',
                    '❌'
                );
            }
        },

        // Share as link
        async shareAsLink() {
            this.showShareModal = false;

            const url = window.location.href;
            const title = this.lang === 'fr' ? 'Citation du Jour - Gist4U' : 'Quote of the Day - Gist4U';
            const text = `${this.quote.quote_text.substring(0, 100)}...`;

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: title,
                        text: text,
                        url: url
                    });
                    return;
                } catch (e) {
                    console.log('Share failed, falling back to clipboard:', e);
                }
            }

            // Fallback: copy URL to clipboard
            try {
                await navigator.clipboard.writeText(url);
                this.showToastMessage(
                    this.lang === 'fr' ? 'Lien copié!' : 'Link copied!',
                    '🔗'
                );
            } catch (e) {
                console.error('Failed to copy:', e);
                this.showToastMessage(
                    this.lang === 'fr' ? 'Échec de la copie' : 'Failed to copy',
                    '❌'
                );
            }
        }
    };
}
