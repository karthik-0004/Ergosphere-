import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Navbar from './components/Navbar'
import BookDetailPage from './pages/BookDetailPage'
import ChatHistoryPage from './pages/ChatHistoryPage'
import DashboardPage from './pages/DashboardPage'
import NotFoundPage from './pages/NotFoundPage'
import QAPage from './pages/QAPage'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-50 font-body text-slate-900">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/books/:id" element={<BookDetailPage />} />
            <Route path="/qa" element={<QAPage />} />
            <Route path="/history" element={<ChatHistoryPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
