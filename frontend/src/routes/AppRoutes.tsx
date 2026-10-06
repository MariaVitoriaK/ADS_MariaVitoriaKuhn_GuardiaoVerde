import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Cadastro from '../pages/Cadastro';
import Perfil from '../pages/Perfil';
import Dashboard from '../pages/Dashboard';
import AdminPanel from '../pages/AdminPanel';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<AdminPanel />} />
            </Routes>
        </Router>
    );
}

export default App;