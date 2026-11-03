import { useContext, useEffect, useState } from 'react';
import {
    AppBar,
    Avatar,
    Box,
    Button,
    Chip,
    Drawer,
    IconButton,
    Toolbar,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import FeedNoticias from './FeedNoticias';
import api, { getCurrentUser } from '../services/api';

export default function Dashboard() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, isAdmin, logout, updateUser } = useContext(AuthContext);

    useEffect(() => {
        getCurrentUser()
            .then(({ data }) => updateUser({ nome: data.nome, foto_perfil: data.foto_perfil }))
            .catch((error) => console.error('Erro ao carregar o perfil do usuário', error));
    }, [updateUser]);

    const fotoPerfil = user?.foto_perfil
        ? user.foto_perfil.startsWith('http')
            ? user.foto_perfil
            : `${api.defaults.baseURL}${user.foto_perfil}`
        : undefined;

    const renderSidebarContent = () => (
        <Box sx={{
            width: 250,
            borderRight: '2px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 3,
            height: '100%',
        }} className="dashboard-sidebar">
            <Avatar src={fotoPerfil} alt={user?.nome ?? 'Foto de perfil'} sx={{ width: 100, height: 100, mb: 1, border: '1px solid #ccc' }}>
                {user?.nome?.charAt(0).toUpperCase() ?? 'U'}
            </Avatar>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                {user?.nome ?? user?.email ?? 'Usuário'}
            </Typography>

            <Chip
                label={isAdmin ? 'Administrador' : 'Usuário'}
                color={isAdmin ? 'success' : 'default'}
                size="small"
                sx={{ mb: 3 }}
            />

            <Button variant="outlined" fullWidth sx={{ mb: 2, borderRadius: 2, color: '#333', borderColor: '#333' }} onClick={() => navigate('/dashboard')}>
                Dashboard
            </Button>
            <Button
                variant="outlined"
                fullWidth
                sx={{ mb: 2, borderRadius: 2, color: '#333', borderColor: '#333' }}
                onClick={() => {
                    navigate('/denunciar');
                    setMobileMenuOpen(false);
                }}
            >
                Denunciar
            </Button>

            <Button
                variant="outlined"
                fullWidth
                sx={{ mb: 2, borderRadius: 2, color: '#333', borderColor: '#333' }}
                onClick={() => {
                    navigate('/ongs');
                    setMobileMenuOpen(false);
                }}
            >
                ONGs
            </Button>

            <Button
                variant="outlined"
                fullWidth
                sx={{ mb: 'auto', borderRadius: 2, color: '#333', borderColor: '#333' }}
                onClick={() => {
                    navigate('/perfil');
                    setMobileMenuOpen(false);
                }}
            >
                Configurações do perfil
            </Button>

            {isAdmin && (
                <>
                    <Button
                        variant="outlined"
                        color="success"
                        fullWidth
                        sx={{ mt: 2, borderRadius: 2 }}
                        onClick={() => {
                            navigate('/admin');
                            setMobileMenuOpen(false);
                        }}
                    >
                        Painel admin
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        sx={{ mt: 1, borderRadius: 2 }}
                        onClick={() => {
                            navigate('/admin/relatorios');
                            setMobileMenuOpen(false);
                        }}
                    >
                        Relatórios
                    </Button>
                </>
            )}

            <Button
                variant="outlined"
                color="error"
                fullWidth
                sx={{ mt: 2, borderRadius: 2 }}
                onClick={() => {
                    logout();
                    navigate('/login');
                    setMobileMenuOpen(false);
                }}
            >
                Sair
            </Button>
        </Box>
    );

    return (
        <Box className="dashboard-layout" sx={{ display: 'flex', height: '100vh', bgcolor: '#fdfdfd', flexDirection: isMobile ? 'column' : 'row' }}>
            {isMobile && (
                <AppBar position="static" color="success">
                    <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <IconButton edge="start" color="inherit" aria-label="Abrir menu" onClick={() => setMobileMenuOpen(true)}>
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
                            Guardião Verde
                        </Typography>
                    </Toolbar>
                </AppBar>
            )}

            {isMobile ? (
                <Drawer anchor="left" open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
                    {renderSidebarContent()}
                </Drawer>
            ) : (
                renderSidebarContent()
            )}

            <Box sx={{ flexGrow: 1, p: isMobile ? 2 : 4, overflowY: 'auto' }} className="dashboard-main">
                <FeedNoticias isAdmin={isAdmin} />
            </Box>
        </Box>
    );
}