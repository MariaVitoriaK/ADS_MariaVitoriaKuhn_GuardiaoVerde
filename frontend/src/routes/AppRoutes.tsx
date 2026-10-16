import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Cadastro from '../pages/Cadastro';
import Perfil from '../pages/Perfil';
import Dashboard from '../pages/Dashboard';
import AdminPanel from '../pages/AdminPanel';
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
                </Route>

                <Route element={<PrivateRoute adminOnly />}>
                    <Route path="/admin" element={<AdminPanel />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;