import { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import {
    criaHistorico,
    getStoredDenuncias,
    persistDenuncias,
    statusLabels,
    type Denuncia,
    type DenunciaStatus,
} from '../data/denuncias';
import { getDenuncias, updateDenunciaStatus } from '../services/api';

const transicoesPermitidas: Record<DenunciaStatus, DenunciaStatus[]> = {
    pendente: ['aceita', 'recusada'],
    aceita: ['em_andamento'],
    em_andamento: ['resolvida'],
    resolvida: [],
    recusada: [],
};

const descricaoPadraoStatus = (status: DenunciaStatus) => {
    switch (status) {
        case 'aceita':
            return 'Denúncia aceita e encaminhada para análise técnica.';
        case 'em_andamento':
            return 'Denúncia em andamento. A equipe foi acionada para acompanhar o caso.';
        case 'resolvida':
            return 'Denúncia concluída após avaliação e intervenção realizada.';
        case 'recusada':
            return 'Denúncia rejeitada por falta de evidência ou inconsistência de dados.';
        default:
            return 'Status atualizado pela administração.';
    }
};

export default function AdminDenunciasPage() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [denuncias, setDenuncias] = useState<Denuncia[]>(() => getStoredDenuncias());
    const [pesquisa, setPesquisa] = useState('');
    const [statusFiltro, setStatusFiltro] = useState<'todos' | DenunciaStatus>('todos');
    const [statusDialog, setStatusDialog] = useState<{ id: number; status: DenunciaStatus; descricao: string } | null>(null);

    useEffect(() => {
        const carregarDenuncias = async () => {
            try {
                const { data } = await getDenuncias();
                if (Array.isArray(data)) {
                    setDenuncias(data);
                }
            } catch {
                setDenuncias(getStoredDenuncias());
            }
        };

        void carregarDenuncias();
    }, []);

    const denunciasFiltradas = useMemo(() => {
        const termo = pesquisa.trim().toLowerCase();

        return denuncias.filter((denuncia) => {
            const atendeStatus = statusFiltro === 'todos' || denuncia.status === statusFiltro;
            const atendePesquisa = !termo || [
                denuncia.titulo,
                denuncia.descricao,
                denuncia.categoria,
                denuncia.cidade,
                denuncia.estado,
                statusLabels[denuncia.status],
            ].join(' ').toLowerCase().includes(termo);

            return atendeStatus && atendePesquisa;
        });
    }, [denuncias, pesquisa, statusFiltro]);

    const atualizarStatus = async (id: number, novoStatus: DenunciaStatus, observacao: string) => {
        try {
            await updateDenunciaStatus(id, novoStatus, observacao);
        } catch (error) {
            console.error('Erro ao atualizar status da denúncia no backend:', error);
        }

        setDenuncias((prev) => {
            const listaAtualizada = prev.map((denuncia) => {
                if (denuncia.id_denuncia !== id) return denuncia;
                if (!transicoesPermitidas[denuncia.status].includes(novoStatus)) return denuncia;

                const historicoAtual = criaHistorico(
                    id,
                    denuncia.status,
                    novoStatus,
                    observacao,
                    new Date().toISOString(),
                    { nome: user?.nome, username: user?.username },
                );

                return {
                    ...denuncia,
                    status: novoStatus,
                    historico: [historicoAtual, ...denuncia.historico],
                };
            });

            persistDenuncias(listaAtualizada);
            return listaAtualizada;
        });
    };

    const abrirDialogStatus = (id: number, novoStatus: DenunciaStatus) => {
        setStatusDialog({ id, status: novoStatus, descricao: descricaoPadraoStatus(novoStatus) });
    };

    const confirmarStatus = async () => {
        if (!statusDialog) return;

        const descricaoFinal = statusDialog.descricao.trim();
        if (!descricaoFinal) {
            return;
        }

        await atualizarStatus(statusDialog.id, statusDialog.status, descricaoFinal);
        setStatusDialog(null);
    };

    return (
        <Box className="admin-reports-page" sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>Denúncias recebidas</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Fluxo: pendente → aceita → em andamento → resolvida. Denúncias pendentes também podem ser recusadas.
                    </Typography>
                </Box>

                <Button variant="outlined" onClick={() => navigate('/admin')}>
                    Voltar ao painel
                </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 2 }}>
                    <TextField
                        label="Pesquisar denúncia"
                        value={pesquisa}
                        onChange={(event) => setPesquisa(event.target.value)}
                        size="small"
                        sx={{ minWidth: { xs: '100%', sm: 300 } }}
                    />
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel id="status-filtro-label">Status</InputLabel>
                        <Select
                            labelId="status-filtro-label"
                            value={statusFiltro}
                            label="Status"
                            onChange={(event) => setStatusFiltro(event.target.value as 'todos' | DenunciaStatus)}
                        >
                            <MenuItem value="todos">Todos</MenuItem>
                            <MenuItem value="pendente">Pendente</MenuItem>
                            <MenuItem value="aceita">Aceita</MenuItem>
                            <MenuItem value="em_andamento">Em andamento</MenuItem>
                            <MenuItem value="resolvida">Resolvida</MenuItem>
                            <MenuItem value="recusada">Recusada</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            <Stack spacing={3}>
                {denunciasFiltradas.length === 0 ? (
                    <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
                        <Typography color="text.secondary">Nenhuma denúncia encontrada para os filtros selecionados.</Typography>
                    </Paper>
                ) : denunciasFiltradas.map((denuncia) => (
                    <Paper key={denuncia.id_denuncia} className="admin-report-card" sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>{denuncia.titulo}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    #{denuncia.id_denuncia} • {denuncia.cidade}/{denuncia.estado} • {denuncia.categoria}
                                </Typography>
                            </Box>

                            <Chip
                                label={statusLabels[denuncia.status]}
                                color={
                                    denuncia.status === 'pendente' ? 'warning'
                                        : denuncia.status === 'aceita' || denuncia.status === 'em_andamento' ? 'info'
                                            : denuncia.status === 'resolvida' ? 'success' : 'error'
                                }
                                size="small"
                            />
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Descrição:</strong> {denuncia.descricao}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Gravidade:</strong> {denuncia.gravidade}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Data da ocorrência:</strong> {denuncia.data_ocorrencia}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            <strong>Coordenadas:</strong> {denuncia.latitude}, {denuncia.longitude}
                        </Typography>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 3 }}>
                            <Button disabled={!transicoesPermitidas[denuncia.status].includes('aceita')} variant="contained" color="success" onClick={() => abrirDialogStatus(denuncia.id_denuncia, 'aceita')}>Aceitar</Button>
                            <Button disabled={!transicoesPermitidas[denuncia.status].includes('em_andamento')} variant="contained" color="warning" onClick={() => abrirDialogStatus(denuncia.id_denuncia, 'em_andamento')}>Em andamento</Button>
                            <Button disabled={!transicoesPermitidas[denuncia.status].includes('resolvida')} variant="contained" color="success" onClick={() => abrirDialogStatus(denuncia.id_denuncia, 'resolvida')}>Concluir</Button>
                            <Button disabled={!transicoesPermitidas[denuncia.status].includes('recusada')} variant="contained" color="error" onClick={() => abrirDialogStatus(denuncia.id_denuncia, 'recusada')}>Recusar</Button>
                        </Stack>

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Histórico da denúncia</Typography>
                            {denuncia.historico.map((historico) => (
                                <Paper key={historico.id_historico} sx={{ p: 2, mb: 1, backgroundColor: '#f7f7f7', borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(historico.data_alteracao).toLocaleString('pt-BR')}
                                        {historico.autor_username && ` • por @${historico.autor_username}`}
                                        {!historico.autor_username && historico.autor_nome && ` • por ${historico.autor_nome}`}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {statusLabels[historico.status_anterior]} → {statusLabels[historico.novo_status]}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {historico.observacao}
                                    </Typography>
                                </Paper>
                            ))}
                        </Box>
                    </Paper>
                ))}
            </Stack>

            <Dialog open={Boolean(statusDialog)} onClose={() => setStatusDialog(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Finalizar mudança de status</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Descreva em uma frase o motivo da atualização para o usuário que enviou a denúncia.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        multiline
                        minRows={4}
                        fullWidth
                        label="Descrição da alteração"
                        value={statusDialog?.descricao ?? ''}
                        onChange={(event) => setStatusDialog((atual) => atual ? { ...atual, descricao: event.target.value } : atual)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatusDialog(null)}>Cancelar</Button>
                    <Button variant="contained" color="success" onClick={confirmarStatus}>Finalizar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
