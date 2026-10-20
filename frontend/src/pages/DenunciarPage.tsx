import { useMemo, useState, type ChangeEvent } from 'react';
import {
    Alert,
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
import {
    criaHistorico,
    getStoredDenuncias,
    persistDenuncias,
    statusLabels,
    type Denuncia,
} from '../data/denuncias';

const emptyForm = {
    titulo: '',
    descricao: '',
    categoria: '',
    localizacao: '',
    cidade: '',
    estado: '',
    latitude: '',
    longitude: '',
    data_ocorrencia: '',
    gravidade: 'média',
};

export default function DenunciarPage() {
    const navigate = useNavigate();
    const [denuncias, setDenuncias] = useState<Denuncia[]>(() => getStoredDenuncias());
    const [showForm, setShowForm] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [fotos, setFotos] = useState<File[]>([]);
    const [form, setForm] = useState(emptyForm);

    const proximoId = useMemo(
        () => Math.max(0, ...denuncias.map((item) => item.id_denuncia)) + 1,
        [denuncias],
    );

    const handleFormChange = (field: keyof typeof emptyForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFotos(Array.from(event.target.files));
        }
    };

    const handleEnviarDenuncia = () => {
        const dados: Denuncia = {
            id_denuncia: proximoId,
            id_usuario: 999,
            titulo: form.titulo || 'Denúncia sem título',
            descricao: form.descricao || 'Descrição não informada.',
            categoria: form.categoria || 'Outros',
            localizacao: form.localizacao || 'Local não informado',
            cidade: form.cidade || 'Cidade não informada',
            estado: form.estado || 'SP',
            latitude: form.latitude || '0',
            longitude: form.longitude || '0',
            data_ocorrencia: form.data_ocorrencia || new Date().toISOString().slice(0, 10),
            gravidade: form.gravidade,
            status: 'pendente',
            data_registro: new Date().toISOString(),
            fotos: fotos.map((foto) => foto.name),
            historico: [
                criaHistorico(
                    proximoId,
                    'pendente',
                    'pendente',
                    'Denúncia registrada e encaminhada para o administrador.',
                    new Date().toISOString(),
                ),
            ],
        };

        setDenuncias((prev) => {
            const novaLista = [dados, ...prev];
            persistDenuncias(novaLista);
            return novaLista;
        });

        setFeedback('Denúncia enviada com sucesso! Ela foi encaminhada para análise do administrador.');
        setShowForm(false);
        setConfirmOpen(false);
        setForm(emptyForm);
        setFotos([]);
    };

    return (
        <Box className="report-page" sx={{ maxWidth: 1100, mx: 'auto', p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
                <Box>
                    <Button variant="outlined" onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
                        Voltar ao dashboard
                    </Button>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>Denúncias</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Registre ocorrências ambientais e acompanhe o histórico das suas denúncias.
                    </Typography>
                </Box>

                <Button variant="contained" color="error" onClick={() => setShowForm(true)}>
                    Denunciar
                </Button>
            </Box>

            {feedback && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    {feedback}
                </Alert>
            )}

            {showForm && (
                <Paper className="report-form-card" sx={{ p: 3, mb: 4, borderRadius: 3 }}>
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Nova denúncia</Typography>

                    <Stack spacing={2}>
                        <TextField
                            label="Título"
                            value={form.titulo}
                            onChange={(event) => handleFormChange('titulo', event.target.value)}
                        />

                        <TextField
                            label="Descrição"
                            multiline
                            rows={4}
                            value={form.descricao}
                            onChange={(event) => handleFormChange('descricao', event.target.value)}
                        />

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                label="Categoria"
                                value={form.categoria}
                                onChange={(event) => handleFormChange('categoria', event.target.value)}
                            />
                            <FormControl>
                                <InputLabel id="gravidade-label">Gravidade</InputLabel>
                                <Select
                                    labelId="gravidade-label"
                                    value={form.gravidade}
                                    label="Gravidade"
                                    onChange={(event) => handleFormChange('gravidade', event.target.value)}
                                >
                                    <MenuItem value="baixa">Baixa</MenuItem>
                                    <MenuItem value="média">Média</MenuItem>
                                    <MenuItem value="alta">Alta</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                label="Localização"
                                value={form.localizacao}
                                onChange={(event) => handleFormChange('localizacao', event.target.value)}
                            />
                            <TextField
                                label="Cidade"
                                value={form.cidade}
                                onChange={(event) => handleFormChange('cidade', event.target.value)}
                            />
                            <TextField
                                label="Estado"
                                value={form.estado}
                                onChange={(event) => handleFormChange('estado', event.target.value)}
                            />
                        </Stack>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                label="Latitude"
                                value={form.latitude}
                                onChange={(event) => handleFormChange('latitude', event.target.value)}
                            />
                            <TextField
                                label="Longitude"
                                value={form.longitude}
                                onChange={(event) => handleFormChange('longitude', event.target.value)}
                            />
                            <TextField
                                type="date"
                                label="Data da ocorrência"
                                value={form.data_ocorrencia}
                                onChange={(event) => handleFormChange('data_ocorrencia', event.target.value)}
                            />
                        </Stack>

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Adicionar fotos</Typography>
                            <input type="file" accept="image/*" multiple onChange={handleFileChange} />
                            {fotos.length > 0 && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                    {fotos.length} arquivo(s) selecionado(s): {fotos.map((foto) => foto.name).join(', ')}
                                </Typography>
                            )}
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button variant="outlined" onClick={() => setShowForm(false)}>
                                Cancelar
                            </Button>
                            <Button variant="contained" color="error" onClick={() => setConfirmOpen(true)}>
                                Denunciar
                            </Button>
                        </Box>
                    </Stack>
                </Paper>
            )}

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Confirmar denúncia</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Tem certeza que deseja enviar esta denúncia? Ela será registrada e encaminhada para o administrador.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>Não</Button>
                    <Button color="error" variant="contained" onClick={handleEnviarDenuncia}>Sim</Button>
                </DialogActions>
            </Dialog>

            <Box>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Histórico de denúncias</Typography>

                {denuncias.map((denuncia) => (
                    <Paper key={denuncia.id_denuncia} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #e0e0e0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>{denuncia.titulo}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    #{denuncia.id_denuncia} • {denuncia.cidade}/{denuncia.estado}
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
                            <strong>Categoria:</strong> {denuncia.categoria}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Local:</strong> {denuncia.localizacao}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Data da ocorrência:</strong> {denuncia.data_ocorrencia}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Gravidade:</strong> {denuncia.gravidade}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Descrição:</strong> {denuncia.descricao}
                        </Typography>

                        {denuncia.fotos.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Fotos anexadas</Typography>
                                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                    {denuncia.fotos.map((foto, index) => (
                                        <Chip key={`${denuncia.id_denuncia}-${index}`} label={foto} size="small" color="primary" variant="outlined" />
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Atualizações</Typography>
                            {denuncia.historico.map((historico) => (
                                <Paper key={historico.id_historico} sx={{ p: 2, mb: 1, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
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
            </Box>

        </Box>
    );
}
