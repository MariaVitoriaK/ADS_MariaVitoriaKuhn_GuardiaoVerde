import { useContext, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
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
import L from 'leaflet';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import {
    criaHistorico,
    getStoredDenuncias,
    persistDenuncias,
    statusLabels,
    type Denuncia,
} from '../data/denuncias';
import { AuthContext } from '../contexts/AuthContext';

type Coordenadas = {
    latitude: number;
    longitude: number;
};

const coordenadasIniciais = (latitude: string, longitude: string): Coordenadas | null => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!latitude || !longitude || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180 || (lat === 0 && lng === 0)) return null;
    return { latitude: lat, longitude: lng };
};

const iconeMarcador = L.icon({
    iconUrl: markerIconUrl,
    iconRetinaUrl: markerIconRetinaUrl,
    shadowUrl: markerShadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function SeletorMapa({
    coordenadasIniciais: coordenadas,
    aoSelecionar,
}: {
    coordenadasIniciais: Coordenadas | null;
    aoSelecionar: (coordenadas: Coordenadas) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const aoSelecionarRef = useRef(aoSelecionar);
    const posicaoInicialRef = useRef(coordenadas);

    useEffect(() => {
        aoSelecionarRef.current = aoSelecionar;
    }, [aoSelecionar]);

    useEffect(() => {
        if (!containerRef.current) return;

        const latitudeInicial = posicaoInicialRef.current?.latitude ?? null;
        const longitudeInicial = posicaoInicialRef.current?.longitude ?? null;
        const temCoordenadas = latitudeInicial !== null && longitudeInicial !== null;
        const centro: L.LatLngExpression = temCoordenadas
            ? [latitudeInicial, longitudeInicial]
            : [-14.235, -51.9253];
        const mapa = L.map(containerRef.current).setView(centro, temCoordenadas ? 13 : 4);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(mapa);

        let marcador = temCoordenadas
            ? L.marker(centro, { icon: iconeMarcador }).addTo(mapa)
            : null;

        mapa.on('click', (evento) => {
            const { lat, lng } = evento.latlng;
            if (marcador) {
                marcador.setLatLng(evento.latlng);
            } else {
                marcador = L.marker(evento.latlng, { icon: iconeMarcador }).addTo(mapa);
            }
            aoSelecionarRef.current({ latitude: lat, longitude: lng });
        });

        requestAnimationFrame(() => mapa.invalidateSize());
        return () => {
            mapa.remove();
        };
    }, []);

    return (
        <Box
            ref={containerRef}
            role="application"
            aria-label="Mapa para selecionar a localização da denúncia"
            sx={{ width: '100%', height: { xs: 320, sm: 440 }, borderRadius: 1, overflow: 'hidden' }}
        />
    );
}

const categoriasDisponiveis = [
    'Desmatamento',
    'Queimada',
    'Lixão irregular',
    'Poluição da água',
    'Erosão e deslizamento',
    'Descarte de resíduos industriais',
    'Caça e pesca irregular',
    'Infraestrutura ambiental',
    'Outros',
];

const emptyForm = {
    titulo: '',
    descricao: '',
    categoria: categoriasDisponiveis[0],
    cidade: '',
    estado: '',
    latitude: '',
    longitude: '',
    data_ocorrencia: '',
    gravidade: 'média',
};

export default function DenunciarPage() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [denuncias, setDenuncias] = useState<Denuncia[]>(() => getStoredDenuncias());
    const [showForm, setShowForm] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [mapaAberto, setMapaAberto] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [fotos, setFotos] = useState<string[]>([]);
    const [form, setForm] = useState(emptyForm);

    const proximoId = useMemo(
        () => Math.max(0, ...denuncias.map((item) => item.id_denuncia)) + 1,
        [denuncias],
    );

    const handleFormChange = (field: keyof typeof emptyForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const arquivos = Array.from(event.target.files ?? []);
        if (!arquivos.length) return;

        const previews = await Promise.all(
            arquivos.map((arquivo) => new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result ?? ''));
                reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
                reader.readAsDataURL(arquivo);
            })),
        );

        setFotos((anterior) => [...anterior, ...previews]);
    };

    const handleEnviarDenuncia = () => {
        const dados: Denuncia = {
            id_denuncia: proximoId,
            id_usuario: 999,
            email_usuario: user?.email ?? 'nao-informado@guardiaoverde.local',
            email_verificado: user?.email_verificado ?? false,
            titulo: form.titulo || 'Denúncia sem título',
            descricao: form.descricao || 'Descrição não informada.',
            categoria: form.categoria || 'Outros',
            localizacao: 'Local não informado',
            cidade: form.cidade || 'Cidade não informada',
            estado: form.estado || 'SP',
            latitude: form.latitude || '0',
            longitude: form.longitude || '0',
            data_ocorrencia: form.data_ocorrencia || new Date().toISOString().slice(0, 10),
            gravidade: form.gravidade,
            status: 'pendente',
            data_registro: new Date().toISOString(),
            fotos,
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
                            <FormControl>
                                <InputLabel id="categoria-label">Categoria</InputLabel>
                                <Select
                                    labelId="categoria-label"
                                    value={form.categoria}
                                    label="Categoria"
                                    onChange={(event) => handleFormChange('categoria', event.target.value)}
                                >
                                    {categoriasDisponiveis.map((categoria) => (
                                        <MenuItem key={categoria} value={categoria}>{categoria}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
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
                                label="Cidade"
                                value={form.cidade}
                                onChange={(event) => handleFormChange('cidade', event.target.value)}
                            />
                            <TextField
                                label="Estado"
                                value={form.estado}
                                onChange={(event) => handleFormChange('estado', event.target.value)}
                            />
                            <TextField
                                type="date"
                                label="Data da ocorrência"
                                value={form.data_ocorrencia}
                                onChange={(event) => handleFormChange('data_ocorrencia', event.target.value)}
                            />
                        </Stack>

                        <Box sx={{ flex: 1 }}>
                            <Button variant="outlined" onClick={() => setMapaAberto(true)}>
                                {form.latitude && form.longitude ? 'Alterar coordenadas no mapa' : 'Adicionar coordenadas'}
                            </Button>
                            {form.latitude && form.longitude && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Latitude: {form.latitude} • Longitude: {form.longitude}
                                </Typography>
                            )}
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Adicionar fotos</Typography>
                            <input type="file" accept="image/*" multiple onChange={(event) => void handleFileChange(event)} />
                            {fotos.length > 0 && (
                                <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
                                    {fotos.map((foto, index) => (
                                        <Box
                                            key={`${foto}-${index}`}
                                            component="img"
                                            src={foto}
                                            alt={`Foto da denúncia ${index + 1}`}
                                            sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 2, border: '1px solid #d9d9d9' }}
                                        />
                                    ))}
                                </Stack>
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

            <Dialog
                open={mapaAberto}
                onClose={() => setMapaAberto(false)}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>Selecione a localização da denúncia</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Clique no mapa para posicionar o marcador.
                    </Typography>
                    <SeletorMapa
                        coordenadasIniciais={coordenadasIniciais(form.latitude, form.longitude)}
                        aoSelecionar={(coordenadas) => {
                            handleFormChange('latitude', coordenadas.latitude.toFixed(6));
                            handleFormChange('longitude', coordenadas.longitude.toFixed(6));
                        }}
                    />
                    {form.latitude && form.longitude && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Latitude: {form.latitude} • Longitude: {form.longitude}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMapaAberto(false)}>Fechar</Button>
                    <Button
                        variant="contained"
                        onClick={() => setMapaAberto(false)}
                        disabled={!form.latitude || !form.longitude}
                    >
                        Usar coordenadas
                    </Button>
                </DialogActions>
            </Dialog>

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
                                        <Box
                                            key={`${denuncia.id_denuncia}-${index}`}
                                            component="img"
                                            src={foto}
                                            alt={`Foto anexada ${index + 1}`}
                                            sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 2, border: '1px solid #d9d9d9' }}
                                        />
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
