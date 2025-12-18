// Article Dummy Data for Article Reader Page
// This file contains sample data for frontend development

const articleDummyData = {
    // Current article being viewed
    article: {
        id: 1001,
        title: "Google Scholarship 2025: Full Funding for African Students in Tech & Innovation",
        headline: "SCHOLARSHIP",
        description: "Google is proud to announce an extraordinary opportunity for students across Africa to pursue their dreams in technology and computer science. This fully-funded scholarship covers tuition, accommodation, living expenses, and provides mentorship from Google engineers. The program aims to nurture the next generation of African tech leaders who will drive innovation across the continent.",
        thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop",
        source: "Google Africa",
        source_logo: "https://www.google.com/favicon.ico",
        published_date: "December 18, 2024",
        read_time: "5 min read",
        view_count: 2847,
        category: "scholarships_abroad",
        audio_url: null, // Will be filled with actual audio URL
        bookmarked: false,
        reactions: 156
    },

    // Related articles for recommendation
    relatedArticles: [
        {
            id: 1002,
            title: "Mastercard Foundation Scholarship 2025",
            thumbnail: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=400",
            category: "scholarships_abroad"
        },
        {
            id: 1003,
            title: "French Embassy PhD Grants Open",
            thumbnail: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=400",
            category: "scholarships_abroad"
        }
    ],

    // Dummy AI chat messages
    chatMessages: [
        {
            id: 1,
            role: "assistant",
            content: "Hello! I'm here to help you understand this article better. What would you like to know about the Google Scholarship 2025?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ],

    // Predefined AI responses for demo
    aiResponses: [
        "That's a great question! Based on the article, the deadline for applications is typically in March. I'd recommend checking the official Google Careers page for the exact date.",
        "The scholarship covers full tuition fees, monthly stipend for living expenses, accommodation, travel costs to the university, and a laptop for your studies.",
        "To be eligible, you need to be a citizen of an African country, have strong academic records, demonstrate leadership potential, and be passionate about technology.",
        "You can apply through the official Google Africa Scholarships portal. The process usually involves an online application, essays, and interviews.",
        "Absolutely! The scholarship is open to students from all 54 African countries. However, some programs may have specific regional focuses."
    ],

    // Share configuration
    shareConfig: {
        baseUrl: window.location.origin,
        getShareUrl: function (articleId) {
            return `${this.baseUrl}/article/${articleId}/`;
        },
        getMetaDescription: function (article) {
            return article.description.substring(0, 160) + "...";
        }
    }
};

// Export for use in article.js
if (typeof window !== 'undefined') {
    window.articleDummyData = articleDummyData;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = articleDummyData;
}
