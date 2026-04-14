import time

CACHE_TTL = 3600

_insight_cache = {}
_rag_cache = {}


def get_cached_insight(book_id):
	entry = _insight_cache.get(book_id)
	if not entry:
		return None
	if time.time() - entry.get("timestamp", 0) > CACHE_TTL:
		_insight_cache.pop(book_id, None)
		return None
	return entry.get("data")


def set_cached_insight(book_id, insight_data):
	_insight_cache[book_id] = {"data": insight_data, "timestamp": time.time()}


def get_cached_rag_answer(question_key):
	entry = _rag_cache.get(question_key)
	if not entry:
		return None
	if time.time() - entry.get("timestamp", 0) > CACHE_TTL:
		_rag_cache.pop(question_key, None)
		return None
	return entry.get("data")


def set_cached_rag_answer(question_key, answer_data):
	_rag_cache[question_key] = {"data": answer_data, "timestamp": time.time()}


def make_question_key(question, book_id=None):
	return f"{question.lower().strip()}_{book_id}"


def clear_expired_cache():
	now = time.time()
	cleared = 0

	for key in list(_insight_cache.keys()):
		if now - _insight_cache[key].get("timestamp", 0) > CACHE_TTL:
			_insight_cache.pop(key, None)
			cleared += 1

	for key in list(_rag_cache.keys()):
		if now - _rag_cache[key].get("timestamp", 0) > CACHE_TTL:
			_rag_cache.pop(key, None)
			cleared += 1

	return cleared


def get_cache_stats():
	insight_cache_size = len(_insight_cache)
	rag_cache_size = len(_rag_cache)
	return {
		"insight_cache_size": insight_cache_size,
		"rag_cache_size": rag_cache_size,
		"total_cached": insight_cache_size + rag_cache_size,
	}
