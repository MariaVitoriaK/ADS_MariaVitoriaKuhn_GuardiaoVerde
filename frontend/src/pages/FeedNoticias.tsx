import { useEffect, useState } from 'react';
import {
    Alert, Avatar, Box, Button, CircularProgress, IconButton, Paper, Typography,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { fetchNoticias, toggleCurtirNoticia } from '../services/noticias';

interface Noticia {
    id_noticia: number;
    titulo: string;
    conteudo: string;
    imagem?: string | null;
    total_curtidas: number;
    total_comentarios: number;
    curtida_pelo_usuario: boolean;
}

const imagemUrl = (imagem?: string | null) => {
    if (!imagem) return undefined;
    return imagem.startsWith('http') ? imagem : `${api.defaults.baseURL}${imagem}`;
};

export default function FeedNoticias({ isAdmin = false }: { isAdmin?: boolean }) {
    const navigate = useNavigate();
    const [noticias, setNoticias] = useState<Noticia[]>([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState('');
    const [curtidasEmAndamento, setCurtidasEmAndamento] = useState<number[]>([]);

    useEffect(() => {
        const carregarNoticias = async () => {
            try {
                const dados = await fetchNoticias();
                setNoticias(dados);
            } catch (error) {
                console.error('Erro ao buscar notícias', error);
                setErro('Não foi possível carregar as notícias. Tente novamente.');
            } finally {
                setLoading(false);
            }
        };

        void carregarNoticias();
    }, []);

    const handleCurtir = async (id: number) => {
        setErro('');
        setCurtidasEmAndamento((ids) => [...ids, id]);
        try {
            const resultado = await toggleCurtirNoticia(id);
            setNoticias((anteriores) => anteriores.map((noticia) =>
                noticia.id_noticia === id
                    ? {
                        ...noticia,
                        curtida_pelo_usuario: resultado.curtida_pelo_usuario,
                        total_curtidas: resultado.total_curtidas,
                    }
                    : noticia,
            ));
        } catch (error) {
            console.error('Erro ao registrar curtida', error);
            setErro('Não foi possível registrar sua curtida. Tente novamente.');
        } finally {
            setCurtidasEmAndamento((ids) => ids.filter((item) => item !== id));
        }
    };

    if (loading) return <CircularProgress color="success" />;

    return (
        <Box className="news-feed" sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Feed de Notícias</Typography>
                {isAdmin && (
                    <Button variant="contained" color="success" startIcon={<AddIcon />}>
                        Adicionar Notícia
                    </Button>
                )}
            </Box>

            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

            {noticias.length === 0 && !erro && (
                <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                    <Typography color="text.secondary">Ainda não há notícias publicadas.</Typography>
                </Paper>
            )}

            {noticias.map((noticia) => (
                <Paper
                    key={noticia.id_noticia}
                    variant="outlined"
                    className="news-card"
                    sx={{
                        display: 'flex',
                        p: { xs: 1.5, sm: 2 },
                        mb: 3,
                        borderRadius: 4,
                        borderColor: '#d8e1d8',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    <Box
                        role="link"
                        tabIndex={0}
                        aria-label={`Abrir notícia: ${noticia.titulo}`}
                        onClick={() => navigate(`/noticias/${noticia.id_noticia}`)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                navigate(`/noticias/${noticia.id_noticia}`);
                            }
                        }}
                        sx={{
                            display: 'flex',
                            flexGrow: 1,
                            alignItems: 'center',
                            gap: 2,
                            minWidth: 0,
                            cursor: 'pointer',
                            '&:hover h2': { color: 'success.dark' },
                        }}
                    >
                        {imagemUrl(noticia.imagem) ? (
                            <Box
                                component="img"
                                src={imagemUrl(noticia.imagem)}
                                alt=""
                                sx={{ width: { xs: 80, sm: 120 }, height: { xs: 80, sm: 120 }, objectFit: 'cover', borderRadius: 2 }}
                            />
                        ) : (
                            <Avatar
                                variant="rounded"
                                sx={{ width: { xs: 80, sm: 120 }, height: { xs: 80, sm: 120 }, bgcolor: 'success.light' }}
                            >
                                <Typography variant="caption" color="success.dark">Notícia</Typography>
                            </Avatar>
                        )}

                        <Box sx={{ minWidth: 0 }}>
                            <Typography component="h2" variant="h5" sx={{ fontWeight: 'bold', transition: 'color 0.2s' }}>
                                {noticia.titulo}
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{
                                    mt: 1,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}
                            >
                                {noticia.conteudo}
                            </Typography>
                            <Typography variant="body2" color="success.dark" sx={{ mt: 1, fontWeight: 600 }}>
                                Ler notícia completa
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <IconButton
                            aria-label={noticia.curtida_pelo_usuario ? 'Remover curtida' : 'Curtir notícia'}
                            disabled={curtidasEmAndamento.includes(noticia.id_noticia)}
                            onClick={() => void handleCurtir(noticia.id_noticia)}
                        >
                            {noticia.curtida_pelo_usuario ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                        </IconButton>
                        <Typography variant="caption">{noticia.total_curtidas} curtidas</Typography>
                        <IconButton
                            aria-label={`${noticia.total_comentarios} comentários`}
                            onClick={() => navigate(`/noticias/${noticia.id_noticia}`)}
                        >
                            <ChatBubbleOutlineIcon />
                        </IconButton>
                        <Typography variant="caption">
                            {noticia.total_comentarios} {noticia.total_comentarios === 1 ? 'comentário' : 'comentários'}
                        </Typography>
                    </Box>
                </Paper>
            ))}
        </Box>
    );
}
