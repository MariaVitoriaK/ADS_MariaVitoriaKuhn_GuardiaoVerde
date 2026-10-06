import React from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';

export default function Dashboard() {
    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h4" gutterBottom>Dashboard</Typography>

            <Grid container spacing={3}>
                {/* Placeholder Estatística 1 */}
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 140, justifyContent: 'center', alignItems: 'center' }}>
                        <Typography variant="h6" color="text.secondary">Total de Vendas</Typography>
                        <Typography variant="h3">--</Typography>
                    </Paper>
                </Grid>

                {/* Placeholder Estatística 2 */}
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 140, justifyContent: 'center', alignItems: 'center' }}>
                        <Typography variant="h6" color="text.secondary">Novos Usuários</Typography>
                        <Typography variant="h3">--</Typography>
                    </Paper>
                </Grid>

                {/* Placeholder Estatística 3 */}
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 140, justifyContent: 'center', alignItems: 'center' }}>
                        <Typography variant="h6" color="text.secondary">Acessos Hoje</Typography>
                        <Typography variant="h3">--</Typography>
                    </Paper>
                </Grid>

                {/* Placeholder Gráfico Principal */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 400, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
                        <Typography variant="h5" color="text.secondary">
                            [Área reservada para o Gráfico Principal - RF07]
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}