import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Booth from './pages/Booth'
import Wall from './pages/Wall'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/booth" element={<Booth />} />
        <Route path="/wall" element={<Wall />} />
      </Routes>
    </BrowserRouter>
  )
}
