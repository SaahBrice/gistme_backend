"""
Management command to seed default article categories.
Run with: python manage.py seed_categories
"""
from django.core.management.base import BaseCommand
from api.models import ArticleCategory


class Command(BaseCommand):
    help = 'Seeds the database with default article categories'

    def handle(self, *args, **options):
        categories = [
            # ACTUALITY categories
            {'slug': 'politics', 'name_en': 'Politics', 'name_fr': 'Politique', 'emoji': '🏛️', 'main_category': 'ACTUALITY', 'order': 1},
            {'slug': 'economy', 'name_en': 'Economy', 'name_fr': 'Économie', 'emoji': '📈', 'main_category': 'ACTUALITY', 'order': 2},
            {'slug': 'sports', 'name_en': 'Sports', 'name_fr': 'Sports', 'emoji': '⚽', 'main_category': 'ACTUALITY', 'order': 3},
            {'slug': 'entertainment', 'name_en': 'Entertainment', 'name_fr': 'Divertissement', 'emoji': '🎬', 'main_category': 'ACTUALITY', 'order': 4},
            {'slug': 'health', 'name_en': 'Health', 'name_fr': 'Santé', 'emoji': '🏥', 'main_category': 'ACTUALITY', 'order': 5},
            {'slug': 'technology', 'name_en': 'Technology', 'name_fr': 'Technologie', 'emoji': '💻', 'main_category': 'ACTUALITY', 'order': 6},
            {'slug': 'culture', 'name_en': 'Culture', 'name_fr': 'Culture', 'emoji': '🎭', 'main_category': 'ACTUALITY', 'order': 7},
            {'slug': 'society', 'name_en': 'Society', 'name_fr': 'Société', 'emoji': '👥', 'main_category': 'ACTUALITY', 'order': 8},
            {'slug': 'international', 'name_en': 'International', 'name_fr': 'International', 'emoji': '🌍', 'main_category': 'ACTUALITY', 'order': 9},
            
            # OPPORTUNITY categories
            {'slug': 'scholarships', 'name_en': 'Scholarships', 'name_fr': 'Bourses', 'emoji': '🎓', 'main_category': 'OPPORTUNITY', 'order': 1},
            {'slug': 'jobs-abroad', 'name_en': 'Jobs Abroad', 'name_fr': 'Emplois à l\'étranger', 'emoji': '✈️', 'main_category': 'OPPORTUNITY', 'order': 2},
            {'slug': 'jobs-local', 'name_en': 'Jobs Local', 'name_fr': 'Emplois locaux', 'emoji': '🇨🇲', 'main_category': 'OPPORTUNITY', 'order': 3},
            {'slug': 'concours', 'name_en': 'Concours', 'name_fr': 'Concours', 'emoji': '📝', 'main_category': 'OPPORTUNITY', 'order': 4},
            {'slug': 'competitions', 'name_en': 'Competitions', 'name_fr': 'Compétitions', 'emoji': '🏆', 'main_category': 'OPPORTUNITY', 'order': 5},
            
            # FOR_YOU category (personalized)
            {'slug': 'for-you', 'name_en': 'For You', 'name_fr': 'Pour Vous', 'emoji': '✨', 'main_category': 'FOR_YOU', 'order': 1},
        ]

        created_count = 0
        updated_count = 0
        
        for cat_data in categories:
            obj, created = ArticleCategory.objects.update_or_create(
                slug=cat_data['slug'],
                defaults={
                    'name_en': cat_data['name_en'],
                    'name_fr': cat_data['name_fr'],
                    'emoji': cat_data['emoji'],
                    'main_category': cat_data['main_category'],
                    'order': cat_data['order'],
                    'is_active': True,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'  Created: {obj}'))
            else:
                updated_count += 1
                self.stdout.write(f'  Updated: {obj}')
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Done! Created {created_count}, updated {updated_count} categories.'))
