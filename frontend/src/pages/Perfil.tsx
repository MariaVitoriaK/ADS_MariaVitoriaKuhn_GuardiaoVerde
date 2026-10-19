import { useContext, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
    Alert, Avatar, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, Divider, Paper, Stack, TextField, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api, { deleteAccount, getCurrentUser, updatePassword, updateProfile, updateProfilePhoto } from '../services/api';

interface PerfilUsuario {
    nome: string;
    email: string;
    foto_perfil?: string | null;
}

export default function Perfil() {
    const navigate = useNavigate();
    const { logout, login, isAdmin, updateUser } = useContext(AuthContext);
    const [perfil, setPerfil] = useState<PerfilUsuario>({ nome: '', email: '' });
    const [foto, setFoto] = useState<File | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string>();
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [salvandoPerfil, setSalvandoPerfil] = useState(false);
    const [salvandoSenha, setSalvandoSenha] = useState(false);
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');

    useEffect(() => {
        getCurrentUser()
            .then(({ data }) => {
                setPerfil({ nome: data.nome, email: data.email, foto_perfil: data.foto_perfil });
                updateUser({ nome: data.nome, email: data.email, foto_perfil: data.foto_perfil });
            })
            .catch((error) => {
                console.error('Erro ao carregar perfil', error);
                setErro('Não foi possível carregar seus dados. Tente novamente.');
            })
            .finally(() => setLoading(false));
    }, [updateUser]);

    useEffect(() => {
        if (!foto) {
            setFotoPreview(undefined);
            return;
        }
        const preview = URL.createObjectURL(foto);
        setFotoPreview(preview);
        return () => URL.revokeObjectURL(preview);
    }, [foto]);

    const fotoUrl = fotoPreview ?? (perfil.foto_perfil
            ? perfil.foto_perfil.startsWith('http')
                ? perfil.foto_perfil
                : `${api.defaults.baseURL}${perfil.foto_perfil}`
            : undefined);

    const handleFotoSelecionada = (event: ChangeEvent<HTMLInputElement>) => {
        const arquivo = event.target.files?.[0] ?? null;
        setFoto(arquivo);
        setMensagem('');
        setErro('');
    };

    const handleUpdateProfile = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSalvandoPerfil(true);
        setMensagem('');
        setErro('');
        try {
            const { data } = await updateProfile({ nome: perfil.nome.trim(), email: perfil.email.trim() });
            login(data.access_token, {
                email: data.email,
                role: isAdmin ? 'admin' : 'user',
                nome: data.nome,
                foto_perfil: data.foto_perfil,
            });
            let fotoAtualizada = data.foto_perfil;
            if (foto) {
                const formData = new FormData();
                formData.append('file', foto);
                const respostaFoto = await updateProfilePhoto(formData);
                fotoAtualizada = respostaFoto.data.foto_perfil;
                setFoto(null);
            }
            setPerfil({ nome: data.nome, email: data.email, foto_perfil: fotoAtualizada });
            updateUser({ nome: data.nome, email: data.email, foto_perfil: fotoAtualizada });
            setMensagem('Perfil atualizado com sucesso.');
        } catch (error) {
            console.error('Erro ao atualizar perfil', error);
            setErro('Não foi possível salvar as alterações. Verifique o e-mail e tente novamente.');
        } finally {
            setSalvandoPerfil(false);
        }
    };

    const handleUpdatePassword = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMensagem('');
        setErro('');
        if (novaSenha !== confirmarSenha) {
            setErro('A confirmação da nova senha não corresponde.');
            return;
        }
        setSalvandoSenha(true);
        try {
            await updatePassword({ senha_atual: senhaAtual, nova_senha: novaSenha });
            setSenhaAtual('');
            setNovaSenha('');
            setConfirmarSenha('');
            setMensagem('Senha alterada com sucesso.');
        } catch (error) {
            console.error('Erro ao atualizar senha', error);
            setErro('Não foi possível alterar a senha. Confira sua senha atual e tente novamente.');
        } finally {
            setSalvandoSenha(false);
        }
    };

    const handleDeleteAccount = async () => {
        setErro('');
        try {
            await deleteAccount();
            logout();
            navigate('/login');
        } catch (error) {
            console.error('Erro ao excluir conta', error);
            setErro('Não foi possível excluir a conta. Tente novamente mais tarde.');
            setOpenModal(false);
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress color="success" /></Box>;
    }

    return (
        <Box sx={{ maxWidth: 760, mx: 'auto', p: { xs: 2, sm: 4 } }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
                Voltar ao dashboard
            </Button>
            <Paper sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }} gutterBottom>
                    Configurações do perfil
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Atualize suas informações, foto de perfil e senha.
                </Typography>

                {mensagem && <Alert severity="success" sx={{ mb: 2 }}>{mensagem}</Alert>}
                {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 3, alignItems: { sm: 'center' } }}>
                    <Avatar src={fotoUrl} alt={perfil.nome} sx={{ width: 104, height: 104, fontSize: 36 }}>
                        {perfil.nome.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="h6">{perfil.nome}</Typography>
                        <Button component="label" variant="outlined" color="success" startIcon={<PhotoCameraIcon />} sx={{ mt: 1 }}>
                            Escolher foto
                            <input hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFotoSelecionada} />
                        </Button>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            JPG, PNG, WEBP ou GIF; até 5 MB.
                        </Typography>
                        {foto && <Typography variant="caption" sx={{ display: 'block' }}>{foto.name}</Typography>}
                    </Box>
                </Stack>

                <Box component="form" onSubmit={(event) => void handleUpdateProfile(event)}>
                    <TextField
                        fullWidth
                        required
                        label="Nome"
                        margin="normal"
                        value={perfil.nome}
                        onChange={(event) => setPerfil((atual) => ({ ...atual, nome: event.target.value }))}
                    />
                    <TextField
                        fullWidth
                        required
                        type="email"
                        label="E-mail"
                        margin="normal"
                        value={perfil.email}
                        onChange={(event) => setPerfil((atual) => ({ ...atual, email: event.target.value }))}
                    />
                    <Button type="submit" variant="contained" color="success" disabled={salvandoPerfil} sx={{ mt: 2 }}>
                        {salvandoPerfil ? 'Salvando…' : 'Salvar alterações'}
                    </Button>
                </Box>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h5" component="h2" gutterBottom>Alterar senha</Typography>
                <Box component="form" onSubmit={(event) => void handleUpdatePassword(event)}>
                    <TextField
                        fullWidth required label="Senha atual" type="password" autoComplete="current-password"
                        margin="normal" value={senhaAtual} onChange={(event) => setSenhaAtual(event.target.value)}
                    />
                    <TextField
                        fullWidth required label="Nova senha" type="password" autoComplete="new-password"
                        margin="normal" value={novaSenha} onChange={(event) => setNovaSenha(event.target.value)}
                    />
                    <TextField
                        fullWidth required label="Confirmar nova senha" type="password" autoComplete="new-password"
                        margin="normal" value={confirmarSenha} onChange={(event) => setConfirmarSenha(event.target.value)}
                    />
                    <Button type="submit" variant="outlined" color="success" disabled={salvandoSenha} sx={{ mt: 2 }}>
                        {salvandoSenha ? 'Atualizando…' : 'Atualizar senha'}
                    </Button>
                </Box>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" color="error" gutterBottom>Zona de perigo</Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                    A exclusão da conta é permanente.
                </Typography>
                <Button variant="contained" color="error" onClick={() => setOpenModal(true)}>
                    Excluir conta
                </Button>
            </Paper>

            <Dialog open={openModal} onClose={() => setOpenModal(false)}>
                <DialogTitle>Excluir sua conta?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Esta ação é irreversível. Deseja realmente excluir sua conta?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
                    <Button onClick={() => void handleDeleteAccount()} color="error" variant="contained">
                        Confirmar exclusão
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
