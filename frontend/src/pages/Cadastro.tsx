import { useState } from 'react';
import { Button, TextField, Typography, Container, Box, Link, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../services/api';

export default function Cadastro() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const navigate = useNavigate();

    const handleCadastro = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');

        try {
            await api.post('/usuarios/', { nome, email, senha });
            alert('Cadastro realizado com sucesso! Faça login.');
            navigate('/login');
        } catch (err: unknown) {
            if (axios.isAxiosError<{ detail?: unknown }>(err)) {
                const detail = err.response?.data?.detail;
                if (typeof detail === 'string') {
                    setErro(detail);
                } else if (Array.isArray(detail)) {
                    setErro(detail.map((item: unknown) => (
                        typeof item === 'object' && item !== null && 'msg' in item
                            ? String(item.msg)
                            : String(item)
                    )).join(' '));
                } else {
                    setErro('Erro ao realizar cadastro. Tente novamente.');
                }
            } else {
                setErro('Erro ao realizar cadastro. Tente novamente.');
            }
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5" color="success.main" gutterBottom>
                    Criar Conta
                </Typography>

                {erro && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{erro}</Alert>}

                <Box component="form" onSubmit={handleCadastro} sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Nome Completo"
                        autoFocus
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="E-mail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Senha"
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                    />
                    <Button type="submit" fullWidth variant="contained" color="success" sx={{ mt: 3, mb: 2 }}>
                        Cadastrar
                    </Button>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Link href="/login" variant="body2" color="success.main">
                            Já tem uma conta? Faça login
                        </Link>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
}