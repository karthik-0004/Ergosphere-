from django.db import models


class Book(models.Model):
	title = models.CharField(max_length=500)
	author = models.CharField(max_length=300)
	rating = models.FloatField(null=True, blank=True)
	num_reviews = models.IntegerField(null=True, blank=True)
	description = models.TextField(null=True, blank=True)
	genre = models.CharField(max_length=200, null=True, blank=True)
	book_url = models.URLField(max_length=1000, null=True, blank=True)
	cover_image_url = models.URLField(max_length=1000, null=True, blank=True)
	price = models.CharField(max_length=50, null=True, blank=True)
	availability = models.CharField(max_length=100, null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return self.title


class AIInsight(models.Model):
	book = models.OneToOneField(
		Book, on_delete=models.CASCADE, related_name="insights"
	)
	summary = models.TextField(null=True, blank=True)
	genre_prediction = models.CharField(max_length=200, null=True, blank=True)
	sentiment = models.CharField(max_length=100, null=True, blank=True)
	sentiment_score = models.FloatField(null=True, blank=True)
	recommendations = models.JSONField(null=True, blank=True)
	is_processed = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"Insights for {self.book.title}"


class ChatHistory(models.Model):
	question = models.TextField()
	answer = models.TextField()
	source_books = models.JSONField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"Q: {self.question[:50]}"
