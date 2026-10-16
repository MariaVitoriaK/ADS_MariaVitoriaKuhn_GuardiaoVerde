import api from './api'; // Sua instância configurada do Axios

export const fetchNoticias = async () => {
    const response = await api.get('/noticias/');
    return response.data;
};

export const createNoticia = async (dados: { titulo: string; conteudo: string; imagem?: string }) => {
    const response = await api.post('/noticias/', dados);
    return response.data;
};

export const toggleCurtirNoticia = async (idNoticia: number) => {
    const response = await api.post(`/noticias/${idNoticia}/curtir`);
    return response.data;
};