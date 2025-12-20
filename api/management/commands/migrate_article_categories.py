"""
Management command to migrate existing articles from legacy category strings to new FK categories.
Run with: python manage.py migrate_article_categories
"""
from django.core.management.base import BaseCommand
from api.models import Article, ArticleCategory


# Mapping from legacy category values to new category slugs
CATEGORY_MAPPING = {
    # ACTUALITY mappings
    'politics': 'politics',
    'economy': 'economy',
    'business': 'economy',
    'sports': 'sports',
    'entertainment': 'entertainment',
    'health': 'health',
    'technology': 'technology',
    'science': 'technology',
    'culture': 'culture',
    'lifestyle': 'culture',
    'society': 'society',
    'international': 'international',
    'education': 'society',
    'environment': 'society',
    'crime': 'society',
    'religion': 'culture',
    'real_estate': 'economy',
    'transportation': 'society',
    'human_interest': 'society',
    'agriculture': 'economy',
    
    # OPPORTUNITY mappings
    'scholarships': 'scholarships',
    'scholarships cameroonians can apply': 'scholarships',
    'jobs_abroad': 'jobs-abroad',
    'latest_jobs': 'jobs-local',
    'jobs_local': 'jobs-local',
    'concours': 'concours',
    'concours_launch': 'concours',
    'competitions': 'competitions',
    
    # Edge cases - map to most sensible category
    'disgusting': 'society',
    'Mboa music': 'entertainment',
    'Mboko music': 'entertainment',
    'music artistsuniversity': 'entertainment',
    'happened in Buea': 'society',
    'happened in any region': 'society',
}


class Command(BaseCommand):
    help = 'Migrates articles from legacy category strings to new FK categories'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )
        parser.add_argument(
            '--delete-unmapped',
            action='store_true',
            help='Delete articles that cannot be mapped to any category',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        delete_unmapped = options['delete_unmapped']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No changes will be made'))
        
        # Build slug -> category lookup
        category_lookup = {}
        for cat in ArticleCategory.objects.all():
            category_lookup[cat.slug] = cat
        
        # Get all articles with legacy data
        articles = Article.objects.filter(category__isnull=True, category_legacy__isnull=False)
        
        total = articles.count()
        mapped = 0
        unmapped = 0
        deleted = 0
        unmapped_categories = set()
        
        self.stdout.write(f'Found {total} articles with legacy categories to migrate')
        self.stdout.write('')
        
        for article in articles:
            legacy = article.category_legacy.strip().lower() if article.category_legacy else ''
            
            # Try to find mapping
            new_slug = None
            for pattern, target_slug in CATEGORY_MAPPING.items():
                if legacy == pattern.lower():
                    new_slug = target_slug
                    break
            
            if new_slug and new_slug in category_lookup:
                if not dry_run:
                    article.category = category_lookup[new_slug]
                    article.save(update_fields=['category'])
                mapped += 1
            else:
                unmapped += 1
                unmapped_categories.add(article.category_legacy)
                
                if delete_unmapped and not dry_run:
                    article.delete()
                    deleted += 1
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Mapped: {mapped} articles'))
        self.stdout.write(self.style.WARNING(f'Unmapped: {unmapped} articles'))
        
        if deleted > 0:
            self.stdout.write(self.style.ERROR(f'Deleted: {deleted} unmapped articles'))
        
        if unmapped_categories:
            self.stdout.write('')
            self.stdout.write('Unmapped legacy categories:')
            for cat in sorted(unmapped_categories):
                self.stdout.write(f'  - "{cat}"')
