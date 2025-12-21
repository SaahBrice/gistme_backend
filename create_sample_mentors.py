# Create sample categories and mentors
from web.models import MentorCategory, Mentor

# Create categories
categories_data = [
    {'name': 'ARTS', 'label': 'Arts & Socials', 'icon': 'palette', 'order': 1},
    {'name': 'SCIENCE', 'label': 'Science & Technology', 'icon': 'flask', 'order': 2},
    {'name': 'GROWTH', 'label': 'Growth & Religion', 'icon': 'heart', 'order': 3},
    {'name': 'BUSINESS', 'label': 'Business & Finance', 'icon': 'briefcase', 'order': 4},
]

for cat_data in categories_data:
    cat, created = MentorCategory.objects.get_or_create(
        name=cat_data['name'],
        defaults={
            'label': cat_data['label'],
            'icon': cat_data['icon'],
            'order': cat_data['order']
        }
    )
    if created:
        print(f"Created category: {cat.label}")
    else:
        print(f"Category already exists: {cat.label}")

# Get category references
arts_cat = MentorCategory.objects.get(name='ARTS')
science_cat = MentorCategory.objects.get(name='SCIENCE')
growth_cat = MentorCategory.objects.get(name='GROWTH')
business_cat = MentorCategory.objects.get(name='BUSINESS')

# Create mentors
mentors_data = [
    {
        'name': 'Dr. Nkeng Stephens',
        'profession': 'Software Engineer at Google',
        'location': 'Douala',
        'bio': 'Helping young Cameroonians break into tech. 10+ years in software development.',
        'picture': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
        'category': science_cat,
        'language': 'BI'
    },
    {
        'name': 'Marie-Claire Fotso',
        'profession': 'PhD Researcher - Public Health',
        'location': 'Yaoundé',
        'bio': 'Passionate about mentoring women in STEM. Research focus on tropical diseases.',
        'picture': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
        'category': science_cat,
        'language': 'FR'
    },
    {
        'name': 'Pastor Emmanuel Mbah',
        'profession': 'Youth Pastor & Life Coach',
        'location': 'Bamenda',
        'bio': 'Guiding young people to discover purpose and build character.',
        'picture': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
        'category': growth_cat,
        'language': 'EN'
    },
    {
        'name': 'Aminatou Hadja',
        'profession': 'Islamic Scholar & Counselor',
        'location': 'Maroua',
        'bio': 'Empowering Muslim youth through education and spiritual guidance.',
        'picture': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
        'category': growth_cat,
        'language': 'FR'
    },
    {
        'name': 'Jean-Pierre Kouam',
        'profession': 'Journalist & Writer',
        'location': 'Douala',
        'bio': 'Award-winning journalist. Mentoring aspiring writers and media professionals.',
        'picture': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
        'category': arts_cat,
        'language': 'FR'
    },
    {
        'name': 'Sandrine Eyanga',
        'profession': 'Artist & Cultural Curator',
        'location': 'Buea',
        'bio': 'Celebrating African art. Helping artists build sustainable careers.',
        'picture': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
        'category': arts_cat,
        'language': 'BI'
    },
    {
        'name': 'Eric Tamo',
        'profession': 'Entrepreneur & Investor',
        'location': 'Douala',
        'bio': 'Building businesses across Africa. Passionate about mentoring young entrepreneurs.',
        'picture': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
        'category': business_cat,
        'language': 'EN'
    },
    {
        'name': 'Dr. Ngozi Okonjo',
        'profession': 'Finance Consultant',
        'location': 'Yaoundé',
        'bio': 'Former banking executive. Helping young professionals understand finance and investment.',
        'picture': 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=200&h=200&fit=crop&crop=face',
        'category': business_cat,
        'language': 'BI'
    },
]

for mentor_data in mentors_data:
    mentor, created = Mentor.objects.get_or_create(
        name=mentor_data['name'],
        defaults=mentor_data
    )
    if created:
        print(f"Created mentor: {mentor.name} ({mentor.get_language_display()})")
    else:
        print(f"Mentor already exists: {mentor.name}")

print("\nDone! Sample data created.")
print(f"Total categories: {MentorCategory.objects.count()}")
print(f"Total mentors: {Mentor.objects.count()}")
