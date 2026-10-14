import { BrowserRouter, Route, Routes } from 'react-router'
import DisplayPage from './pages/DisplayPage.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <main>
        <h1>Office Quotes</h1>
        <Routes>
          <Route path="/" element={<DisplayPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
