// Mentor Me Page JavaScript
function mentorApp() {
    return {
        // State
        selectedCategory: 'ALL',
        isPlaying: false,
        audioProgress: 0,
        audioElement: null,

        // Dummy mentors data
        mentors: [
            {
                id: 1,
                name: 'Dr. Nkeng Stephens',
                profession: 'Software Engineer at Google',
                location: 'Douala',
                bio: 'Helping young Cameroonians break into tech. 10+ years in software development.',
                picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
                category: 'SCIENCE'
            },
            {
                id: 2,
                name: 'Marie-Claire Fotso',
                profession: 'PhD Researcher - Public Health',
                location: 'Yaoundé',
                bio: 'Passionate about mentoring women in STEM. Research focus on tropical diseases.',
                picture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
                category: 'SCIENCE'
            },
            {
                id: 3,
                name: 'Pastor Emmanuel Mbah',
                profession: 'Youth Pastor & Life Coach',
                location: 'Bamenda',
                bio: 'Guiding young people to discover purpose and build character.',
                picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
                category: 'RELIGIOUS'
            },
            {
                id: 4,
                name: 'Aminatou Hadja',
                profession: 'Islamic Scholar & Counselor',
                location: 'Maroua',
                bio: 'Empowering Muslim youth through education and spiritual guidance.',
                picture: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
                category: 'RELIGIOUS'
            },
            {
                id: 5,
                name: 'Jean-Pierre Kouam',
                profession: 'Journalist & Writer',
                location: 'Douala',
                bio: 'Award-winning journalist. Mentoring aspiring writers and media professionals.',
                picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
                category: 'ARTS'
            },
            {
                id: 6,
                name: 'Sandrine Eyanga',
                profession: 'Artist & Cultural Curator',
                location: 'Buea',
                bio: 'Celebrating African art. Helping artists build sustainable careers.',
                picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
                category: 'ARTS'
            }
        ],

        categories: [
            { key: 'ALL', label: 'All', icon: 'users' },
            { key: 'ARTS', label: 'Arts & Socials', icon: 'palette' },
            { key: 'SCIENCE', label: 'Science & Technology', icon: 'flask' },
            { key: 'RELIGIOUS', label: 'Growth & Religion', icon: 'heart' }
        ],

        init() {
            console.log('Mentor page initialized');
        },

        get filteredMentors() {
            if (this.selectedCategory === 'ALL') {
                return this.mentors;
            }
            return this.mentors.filter(m => m.category === this.selectedCategory);
        },

        get progressOffset() {
            // 188 is circumference of circle (2 * PI * 30)
            return 188 - (188 * this.audioProgress / 100);
        },

        selectCategory(key) {
            this.selectedCategory = key;
        },

        toggleAudio() {
            if (!this.audioElement) {
                this.audioElement = new Audio('/static/web/audio/mentor_me_message.mp3');

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

        requestMentor(mentor) {
            alert(`Request sent to ${mentor.name}! We'll connect you soon.`);
        }
    };
}
