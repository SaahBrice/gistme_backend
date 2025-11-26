const FeedConfig = {
    // View counts for each article
    viewCounts: ['1.2k', '3.5k', '892', '5.1k', '2.8k', '1.9k'],

    // Category Groups
    categoryGroups: [
        {
            nameEn: 'News & Current Affairs',
            nameFr: 'Actualités',
            icon: '📰',
            categories: [
                { id: 'politics', nameEn: 'Politics', nameFr: 'Politique' },
                { id: 'crime', nameEn: 'Crime', nameFr: 'Crime' },
                { id: 'international', nameEn: 'International', nameFr: 'International' },
                { id: 'society', nameEn: 'Society', nameFr: 'Société' }
            ]
        },
        {
            nameEn: 'Business & Economy',
            nameFr: 'Économie',
            icon: '💼',
            categories: [
                { id: 'business', nameEn: 'Business', nameFr: 'Affaires' },
                { id: 'economy', nameEn: 'Economy', nameFr: 'Économie' },
                { id: 'real_estate', nameEn: 'Real Estate', nameFr: 'Immobilier' }
            ]
        },
        {
            nameEn: 'Education & Jobs',
            nameFr: 'Éducation & Emploi',
            icon: '🎓',
            categories: [
                { id: 'education', nameEn: 'Education', nameFr: 'Éducation' },
                { id: 'university', nameEn: 'University', nameFr: 'Université' },
                { id: 'exam_results', nameEn: 'Exam Results', nameFr: 'Résultats' },
                { id: 'latest_jobs', nameEn: 'Latest Jobs', nameFr: 'Emplois' },
                { id: 'scholarships cameroonians can apply', nameEn: 'Scholarships', nameFr: 'Bourses' }
            ]
        },
        {
            nameEn: 'Sports & Entertainment',
            nameFr: 'Sports & Loisirs',
            icon: '⚽',
            categories: [
                { id: 'sports', nameEn: 'Sports', nameFr: 'Sports' },
                { id: 'entertainment', nameEn: 'Entertainment', nameFr: 'Divertissement' },
                { id: 'Mboko music', nameEn: 'Mboko Music', nameFr: 'Musique Mboko' },
                { id: 'Mboa music', nameEn: 'Mboa Music', nameFr: 'Musique Mboa' },
                { id: 'music artists', nameEn: 'Music Artists', nameFr: 'Artistes' }
            ]
        },
        {
            nameEn: 'Tech & Science',
            nameFr: 'Tech & Science',
            icon: '💻',
            categories: [
                { id: 'technology', nameEn: 'Technology', nameFr: 'Technologie' },
                { id: 'science', nameEn: 'Science', nameFr: 'Science' }
            ]
        },
        {
            nameEn: 'Lifestyle & Culture',
            nameFr: 'Art de vivre',
            icon: '🎨',
            categories: [
                { id: 'culture', nameEn: 'Culture', nameFr: 'Culture' },
                { id: 'lifestyle', nameEn: 'Lifestyle', nameFr: 'Mode de vie' },
                { id: 'religion', nameEn: 'Religion', nameFr: 'Religion' },
                { id: 'health', nameEn: 'Health', nameFr: 'Santé' }
            ]
        },
        {
            nameEn: 'Local News',
            nameFr: 'Infos Locales',
            icon: '📍',
            categories: [
                { id: 'happened in Buea', nameEn: 'Buea', nameFr: 'Buea' },
                { id: 'happened in any region', nameEn: 'Regional', nameFr: 'Régional' }
            ]
        },
        {
            nameEn: 'Environment & Agriculture',
            nameFr: 'Environnement',
            icon: '🌱',
            categories: [
                { id: 'environment', nameEn: 'Environment', nameFr: 'Environnement' },
                { id: 'agriculture', nameEn: 'Agriculture', nameFr: 'Agriculture' },
                { id: 'transportation', nameEn: 'Transportation', nameFr: 'Transport' }
            ]
        },
        {
            nameEn: 'Special',
            nameFr: 'Spécial',
            icon: '⭐',
            categories: [
                { id: 'concours_launch', nameEn: 'Concours', nameFr: 'Concours' },
                { id: 'human_interest', nameEn: 'Human Interest', nameFr: 'Intérêt Humain' },
                { id: 'disgusting', nameEn: 'Shocking', nameFr: 'Choquant' }
            ]
        }
    ],

    // Categories
    categories: [
        {
            id: 'DEVELOPMENT',
            nameEn: 'Development',
            nameFr: 'Développement',
            emoji: '🏗️',
            gradient: 'bg-gradient-to-br from-blue-600 to-blue-800',
            selectedGradient: 'bg-gradient-to-br from-blue-400 to-blue-600'
        },
        {
            id: 'BUSINESS',
            nameEn: 'Business',
            nameFr: 'Affaires',
            emoji: '💼',
            gradient: 'bg-gradient-to-br from-orange-600 to-orange-800',
            selectedGradient: 'bg-gradient-to-br from-orange-400 to-orange-600'
        },
        {
            id: 'SPORTS',
            nameEn: 'Sports',
            nameFr: 'Sports',
            emoji: '⚽',
            gradient: 'bg-gradient-to-br from-green-600 to-green-800',
            selectedGradient: 'bg-gradient-to-br from-green-400 to-green-600'
        },
        {
            id: 'TECH',
            nameEn: 'Technology',
            nameFr: 'Technologie',
            emoji: '💻',
            gradient: 'bg-gradient-to-br from-purple-600 to-purple-800',
            selectedGradient: 'bg-gradient-to-br from-purple-400 to-purple-600'
        },
        {
            id: 'POLITICS',
            nameEn: 'Politics',
            nameFr: 'Politique',
            emoji: '🏛️',
            gradient: 'bg-gradient-to-br from-red-600 to-red-800',
            selectedGradient: 'bg-gradient-to-br from-red-400 to-red-600'
        },
        {
            id: 'ENTERTAINMENT',
            nameEn: 'Entertainment',
            nameFr: 'Divertissement',
            emoji: '🎭',
            gradient: 'bg-gradient-to-br from-pink-600 to-pink-800',
            selectedGradient: 'bg-gradient-to-br from-pink-400 to-pink-600'
        },
    ]
};
