import React, { useState } from 'react';
import {
    Box, Typography, Paper, Button, Avatar, IconButton, Divider
} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

// Simulação de dados. Na versão final, virá do Backend.
const mockNoticias = [
    { id: 1, titulo: 'Título da Notícia 1', resumo: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { id: 2, titulo: 'Título da Notícia 2', resumo: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { id: 3, titulo: 'Título da Notícia 3', resumo: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
];

export default function Dashboard() {
    // TODO: Substituir por verificação real vinda do seu Contexto de Autenticação / LocalStorage
    const [isAdmin, setIsAdmin] = useState(false);

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#fdfdfd' }}>

            {/* ================= BARRA LATERAL (SIDEBAR) ================= */}
            <Box sx={{
                width: 250,
                borderRight: '2px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: 3
            }}>
                <Avatar sx={{ width: 100, height: 100, mb: 1, border: '1px solid #ccc' }}>Foto</Avatar>
                <Typography variant="subtitle1" sx={{ mb: 4 }}>Nome do Usuário</Typography>

                <Button variant="outlined" fullWidth sx={{ mb: 2, borderRadius: 2, color: '#333', borderColor: '#333' }}>
                    Dashboard
                </Button>
                <Button variant="outlined" fullWidth sx={{ mb: 'auto', borderRadius: 2, color: '#333', borderColor: '#333' }}>
                    Denunciar
                </Button>

                <Button variant="outlined" fullWidth sx={{ mt: 2, borderRadius: 2, color: '#333', borderColor: '#333' }}>
                    Configurações
                </Button>

                {/* Toggle temporário apenas para você testar a visualização do Admin */}
                <Button size="small" sx={{ mt: 2 }} onClick={() => setIsAdmin(!isAdmin)}>
                    Mudar para visão de {isAdmin ? 'Usuário' : 'Admin'}
                </Button>
            </Box>

            {/* ================= ÁREA PRINCIPAL (FEED DE NOTÍCIAS) ================= */}
            <Box sx={{ flexGrow: 1, p: 4, overflowY: 'auto' }}>

                {/* Cabeçalho do Feed com botão de adicionar (Apenas Admin) */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h4" fontWeight="bold">Feed de Notícias</Typography>
                    {isAdmin && (
                        <Button variant="contained" color="success" startIcon={<AddIcon />}>
                            Adicionar Notícia
                        </Button>
                    )}
                </Box>

                {/* Lista de Notícias */}
                {mockNoticias.map((noticia) => (
                    <Paper
                        key={noticia.id}
                        variant="outlined"
                        sx={{
                            display: 'flex',
                            p: 2,
                            mb: 3,
                            borderRadius: 4,
                            borderColor: '#b0b0b0',
                            position: 'relative'
                        }}
                    >
                        {/* Quadrado da Foto da Notícia */}
                        <Box sx={{
                            minWidth: 120,
                            height: 120,
                            border: '1px solid #ccc',
                            borderRadius: 2,
                            mr: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Typography variant="body2" color="text.secondary">Foto</Typography>
                        </Box>

                        {/* Conteúdo da Notícia */}
                        <Box sx={{ flexGrow: 1, pr: 8 }}>
                            <Typography variant="h5" fontWeight="bold" gutterBottom>
                                {noticia.titulo}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                {noticia.resumo}
                            </Typography>
                        </Box>

                        {/* Interações (Likes e Comentários) */}
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1
                        }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <IconButton sx={{ border: '1px solid #ccc' }}><FavoriteBorderIcon /></IconButton>
                                <Typography variant="caption" display="block">likes</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <IconButton sx={{ border: '1px solid #ccc' }}><ChatBubbleOutlineIcon /></IconButton>
                                <Typography variant="caption" display="block">comentários</Typography>
                            </Box>
                        </Box>

                        {/* Botões de Ação do Admin (Editar / Remover) */}
                        {isAdmin && (
                            <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                                <IconButton size="small" color="primary"><EditIcon fontSize="small" /></IconButton>
                                <IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton>
                            </Box>
                        )}

                    </Paper>
                ))}
            </Box>

        </Box>
    );
}