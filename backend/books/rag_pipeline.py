import json
import re

import chromadb
from chromadb.utils import embedding_functions
from django.conf import settings
from django.db.models import Q
from openai import OpenAI

client = OpenAI(api_key=settings.OPENAI_API_KEY)

openai_ef = embedding_functions.OpenAIEmbeddingFunction(
	api_key=settings.OPENAI_API_KEY,
	model_name="text-embedding-ada-002",
)

chroma_client = chromadb.PersistentClient(path=str(settings.CHROMA_DB_PATH))

collection = chroma_client.get_or_create_collection(
	name="books_collection",
	embedding_function=openai_ef,
)


def chunk_book_text(book):
	chunks = []

	metadata_chunk = (
		f"Title: {book.title}. Author: {book.author}. Genre: {book.genre}. "
		f"Price: {book.price}. Rating: {book.rating}/5. "
		f"Availability: {book.availability}."
	)
	chunks.append(metadata_chunk)

	description = (book.description or "").strip()
	if description:
		if len(description) <= 300:
			chunks.append(f"Book Description for '{book.title}': {description}")
		else:
			step = 250
			for start in range(0, len(description), step):
				end = start + 300
				sub_chunk = description[start:end]
				if not sub_chunk:
					continue
				chunks.append(f"Book Description for '{book.title}': {sub_chunk}")
				if end >= len(description):
					break

	insight = None
	try:
		insight = book.insights
	except Exception:
		insight = None

	if insight:
		insight_chunk = (
			f"AI Summary of '{book.title}': {insight.summary}. "
			f"Sentiment: {insight.sentiment}. "
			f"Genre Classification: {insight.genre_prediction}."
		)
		chunks.append(insight_chunk)

	return chunks


def ingest_book_to_chroma(book):
	try:
		chunks = chunk_book_text(book)
		if not chunks:
			return

		ids = [f"book_{book.id}_chunk_{index}" for index, _ in enumerate(chunks)]
		metadatas = [
			{
				"book_id": book.id,
				"title": book.title,
				"author": book.author,
				"chunk_index": index,
			}
			for index, _ in enumerate(chunks)
		]

		collection.upsert(
			documents=chunks,
			metadatas=metadatas,
			ids=ids,
		)
		print(f"Ingested {len(chunks)} chunks for book: {book.title}")
	except Exception as exc:
		print(f"Failed to ingest book '{book.title}' to ChromaDB: {exc}")


def ingest_all_books():
	from .models import Book

	books = Book.objects.all()
	for book in books:
		ingest_book_to_chroma(book)
	return books.count()


def search_similar_chunks(query_text, n_results=5, book_id=None):
	try:
		if book_id is not None:
			where_filter = {"book_id": int(book_id)}
			return collection.query(
				query_texts=[query_text],
				n_results=n_results,
				where=where_filter,
			)
		return collection.query(query_texts=[query_text], n_results=n_results)
	except Exception:
		return None


def build_context_from_results(chroma_results):
	if not chroma_results:
		return "", []

	documents = (chroma_results.get("documents") or [[]])[0]
	metadatas = (chroma_results.get("metadatas") or [[]])[0]

	context_lines = []
	source_books = []
	seen_ids = set()

	for index, (document_text, metadata) in enumerate(zip(documents, metadatas), start=1):
		title = metadata.get("title", "Unknown") if metadata else "Unknown"
		author = metadata.get("author", "Unknown") if metadata else "Unknown"
		book_id = metadata.get("book_id") if metadata else None

		context_lines.append(
			f"SOURCE {index} (Book: {title} by {author}):\n{document_text}\n"
		)

		if book_id is not None and book_id not in seen_ids:
			seen_ids.add(book_id)
			source_books.append(
				{"book_id": book_id, "title": title, "author": author}
			)

	context_string = "\n".join(context_lines).strip()
	return context_string, source_books


def answer_question(question, book_id=None):
	try:
		results = search_similar_chunks(question, n_results=5, book_id=book_id)
		if not results:
			return {
				"answer": "I could not find relevant information to answer your question. Please try rephrasing.",
				"sources": [],
			}

		documents = results.get("documents") or []
		if not documents or not documents[0]:
			return {
				"answer": "I could not find relevant information to answer your question. Please try rephrasing.",
				"sources": [],
			}

		context, source_books = build_context_from_results(results)

		response = client.chat.completions.create(
			model="gpt-3.5-turbo",
			messages=[
				{
					"role": "system",
					"content": (
						"You are an intelligent book assistant. Answer questions about books "
						"using ONLY the provided context. Always cite which book(s) your "
						"answer comes from. Be concise and helpful."
					),
				},
				{
					"role": "user",
					"content": (
						"Context from book database:\n"
						f"{context}\n\n"
						f"Question: {question}\n\n"
						"Answer based on the context above and cite your sources:"
					),
				},
			],
			max_tokens=500,
			temperature=0.5,
		)

		answer_text = (response.choices[0].message.content or "").strip()
		return {"answer": answer_text, "sources": source_books}
	except Exception:
		return {
			"answer": "An error occurred while processing your question.",
			"sources": [],
		}
