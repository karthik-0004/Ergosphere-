import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .ai_insights import AIInsightGenerator
from .cache_utils import (
	clear_expired_cache,
	get_cache_stats,
	get_cached_insight,
	get_cached_rag_answer,
	make_question_key,
	set_cached_insight,
	set_cached_rag_answer,
)
from .models import Book, ChatHistory
from .rag_pipeline import ingest_all_books, ingest_book_to_chroma
from .scraper import run_scraper
from .serializers import (
	AIInsightSerializer,
	BookDetailSerializer,
	BookListSerializer,
	BookUploadSerializer,
	ChatHistorySerializer,
	RAGQuerySerializer,
)

logger = logging.getLogger(__name__)


class BookListView(APIView):
	def get(self, request):
		try:
			books = Book.objects.all().order_by("-created_at")
			serializer = BookListSerializer(books, many=True)
			logger.info("Fetched book list", extra={"count": books.count()})
			return Response({"count": books.count(), "books": serializer.data})
		except Exception as e:
			logger.error("Failed to fetch book list", exc_info=True)
			return Response(
				{"error": "Failed to fetch books", "detail": str(e)},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR,
			)


class BookDetailView(APIView):
	def get(self, request, pk):
		try:
			try:
				book = Book.objects.get(pk=pk)
			except Book.DoesNotExist:
				return Response(
					{"error": "Book not found", "detail": f"No book with id {pk}"},
					status=status.HTTP_404_NOT_FOUND,
				)

			serializer = BookDetailSerializer(book)
			logger.info("Fetched book detail", extra={"book_id": pk})
			return Response(serializer.data)
		except Exception as e:
			logger.error("Failed to fetch book detail", exc_info=True)
			return Response(
				{"error": "Failed to fetch book detail", "detail": str(e)},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR,
			)


class BookRecommendationsView(APIView):
	def get(self, request, pk):
		try:
			try:
				book = Book.objects.get(pk=pk)
			except Book.DoesNotExist:
				return Response(
					{"error": "Book not found", "detail": f"No book with id {pk}"},
					status=status.HTTP_404_NOT_FOUND,
				)

			recommendations = []
			selected_ids = {book.id}

			if book.genre:
				genre_matches = list(
					Book.objects.filter(genre=book.genre)
					.exclude(pk=book.pk)
					.order_by("-created_at")[:5]
				)
				recommendations.extend(genre_matches)
				selected_ids.update(item.id for item in genre_matches)

			if len(recommendations) < 5 and book.rating is not None:
				remaining = 5 - len(recommendations)
				rating_matches = list(
					Book.objects.filter(
						rating__isnull=False,
						rating__gte=book.rating - 0.5,
						rating__lte=book.rating + 0.5,
					)
					.exclude(pk__in=selected_ids)
					.order_by("-created_at")[:remaining]
				)
				recommendations.extend(rating_matches)

			serializer = BookListSerializer(recommendations[:5], many=True)
			logger.info(
				"Fetched recommendations",
				extra={"book_id": pk, "count": len(serializer.data)},
			)
			return Response({"book_id": pk, "recommendations": serializer.data})
		except Exception as e:
			logger.error("Failed to fetch recommendations", exc_info=True)
			return Response(
				{"error": "Failed to fetch recommendations", "detail": str(e)},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR,
			)


class BookUploadView(APIView):
	def post(self, request):
		try:
			serializer = BookUploadSerializer(data=request.data)
			if serializer.is_valid():
				book = serializer.save()
				logger.info("Uploaded book", extra={"book_id": book.id})
				return Response(
					BookDetailSerializer(book).data,
					status=status.HTTP_201_CREATED,
				)
			return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
		except Exception as e:
			logger.error("Failed to upload book", exc_info=True)
			return Response(
				{"error": "Failed to upload book", "detail": str(e)},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR,
			)


class ScrapeBookView(APIView):
	def post(self, request):
		try:
			max_pages = request.data.get("max_pages", 3)
			try:
				max_pages = int(max_pages)
			except (TypeError, ValueError):
				max_pages = 3

			books_scraped = run_scraper(max_pages=max_pages)
			logger.info(
				"Scraping completed",
				extra={"max_pages": max_pages, "books_scraped": books_scraped},
			)
			return Response(
				{
					"message": "Scraping complete",
					"books_scraped": books_scraped,
				}
			)
		except Exception as e:
			logger.error("Failed to scrape books", exc_info=True)
			return Response(
				{"error": "Scraping failed", "detail": str(e)},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR,
			)


