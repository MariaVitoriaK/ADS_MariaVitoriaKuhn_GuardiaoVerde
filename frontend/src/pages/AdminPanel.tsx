import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
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
import { getUsers, type BloqueioDuracao, updateUserStatus } from '../services/api';

interface Usuario {
    id_usuario: number;
    nome: string;
    email: string;
    status: 'ativo' | 'inativo' | 'banido';
    tipo_usuario: 'usuario' | 'administrador' | string;
    bloqueado_ate?: string | null;
}

const normalizarStatus = (status?: string): 'ativo' | 'inativo' | 'banido' => {
    if (status === 'banido') return 'banido';
    if (status === 'inativo') return 'inativo';
    return 'ativo';
};

export default function AdminPanel() {
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [erro, setErro] = useState('');
    const [atualizando, setAtualizando] = useState<number | null>(null);
    const [pesquisa, setPesquisa] = useState('');
    const [filtroPermissao, setFiltroPermissao] = useState<'todos' | 'usuarios' | 'administradores'>('todos');

    const usuariosFiltrados = useMemo(() => {
        const termo = pesquisa.trim().toLowerCase();

        return usuarios.filter((usuario) => {
            const correspondePesquisa = !termo || [usuario.nome, usuario.email, usuario.tipo_usuario].join(' ').toLowerCase().includes(termo);
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
                    email: usuario.email,
                    status: normalizarStatus(usuario.status),
                    tipo_usuario: usuario.tipo_usuario,
                    bloqueado_ate: usuario.bloqueado_ate ?? null,
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
                </Stack>
            </Stack>

            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

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
                            <TableCell>E-mail</TableCell>
                            <TableCell>Permissão</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="center">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {usuariosFiltrados.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                    Nenhum usuário encontrado para os filtros selecionados.
                                </TableCell>
                            </TableRow>
                        ) : usuariosFiltrados.map((usuario) => {
                            const usuarioBloqueado = usuario.status !== 'ativo';
                            const tipo = usuario.tipo_usuario === 'administrador' ? 'administrador' : 'usuário';
                            const valorSelect = usuario.status === 'ativo' ? 'ativo' : usuario.status === 'inativo' ? 'inativo' : '30_dias';

                            return (
                                <TableRow key={usuario.id_usuario}>
                                    <TableCell>{usuario.id_usuario}</TableCell>
                                    <TableCell>{usuario.nome}</TableCell>
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
                                                disabled={usuario.tipo_usuario === 'administrador' || atualizando === usuario.id_usuario}
                                            >
                                                <MenuItem value="ativo">Ativo</MenuItem>
                                                <MenuItem value="inativo">Inativo</MenuItem>
                                                <MenuItem value="30_dias">30 dias</MenuItem>
                                                <MenuItem value="90_dias">90 dias</MenuItem>
                                                <MenuItem value="permanente">Permanente</MenuItem>
                                            </Select>
                                        </FormControl>
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