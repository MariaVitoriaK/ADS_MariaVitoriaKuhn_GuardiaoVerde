import { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, IconButton, CircularProgress, Button,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchNoticias, toggleCurtirNoticia } from '../services/noticias';

interface Noticia {
    id_noticia: number;
    titulo: string;
    conteudo: string;
    total_curtidas: number;
    curtida_pelo_usuario?: boolean;
}

const fallbackNoticias: Noticia[] = [
    {
        id_noticia: 1,
        titulo: 'Reflorestamento cresce em áreas urbanas',
        conteudo: 'Projetos comunitários reforçam a mata nativa e melhoram a qualidade do ar em bairros próximos a parques e corredores ecológicos.',
        total_curtidas: 24,
        curtida_pelo_usuario: false,
    },
    {
        id_noticia: 2,
        titulo: 'Nova campanha incentiva coleta seletiva',
        conteudo: 'A iniciativa reúne escolas, empresas e moradores para ampliar a separação correta de resíduos e reduzir o lixo em aterros.',
        total_curtidas: 18,
        curtida_pelo_usuario: true,
    },
    {
        id_noticia: 3,
        titulo: 'Áreas de preservação recebem apoio de voluntários',
        conteudo: 'Voluntários de todo o município apoiam ações de limpeza, monitoramento e educação ambiental em áreas vulneráveis.',
        total_curtidas: 31,
        curtida_pelo_usuario: false,
    },
];

export default function FeedNoticias({ isAdmin = false }: { isAdmin?: boolean }) {
    const [noticias, setNoticias] = useState<Noticia[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarNoticias();
    }, []);

    const carregarNoticias = async () => {
        try {
            const dados = await fetchNoticias();
            if (Array.isArray(dados) && dados.length > 0) {
                const noticiasNormalizadas = dados.map((noticia: any) => ({
                    id_noticia: noticia.id_noticia ?? noticia.id ?? 0,
                    titulo: noticia.titulo ?? 'Notícia',
                    conteudo: noticia.conteudo ?? noticia.resumo ?? 'Sem resumo disponível.',
                    total_curtidas: Number(noticia.total_curtidas ?? 0),
                    curtida_pelo_usuario: Boolean(noticia.curtida_pelo_usuario ?? false),
                }));
                setNoticias(noticiasNormalizadas);
                return;
            }
            setNoticias(fallbackNoticias);
        } catch (error) {
            console.error('Erro ao buscar notícias', error);
            setNoticias(fallbackNoticias);
        } finally {
            setLoading(false);
        }
    };

    const handleCurtir = async (id: number) => {
        setNoticias(prev => prev.map(n => {
            if (n.id_noticia === id) {
                const isCurtido = Boolean(n.curtida_pelo_usuario);
                return {
                    ...n,
                    curtida_pelo_usuario: !isCurtido,
                    total_curtidas: isCurtido ? n.total_curtidas - 1 : n.total_curtidas + 1,
                };
            }
            return n;
        }));

        try {
            await toggleCurtirNoticia(id);
        } catch (_error) {
            console.warn('Curtir simulando fallback local.');
        }
    };

    const handleDelete = (id: number) => {
        setNoticias(prev => prev.filter(noticia => noticia.id_noticia !== id));
    };

    if (loading) return <CircularProgress />;

    return (
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Feed de Notícias</Typography>
                {isAdmin && (
                    <Button variant="contained" color="success" startIcon={<AddIcon />}>
                        Adicionar Notícia
                    </Button>
                )}
            </Box>

            {noticias.map((noticia) => (
                <Paper
                    key={noticia.id_noticia}
                    variant="outlined"
                    sx={{
                        display: 'flex',
                        p: 2,
                        mb: 3,
                        borderRadius: 4,
                        borderColor: '#b0b0b0',
                        position: 'relative',
                    }}
                >
                    <Box sx={{
                        minWidth: 120,
                        height: 120,
                        border: '1px solid #ccc',
                        borderRadius: 2,
                        mr: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Typography variant="body2" color="text.secondary">Foto</Typography>
                    </Box>

                    <Box sx={{ flexGrow: 1, pr: 8 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }} gutterBottom>
                            {noticia.titulo}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {noticia.conteudo}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <IconButton onClick={() => handleCurtir(noticia.id_noticia)}>
                                {noticia.curtida_pelo_usuario ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                            </IconButton>
                            <Typography variant="caption" sx={{ display: 'block' }}>{noticia.total_curtidas} likes</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <IconButton>
                                <ChatBubbleOutlineIcon />
                            </IconButton>
                            <Typography variant="caption" sx={{ display: 'block' }}>comentários</Typography>
                        </Box>
                    </Box>

                    {isAdmin && (
                        <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                            <IconButton size="small" color="primary" aria-label="editar notícia">
                                <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" aria-label="excluir notícia" onClick={() => handleDelete(noticia.id_noticia)}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    )}
                </Paper>
            ))}
        </Box>
    );
}