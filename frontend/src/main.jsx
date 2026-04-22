import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import './i18n/index.js';
import './styles/global.css';
import App from './App.jsx'
import { ThemeProvider } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme.jsx';
import { AuthProvider } from './context/AuthProvider.jsx';
import { StudentProvider } from './context/StudentContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <StudentProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline/>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </StudentProvider>
    </AuthProvider>
  </StrictMode>,
)
