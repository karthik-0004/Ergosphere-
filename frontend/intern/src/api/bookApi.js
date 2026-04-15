import axios from 'axios'

const API_BASE = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

export const bookApi = {
  getAllBooks: () => api.get('/books/'),
  getBookDetail: (id) => api.get(`/books/${id}/`),
  getRecommendations: (id) => api.get(`/books/${id}/recommendations/`),
  uploadBook: (data) => api.post('/books/upload/', data),
  scrapeBooks: (maxPages = 2) => api.post('/books/scrape/', { max_pages: maxPages }),
  askQuestion: (question, bookId = null) => {
    const payload = { question }
    if (bookId !== null && bookId !== undefined && bookId !== '') {
      payload.book_id = bookId
    }
    return api.post('/books/query/', payload)
  },
  generateInsights: (id) => api.post(`/books/${id}/insights/`),
  ingestAllBooks: () => api.post('/books/ingest/'),
  getChatHistory: () => api.get('/chat/history/'),
}
