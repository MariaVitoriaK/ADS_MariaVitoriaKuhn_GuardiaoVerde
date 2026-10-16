import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, IconButton, CircularProgress } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import { fetchNoticias, toggleCurtirNoticia } from '../services/noticias';

interface Noticia {
    id_noticia: number;
    titulo: string;
    conteudo: string;
    total_curtidas: number;
    curtida_pelo_usuario?: boolean; // Derivado do backend ou estado local
}

export default function FeedNoticias() {
    const [noticias, setNoticias] = useState<Noticia[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarNoticias();
    }, []);

    const carregarNoticias = async () => {
        try {
            const dados = await fetchNoticias();
            setNoticias(dados);
        } catch (error) {
            console.error("Erro ao buscar notícias", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCurtir = async (id: number) => {
        // Atualização Otimista no Frontend
        setNoticias(prev => prev.map(n => {
            if (n.id_noticia === id) {
                const isCurtido = n.curtida_pelo_usuario;
                return {
                    ...n,
                    curtida_pelo_usuario: !isCurtido,
                    total_curtidas: isCurtido ? n.total_curtidas - 1 : n.total_curtidas + 1
                };
            }
            return n;
        }));
        // Chamada real para a API
        await toggleCurtirNoticia(id);
    };

    if (loading) return <CircularProgress />;

    return (
        <Box sx={{ flexGrow: 1, p: 4, overflowY: 'auto' }}>
            <Typography variant="h4" fontWeight="bold" mb={3}>Feed de Notícias</Typography>

            {noticias.map((noticia) => (
                <Paper key={noticia.id_noticia} variant="outlined" sx={{ display: 'flex', p: 2, mb: 3, borderRadius: 4 }}>
                    <Box sx={{ flexGrow: 1, pr: 8 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>{noticia.titulo}</Typography>
                        <Typography variant="body1" color="text.secondary">{noticia.conteudo}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <IconButton onClick={() => handleCurtir(noticia.id_noticia)}>
                                {noticia.curtida_pelo_usuario ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                            </IconButton>
                            <Typography variant="caption" display="block">{noticia.total_curtidas} likes</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <IconButton><ChatBubbleOutlineIcon /></IconButton>
                            <Typography variant="caption" display="block">comentar</Typography>
                        </Box>
                    </Box>
                </Paper>
            ))}
        </Box>
    );
}