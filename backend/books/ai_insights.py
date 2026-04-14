import json

from django.conf import settings
from django.db.models import Q
from openai import OpenAI

from .models import AIInsight, Book

client = OpenAI(api_key=settings.OPENAI_API_KEY)


class AIInsightGenerator:
	def generate_summary(self, book):
		try:
			description = (book.description or "")[:500]
			response = client.chat.completions.create(
				model="gpt-3.5-turbo",
				messages=[
					{
						"role": "system",
						"content": "You are a literary analyst. Generate concise, engaging book summaries.",
					},
					{
						"role": "user",
						"content": (
							"Generate a 3-sentence summary for this book:\n"
							f"Title: {book.title}, Author: {book.author}, Genre: {book.genre}, "
							f"Description: {description}"
						),
					},
				],
				max_tokens=200,
				temperature=0.7,
			)
			return (response.choices[0].message.content or "").strip()
		except Exception:
			return ""

	def classify_genre(self, book):
		try:
			description = (book.description or "")[:400]
			response = client.chat.completions.create(
				model="gpt-3.5-turbo",
				messages=[
					{
						"role": "system",
						"content": "You are a book genre classifier. Respond with only the genre name, nothing else.",
					},
					{
						"role": "user",
						"content": (
							"Classify the genre of this book:\n"
							f"Title: {book.title}, Author: {book.author}, "
							f"Description: {description}\n"
							"Choose from: Fiction, Non-Fiction, Mystery, Romance, Science Fiction, "
							"Fantasy, Biography, History, Self-Help, Children, Horror, Thriller, "
							"Literary Fiction, Historical Fiction, Other"
						),
					},
				],
				max_tokens=20,
				temperature=0.3,
			)
			return (response.choices[0].message.content or "").strip()
		except Exception:
			return book.genre or "Unknown"

	def analyze_sentiment(self, book):
		try:
			description = (book.description or "")[:400]
			response = client.chat.completions.create(
				model="gpt-3.5-turbo",
				messages=[
					{
						"role": "system",
						"content": "You are a sentiment analyzer for books. Always respond in valid JSON format only.",
					},
					{
						"role": "user",
						"content": (
							"Analyze the tone and sentiment of this book based on its description and metadata.\n"
							f"Title: {book.title}, Genre: {book.genre}, Description: {description}\n"
							"Respond in this exact JSON format:\n"
							"{\n"
							"  'sentiment': 'positive/negative/neutral/mixed',\n"
							"  'score': 0.0 to 1.0,\n"
							"  'tone_keywords': ['word1', 'word2', 'word3']\n"
							"}"
						),
					},
				],
				max_tokens=150,
				temperature=0.3,
			)
			content = (response.choices[0].message.content or "").strip()
			content = content.replace("```json", "").replace("```", "").strip()
			payload = json.loads(content)
			return {
				"sentiment": str(payload.get("sentiment", "neutral")),
				"score": float(payload.get("score", 0.5)),
				"tone_keywords": payload.get("tone_keywords", []) or [],
			}
		except Exception:
			return {"sentiment": "neutral", "score": 0.5, "tone_keywords": []}

	def generate_recommendations(self, book, all_books):
		try:
			candidates = list(all_books[:10])
			if not candidates:
				return []

			candidates_text = "\n".join(
				[
					f"Title: {candidate.title}, Author: {candidate.author}, Genre: {candidate.genre}"
					for candidate in candidates
				]
			)

			response = client.chat.completions.create(
				model="gpt-3.5-turbo",
				messages=[
					{
						"role": "system",
						"content": "You are a book recommendation engine. Respond with only a JSON array of book titles.",
					},
					{
						"role": "user",
						"content": (
							f"Given that someone liked '{book.title}' by {book.author} "
							f"(Genre: {book.genre}), which of these books would you recommend?\n"
							f"Candidates: {candidates_text}\n"
							"Return a JSON array of up to 3 book titles from the candidates list."
						),
					},
				],
				max_tokens=200,
				temperature=0.5,
			)

			content = (response.choices[0].message.content or "").strip()
			content = content.replace("```json", "").replace("```", "").strip()
			titles = json.loads(content)
			if not isinstance(titles, list):
				return []

			lookup = {candidate.title: candidate for candidate in candidates}
			recommendations = []
			for title in titles:
				candidate = lookup.get(str(title).strip())
				if candidate:
					recommendations.append({"id": candidate.id, "title": candidate.title})
			return recommendations
		except Exception:
			return []

	def process_book_insights(self, book):
		try:
			insight, _ = AIInsight.objects.get_or_create(book=book)

			insight.summary = self.generate_summary(book)

			genre_prediction = self.classify_genre(book)
			insight.genre_prediction = genre_prediction
			if not book.genre:
				book.genre = genre_prediction

			sentiment_data = self.analyze_sentiment(book)
			insight.sentiment = sentiment_data.get("sentiment", "neutral")
			insight.sentiment_score = sentiment_data.get("score", 0.5)

			candidate_books = Book.objects.exclude(id=book.id).order_by("-created_at")[:20]
			insight.recommendations = self.generate_recommendations(book, candidate_books)

			insight.is_processed = True
			insight.save()
			book.save()

			print(f"AI insights generated for: {book.title}")
			return insight
		except Exception as exc:
			print(f"Failed to generate AI insights for {book.title}: {exc}")
			return None


def process_all_unprocessed_books():
	books = Book.objects.filter(
		Q(insights__isnull=True) | Q(insights__is_processed=False)
	).distinct()
	generator = AIInsightGenerator()
	processed = 0
	for book in books:
		if generator.process_book_insights(book):
			processed += 1
	print(f"Processed AI insights for {processed} books.")
