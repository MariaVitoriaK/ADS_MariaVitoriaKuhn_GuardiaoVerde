import React, { useState } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, Chip
} from '@mui/material';

// Interface temporária para simular os dados recebidos da API
interface Usuario {
    id: number;
    nome: string;
    email: string;
    status: 'ativo' | 'bloqueado';
    tipo: string;
}

const mockUsuarios: Usuario[] = [
    { id: 1, nome: 'João Silva', email: 'joao@email.com', status: 'ativo', tipo: 'cliente' },
    { id: 2, nome: 'Maria Souza', email: 'maria@email.com', status: 'bloqueado', tipo: 'cliente' },
    { id: 3, nome: 'Admin Master', email: 'admin@email.com', status: 'ativo', tipo: 'administrador' },
];

export default function AdminPanel() {
    const [usuarios, setUsuarios] = useState<Usuario[]>(mockUsuarios);

    const handleToggleStatus = (id: number, currentStatus: string) => {
        const novoStatus = currentStatus === 'ativo' ? 'bloqueado' : 'ativo';
        // PUT /usuarios/{id}/status (novoStatus)
        setUsuarios(usuarios.map(u => u.id === id ? { ...u, status: novoStatus } : u));
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Painel Administrativo</Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Nome</TableCell>
                            <TableCell>E-mail</TableCell>
                            <TableCell>Permissão</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="center">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {usuarios.map((usuario) => (
                            <TableRow key={usuario.id}>
                                <TableCell>{usuario.id}</TableCell>
                                <TableCell>{usuario.nome}</TableCell>
                                <TableCell>{usuario.email}</TableCell>
                                <TableCell>{usuario.tipo}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={usuario.status}
                                        color={usuario.status === 'ativo' ? 'success' : 'error'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Button
                                        variant="outlined"
                                        color={usuario.status === 'ativo' ? 'error' : 'success'}
                                        size="small"
                                        onClick={() => handleToggleStatus(usuario.id, usuario.status)}
                                        disabled={usuario.tipo === 'administrador'} // Opcional: proteger admin
                                    >
                                        {usuario.status === 'ativo' ? 'Bloquear' : 'Reativar'}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}