import { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, Chip, Stack, Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { getUsers, updateUserStatus } from '../services/api';

interface Usuario {
    id_usuario: number;
    nome: string;
    email: string;
    status: 'ativo' | 'inativo' | 'banido';
    tipo_usuario: 'usuario' | 'administrador' | string;
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
                })));
            } catch (error) {
                console.error('Erro ao carregar usuários', error);
                setErro('Não foi possível carregar os usuários cadastrados.');
            }
        };

        void carregarUsuarios();
    }, []);

    const handleToggleStatus = async (id: number, currentStatus: string) => {
        const novoStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
        setAtualizando(id);
        setErro('');

        try {
            await updateUserStatus(id, novoStatus as 'ativo' | 'inativo' | 'banido');
            setUsuarios((prev) => prev.map((usuario) => (
                usuario.id_usuario === id ? { ...usuario, status: novoStatus as 'ativo' | 'inativo' | 'banido' } : usuario
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
                <Button variant="contained" color="error" onClick={() => navigate('/admin/denuncias')}>
                    Ver denúncias
                </Button>
            </Stack>

            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

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
                        {usuarios.map((usuario) => {
                            const usuarioBloqueado = usuario.status !== 'ativo';
                            const tipo = usuario.tipo_usuario === 'administrador' ? 'administrador' : 'usuário';

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
                                        <Button
                                            variant="outlined"
                                            color={usuarioBloqueado ? 'success' : 'error'}
                                            size="small"
                                            onClick={() => void handleToggleStatus(usuario.id_usuario, usuario.status)}
                                            disabled={usuario.tipo_usuario === 'administrador' || atualizando === usuario.id_usuario}
                                        >
                                            {usuarioBloqueado ? 'Reativar' : 'Bloquear'}
                                        </Button>
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