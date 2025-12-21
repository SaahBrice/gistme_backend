// Mentor Me Page JavaScript - Backend Connected
function mentorApp() {
    return {
        // State
        selectedCategory: 'all',
        isPlaying: false,
        audioProgress: 0,
        audioElement: null,
        loading: true,
        requestingMentor: null,

        // Data from API
        mentors: [],
        categories: [],

        async init() {
            console.log('Mentor page initialized');
            await this.fetchCategories();
            await this.fetchMentors();
            this.loading = false;
        },

        async fetchCategories() {
            try {
                const response = await fetch('/api/mentors/categories/');
                if (response.ok) {
                    const data = await response.json();
                    // Add "All" category at the beginning
                    this.categories = [
                        { id: 'all', name: 'all', label: 'All', icon: 'users' },
                        ...data
                    ];
                }
            } catch (e) {
                console.error('Failed to fetch categories:', e);
            }
        },

        async fetchMentors() {
            try {
                let url = '/api/mentors/';
                if (this.selectedCategory && this.selectedCategory !== 'all') {
                    url += `?category=${this.selectedCategory}`;
                }
                const response = await fetch(url);
                if (response.ok) {
                    this.mentors = await response.json();
                }
            } catch (e) {
                console.error('Failed to fetch mentors:', e);
            }
        },

        get filteredMentors() {
            if (this.selectedCategory === 'all') {
                return this.mentors;
            }
            return this.mentors.filter(m => m.category_id == this.selectedCategory);
        },

        get progressOffset() {
            // 188 is circumference of circle (2 * PI * 30)
            return 188 - (188 * this.audioProgress / 100);
        },

        async selectCategory(categoryId) {
            this.selectedCategory = categoryId;
            // Re-fetch mentors (could optimize by filtering client-side)
            await this.fetchMentors();
        },

        getCategoryIcon(iconName) {
            const icons = {
                'users': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
                'palette': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>',
                'flask': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3h6v7l5 9H4l5-9V3z"/><line x1="9" y1="3" x2="15" y2="3"/></svg>',
                'heart': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
                'book': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
                'briefcase': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
                'music': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
                'globe': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
                'code': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
                'graduation': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>',
                'star': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
                'lightbulb': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A5.5 5.5 0 1 0 7.5 11.5c.76.76 1.23 1.52 1.41 2.5"/></svg>'
            };
            return icons[iconName] || icons['users'];
        },

        getLanguageBadge(language) {
            const badges = {
                'EN': '🇬🇧',
                'FR': '🇫🇷',
                'BI': '🌐'
            };
            return badges[language] || '🌐';
        },

        toggleAudio() {
            if (!this.audioElement) {
                // Determine language from URL
                const langMatch = window.location.pathname.match(/^\/(en|fr)\//);
                const lang = langMatch ? langMatch[1] : 'en';
                const audioFile = lang === 'fr' ? '/static/web/audio/mentor_me_message_fr.wav' : '/static/web/audio/mentor_me_message.mp3';
                this.audioElement = new Audio(audioFile);

                this.audioElement.addEventListener('timeupdate', () => {
                    if (this.audioElement.duration) {
                        this.audioProgress = (this.audioElement.currentTime / this.audioElement.duration) * 100;
                    }
                });

                this.audioElement.addEventListener('ended', () => {
                    this.isPlaying = false;
                    this.audioProgress = 100;
                });
            }

            if (this.isPlaying) {
                this.audioElement.pause();
                this.isPlaying = false;
            } else {
                this.audioElement.play().catch(e => {
                    console.log('Audio play failed:', e);
                    alert('Welcome to Mentor Me! We have partnered with la crème de la crème of mentors who can guide you to success.');
                });
                this.isPlaying = true;
            }
        },

        async requestMentor(mentor) {
            if (this.requestingMentor === mentor.id) return;

            this.requestingMentor = mentor.id;

            try {
                const response = await fetch('/api/mentors/request/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || ''
                    },
                    body: JSON.stringify({
                        mentor_id: mentor.id,
                        message: ''
                    })
                });

                const data = await response.json();
                const t = window.mentorTranslations || {};

                if (response.ok) {
                    this.showModal('success', t.successTitle || '🎉 Request Sent!', data.message || t.successMessage?.replace('{name}', mentor.name) || `We'll connect you with ${mentor.name} soon.`);
                } else {
                    this.showModal('error', t.errorTitle || 'Oops!', data.error || t.errorMessage || 'Failed to send request');
                }
            } catch (e) {
                console.error('Request failed:', e);
                const t = window.mentorTranslations || {};
                this.showModal('error', t.connectionErrorTitle || 'Connection Error', t.connectionErrorMessage || 'Failed to send request. Please try again.');
            }

            this.requestingMentor = null;
        },

        // Modal state
        modalVisible: false,
        modalType: 'success',
        modalTitle: '',
        modalMessage: '',

        showModal(type, title, message) {
            this.modalType = type;
            this.modalTitle = title;
            this.modalMessage = message;
            this.modalVisible = true;
        },

        closeModal() {
            this.modalVisible = false;
        }
    };
}
