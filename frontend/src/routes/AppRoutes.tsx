import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Cadastro from '../pages/Cadastro';
import Perfil from '../pages/Perfil';
import Dashboard from '../pages/Dashboard';
import DenunciarPage from '../pages/DenunciarPage';
import AdminPanel from '../pages/AdminPanel';
import AdminDenunciasPage from '../pages/AdminDenunciasPage';
import NoticiaPage from '../pages/NoticiaPage';
import PrivateRoute from './PrivateRoute';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />

                <Route element={<PrivateRoute />}>
                    <Route path="/home" element={<Home />} />
                    <Route path="/perfil" element={<Perfil />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/denunciar" element={<DenunciarPage />} />
                    <Route path="/noticias/:id" element={<NoticiaPage />} />
                </Route>

                <Route element={<PrivateRoute adminOnly />}>
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/admin/denuncias" element={<AdminDenunciasPage />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;