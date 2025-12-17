// Mentor Me Page JavaScript
function mentorApp() {
    return {
        notified: false,

        init() {
            console.log('Mentor page initialized');
        },

        notifyMe() {
            this.notified = true;
            // TODO: Add API call to save notification preference
        }
    };
}
