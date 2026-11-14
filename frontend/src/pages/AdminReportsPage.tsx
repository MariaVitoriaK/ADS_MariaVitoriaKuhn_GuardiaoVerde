import { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    Paper,
    Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getStoredDenuncias, statusLabels, type Denuncia } from '../data/denuncias';
import { getDenuncias, getUsers } from '../services/api';

interface UsuarioResumo {
    id_usuario: number;
    nome: string;
    email: string;
    status: 'ativo' | 'inativo' | 'banido';
    tipo_usuario: 'usuario' | 'administrador' | string;
}

const metricCard = (title: string, value: string | number, tone: 'primary' | 'success' | 'warning' | 'error' | 'info') => ({
    title,
    value,
    tone,
});

export default function AdminReportsPage() {
    const navigate = useNavigate();
    const [denuncias, setDenuncias] = useState<Denuncia[]>(() => getStoredDenuncias());
    const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
    const [erro, setErro] = useState('');

    useEffect(() => {
        const carregarDados = async () => {
            try {
                const [{ data: denunciasData }, { data: usuariosData }] = await Promise.all([
                    getDenuncias(),
                    getUsers(),
                ]);

                setDenuncias(Array.isArray(denunciasData) ? denunciasData : getStoredDenuncias());
                setUsuarios(usuariosData.map((usuario: any) => ({
                    id_usuario: usuario.id_usuario,
                    nome: usuario.nome,
                    email: usuario.email,
                    status: usuario.status === 'banido' ? 'banido' : usuario.status === 'inativo' ? 'inativo' : 'ativo',
                    tipo_usuario: usuario.tipo_usuario,
                })));
            } catch (error) {
                console.error('Erro ao carregar métricas', error);
                setDenuncias(getStoredDenuncias());
                setErro('Não foi possível carregar os dados de usuários e denúncias para os relatórios.');
            }
        };

        void carregarDados();
    }, []);

    const metricas = useMemo(() => {
        const totalDenuncias = denuncias.length;
        const pendentes = denuncias.filter((denuncia) => denuncia.status === 'pendente').length;
        const aceitas = denuncias.filter((denuncia) => denuncia.status === 'aceita').length;
        const emAndamento = denuncias.filter((denuncia) => denuncia.status === 'em_andamento').length;
        const resolvidas = denuncias.filter((denuncia) => denuncia.status === 'resolvida').length;
        const recusadas = denuncias.filter((denuncia) => denuncia.status === 'recusada').length;

        const totalUsuarios = usuarios.length;
        const ativos = usuarios.filter((usuario) => usuario.status === 'ativo').length;
        const inativos = usuarios.filter((usuario) => usuario.status === 'inativo').length;
        const bloqueados = usuarios.filter((usuario) => usuario.status === 'banido').length;
        const administradores = usuarios.filter((usuario) => usuario.tipo_usuario === 'administrador').length;

        return [
            metricCard('Total de denúncias', totalDenuncias, 'primary'),
            metricCard('Pendentes', pendentes, 'warning'),
            metricCard('Aceitas', aceitas, 'info'),
            metricCard('Em andamento', emAndamento, 'warning'),
            metricCard('Resolvidas', resolvidas, 'success'),
            metricCard('Recusadas', recusadas, 'error'),
            metricCard('Usuários ativos', ativos, 'success'),
            metricCard('Usuários inativos', inativos, 'warning'),
            metricCard('Usuários bloqueados', bloqueados, 'error'),
            metricCard('Administradores', administradores, 'info'),
            metricCard('Total de usuários', totalUsuarios, 'primary'),
        ];
    }, [denuncias, usuarios]);

    const statusDenuncias = [
        { label: 'Pendentes', value: denuncias.filter((denuncia) => denuncia.status === 'pendente').length },
        { label: 'Aceitas', value: denuncias.filter((denuncia) => denuncia.status === 'aceita').length },
        { label: 'Em andamento', value: denuncias.filter((denuncia) => denuncia.status === 'em_andamento').length },
        { label: 'Resolvidas', value: denuncias.filter((denuncia) => denuncia.status === 'resolvida').length },
        { label: 'Recusadas', value: denuncias.filter((denuncia) => denuncia.status === 'recusada').length },
    ];

    const cores = {
        primary: '#1b5e20',
        success: '#2e7d32',
        warning: '#ed6c02',
        error: '#d32f2f',
        info: '#0288d1',
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>Relatórios do administrador</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Visão geral da atividade do sistema, usuários e denúncias registradas.
                    </Typography>
                </Box>
                <Button variant="outlined" onClick={() => navigate('/admin')}>
                    Voltar ao painel
                </Button>
            </Box>

            {erro && (
                <Paper sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid #f5c2c7', bgcolor: '#fff5f5' }}>
                    <Typography color="error">{erro}</Typography>
                </Paper>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 4 }}>
                {metricas.map((card) => (
                    <Card key={card.title} sx={{ height: '100%', borderLeft: `6px solid ${cores[card.tone]}` }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">{card.title}</Typography>
                            <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>{card.value}</Typography>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 3 }}>
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Status das denúncias</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {statusDenuncias.map((item) => (
                            <Box key={item.label}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography>{item.label}</Typography>
                                    <Typography sx={{ fontWeight: 700 }}>{item.value}</Typography>
                                </Box>
                                <Divider sx={{ mt: 1 }} />
                            </Box>
                        ))}
                    </Box>
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Status dos usuários</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography>Ativos</Typography>
                                <Typography sx={{ fontWeight: 700 }}>{usuarios.filter((usuario) => usuario.status === 'ativo').length}</Typography>
                            </Box>
                            <Divider sx={{ mt: 1 }} />
                        </Box>
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography>Inativos</Typography>
                                <Typography sx={{ fontWeight: 700 }}>{usuarios.filter((usuario) => usuario.status === 'inativo').length}</Typography>
                            </Box>
                            <Divider sx={{ mt: 1 }} />
                        </Box>
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography>Bloqueados</Typography>
                                <Typography sx={{ fontWeight: 700 }}>{usuarios.filter((usuario) => usuario.status === 'banido').length}</Typography>
                            </Box>
                            <Divider sx={{ mt: 1 }} />
                        </Box>
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography>Administradores</Typography>
                                <Typography sx={{ fontWeight: 700 }}>{usuarios.filter((usuario) => usuario.tipo_usuario === 'administrador').length}</Typography>
                            </Box>
                            <Divider sx={{ mt: 1 }} />
                        </Box>
                    </Box>
                </Paper>
            </Box>

            <Paper sx={{ p: 3, mt: 3, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Resumo da operação</Typography>
                <Typography variant="body1" color="text.secondary">
                    {`Há ${denuncias.length} denúncias registradas, ${statusLabels.pendente.toLowerCase()} e ${statusLabels.aceita.toLowerCase()} são os estados mais relevantes no momento, com ${usuarios.filter((usuario) => usuario.status === 'banido').length} usuários bloqueados e ${usuarios.filter((usuario) => usuario.status === 'ativo').length} ativos no sistema.`}
                </Typography>
            </Paper>
        </Box>
    );
}
