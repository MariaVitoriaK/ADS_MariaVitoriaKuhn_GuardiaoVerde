import { useState } from 'react';
import {
    Box,
    Button,
    Chip,
    Divider,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
    criaHistorico,
    getStoredDenuncias,
    persistDenuncias,
    statusLabels,
    type Denuncia,
    type DenunciaStatus,
} from '../data/denuncias';

export default function AdminDenunciasPage() {
    const navigate = useNavigate();
    const [denuncias, setDenuncias] = useState<Denuncia[]>(() => getStoredDenuncias());

    const atualizarStatus = (id: number, novoStatus: DenunciaStatus, observacao: string) => {
        setDenuncias((prev) => {
            const listaAtualizada = prev.map((denuncia) => {
                if (denuncia.id_denuncia !== id) return denuncia;

                const historicoAtual = criaHistorico(
                    id,
                    denuncia.status,
                    novoStatus,
                    observacao,
                    new Date().toISOString(),
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

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>Denúncias recebidas</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Painel administrativo para análise, aceite e atualização de status.
                    </Typography>
                </Box>

                <Button variant="outlined" onClick={() => navigate('/admin')}>
                    Voltar ao painel
                </Button>
            </Box>

            <Stack spacing={3}>
                {denuncias.map((denuncia) => (
                    <Paper key={denuncia.id_denuncia} sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>{denuncia.titulo}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    #{denuncia.id_denuncia} • {denuncia.cidade}/{denuncia.estado} • {denuncia.categoria}
                                </Typography>
                            </Box>

                            <Chip
                                label={statusLabels[denuncia.status]}
                                color={denuncia.status === 'pendente' ? 'warning' : denuncia.status === 'aceita' ? 'info' : denuncia.status === 'resolvida' ? 'success' : 'error'}
                                size="small"
                            />
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Descrição:</strong> {denuncia.descricao}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Localização:</strong> {denuncia.localizacao}
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
                            <Button variant="contained" color="success" onClick={() => atualizarStatus(denuncia.id_denuncia, 'aceita', 'Denúncia aceita e encaminhada para análise técnica.')}>Aceitar</Button>
                            <Button variant="contained" color="warning" onClick={() => atualizarStatus(denuncia.id_denuncia, 'em_andamento', 'Denúncia em andamento. A equipe foi acionada para acompanhar o caso.')}>Em andamento</Button>
                            <Button variant="contained" color="success" onClick={() => atualizarStatus(denuncia.id_denuncia, 'resolvida', 'Denúncia concluída após avaliação e intervenção realizada.')}>Concluir</Button>
                            <Button variant="contained" color="error" onClick={() => atualizarStatus(denuncia.id_denuncia, 'recusada', 'Denúncia rejeitada por falta de evidência ou inconsistência de dados.')}>Recusar</Button>
                        </Stack>

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Histórico da denúncia</Typography>
                            {denuncia.historico.map((historico) => (
                                <Paper key={historico.id_historico} sx={{ p: 2, mb: 1, backgroundColor: '#f7f7f7', borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(historico.data_alteracao).toLocaleString('pt-BR')}
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
        </Box>
    );
}
