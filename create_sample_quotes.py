"""
Script to create sample daily quotes for testing.
Run with: python create_sample_quotes.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gistme_backend.settings')
django.setup()

from datetime import date, timedelta
from api.models import DailyQuote

today = date.today()

# Sample quotes for GENERAL category
general_quotes = [
    {
        "quote_text": "The only way to do great work is to love what you do.",
        "author": "Steve Jobs",
        "explanation": "This quote emphasizes that passion is the foundation of excellence. When you genuinely love your work, it doesn't feel like a burden, and you naturally invest more effort, creativity, and dedication into it. True success comes from aligning your career with your passions.",
        "affirmations": ["I love what I do", "My work brings me joy", "I am passionate about my goals", "Every day I grow closer to my dreams"],
        "source_reference": "Stanford Commencement Speech, 2005"
    },
    {
        "quote_text": "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        "author": "Winston Churchill",
        "explanation": "Churchill reminds us that both success and failure are temporary states. What truly matters is perseverance—the ability to keep moving forward regardless of circumstances. This mindset transforms obstacles into stepping stones.",
        "affirmations": ["I embrace both success and failure as teachers", "I have the courage to continue", "Every setback makes me stronger", "Persistence is my superpower"],
        "source_reference": ""
    },
    {
        "quote_text": "Believe you can and you're halfway there.",
        "author": "Theodore Roosevelt",
        "explanation": "Self-belief is the first and most crucial step toward any achievement. When you truly believe in your capabilities, you create the mental foundation for action. Doubt holds us back; belief propels us forward.",
        "affirmations": ["I believe in myself completely", "I am capable of achieving my goals", "My confidence grows every day", "I trust my journey"],
        "source_reference": ""
    },
    {
        "quote_text": "The future belongs to those who believe in the beauty of their dreams.",
        "author": "Eleanor Roosevelt",
        "explanation": "Dreams are the blueprints of our future. Those who nurture their dreams with belief and action are the ones who shape tomorrow. Never let anyone diminish the beauty of what you envision for your life.",
        "affirmations": ["My dreams are valid and beautiful", "I am creating my future today", "I deserve to achieve my dreams", "Every step I take leads to my goals"],
        "source_reference": ""
    },
    {
        "quote_text": "It is during our darkest moments that we must focus to see the light.",
        "author": "Aristotle",
        "explanation": "Challenges and difficult times are inevitable, but they are also opportunities for growth. By actively seeking hope and solutions during hardship, we develop resilience and often discover strength we never knew we had.",
        "affirmations": ["I find light in every situation", "Challenges make me stronger", "Hope guides my path", "I am resilient and unbreakable"],
        "source_reference": ""
    }
]

# Sample quotes for CHRISTIAN category
christian_quotes = [
    {
        "quote_text": "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
        "author": "Jeremiah 29:11",
        "explanation": "God has a divine plan for each of our lives. Even when we face uncertainty or hardship, we can trust that He is working all things together for our good. His plans are always better than what we can imagine for ourselves.",
        "affirmations": ["God has a beautiful plan for my life", "I trust in the Lord's timing", "My future is secure in God's hands", "I walk in faith, not fear"],
        "source_reference": "Jeremiah 29:11 (NIV)"
    },
    {
        "quote_text": "I can do all things through Christ who strengthens me.",
        "author": "Philippians 4:13",
        "explanation": "With Christ, there are no limits to what we can achieve. This verse reminds us that our strength doesn't come from ourselves but from our relationship with God. When we feel weak, His power is made perfect in us.",
        "affirmations": ["Christ gives me strength", "I am empowered by God's grace", "Nothing is impossible with God", "Divine strength flows through me"],
        "source_reference": "Philippians 4:13 (NKJV)"
    },
    {
        "quote_text": "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
        "author": "Proverbs 3:5-6",
        "explanation": "Human wisdom has limits, but God's wisdom is infinite. When we surrender our plans and trust Him completely, He guides us on the right path. True peace comes from releasing control and embracing His leadership.",
        "affirmations": ["I trust God completely", "His wisdom guides my decisions", "I surrender my worries to the Lord", "My path is made straight by God"],
        "source_reference": "Proverbs 3:5-6 (NIV)"
    },
    {
        "quote_text": "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
        "author": "Joshua 1:9",
        "explanation": "Fear and discouragement are not from God. He calls us to courage because He promises His constant presence. No matter what challenges we face, we never face them alone. God walks beside us every step of the way.",
        "affirmations": ["I am strong and courageous", "God is always with me", "Fear has no power over me", "I walk boldly in faith"],
        "source_reference": "Joshua 1:9 (NIV)"
    },
    {
        "quote_text": "The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.",
        "author": "Psalm 23:1-3",
        "explanation": "As our shepherd, God provides everything we need. He offers rest, peace, and restoration for our weary souls. In His care, we find complete provision and profound peace that the world cannot offer.",
        "affirmations": ["God provides all my needs", "I rest in His peace", "My soul is restored daily", "I lack nothing with the Lord as my shepherd"],
        "source_reference": "Psalm 23:1-3 (ESV)"
    }
]

# Sample quotes for ISLAMIC category
islamic_quotes = [
    {
        "quote_text": "Indeed, with hardship comes ease.",
        "author": "Quran 94:6",
        "explanation": "Allah promises that every difficulty is accompanied by relief. This ayah is repeated twice in Surah Ash-Sharh, emphasizing that ease is guaranteed. No matter how challenging our circumstances, we can hold onto this divine promise.",
        "affirmations": ["Ease comes after every hardship", "Allah's promise is true", "Relief is on its way", "I trust in Allah's plan"],
        "source_reference": "Surah Ash-Sharh (94:6)"
    },
    {
        "quote_text": "The best among you are those who have the best manners and character.",
        "author": "Prophet Muhammad (PBUH)",
        "explanation": "In Islam, good character is considered one of the highest virtues. The Prophet (PBUH) emphasized that our treatment of others reflects our faith. True excellence is measured not by wealth or status, but by our character and conduct.",
        "affirmations": ["I strive for excellent character", "My manners reflect my faith", "I treat others with kindness and respect", "Good character is my greatest asset"],
        "source_reference": "Sahih Bukhari"
    },
    {
        "quote_text": "Tie your camel first, then put your trust in Allah.",
        "author": "Prophet Muhammad (PBUH)",
        "explanation": "This hadith teaches the balance between effort and trust in Allah (tawakkul). We must do our part—take practical steps and make preparations—while simultaneously placing our ultimate trust in Allah's wisdom and plan.",
        "affirmations": ["I take action and trust Allah", "My efforts are blessed", "Tawakkul guides my life", "I do my best and leave the rest to Allah"],
        "source_reference": "Jami at-Tirmidhi"
    },
    {
        "quote_text": "Allah does not burden a soul beyond that it can bear.",
        "author": "Quran 2:286",
        "explanation": "Every test and trial we face is within our capacity to handle. Allah, in His infinite wisdom, knows our limits better than we do. This verse provides comfort that we are never given more than we can bear with His help.",
        "affirmations": ["I am strong enough for this test", "Allah knows my strength", "Every challenge makes me grow", "I can overcome what I face"],
        "source_reference": "Surah Al-Baqarah (2:286)"
    },
    {
        "quote_text": "Be in this world as though you were a stranger or a traveler.",
        "author": "Prophet Muhammad (PBUH)",
        "explanation": "This hadith reminds us that our time in this world is temporary. By viewing ourselves as travelers, we focus on what truly matters—our akhirah (afterlife)—and avoid becoming too attached to worldly possessions and status.",
        "affirmations": ["I focus on what truly matters", "My heart is set on eternal success", "I live with purpose and intention", "This world is a journey, not my destination"],
        "source_reference": "Sahih Bukhari"
    }
]

# Create quotes in database
created_count = 0

print("Creating sample quotes...")

for i, quote_data in enumerate(general_quotes):
    quote_date = today - timedelta(days=i)
    quote, created = DailyQuote.objects.get_or_create(
        category='GENERAL',
        date=quote_date,
        defaults={
            'quote_text': quote_data['quote_text'],
            'author': quote_data['author'],
            'explanation': quote_data['explanation'],
            'affirmations': quote_data['affirmations'],
            'source_reference': quote_data['source_reference']
        }
    )
    if created:
        created_count += 1
        print(f"  Created GENERAL quote for {quote_date}")

for i, quote_data in enumerate(christian_quotes):
    quote_date = today - timedelta(days=i)
    quote, created = DailyQuote.objects.get_or_create(
        category='CHRISTIAN',
        date=quote_date,
        defaults={
            'quote_text': quote_data['quote_text'],
            'author': quote_data['author'],
            'explanation': quote_data['explanation'],
            'affirmations': quote_data['affirmations'],
            'source_reference': quote_data['source_reference']
        }
    )
    if created:
        created_count += 1
        print(f"  Created CHRISTIAN quote for {quote_date}")

for i, quote_data in enumerate(islamic_quotes):
    quote_date = today - timedelta(days=i)
    quote, created = DailyQuote.objects.get_or_create(
        category='ISLAMIC',
        date=quote_date,
        defaults={
            'quote_text': quote_data['quote_text'],
            'author': quote_data['author'],
            'explanation': quote_data['explanation'],
            'affirmations': quote_data['affirmations'],
            'source_reference': quote_data['source_reference']
        }
    )
    if created:
        created_count += 1
        print(f"  Created ISLAMIC quote for {quote_date}")

print(f"\n✓ Created {created_count} sample quotes!")
print(f"Total quotes in database: {DailyQuote.objects.count()}")
