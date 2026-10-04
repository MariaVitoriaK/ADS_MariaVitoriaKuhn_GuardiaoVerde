import AppRoutes from './routes/AppRoutes';
import { CssBaseline } from '@mui/material';

function App() {
  return (
    <>
      <CssBaseline /> {/* Reseta o CSS padrão do navegador e aplica a fonte do MUI */}
      <AppRoutes />
    </>
  );
}

export default App;