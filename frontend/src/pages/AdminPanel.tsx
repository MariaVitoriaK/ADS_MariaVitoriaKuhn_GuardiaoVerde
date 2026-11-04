import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { createAdminAccount, deleteAdminAccount, getUsers, type AdminAccountInput, type BloqueioDuracao, updateUserStatus } from '../services/api';

interface Usuario {
    id_usuario: number;
    nome: string;
    username: string;
    email: string;
    status: 'ativo' | 'inativo' | 'banido';
    tipo_usuario: 'usuario' | 'administrador' | string;
    administrador_principal: boolean;
    bloqueado_ate?: string | null;
    bloqueio_duracao?: BloqueioDuracao | null;
}

const normalizarStatus = (status?: string): 'ativo' | 'inativo' | 'banido' => {
    if (status === 'banido') return 'banido';
    if (status === 'inativo') return 'inativo';
    return 'ativo';
};

export default function AdminPanel() {
    const navigate = useNavigate();
    const { isAdminPrincipal } = useContext(AuthContext);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [erro, setErro] = useState('');
    const [atualizando, setAtualizando] = useState<number | null>(null);
    const [pesquisa, setPesquisa] = useState('');
    const [filtroPermissao, setFiltroPermissao] = useState<'todos' | 'usuarios' | 'administradores'>('todos');
    const [cadastroAdminAberto, setCadastroAdminAberto] = useState(false);
    const [salvandoAdmin, setSalvandoAdmin] = useState(false);
    const [novoAdmin, setNovoAdmin] = useState({ nome: 'Paulo Oliveira', username: '', email: '', senha: '' });

    const usuariosFiltrados = useMemo(() => {
        const termo = pesquisa.trim().toLowerCase();

        return usuarios.filter((usuario) => {
            const correspondePesquisa = !termo || [usuario.nome, usuario.username, usuario.email, usuario.tipo_usuario].join(' ').toLowerCase().includes(termo);
            const correspondePermissao = filtroPermissao === 'todos'
                || (filtroPermissao === 'usuarios' ? usuario.tipo_usuario !== 'administrador' : usuario.tipo_usuario === 'administrador');
            return correspondePesquisa && correspondePermissao;
        });
    }, [filtroPermissao, pesquisa, usuarios]);

    useEffect(() => {
        const carregarUsuarios = async () => {
            try {
                const { data } = await getUsers();
                setUsuarios(data.map((usuario: any) => ({
                    id_usuario: usuario.id_usuario,
                    nome: usuario.nome,
                    username: usuario.username,
                    email: usuario.email,
                    status: normalizarStatus(usuario.status),
                    tipo_usuario: usuario.tipo_usuario,
                    administrador_principal: usuario.administrador_principal === true,
                    bloqueado_ate: usuario.bloqueado_ate ?? null,
                    bloqueio_duracao: usuario.bloqueado_ate
                        ? (new Date(usuario.bloqueado_ate).getTime() - Date.now() > 45 * 24 * 60 * 60 * 1000 ? '90_dias' : '30_dias')
                        : null,
                })));
            } catch (error) {
                console.error('Erro ao carregar usuários', error);
                setErro('Não foi possível carregar os usuários cadastrados.');
            }
        };

        void carregarUsuarios();
    }, []);

    const handleAlterarStatus = async (
        id: number,
        novoStatus: 'ativo' | 'inativo' | 'banido',
        duracao?: BloqueioDuracao,
    ) => {
        setAtualizando(id);
        setErro('');

        try {
            await updateUserStatus(id, novoStatus, duracao);
            setUsuarios((prev) => prev.map((usuario) => (
                usuario.id_usuario === id
                    ? {
                        ...usuario,
                        status: novoStatus,
                        bloqueio_duracao: novoStatus === 'banido' ? duracao ?? '30_dias' : null,
                        bloqueado_ate: novoStatus === 'banido' ? (duracao === 'permanente' ? null : new Date(Date.now() + (duracao === '30_dias' ? 30 : 90) * 24 * 60 * 60 * 1000).toISOString()) : null,
                    }
                    : usuario
            )));
        } catch (error) {
            console.error('Erro ao alterar status do usuário', error);
            setErro('Não foi possível alterar o status do usuário.');
        } finally {
            setAtualizando(null);
        }
    };

    const handleCriarAdmin = async () => {
        setSalvandoAdmin(true);
        setErro('');
        try {
            const dadosAdmin: AdminAccountInput = {
                ...novoAdmin,
                nome: novoAdmin.nome.trim(),
                username: novoAdmin.username.trim(),
                email: novoAdmin.email.trim(),
            };
            const { data } = await createAdminAccount(dadosAdmin);
            setUsuarios((prev) => [...prev, {
                id_usuario: data.id_usuario,
                nome: data.nome,
                username: data.username,
                email: data.email,
                status: normalizarStatus(data.status),
                tipo_usuario: data.tipo_usuario,
                administrador_principal: data.administrador_principal,
                bloqueado_ate: data.bloqueado_ate ?? null,
                bloqueio_duracao: null,
            }]);
            setNovoAdmin({ nome: 'Paulo Oliveira', username: '', email: '', senha: '' });
            setCadastroAdminAberto(false);
        } catch (error) {
            console.error('Erro ao criar administrador secundário', error);
            setErro('Não foi possível criar o administrador. Verifique o e-mail e o username.');
        } finally {
            setSalvandoAdmin(false);
        }
    };

    const handleExcluirAdmin = async (usuario: Usuario) => {
        if (!window.confirm(`Excluir permanentemente a conta de ${usuario.nome} (@${usuario.username})?`)) return;
        setErro('');
        try {
            await deleteAdminAccount(usuario.id_usuario);
            setUsuarios((prev) => prev.filter((item) => item.id_usuario !== usuario.id_usuario));
        } catch (error) {
            console.error('Erro ao excluir administrador secundário', error);
            setErro('Não foi possível excluir este administrador.');
        }
    };

    return (
        <Box className="admin-page" sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <Button startIcon={<ArrowBackIcon />} variant="outlined" onClick={() => navigate('/dashboard')}>
                    Voltar ao dashboard
                </Button>
                <Typography variant="h4" gutterBottom>Painel Administrativo</Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    <Button variant="contained" color="error" onClick={() => navigate('/admin/denuncias')}>
                        Ver denúncias
                    </Button>
                    <Button variant="outlined" color="success" onClick={() => navigate('/admin/relatorios')}>
                        Relatórios
                    </Button>
                    {isAdminPrincipal && (
                        <Button variant="contained" color="success" onClick={() => setCadastroAdminAberto(true)}>
                            Adicionar administrador
                        </Button>
                    )}
                </Stack>
            </Stack>

            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

            <Dialog open={cadastroAdminAberto} onClose={() => setCadastroAdminAberto(false)} fullWidth maxWidth="sm">
                <DialogTitle>Cadastrar administrador secundário</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
                    {erro && <Alert severity="error">{erro}</Alert>}
                    <FormControl size="small" fullWidth>
                        <InputLabel id="novo-admin-nome-label">Nome</InputLabel>
                        <Select
                            labelId="novo-admin-nome-label"
                            value={novoAdmin.nome}
                            label="Nome"
                            onChange={(event) => setNovoAdmin((prev) => ({ ...prev, nome: event.target.value }))}
                        >
                            {['Paulo Oliveira', 'Tomas Dias', 'Alice Torres'].map((nome) => (
                                <MenuItem key={nome} value={nome}>{nome}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        required
                        label="Username"
                        value={novoAdmin.username}
                        onChange={(event) => setNovoAdmin((prev) => ({ ...prev, username: event.target.value }))}
                        helperText="Único; 3 a 30 letras, números, ponto, hífen ou sublinhado."
                    />
                    <TextField
                        required
                        type="email"
                        label="E-mail"
                        value={novoAdmin.email}
                        onChange={(event) => setNovoAdmin((prev) => ({ ...prev, email: event.target.value }))}
                    />
                    <TextField
                        required
                        type="password"
                        label="Senha inicial (mínimo 8 caracteres)"
                        value={novoAdmin.senha}
                        onChange={(event) => setNovoAdmin((prev) => ({ ...prev, senha: event.target.value }))}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCadastroAdminAberto(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        color="success"
                        disabled={salvandoAdmin || novoAdmin.username.trim().length < 3 || !novoAdmin.email.trim() || novoAdmin.senha.length < 8}
                        onClick={() => void handleCriarAdmin()}
                    >
                        {salvandoAdmin ? 'Salvando…' : 'Criar administrador'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 2 }}>
                    <TextField
                        label="Pesquisar usuário"
                        value={pesquisa}
                        onChange={(event) => setPesquisa(event.target.value)}
                        size="small"
                        sx={{ minWidth: { xs: '100%', sm: 260 } }}
                    />
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel id="filtro-permissao-label">Permissão</InputLabel>
                        <Select
                            labelId="filtro-permissao-label"
                            value={filtroPermissao}
                            label="Permissão"
                            onChange={(event) => setFiltroPermissao(event.target.value as 'todos' | 'usuarios' | 'administradores')}
                        >
                            <MenuItem value="todos">Todos</MenuItem>
                            <MenuItem value="usuarios">Usuários</MenuItem>
                            <MenuItem value="administradores">Administradores</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            <TableContainer component={Paper} className="admin-table">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Nome</TableCell>
                            <TableCell>Username</TableCell>
                            <TableCell>E-mail</TableCell>
                            <TableCell>Permissão</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="center">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {usuariosFiltrados.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                    Nenhum usuário encontrado para os filtros selecionados.
                                </TableCell>
                            </TableRow>
                        ) : usuariosFiltrados.map((usuario) => {
                            const usuarioBloqueado = usuario.status !== 'ativo';
                            const tipo = usuario.tipo_usuario === 'administrador' ? 'administrador' : 'usuário';
                            const valorSelect = usuario.status === 'ativo' ? 'ativo' : usuario.status === 'inativo' ? 'inativo' : usuario.bloqueio_duracao ?? 'permanente';

                            return (
                                <TableRow key={usuario.id_usuario}>
                                    <TableCell>{usuario.id_usuario}</TableCell>
                                    <TableCell>{usuario.nome}</TableCell>
                                    <TableCell>@{usuario.username}</TableCell>
                                    <TableCell>{usuario.email}</TableCell>
                                    <TableCell>{tipo}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={usuarioBloqueado ? 'Bloqueado' : 'Ativo'}
                                            color={usuarioBloqueado ? 'error' : 'success'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <FormControl size="small" sx={{ minWidth: 140 }}>
                                            <InputLabel id={`status-${usuario.id_usuario}`}>Status</InputLabel>
                                            <Select
                                                labelId={`status-${usuario.id_usuario}`}
                                                value={valorSelect}
                                                label="Status"
                                                onChange={(event) => {
                                                    const proximo = event.target.value as string;
                                                    if (usuario.tipo_usuario === 'administrador') return;

                                                    if (proximo === 'ativo') {
                                                        void handleAlterarStatus(usuario.id_usuario, 'ativo');
                                                        return;
                                                    }

                                                    if (proximo === 'inativo') {
                                                        void handleAlterarStatus(usuario.id_usuario, 'inativo');
                                                        return;
                                                    }

                                                    void handleAlterarStatus(usuario.id_usuario, 'banido', proximo as BloqueioDuracao);
                                                }}
                                                disabled={(usuario.tipo_usuario === 'administrador' && (!isAdminPrincipal || usuario.administrador_principal)) || atualizando === usuario.id_usuario}
                                            >
                                                <MenuItem value="ativo">Ativo</MenuItem>
                                                <MenuItem value="inativo">Inativo</MenuItem>
                                                <MenuItem value="30_dias">30 dias</MenuItem>
                                                <MenuItem value="90_dias">90 dias</MenuItem>
                                                <MenuItem value="permanente">Permanente</MenuItem>
                                            </Select>
                                        </FormControl>
                                        {isAdminPrincipal && usuario.tipo_usuario === 'administrador' && !usuario.administrador_principal && (
                                            <Button
                                                aria-label={`Excluir administrador ${usuario.nome}`}
                                                color="error"
                                                onClick={() => void handleExcluirAdmin(usuario)}
                                                sx={{ ml: 1, minWidth: 0 }}
                                            >
                                                Excluir
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}