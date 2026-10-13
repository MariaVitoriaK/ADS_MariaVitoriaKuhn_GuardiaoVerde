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

export const updateProfile = (data: { nome?: string; email?: string }) => api.put('/usuarios/me', data);
export const updateProfilePhoto = (formData: FormData) => api.put('/usuarios/me/foto', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const updatePassword = (data: { senha_atual: string; nova_senha: string }) => api.put('/usuarios/me/senha', data);
export const deleteAccount = () => api.delete('/usuarios/me');
export const getUsers = () => api.get('/usuarios/');
export const updateUserStatus = (id: number, status: 'ativo' | 'inativo' | 'banido') => api.put(`/usuarios/${id}/status`, { status });

export default api;