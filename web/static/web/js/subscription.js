// Subscription Modal Logic
function subscriptionModal() {
    return {
        showModal: false,
        currentStep: 'intro', // intro, form, processing, success

        // Form Data
        subscriberName: '',
        subscriberPhone: '',
        subscriberEmail: '',

        // Validation Errors
        errors: {
            name: '',
            phone: '',
            email: ''
        },

        openModal() {
            this.showModal = true;
            this.currentStep = 'intro';
            this.resetForm();
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        },

        closeModal() {
            this.showModal = false;
            document.body.style.overflow = '';
            setTimeout(() => {
                this.currentStep = 'intro';
                this.resetForm();
            }, 300);
        },

        resetForm() {
            this.subscriberName = '';
            this.subscriberPhone = '';
            this.subscriberEmail = '';
            this.errors = { name: '', phone: '', email: '' };
        },

        proceedToForm() {
            this.currentStep = 'form';
        },

        validateForm() {
            let isValid = true;
            this.errors = { name: '', phone: '', email: '' };

            // Validate Name
            if (!this.subscriberName.trim()) {
                this.errors.name = 'Please enter your name';
                isValid = false;
            } else if (this.subscriberName.trim().length < 2) {
                this.errors.name = 'Name must be at least 2 characters';
                isValid = false;
            }

            // Validate Phone (Cameroon format: starts with 6, 9 digits)
            const phonePattern = /^6[0-9]{8}$/;
            const cleanPhone = this.subscriberPhone.replace(/\s+/g, '');
            if (!cleanPhone) {
                this.errors.phone = 'Please enter your phone number';
                isValid = false;
            } else if (!phonePattern.test(cleanPhone)) {
                this.errors.phone = 'Invalid Cameroon phone (e.g., 670123456)';
                isValid = false;
            }

            // Validate Email
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!this.subscriberEmail.trim()) {
                this.errors.email = 'Please enter your email';
                isValid = false;
            } else if (!emailPattern.test(this.subscriberEmail.trim())) {
                this.errors.email = 'Please enter a valid email address';
                isValid = false;
            }

            return isValid;
        },

        async submitSubscription() {
            if (!this.validateForm()) {
                return;
            }

            // Show processing state
            this.currentStep = 'processing';

            // Simulate API call for payment processing
            setTimeout(() => {
                // In production, this would be an actual API call
                // const response = await fetch('/api/subscribe/', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify({
                //         name: this.subscriberName,
                //         phone: this.subscriberPhone,
                //         email: this.subscriberEmail
                //     })
                // });

                // Show success state
                this.currentStep = 'success';
            }, 2500); // Simulate 2.5 second processing time
        },

        goToFeed() {
            window.location.href = '/feed/';
        }
    };
}
