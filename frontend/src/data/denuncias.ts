export type DenunciaStatus = 'pendente' | 'aceita' | 'em_andamento' | 'resolvida' | 'recusada';

export interface HistoricoDenuncia {
    id_historico: number;
    id_denuncia: number;
    status_anterior: DenunciaStatus;
    novo_status: DenunciaStatus;
    observacao: string;
    data_alteracao: string;
}

export interface Denuncia {
    id_denuncia: number;
    id_usuario: number;
    titulo: string;
    descricao: string;
    categoria: string;
    localizacao: string;
    cidade: string;
    estado: string;
    latitude: string;
    longitude: string;
    data_ocorrencia: string;
    gravidade: string;
    status: DenunciaStatus;
    data_registro: string;
    fotos: string[];
    historico: HistoricoDenuncia[];
}

export const statusLabels: Record<DenunciaStatus, string> = {
    pendente: 'Pendente',
    aceita: 'Aceita',
    em_andamento: 'Em andamento',
    resolvida: 'Resolvida',
    recusada: 'Recusada',
};

export const criaHistorico = (
    idDenuncia: number,
    statusAnterior: DenunciaStatus,
    novoStatus: DenunciaStatus,
    observacao: string,
    dataAlteracao: string,
): HistoricoDenuncia => ({
    id_historico: Date.now() + Math.floor(Math.random() * 1000),
    id_denuncia: idDenuncia,
    status_anterior: statusAnterior,
    novo_status: novoStatus,
    observacao,
    data_alteracao: dataAlteracao,
});

export const initialDenuncias: Denuncia[] = [
    {
        id_denuncia: 1,
        id_usuario: 101,
        titulo: 'Desmatamento em área de preservação',
        descricao: 'Há corte irregular de árvores em uma faixa próxima ao rio e a área está sendo usada para descarte de resíduos.',
        categoria: 'Desmatamento',
        localizacao: 'Próximo ao parque municipal',
        cidade: 'São Paulo',
        estado: 'SP',
        latitude: '-23.5505',
        longitude: '-46.6333',
        data_ocorrencia: '2026-10-12',
        gravidade: 'alta',
        status: 'pendente',
        data_registro: '2026-10-13T09:30:00',
        fotos: ['image-1.jpg'],
        historico: [
            {
                id_historico: 1,
                id_denuncia: 1,
                status_anterior: 'pendente',
                novo_status: 'pendente',
                observacao: 'Denúncia registrada pelo usuário e enviada para análise do administrador.',
                data_alteracao: '2026-10-13T09:30:00',
            },
        ],
    },
    {
        id_denuncia: 2,
        id_usuario: 102,
        titulo: 'Queimadas na região rural',
        descricao: 'Há focos de fumaça e sinais de queima de vegetação em área abandonada perto da estrada rural.',
        categoria: 'Queimada',
        localizacao: 'Estrada rural KM 12',
        cidade: 'Campinas',
        estado: 'SP',
        latitude: '-22.9058',
        longitude: '-47.0616',
        data_ocorrencia: '2026-10-14',
        gravidade: 'média',
        status: 'aceita',
        data_registro: '2026-10-14T18:10:00',
        fotos: ['image-2.jpg'],
        historico: [
            {
                id_historico: 2,
                id_denuncia: 2,
                status_anterior: 'pendente',
                novo_status: 'aceita',
                observacao: 'Denúncia validada e encaminhada para equipe de monitoramento.',
                data_alteracao: '2026-10-14T18:45:00',
            },
        ],
    },
];
const STORAGE_KEY = 'guardiaverde_denuncias';

export const getStoredDenuncias = (): Denuncia[] => {
    if (typeof window === 'undefined') {
        return initialDenuncias;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return initialDenuncias;
    }

    try {
        const parsed = JSON.parse(raw) as Denuncia[];
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialDenuncias;
    } catch {
        return initialDenuncias;
    }
};

export const persistDenuncias = (denuncias: Denuncia[]) => {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(denuncias));
    }
};