import { Box, Button, Card, CardActions, CardContent, CardMedia, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';

const ongs = [
    {
        nome: 'Greenpeace',
        descricao: 'Atua no combate às mudanças climáticas, ao desmatamento, à poluição e à destruição dos ecossistemas.',
        site: 'https://www.greenpeace.org/brasil/',
        imagem: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=85',
        alt: 'Luz do sol atravessando uma floresta',
    },
    {
        nome: 'WWF Brasil',
        descricao: 'Trabalha na conservação da biodiversidade, proteção de espécies ameaçadas e preservação de florestas e rios.',
        site: 'https://www.wwf.org.br/',
        imagem: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=85',
        alt: 'Copas de árvores em uma floresta',
    },
    {
        nome: 'SOS Mata Atlântica',
        descricao: 'Dedica-se à preservação da Mata Atlântica, à recuperação de áreas desmatadas e à proteção dos recursos hídricos.',
        site: 'https://www.sosma.org.br/',
        imagem: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=85',
        alt: 'Trilha em meio à Mata Atlântica',
    },
    {
        nome: 'Instituto Socioambiental (ISA)',
        descricao: 'Defende o meio ambiente, os direitos dos povos indígenas e das comunidades tradicionais.',
        site: 'https://www.socioambiental.org/',
        imagem: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=900&q=85',
        alt: 'Floresta amazônica vista do alto',
    },
    {
        nome: 'Conservação Internacional Brasil',
        descricao: 'Desenvolve projetos para proteger a biodiversidade e conservar ecossistemas terrestres e marinhos.',
        site: 'https://www.conservation.org/brasil',
        imagem: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=900&q=85',
        alt: 'Ondas do oceano',
    },
    {
        nome: 'Instituto Akatu',
        descricao: 'Promove o consumo consciente e práticas sustentáveis para reduzir os impactos ambientais.',
        site: 'https://akatu.org.br/',
        imagem: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=900&q=85',
        alt: 'Mãos segurando uma pequena planta',
    },
    {
        nome: 'Instituto de Pesquisas Ecológicas (IPÊ)',
        descricao: 'Atua na conservação da biodiversidade, na recuperação de ecossistemas e na proteção de animais ameaçados de extinção.',
        site: 'https://ipe.org.br/',
        imagem: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=900&q=85',
        alt: 'Raposa em seu habitat natural',
    },
    {
        nome: 'Fundação SOS Amazônia',
        descricao: 'Trabalha na preservação da Floresta Amazônica, na recuperação de áreas degradadas e na educação ambiental.',
        site: 'https://sosamazonia.org.br/',
        imagem: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=900&q=85',
        alt: 'Vegetação densa da floresta amazônica',
    },
    {
        nome: 'The Nature Conservancy (TNC)',
        descricao: 'Desenvolve projetos de conservação da natureza, proteção de florestas, rios e oceanos.',
        site: 'https://www.tnc.org.br/',
        imagem: 'https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?auto=format&fit=crop&w=900&q=85',
        alt: 'Rio sinuoso entre áreas verdes',
    },
    {
        nome: 'Oceana',
        descricao: 'Atua na proteção dos oceanos e na defesa da pesca sustentável e da biodiversidade marinha.',
        site: 'https://brasil.oceana.org/',
        imagem: 'https://images.unsplash.com/photo-1518467166778-b88f373ffec7?auto=format&fit=crop&w=900&q=85',
        alt: 'Tartaruga marinha nadando no oceano',
    },
];

export default function OngsPage() {
    const navigate = useNavigate();

    return (
        <Box component="main" className="ongs-page">
            <Button
                startIcon={<ArrowBackIcon />}
                variant="outlined"
                onClick={() => navigate('/dashboard')}
                sx={{ mb: 3 }}
            >
                Voltar ao dashboard
            </Button>

            <Box className="ongs-intro">
                <Typography variant="overline" className="ongs-eyebrow">
                    Juntos pela natureza
                </Typography>
                <Typography variant="h1" component="h1">
                    Conheça ONGs ambientais
                </Typography>
                <Typography component="p">
                    Descubra organizações que trabalham todos os dias pela conservação do meio ambiente
                    e conheça as causas que elas apoiam.
                </Typography>
            </Box>

            <Box component="section" className="ongs-grid" aria-label="Organizações ambientais">
                {ongs.map((ong) => (
                    <Card key={ong.nome} className="ong-card">
                        <CardMedia
                            component="img"
                            image={ong.imagem}
                            alt={ong.alt}
                            loading="lazy"
                        />
                        <CardContent className="ong-card-content">
                            <Typography variant="h2" component="h2">
                                {ong.nome}
                            </Typography>
                            <Typography component="p">
                                {ong.descricao}
                            </Typography>
                        </CardContent>
                        <CardActions className="ong-card-actions">
                            <Button
                                component="a"
                                href={ong.site}
                                target="_blank"
                                rel="noopener noreferrer"
                                endIcon={<OpenInNewIcon fontSize="small" />}
                            >
                                Visitar site
                            </Button>
                        </CardActions>
                    </Card>
                ))}
            </Box>
        </Box>
    );
}
