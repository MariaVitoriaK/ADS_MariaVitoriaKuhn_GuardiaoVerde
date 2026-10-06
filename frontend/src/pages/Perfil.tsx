import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Button, TextField, Typography, Paper, Divider,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';

export default function Perfil() {
    const navigate = useNavigate();
    const [openModal, setOpenModal] = useState(false);
    const [foto, setFoto] = useState<File | null>(null);

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        // PUT /usuarios/me
        console.log("Atualizar dados");
    };

    const handleUpdatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        // PUT /usuarios/me/senha
        console.log("Atualizar senha");
    };

    const handleDeleteAccount = () => {
        // DELETE /usuarios/me
        console.log("Conta excluída");
        setOpenModal(false);
        // Limpar token do localStorage/contexto aqui
        navigate('/login');
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom>Meu Perfil</Typography>

                {/* Dados e Foto */}
                <Box component="form" onSubmit={handleUpdateProfile} sx={{ mb: 4 }}>
                    <TextField fullWidth label="Nome" margin="normal" defaultValue="Nome Atual" />
                    <TextField fullWidth label="E-mail" margin="normal" defaultValue="email@atual.com" />

                    <Box sx={{ mt: 2, mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Foto de Perfil</Typography>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFoto(e.target.files ? e.target.files[0] : null)}
                        />
                    </Box>
                    <Button type="submit" variant="contained" color="primary">Salvar Alterações</Button>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Alteração de Senha */}
                <Typography variant="h6" gutterBottom>Alterar Senha</Typography>
                <Box component="form" onSubmit={handleUpdatePassword} sx={{ mb: 4 }}>
                    <TextField fullWidth label="Senha Atual" type="password" margin="normal" />
                    <TextField fullWidth label="Nova Senha" type="password" margin="normal" />
                    <Button type="submit" variant="outlined" sx={{ mt: 1 }}>Atualizar Senha</Button>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Exclusão de Conta */}
                <Typography variant="h6" color="error" gutterBottom>Zona de Perigo</Typography>
                <Button variant="contained" color="error" onClick={() => setOpenModal(true)}>
                    Excluir Conta
                </Button>

                {/* Modal de Confirmação */}
                <Dialog open={openModal} onClose={() => setOpenModal(false)}>
                    <DialogTitle>Tem certeza que deseja excluir sua conta?</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Esta ação é irreversível. Todos os seus dados serão perdidos e você será redirecionado para a tela de login.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
                        <Button onClick={handleDeleteAccount} color="error" variant="contained">
                            Confirmar Exclusão
                        </Button>
                    </DialogActions>
                </Dialog>
            </Paper>
        </Box>
    );
}