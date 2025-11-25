from django.db import models
import random

class Article(models.Model):
    headline = models.CharField(max_length=300)
    category = models.CharField(max_length=100, db_index=True)
    french_summary = models.TextField()
    english_summary = models.TextField()
    mood = models.CharField(max_length=100, db_index=True)
    source_urls = models.JSONField(default=list, blank=True)
    source_names = models.JSONField(default=list, blank=True)
    thumbnails = models.JSONField(default=list, blank=True)
    french_audio = models.CharField(max_length=500, null=True, blank=True)
    english_audio = models.CharField(max_length=500, null=True, blank=True)
    timestamp = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    view_count = models.PositiveIntegerField(default=0, db_index=True)
    comment_count = models.PositiveIntegerField(default=0)
    reaction_count = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.view_count:
            self.view_count = random.randint(1000, 5000000)
        
        if not self.reaction_count:
            upper_limit = min(100000, self.view_count)
            if upper_limit < 100:
                self.reaction_count = upper_limit
            else:
                self.reaction_count = random.randint(100, upper_limit)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.headline

class Comment(models.Model):
    article = models.ForeignKey(Article, related_name='comments', on_delete=models.CASCADE)
    commenter_name = models.CharField(max_length=50)
    comment_text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.commenter_name} on {self.article.headline[:30]}"

class VisitorSubscription(models.Model):
    session_key = models.CharField(max_length=40, unique=True)
    endpoint = models.URLField(max_length=500)
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Subscription for {self.session_key}"
