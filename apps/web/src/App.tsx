import { BrowserRouter, NavLink, Route, Routes } from 'react-router'
import DisplayPage from './pages/DisplayPage.tsx'
import ModeratePage from './pages/ModeratePage.tsx'
import SubmitPage from './pages/SubmitPage.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <main>
        <h1>Office Quotes</h1>
        <nav>
          <NavLink to="/" end>
            Quotes
          </NavLink>
          <NavLink to="/submit">Submit</NavLink>
        </nav>
        <Routes>
          <Route path="/" element={<DisplayPage />} />
          <Route path="/submit" element={<SubmitPage />} />
          <Route path="/moderate" element={<ModeratePage />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
