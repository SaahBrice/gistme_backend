// Onboarding Flow - Alpine.js Component
function onboardingFlow() {
    return {
        step: 1,
        saving: false,
        direction: 'forward', // Track animation direction

        phone: '',
        phoneError: '',
        isPhoneValid: false,
        interests: [],
        education: '',
        background: '',
        notificationTime: '',
        customDesires: '',

        interestOptions: [
            { id: 'jobs_abroad', label: 'Jobs Abroad', emoji: '🌍' },
            { id: 'jobs_cameroon', label: 'Jobs in Cameroon', emoji: '🇨🇲' },
            { id: 'scholarships_abroad', label: 'Scholarships Abroad', emoji: '🎓' },
            { id: 'scholarships_local', label: 'Local Scholarships', emoji: '📚' },
            { id: 'concours', label: 'Concours (ENS, ENAM...)', emoji: '📝' },
            { id: 'university_free', label: 'Foreign Uni (No App Fee)', emoji: '🆓' },
            { id: 'university_paid', label: 'Foreign Uni (App Fee)', emoji: '💰' },
            { id: 'competitions', label: 'Competitions & Contests', emoji: '🏆' },
        ],

        educationOptions: [
            { value: 'FSLC', label: 'FSLC' },
            { value: 'GCE_OL', label: 'GCE O Level' },
            { value: 'GCE_AL', label: 'GCE A Level' },
            { value: 'HND', label: 'HND' },
            { value: 'BACHELOR', label: 'Bachelor' },
            { value: 'MASTERS', label: 'Masters' },
            { value: 'PHD', label: 'PhD' },
            { value: 'RAS', label: 'Prefer not to say' },
        ],

        backgroundOptions: [
            { value: 'ARTS', label: 'Arts & Humanities' },
            { value: 'SCIENCE', label: 'Science & Technology' },
            { value: 'RAS', label: 'Prefer not to say' },
        ],

        timeSlots: [
            { value: '06:00', time: '6 AM', label: 'Early Bird' },
            { value: '08:00', time: '8 AM', label: 'Morning' },
            { value: '12:00', time: '12 PM', label: 'Noon' },
            { value: '18:00', time: '6 PM', label: 'Evening' },
            { value: '21:00', time: '9 PM', label: 'Night Owl' },
        ],

        validatePhone() {
            const cleaned = this.phone.replace(/\D/g, '');
            this.phone = cleaned;

            if (cleaned.length === 0) {
                this.phoneError = '';
                this.isPhoneValid = false;
            } else if (cleaned.length < 9) {
                this.phoneError = 'Enter 9 digits';
                this.isPhoneValid = false;
            } else if (!cleaned.match(/^6[2-9]\d{7}$/)) {
                this.phoneError = 'Enter a valid CM number';
                this.isPhoneValid = false;
            } else {
                this.phoneError = '';
                this.isPhoneValid = true;
            }
        },

        toggleInterest(id) {
            if (this.interests.includes(id)) {
                this.interests = this.interests.filter(i => i !== id);
            } else {
                this.interests.push(id);
            }
        },

        selectAllInterests() {
            if (this.interests.length === this.interestOptions.length) {
                this.interests = [];
            } else {
                this.interests = this.interestOptions.map(o => o.id);
            }
        },

        nextStep() {
            if (this.step < 5) {
                this.direction = 'forward';
                this.step++;
            }
        },

        prevStep() {
            if (this.step > 1) {
                this.direction = 'back';
                this.step--;
            }
        },

        async saveAndContinue() {
            this.saving = true;

            try {
                const response = await fetch('/api/onboarding/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.getCookie('csrftoken')
                    },
                    body: JSON.stringify({
                        phone: '+237' + this.phone,
                        interests: this.interests,
                        education_level: this.education,
                        background: this.background,
                        notification_time: this.notificationTime,
                        custom_desires: this.customDesires
                    })
                });

                if (response.ok) {
                    window.location.href = '/feed/';
                } else {
                    alert('Something went wrong. Please try again.');
                    this.saving = false;
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Connection error. Please try again.');
                this.saving = false;
            }
        },

        getCookie(name) {
            let cookieValue = null;
            if (document.cookie) {
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
        }
    }
}

// Dynamic Tech Mesh Background Animation
(function () {
    const canvas = document.getElementById('mesh-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let nodes = [];
    let time = 0;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        initNodes();
    }

    function initNodes() {
        nodes = [];
        const nodeCount = Math.floor((width * height) / 15000);

        for (let i = 0; i < nodeCount; i++) {
            nodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                color: ['#FACC15', '#8B5CF6', '#10B981', '#3B82F6'][Math.floor(Math.random() * 4)],
                pulse: Math.random() * Math.PI * 2
            });
        }
    }

    function drawNode(node) {
        const pulse = Math.sin(time * 2 + node.pulse) * 0.5 + 1;
        const glowRadius = node.radius * 3 * pulse;

        // Glow
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius);
        gradient.addColorStop(0, node.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawConnections() {
        const maxDist = 150;

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[j].x - nodes[i].x;
                const dy = nodes[j].y - nodes[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < maxDist) {
                    const opacity = (1 - dist / maxDist) * 0.3;
                    ctx.strokeStyle = `rgba(250, 204, 21, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    function updateNodes() {
        for (let node of nodes) {
            node.x += node.vx;
            node.y += node.vy;

            // Add slight wave motion
            node.x += Math.sin(time + node.pulse) * 0.3;
            node.y += Math.cos(time * 0.7 + node.pulse) * 0.3;

            // Bounce off edges
            if (node.x < 0 || node.x > width) node.vx *= -1;
            if (node.y < 0 || node.y > height) node.vy *= -1;

            // Keep in bounds
            node.x = Math.max(0, Math.min(width, node.x));
            node.y = Math.max(0, Math.min(height, node.y));
        }
    }

    function animate() {
        ctx.fillStyle = 'rgba(10, 10, 10, 0.15)';
        ctx.fillRect(0, 0, width, height);

        drawConnections();

        for (let node of nodes) {
            drawNode(node);
        }

        updateNodes();
        time += 0.02;

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    animate();
})();
