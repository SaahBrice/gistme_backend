// Dummy articles data for testing bookmarks feature
// Import this file and use: articles = [...dummyArticles]

const dummyArticles = [
    {
        id: 101,
        title: "Google Scholarship 2025: Full Funding for African Students",
        excerpt: "Google is offering fully-funded scholarships for students across Africa to study technology and computer science at top universities.",
        image: "https://picsum.photos/seed/article1/400/300",
        category: "scholarships_abroad",
        bookmarked: true
    },
    {
        id: 102,
        title: "ENAM Concours 2025: Registration Now Open",
        excerpt: "The National School of Administration and Magistracy opens registration for the 2025 competitive entrance examination.",
        image: "https://picsum.photos/seed/article2/400/300",
        category: "concours",
        bookmarked: true
    },
    {
        id: 103,
        title: "Canada Work Permit: New Pathway for Cameroonians",
        excerpt: "Canada announces new immigration pathway making it easier for Cameroonians to obtain work permits in tech sector.",
        image: "https://picsum.photos/seed/article3/400/300",
        category: "jobs_abroad",
        bookmarked: false
    },
    {
        id: 104,
        title: "University of Buea: Free Admission for Engineering",
        excerpt: "UB announces tuition-free admission for top-performing students in engineering programs for 2025 intake.",
        image: "https://picsum.photos/seed/article4/400/300",
        category: "university_free",
        bookmarked: true
    },
    {
        id: 105,
        title: "MTN Cameroon Hiring 50 Software Developers",
        excerpt: "MTN opens recruitment for software developers with competitive salaries and benefits package.",
        image: "https://picsum.photos/seed/article5/400/300",
        category: "jobs_cameroon",
        bookmarked: false
    },
    {
        id: 106,
        title: "ENS Yaoundé Concours: Key Dates and Requirements",
        excerpt: "Everything you need to know about the École Normale Supérieure entrance examination for 2025.",
        image: "https://picsum.photos/seed/article6/400/300",
        category: "concours",
        bookmarked: false
    },
    {
        id: 107,
        title: "Chevening Scholarship: Deadline Approaching",
        excerpt: "UK's prestigious Chevening scholarship opens applications for Cameroonian students. Apply before November 2024.",
        image: "https://picsum.photos/seed/article7/400/300",
        category: "scholarships_abroad",
        bookmarked: true
    },
    {
        id: 108,
        title: "African Development Bank Internship Program",
        excerpt: "AfDB offers paid internships for recent graduates from African countries. Monthly stipend of $3000.",
        image: "https://picsum.photos/seed/article8/400/300",
        category: "jobs_abroad",
        bookmarked: false
    },
    {
        id: 109,
        title: "Cameroon Excellence Scholarship for Masters",
        excerpt: "Government of Cameroon announces scholarship program for masters studies at local universities.",
        image: "https://picsum.photos/seed/article9/400/300",
        category: "scholarships_local",
        bookmarked: false
    },
    {
        id: 110,
        title: "Orange Digital Center: Free Coding Bootcamp",
        excerpt: "Orange Cameroon offers free 6-month coding bootcamp with job placement support after graduation.",
        image: "https://picsum.photos/seed/article10/400/300",
        category: "competitions",
        bookmarked: true
    },
    {
        id: 111,
        title: "ESSEC Business School: MBA Admissions Open",
        excerpt: "ESSEC Douala opens admissions for their internationally recognized MBA program with partial scholarships.",
        image: "https://picsum.photos/seed/article11/400/300",
        category: "university_paid",
        bookmarked: false
    },
    {
        id: 112,
        title: "Germany Study Visa: New Student-Friendly Policy",
        excerpt: "Germany simplifies visa process for African students with new fast-track approval system.",
        image: "https://picsum.photos/seed/article12/400/300",
        category: "scholarships_abroad",
        bookmarked: false
    },
    {
        id: 113,
        title: "BEAC Recruitment 2025: Banking Jobs Available",
        excerpt: "Bank of Central African States announces recruitment of economists and IT specialists.",
        image: "https://picsum.photos/seed/article13/400/300",
        category: "jobs_cameroon",
        bookmarked: false
    },
    {
        id: 114,
        title: "Innovation Challenge: $10,000 Prize Pool",
        excerpt: "Cameroonian startups invited to participate in tech innovation challenge with major prizes.",
        image: "https://picsum.photos/seed/article14/400/300",
        category: "competitions",
        bookmarked: true
    },
    {
        id: 115,
        title: "French Embassy Scholarship for PhD Students",
        excerpt: "Campus France announces doctoral scholarships for Cameroonian researchers in all fields.",
        image: "https://picsum.photos/seed/article15/400/300",
        category: "scholarships_abroad",
        bookmarked: false
    },
    {
        id: 116,
        title: "IRIC Concours 2025: International Relations",
        excerpt: "Institut des Relations Internationales du Cameroun opens applications for diplomatic studies.",
        image: "https://picsum.photos/seed/article16/400/300",
        category: "concours",
        bookmarked: false
    },
    {
        id: 117,
        title: "Remote Jobs: Top Companies Hiring Africans",
        excerpt: "List of international companies offering remote positions to talent based in Cameroon.",
        image: "https://picsum.photos/seed/article17/400/300",
        category: "jobs_abroad",
        bookmarked: true
    },
    {
        id: 118,
        title: "Catholic University: Nursing Program Admission",
        excerpt: "UCAC opens admissions for nursing and healthcare programs with scholarship opportunities.",
        image: "https://picsum.photos/seed/article18/400/300",
        category: "university_paid",
        bookmarked: false
    },
    {
        id: 119,
        title: "Youth Entrepreneurship Grant: 5M FCFA",
        excerpt: "Ministry of Youth Affairs launches grant program for young entrepreneurs aged 18-35.",
        image: "https://picsum.photos/seed/article19/400/300",
        category: "competitions",
        bookmarked: false
    },
    {
        id: 120,
        title: "Mastercard Foundation Scholarship 2025",
        excerpt: "Full scholarship opportunity for undergraduate and graduate studies at partner universities worldwide.",
        image: "https://picsum.photos/seed/article20/400/300",
        category: "scholarships_abroad",
        bookmarked: true
    }
];

// Export for use in feed.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = dummyArticles;
}
