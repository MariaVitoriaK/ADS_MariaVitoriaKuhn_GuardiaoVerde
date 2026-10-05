import { useState, useContext } from 'react';
import { Button, TextField, Typography, Container, Box, Link, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');

        try {
            // O FastAPI OAuth2 espera dados em formato x-www-form-urlencoded
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', senha);

            const response = await api.post('/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            login(response.data.access_token);
            navigate('/'); // Redireciona para o Dashboard após o login
        } catch (err: any) {
            setErro('E-mail ou senha incorretos.');
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5" color="success.main" gutterBottom>
                    Guardião Verde - Login
                </Typography>

                {erro && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{erro}</Alert>}

                <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="E-mail"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Senha"
                        type="password"
                        autoComplete="current-password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                    />
                    <Button type="submit" fullWidth variant="contained" color="success" sx={{ mt: 3, mb: 2 }}>
                        Entrar
                    </Button>
                    <Box display="flex" justifyContent="space-between">
                        <Link href="#" variant="body2" color="success.main">
                            Esqueceu a senha?
                        </Link>
                        <Link href="/cadastro" variant="body2" color="success.main">
                            Não tem conta? Cadastre-se
                        </Link>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
}