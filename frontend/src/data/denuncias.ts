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

export const initialDenuncias: Denuncia[] = [];
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
        if (!Array.isArray(parsed)) {
            window.localStorage.removeItem(STORAGE_KEY);
            return initialDenuncias;
        }

        const temDenunciasMockadas = parsed.some((item) => item.id_usuario === 101 || item.id_usuario === 102);
        if (temDenunciasMockadas) {
            window.localStorage.removeItem(STORAGE_KEY);
            return initialDenuncias;
        }

        return parsed;
    } catch {
        window.localStorage.removeItem(STORAGE_KEY);
        return initialDenuncias;
    }
};

export const persistDenuncias = (denuncias: Denuncia[]) => {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(denuncias));
    }
};