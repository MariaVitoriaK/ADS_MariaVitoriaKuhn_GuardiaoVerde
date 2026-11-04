import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
});

// Interceptor para adicionar o token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const updateProfile = (data: { nome?: string; username?: string; email?: string }) => api.put('/usuarios/me', data);
export const getCurrentUser = (token?: string) => api.get('/usuarios/me', token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : undefined);
export const updateProfilePhoto = (formData: FormData) => api.put('/usuarios/me/foto', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const updatePassword = (data: { senha_atual: string; nova_senha: string }) => api.put('/usuarios/me/senha', data);
export const deleteAccount = () => api.delete('/usuarios/me');
export const getUsers = () => api.get('/usuarios/');
export interface AdminAccountInput {
    nome: string;
    username: string;
    email: string;
    senha: string;
}
export const createAdminAccount = (data: AdminAccountInput) => api.post('/usuarios/administradores', data);
export const deleteAdminAccount = (id: number) => api.delete(`/usuarios/${id}`);
export type BloqueioDuracao = '30_dias' | '90_dias' | 'permanente';

export const updateUserStatus = (
    id: number,
    status: 'ativo' | 'inativo' | 'banido',
    duracao?: BloqueioDuracao,
) => api.put(`/usuarios/${id}/status`, { status, duracao });

export default api;