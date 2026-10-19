import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Alert, Avatar, Box, Button, CircularProgress, Divider, IconButton, Paper, Stack, TextField, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import api from '../services/api';
import { createComentario, fetchNoticia, toggleCurtirNoticia } from '../services/noticias';

interface Comentario {
    id_comentario: number;
    id_usuario: number;
    nome_usuario: string;
    foto_perfil?: string | null;
    texto: string;
    data_comentario: string;
}

interface Noticia {
    id_noticia: number;
    titulo: string;
    conteudo: string;
    imagem?: string | null;
    data_publicacao: string;
    total_curtidas: number;
    total_comentarios: number;
    curtida_pelo_usuario: boolean;
    comentarios: Comentario[];
}

const imagemUrl = (imagem?: string | null) => {
    if (!imagem) return undefined;
    return imagem.startsWith('http') ? imagem : `${api.defaults.baseURL}${imagem}`;
};

export default function NoticiaPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [noticia, setNoticia] = useState<Noticia | null>(null);
    const [textoComentario, setTextoComentario] = useState('');
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState('');

    const carregarNoticia = useCallback(async () => {
        if (!id || !Number.isInteger(Number(id))) {
            setErro('Notícia não encontrada.');
            setLoading(false);
            return;
        }
        try {
            setNoticia(await fetchNoticia(Number(id)));
            setErro('');
        } catch (error) {
            console.error('Erro ao carregar notícia', error);
            setErro('Não foi possível carregar esta notícia.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        void carregarNoticia();
    }, [carregarNoticia]);

    const handleCurtir = async () => {
        if (!noticia) return;
        try {
            const resultado = await toggleCurtirNoticia(noticia.id_noticia);
            setNoticia((atual) => atual ? {
                ...atual,
                curtida_pelo_usuario: resultado.curtida_pelo_usuario,
                total_curtidas: resultado.total_curtidas,
            } : atual);
        } catch (error) {
            console.error('Erro ao registrar curtida', error);
            setErro('Não foi possível registrar sua curtida.');
        }
    };

    const handleComentar = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!noticia || !textoComentario.trim()) return;
        setEnviando(true);
        setErro('');
        try {
            await createComentario(noticia.id_noticia, textoComentario.trim());
            setTextoComentario('');
            await carregarNoticia();
        } catch (error) {
            console.error('Erro ao publicar comentário', error);
            setErro('Não foi possível publicar seu comentário. Tente novamente.');
        } finally {
            setEnviando(false);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress color="success" /></Box>;

    return (
        <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, sm: 4 } }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
                Voltar ao dashboard
            </Button>
            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
            {!noticia ? null : (
                <Stack spacing={3}>
                    <Paper sx={{ overflow: 'hidden', borderRadius: 3 }}>
                        {imagemUrl(noticia.imagem) && (
                            <Box
                                component="img"
                                src={imagemUrl(noticia.imagem)}
                                alt={noticia.titulo}
                                sx={{ width: '100%', maxHeight: 480, objectFit: 'cover', display: 'block' }}
                            />
                        )}
                        <Box sx={{ p: { xs: 2, sm: 4 } }}>
                            <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                                {noticia.titulo}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Publicada em {new Date(noticia.data_publicacao).toLocaleDateString('pt-BR')}
                            </Typography>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                                {noticia.conteudo}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
                                <IconButton aria-label="Curtir notícia" color={noticia.curtida_pelo_usuario ? 'error' : 'default'} onClick={() => void handleCurtir()}>
                                    {noticia.curtida_pelo_usuario ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                </IconButton>
                                <Typography>{noticia.total_curtidas} curtidas</Typography>
                                <Typography color="text.secondary" sx={{ ml: 2 }}>
                                    {noticia.total_comentarios} {noticia.total_comentarios === 1 ? 'comentário' : 'comentários'}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>

                    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
                        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
                            Comentários ({noticia.total_comentarios})
                        </Typography>
                        <Box component="form" onSubmit={(event) => void handleComentar(event)} sx={{ display: 'flex', gap: 1, mb: 3 }}>
                            <TextField
                                fullWidth
                                multiline
                                minRows={2}
                                label="Escreva um comentário"
                                value={textoComentario}
                                onChange={(event) => setTextoComentario(event.target.value)}
                                slotProps={{ htmlInput: { maxLength: 5000 } }}
                            />
                            <Button type="submit" variant="contained" color="success" disabled={enviando || !textoComentario.trim()}>
                                {enviando ? 'Enviando…' : 'Comentar'}
                            </Button>
                        </Box>
                        <Divider />
                        {noticia.comentarios.length === 0 ? (
                            <Typography color="text.secondary" sx={{ mt: 2 }}>Ainda não há comentários. Seja o primeiro!</Typography>
                        ) : (
                            <Stack spacing={2} sx={{ mt: 2 }}>
                                {noticia.comentarios.map((comentario) => (
                                    <Box key={comentario.id_comentario} sx={{ display: 'flex', gap: 1.5 }}>
                                        <Avatar src={imagemUrl(comentario.foto_perfil)} alt={comentario.nome_usuario}>
                                            {comentario.nome_usuario.charAt(0).toUpperCase()}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle2">{comentario.nome_usuario}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(comentario.data_comentario).toLocaleString('pt-BR')}
                                            </Typography>
                                            <Typography sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{comentario.texto}</Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </Paper>
                </Stack>
            )}
        </Box>
    );
}
