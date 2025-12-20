"""
Script to create bilingual sample daily quotes.
Run with: python create_bilingual_quotes.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gistme_backend.settings')
django.setup()

from datetime import date, timedelta
from api.models import DailyQuote

# Delete existing quotes first
print("Deleting existing quotes...")
DailyQuote.objects.all().delete()

today = date.today()

# Bilingual quotes for GENERAL category
general_quotes = [
    {
        "quote_text_en": "The only way to do great work is to love what you do.",
        "quote_text_fr": "La seule façon de faire du bon travail est d'aimer ce que vous faites.",
        "author": "Steve Jobs",
        "explanation_en": "This quote emphasizes that passion is the foundation of excellence. When you genuinely love your work, it doesn't feel like a burden, and you naturally invest more effort, creativity, and dedication into it.",
        "explanation_fr": "Cette citation souligne que la passion est le fondement de l'excellence. Quand vous aimez vraiment votre travail, il ne vous semble pas être un fardeau, et vous y investissez naturellement plus d'efforts, de créativité et de dévouement.",
        "affirmations_en": ["I love what I do", "My work brings me joy", "I am passionate about my goals", "Every day I grow closer to my dreams"],
        "affirmations_fr": ["J'aime ce que je fais", "Mon travail m'apporte de la joie", "Je suis passionné par mes objectifs", "Chaque jour je me rapproche de mes rêves"],
        "source_reference": "Stanford Commencement Speech, 2005"
    },
    {
        "quote_text_en": "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        "quote_text_fr": "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte.",
        "author": "Winston Churchill",
        "explanation_en": "Churchill reminds us that both success and failure are temporary states. What truly matters is perseverance—the ability to keep moving forward regardless of circumstances.",
        "explanation_fr": "Churchill nous rappelle que le succès et l'échec sont des états temporaires. Ce qui compte vraiment, c'est la persévérance—la capacité de continuer à avancer quelles que soient les circonstances.",
        "affirmations_en": ["I embrace both success and failure as teachers", "I have the courage to continue", "Every setback makes me stronger", "Persistence is my superpower"],
        "affirmations_fr": ["J'accepte le succès et l'échec comme des enseignants", "J'ai le courage de continuer", "Chaque revers me rend plus fort", "La persévérance est mon super-pouvoir"],
        "source_reference": ""
    },
    {
        "quote_text_en": "Believe you can and you're halfway there.",
        "quote_text_fr": "Croyez que vous pouvez et vous êtes déjà à mi-chemin.",
        "author": "Theodore Roosevelt",
        "explanation_en": "Self-belief is the first and most crucial step toward any achievement. When you truly believe in your capabilities, you create the mental foundation for action.",
        "explanation_fr": "La confiance en soi est la première et la plus importante étape vers tout accomplissement. Quand vous croyez vraiment en vos capacités, vous créez la base mentale pour l'action.",
        "affirmations_en": ["I believe in myself completely", "I am capable of achieving my goals", "My confidence grows every day", "I trust my journey"],
        "affirmations_fr": ["Je crois en moi complètement", "Je suis capable d'atteindre mes objectifs", "Ma confiance grandit chaque jour", "Je fais confiance à mon parcours"],
        "source_reference": ""
    },
    {
        "quote_text_en": "The future belongs to those who believe in the beauty of their dreams.",
        "quote_text_fr": "L'avenir appartient à ceux qui croient en la beauté de leurs rêves.",
        "author": "Eleanor Roosevelt",
        "explanation_en": "Dreams are the blueprints of our future. Those who nurture their dreams with belief and action are the ones who shape tomorrow.",
        "explanation_fr": "Les rêves sont les plans de notre avenir. Ceux qui nourrissent leurs rêves avec conviction et action sont ceux qui façonnent demain.",
        "affirmations_en": ["My dreams are valid and beautiful", "I am creating my future today", "I deserve to achieve my dreams", "Every step I take leads to my goals"],
        "affirmations_fr": ["Mes rêves sont valides et beaux", "Je crée mon avenir aujourd'hui", "Je mérite de réaliser mes rêves", "Chaque pas que je fais me rapproche de mes objectifs"],
        "source_reference": ""
    },
    {
        "quote_text_en": "It is during our darkest moments that we must focus to see the light.",
        "quote_text_fr": "C'est pendant nos moments les plus sombres que nous devons nous concentrer pour voir la lumière.",
        "author": "Aristotle",
        "explanation_en": "Challenges and difficult times are inevitable, but they are also opportunities for growth. By actively seeking hope during hardship, we develop resilience.",
        "explanation_fr": "Les défis et les moments difficiles sont inévitables, mais ils sont aussi des opportunités de croissance. En cherchant activement l'espoir pendant les épreuves, nous développons la résilience.",
        "affirmations_en": ["I find light in every situation", "Challenges make me stronger", "Hope guides my path", "I am resilient and unbreakable"],
        "affirmations_fr": ["Je trouve la lumière dans chaque situation", "Les défis me rendent plus fort", "L'espoir guide mon chemin", "Je suis résilient et incassable"],
        "source_reference": ""
    }
]

# Bilingual quotes for CHRISTIAN category
christian_quotes = [
    {
        "quote_text_en": "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
        "quote_text_fr": "Car je connais les projets que j'ai formés sur vous, dit l'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l'espérance.",
        "author": "Jeremiah 29:11",
        "explanation_en": "God has a divine plan for each of our lives. Even when we face uncertainty or hardship, we can trust that He is working all things together for our good.",
        "explanation_fr": "Dieu a un plan divin pour chacune de nos vies. Même face à l'incertitude ou aux difficultés, nous pouvons avoir confiance qu'Il travaille toutes choses pour notre bien.",
        "affirmations_en": ["God has a beautiful plan for my life", "I trust in the Lord's timing", "My future is secure in God's hands", "I walk in faith, not fear"],
        "affirmations_fr": ["Dieu a un beau plan pour ma vie", "Je fais confiance au timing de l'Éternel", "Mon avenir est entre les mains de Dieu", "Je marche par la foi, pas par la peur"],
        "source_reference": "Jérémie 29:11 (NIV)"
    },
    {
        "quote_text_en": "I can do all things through Christ who strengthens me.",
        "quote_text_fr": "Je puis tout par celui qui me fortifie.",
        "author": "Philippians 4:13",
        "explanation_en": "With Christ, there are no limits to what we can achieve. Our strength doesn't come from ourselves but from our relationship with God.",
        "explanation_fr": "Avec Christ, il n'y a pas de limites à ce que nous pouvons accomplir. Notre force ne vient pas de nous-mêmes mais de notre relation avec Dieu.",
        "affirmations_en": ["Christ gives me strength", "I am empowered by God's grace", "Nothing is impossible with God", "Divine strength flows through me"],
        "affirmations_fr": ["Christ me donne la force", "Je suis fortifié par la grâce de Dieu", "Rien n'est impossible avec Dieu", "La force divine coule à travers moi"],
        "source_reference": "Philippiens 4:13 (LSG)"
    },
    {
        "quote_text_en": "Trust in the Lord with all your heart and lean not on your own understanding.",
        "quote_text_fr": "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta sagesse.",
        "author": "Proverbs 3:5-6",
        "explanation_en": "Human wisdom has limits, but God's wisdom is infinite. When we surrender our plans and trust Him completely, He guides us on the right path.",
        "explanation_fr": "La sagesse humaine a ses limites, mais la sagesse de Dieu est infinie. Quand nous abandonnons nos plans et lui faisons entièrement confiance, Il nous guide sur le bon chemin.",
        "affirmations_en": ["I trust God completely", "His wisdom guides my decisions", "I surrender my worries to the Lord", "My path is made straight by God"],
        "affirmations_fr": ["Je fais entièrement confiance à Dieu", "Sa sagesse guide mes décisions", "Je remets mes soucis à l'Éternel", "Mon chemin est aplani par Dieu"],
        "source_reference": "Proverbes 3:5-6 (LSG)"
    },
    {
        "quote_text_en": "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
        "quote_text_fr": "Fortifie-toi et prends courage. Ne crains point et ne t'effraie point, car l'Éternel, ton Dieu, est avec toi partout où tu iras.",
        "author": "Joshua 1:9",
        "explanation_en": "Fear and discouragement are not from God. He calls us to courage because He promises His constant presence.",
        "explanation_fr": "La peur et le découragement ne viennent pas de Dieu. Il nous appelle au courage parce qu'Il promet sa présence constante.",
        "affirmations_en": ["I am strong and courageous", "God is always with me", "Fear has no power over me", "I walk boldly in faith"],
        "affirmations_fr": ["Je suis fort et courageux", "Dieu est toujours avec moi", "La peur n'a aucun pouvoir sur moi", "Je marche avec audace dans la foi"],
        "source_reference": "Josué 1:9 (LSG)"
    },
    {
        "quote_text_en": "The Lord is my shepherd; I shall not want. He makes me lie down in green pastures.",
        "quote_text_fr": "L'Éternel est mon berger, je ne manquerai de rien. Il me fait reposer dans de verts pâturages.",
        "author": "Psalm 23:1-2",
        "explanation_en": "As our shepherd, God provides everything we need. He offers rest, peace, and restoration for our weary souls.",
        "explanation_fr": "En tant que notre berger, Dieu pourvoit à tous nos besoins. Il offre le repos, la paix et la restauration pour nos âmes fatiguées.",
        "affirmations_en": ["God provides all my needs", "I rest in His peace", "My soul is restored daily", "I lack nothing with the Lord as my shepherd"],
        "affirmations_fr": ["Dieu pourvoit à tous mes besoins", "Je repose dans sa paix", "Mon âme est restaurée chaque jour", "Je ne manque de rien avec l'Éternel pour berger"],
        "source_reference": "Psaume 23:1-2 (LSG)"
    }
]

# Bilingual quotes for ISLAMIC category
islamic_quotes = [
    {
        "quote_text_en": "Indeed, with hardship comes ease.",
        "quote_text_fr": "En vérité, avec la difficulté vient la facilité.",
        "author": "Quran 94:6",
        "explanation_en": "Allah promises that every difficulty is accompanied by relief. This ayah is repeated twice in Surah Ash-Sharh, emphasizing that ease is guaranteed.",
        "explanation_fr": "Allah promet que chaque difficulté est accompagnée de soulagement. Cette ayah est répétée deux fois dans la Sourate Ash-Sharh, soulignant que la facilité est garantie.",
        "affirmations_en": ["Ease comes after every hardship", "Allah's promise is true", "Relief is on its way", "I trust in Allah's plan"],
        "affirmations_fr": ["La facilité vient après chaque difficulté", "La promesse d'Allah est vraie", "Le soulagement est en chemin", "Je fais confiance au plan d'Allah"],
        "source_reference": "Sourate Ash-Sharh (94:6)"
    },
    {
        "quote_text_en": "The best among you are those who have the best manners and character.",
        "quote_text_fr": "Les meilleurs d'entre vous sont ceux qui ont les meilleures manières et le meilleur caractère.",
        "author": "Prophet Muhammad (PBUH)",
        "explanation_en": "In Islam, good character is considered one of the highest virtues. True excellence is measured not by wealth or status, but by our character and conduct.",
        "explanation_fr": "En Islam, le bon caractère est considéré comme l'une des plus hautes vertus. La vraie excellence se mesure non par la richesse ou le statut, mais par notre caractère et notre conduite.",
        "affirmations_en": ["I strive for excellent character", "My manners reflect my faith", "I treat others with kindness and respect", "Good character is my greatest asset"],
        "affirmations_fr": ["Je m'efforce d'avoir un excellent caractère", "Mes manières reflètent ma foi", "Je traite les autres avec gentillesse et respect", "Le bon caractère est mon plus grand atout"],
        "source_reference": "Sahih Bukhari"
    },
    {
        "quote_text_en": "Tie your camel first, then put your trust in Allah.",
        "quote_text_fr": "Attache d'abord ton chameau, puis place ta confiance en Allah.",
        "author": "Prophet Muhammad (PBUH)",
        "explanation_en": "This hadith teaches the balance between effort and trust in Allah (tawakkul). We must do our part while placing our ultimate trust in Allah's wisdom.",
        "explanation_fr": "Ce hadith enseigne l'équilibre entre l'effort et la confiance en Allah (tawakkul). Nous devons faire notre part tout en plaçant notre confiance ultime dans la sagesse d'Allah.",
        "affirmations_en": ["I take action and trust Allah", "My efforts are blessed", "Tawakkul guides my life", "I do my best and leave the rest to Allah"],
        "affirmations_fr": ["J'agis et je fais confiance à Allah", "Mes efforts sont bénis", "Le tawakkul guide ma vie", "Je fais de mon mieux et laisse le reste à Allah"],
        "source_reference": "Jami at-Tirmidhi"
    },
    {
        "quote_text_en": "Allah does not burden a soul beyond that it can bear.",
        "quote_text_fr": "Allah n'impose à aucune âme une charge supérieure à sa capacité.",
        "author": "Quran 2:286",
        "explanation_en": "Every test and trial we face is within our capacity to handle. Allah, in His infinite wisdom, knows our limits better than we do.",
        "explanation_fr": "Chaque épreuve que nous affrontons est à la mesure de nos capacités. Allah, dans Sa sagesse infinie, connaît nos limites mieux que nous-mêmes.",
        "affirmations_en": ["I am strong enough for this test", "Allah knows my strength", "Every challenge makes me grow", "I can overcome what I face"],
        "affirmations_fr": ["Je suis assez fort pour cette épreuve", "Allah connaît ma force", "Chaque défi me fait grandir", "Je peux surmonter ce que j'affronte"],
        "source_reference": "Sourate Al-Baqarah (2:286)"
    },
    {
        "quote_text_en": "Be in this world as though you were a stranger or a traveler.",
        "quote_text_fr": "Sois dans ce monde comme si tu étais un étranger ou un voyageur.",
        "author": "Prophet Muhammad (PBUH)",
        "explanation_en": "This hadith reminds us that our time in this world is temporary. By viewing ourselves as travelers, we focus on what truly matters—our akhirah (afterlife).",
        "explanation_fr": "Ce hadith nous rappelle que notre temps dans ce monde est temporaire. En nous voyant comme des voyageurs, nous nous concentrons sur ce qui compte vraiment—notre akhirah (vie après la mort).",
        "affirmations_en": ["I focus on what truly matters", "My heart is set on eternal success", "I live with purpose and intention", "This world is a journey, not my destination"],
        "affirmations_fr": ["Je me concentre sur ce qui compte vraiment", "Mon cœur vise le succès éternel", "Je vis avec intention et but", "Ce monde est un voyage, pas ma destination"],
        "source_reference": "Sahih Bukhari"
    }
]

# Create quotes in database
created_count = 0

print("Creating bilingual quotes...")

for i, quote_data in enumerate(general_quotes):
    quote_date = today - timedelta(days=i)
    quote = DailyQuote.objects.create(
        category='GENERAL',
        date=quote_date,
        quote_text_en=quote_data['quote_text_en'],
        quote_text_fr=quote_data['quote_text_fr'],
        author=quote_data['author'],
        explanation_en=quote_data['explanation_en'],
        explanation_fr=quote_data['explanation_fr'],
        affirmations_en=quote_data['affirmations_en'],
        affirmations_fr=quote_data['affirmations_fr'],
        source_reference=quote_data['source_reference']
    )
    created_count += 1
    print(f"  ✓ GENERAL quote for {quote_date}")

for i, quote_data in enumerate(christian_quotes):
    quote_date = today - timedelta(days=i)
    quote = DailyQuote.objects.create(
        category='CHRISTIAN',
        date=quote_date,
        quote_text_en=quote_data['quote_text_en'],
        quote_text_fr=quote_data['quote_text_fr'],
        author=quote_data['author'],
        explanation_en=quote_data['explanation_en'],
        explanation_fr=quote_data['explanation_fr'],
        affirmations_en=quote_data['affirmations_en'],
        affirmations_fr=quote_data['affirmations_fr'],
        source_reference=quote_data['source_reference']
    )
    created_count += 1
    print(f"  ✓ CHRISTIAN quote for {quote_date}")

for i, quote_data in enumerate(islamic_quotes):
    quote_date = today - timedelta(days=i)
    quote = DailyQuote.objects.create(
        category='ISLAMIC',
        date=quote_date,
        quote_text_en=quote_data['quote_text_en'],
        quote_text_fr=quote_data['quote_text_fr'],
        author=quote_data['author'],
        explanation_en=quote_data['explanation_en'],
        explanation_fr=quote_data['explanation_fr'],
        affirmations_en=quote_data['affirmations_en'],
        affirmations_fr=quote_data['affirmations_fr'],
        source_reference=quote_data['source_reference']
    )
    created_count += 1
    print(f"  ✓ ISLAMIC quote for {quote_date}")

print(f"\n✅ Created {created_count} bilingual sample quotes!")
print(f"Total quotes in database: {DailyQuote.objects.count()}")
