import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Booth from './pages/Booth'
import Wall from './pages/Wall'
import GangminLayout from './pages/gangmin/Layout'
import Dashboard from './pages/gangmin/Dashboard'
import Categories from './pages/gangmin/Categories'
import Frames from './pages/gangmin/Frames'
import FrameForm from './pages/gangmin/FrameForm'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/booth" element={<Booth />} />
        <Route path="/wall" element={<Wall />} />
        <Route path="/gangmin" element={<GangminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="categories" element={<Categories />} />
          <Route path="frames" element={<Frames />} />
          <Route path="frames/new" element={<FrameForm mode="create" />} />
          <Route path="frames/:id/edit" element={<FrameForm mode="edit" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
