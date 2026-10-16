import { useContext } from 'react';
import { Box, Typography, Button, Avatar, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import FeedNoticias from './FeedNoticias';

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, isAdmin, logout } = useContext(AuthContext);

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#fdfdfd' }}>
            <Box sx={{
                width: 250,
                borderRight: '2px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: 3
            }}>
                <Avatar sx={{ width: 100, height: 100, mb: 1, border: '1px solid #ccc' }}>Foto</Avatar>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    {user?.email ?? 'Usuário'}
                </Typography>

                <Chip
                    label={isAdmin ? 'Administrador' : 'Usuário'}
                    color={isAdmin ? 'success' : 'default'}
                    size="small"
                    sx={{ mb: 3 }}
                />

                <Button variant="outlined" fullWidth sx={{ mb: 2, borderRadius: 2, color: '#333', borderColor: '#333' }}>
                    Dashboard
                </Button>
                <Button variant="outlined" fullWidth sx={{ mb: 'auto', borderRadius: 2, color: '#333', borderColor: '#333' }}>
                    Denunciar
                </Button>

                {isAdmin && (
                    <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        sx={{ mt: 2, borderRadius: 2 }}
                        onClick={() => navigate('/admin')}
                    >
                        Abrir painel admin
                    </Button>
                )}

                <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    sx={{ mt: 2, borderRadius: 2 }}
                    onClick={() => {
                        logout();
                        navigate('/login');
                    }}
                >
                    Sair
                </Button>
            </Box>

            <Box sx={{ flexGrow: 1, p: 4, overflowY: 'auto' }}>
                <FeedNoticias isAdmin={isAdmin} />
            </Box>
        </Box>
    );
}