class RAGQueryView(APIView):
	def post(self, request):
		try:
			serializer = RAGQuerySerializer(data=request.data)
			if not serializer.is_valid():
				return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

			question = serializer.validated_data["question"]
			book_id = serializer.validated_data.get("book_id")
			question_key = make_question_key(question, book_id)
			cached_result = get_cached_rag_answer(question_key)
			if cached_result:
				logger.info("Served RAG response from cache")
				return Response(cached_result)

			from .rag_pipeline import answer_question

			result = answer_question(question, book_id=book_id)
			set_cached_rag_answer(question_key, result)
			answer = result.get("answer", "") if isinstance(result, dict) else str(result)
			sources = result.get("sources", []) if isinstance(result, dict) else []

			chat = ChatHistory.objects.create(
				question=question,
				answer=answer,
				source_books=sources,
			)

			logger.info("RAG query completed", extra={"chat_id": chat.id})
			return Response(
				{
					"question": question,
					"answer": answer,
					"sources": sources,
					"chat_id": chat.id,
				}
			)
		except Exception as e:
			logger.error("Failed to process RAG query", exc_info=True)
			return Response(
				{"error": "Failed to process question", "detail": str(e)},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR,
			)


class GenerateInsightsView(APIView):
	def post(self, request, pk):
		try:
			try:
				book = Book.objects.get(pk=pk)
			except Book.DoesNotExist:
				return Response(
					{"error": "Book not found", "detail": f"No book with id {pk}"},
					status=status.HTTP_404_NOT_FOUND,
				)

			cached_insight = get_cached_insight(pk)
			if cached_insight:
				logger.info("Served insights from cache", extra={"book_id": pk})
				return Response(cached_insight)

			generator = AIInsightGenerator()
			insight = generator.process_book_insights(book)
			if not insight:
				return Response(
					{"error": "Insight generation failed", "detail": "Unknown processing error"},
					status=status.HTTP_500_INTERNAL_SERVER_ERROR,
				)

			ingest_book_to_chroma(book)
			data = AIInsightSerializer(insight).data
			set_cached_insight(pk, data)
			logger.info("Generated and cached insights", extra={"book_id": pk})
			return Response(data)
		except Exception as e:
			logger.error("Failed to generate insights", exc_info=True)
			return Response(
				{"error": "Failed to generate insights", "detail": str(e)},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR,
			)


class IngestAllBooksView(APIView):
	def post(self, request):
		try:
			books_ingested = ingest_all_books()
			logger.info("Ingested all books", extra={"books_ingested": books_ingested})
			return Response(
				{"message": "Ingestion complete", "books_ingested": books_ingested}
			)
		except Exception as e:
			logger.error("Failed to ingest books", exc_info=True)
			return Response(
				{"error": "Ingestion failed", "detail": str(e)},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR,
			)


class ChatHistoryView(APIView):
	def get(self, request):
		try:
			history = ChatHistory.objects.all().order_by("-created_at")[:50]
			serializer = ChatHistorySerializer(history, many=True)
			logger.info("Fetched chat history", extra={"count": history.count()})
			return Response({"count": history.count(), "history": serializer.data})
		except Exception as e:
			logger.error("Failed to fetch chat history", exc_info=True)
			return Response(
				{"error": "Failed to fetch chat history", "detail": str(e)},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR,
			)


class CacheStatsView(APIView):
	def get(self, request):
		try:
			stats = get_cache_stats()
			logger.info("Fetched cache stats", extra=stats)
			return Response(stats, status=status.HTTP_200_OK)
		except Exception as e:
			logger.error("Failed to fetch cache stats", exc_info=True)
			return Response(
				{"error": "Failed to fetch cache stats", "detail": str(e)},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR,
			)

	def delete(self, request):
		try:
			cleared = clear_expired_cache()
			logger.info("Cleared expired cache entries", extra={"cleared": cleared})
			return Response(
				{"message": f"Cleared {cleared} expired cache entries"},
				status=status.HTTP_200_OK,
			)
		except Exception as e:
			logger.error("Failed to clear expired cache", exc_info=True)
			return Response(
				{"error": "Failed to clear expired cache", "detail": str(e)},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR,
			)
