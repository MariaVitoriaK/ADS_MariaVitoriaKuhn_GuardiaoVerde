import { Typography } from '@mui/material';

export default function Home() {
    return (
        <div className="welcome-page">
            <Typography variant="h4" component="h1" gutterBottom>
                Bem-vindo ao Guardião Verde
            </Typography>
            <Typography variant="body1">
                O sistema está configurado e pronto para o desenvolvimento!
            </Typography>
        </div>
    );
}