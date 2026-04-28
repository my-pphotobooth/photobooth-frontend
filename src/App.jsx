import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Booth from './pages/Booth'
import Wall from './pages/Wall'
import GangminLayout from './pages/gangmin/Layout'
import Login from './pages/gangmin/Login'
import Dashboard from './pages/gangmin/Dashboard'
import Categories from './pages/gangmin/Categories'
import Frames from './pages/gangmin/Frames'
import FrameForm from './pages/gangmin/FrameForm'
import Tapes from './pages/gangmin/Tapes'
import Photos from './pages/gangmin/Photos'
import InAppBrowserGuard from './components/InAppBrowserGuard'

export default function App() {
  return (
    <InAppBrowserGuard>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/booth" element={<Booth />} />
          <Route path="/wall" element={<Wall />} />
          <Route path="/gangmin/login" element={<Login />} />
          <Route path="/gangmin" element={<GangminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="categories" element={<Categories />} />
            <Route path="frames" element={<Frames />} />
            <Route path="frames/new" element={<FrameForm mode="create" />} />
            <Route path="frames/:id/edit" element={<FrameForm mode="edit" />} />
            <Route path="tapes" element={<Tapes />} />
            <Route path="photos" element={<Photos />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </InAppBrowserGuard>
  )
}
