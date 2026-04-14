from django.urls import path

from .views import (
    BookDetailView,
    BookListView,
    BookRecommendationsView,
    BookUploadView,
    CacheStatsView,
    ChatHistoryView,
    GenerateInsightsView,
    IngestAllBooksView,
    RAGQueryView,
    ScrapeBookView,
)

urlpatterns = [
    path("books/", BookListView.as_view(), name="book-list"),
    path("cache/stats/", CacheStatsView.as_view(), name="cache-stats"),
    path("books/ingest/", IngestAllBooksView.as_view(), name="ingest-all"),
    path("books/upload/", BookUploadView.as_view(), name="book-upload"),
    path("books/scrape/", ScrapeBookView.as_view(), name="book-scrape"),
    path("books/query/", RAGQueryView.as_view(), name="rag-query"),
    path("books/<int:pk>/", BookDetailView.as_view(), name="book-detail"),
    path(
        "books/<int:pk>/insights/",
        GenerateInsightsView.as_view(),
        name="generate-insights",
    ),
    path(
        "books/<int:pk>/recommendations/",
        BookRecommendationsView.as_view(),
        name="book-recommendations",
    ),
    path("chat/history/", ChatHistoryView.as_view(), name="chat-history"),
]
