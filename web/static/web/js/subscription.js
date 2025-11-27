// Subscription Modal Logic
function subscriptionModal() {
    return {
        isOpen: false,
        step: 'intro', // intro, form, loading, success
        formData: {
            name: '',
            phone: '',
            email: ''
        },
        openModal() {
            this.isOpen = true;
            this.step = 'intro';
            this.formData = { name: '', phone: '', email: '' };
            document.body.style.overflow = 'hidden';
        },
        closeModal() {
            this.isOpen = false;
            document.body.style.overflow = '';
            setTimeout(() => {
                this.step = 'intro';
            }, 300);
        },
        processSubscription() {
            this.step = 'loading';

            // Post subscription data to backend
            fetch('/api/subscribe/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.formData)
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        this.step = 'success';
                    } else {
                        alert('Subscription failed: ' + (data.error || 'Unknown error'));
                        this.step = 'form';
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred. Please try again.');
                    this.step = 'form';
                });
        },
        goToFeed() {
            window.location.href = '/feed/';
        }
    }
}
