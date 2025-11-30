function waitingListModal() {
    return {
        isOpen: false,
        step: 'loading', // loading, success

        init() {
            // Listen for events to control the modal
            window.addEventListener('open-waiting-list-modal', (e) => this.openModal(e.detail));
            window.addEventListener('update-waiting-list-step', (e) => { this.step = e.detail; });
            window.addEventListener('close-waiting-list-modal', () => this.closeModal());
        },

        openModal(step = 'loading') {
            this.isOpen = true;
            this.step = step;
            document.body.style.overflow = 'hidden';
        },

        closeModal() {
            this.isOpen = false;
            document.body.style.overflow = '';
        }
    }
}

function waitingListForm() {
    return {
        formData: {
            email: '',
            phone: '',
            website: '' // Honeypot field
        },
        isLoading: false,

        async submitForm() {
            if (this.isLoading) return;
            this.isLoading = true;

            // Show loading modal immediately
            window.dispatchEvent(new CustomEvent('open-waiting-list-modal', { detail: 'loading' }));

            try {
                // Get CSRF token
                const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

                const response = await fetch('/join-waiting-list/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify(this.formData)
                });

                const data = await response.json();

                if (data.success) {
                    // Simulate a small delay for better UX if response is too fast
                    setTimeout(() => {
                        // Update modal to success state via event
                        window.dispatchEvent(new CustomEvent('update-waiting-list-step', { detail: 'success' }));

                        // Reset form
                        this.formData = { email: '', phone: '', website: '' };
                    }, 800);
                } else {
                    // Close modal and show error
                    window.dispatchEvent(new CustomEvent('close-waiting-list-modal'));

                    alert(data.error || 'Something went wrong. Please try again.');
                }

            } catch (error) {
                console.error('Error:', error);
                window.dispatchEvent(new CustomEvent('close-waiting-list-modal'));
                alert('Connection error. Please check your internet and try again.');
            } finally {
                this.isLoading = false;
            }
        }
    }
}
