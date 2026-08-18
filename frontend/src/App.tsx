import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Blobs from './components/Blobs';
import Landing from './pages/Landing';
import PublicConsultant from './pages/PublicConsultant';
import { Login, Register } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Checkout from './pages/Checkout';

export default function App() {
  return (
    <BrowserRouter>
      <Blobs />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/c/:slug" element={<PublicConsultant />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
}
