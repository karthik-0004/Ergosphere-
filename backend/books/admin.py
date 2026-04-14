from django.contrib import admin

from .models import AIInsight, Book, ChatHistory


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
	list_display = (
		"title",
		"author",
		"genre",
		"rating",
		"num_reviews",
		"price",
		"availability",
		"created_at",
	)
	search_fields = ("title", "author", "genre")
	list_filter = ("genre", "availability", "created_at")
	ordering = ("-created_at",)


@admin.register(AIInsight)
class AIInsightAdmin(admin.ModelAdmin):
	list_display = (
		"book",
		"genre_prediction",
		"sentiment",
		"sentiment_score",
		"is_processed",
		"created_at",
	)
	search_fields = ("book__title", "genre_prediction", "sentiment")
	list_filter = ("is_processed", "sentiment", "created_at")
	ordering = ("-created_at",)


@admin.register(ChatHistory)
class ChatHistoryAdmin(admin.ModelAdmin):
	list_display = ("short_question", "created_at")
	search_fields = ("question", "answer")
	ordering = ("-created_at",)

	@staticmethod
	def short_question(obj):
		return obj.question[:80]
