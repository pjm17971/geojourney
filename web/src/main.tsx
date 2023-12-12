import ReactDOM from 'react-dom/client';
import { App } from './App.tsx';
import './index.css';
import { MachineContext } from './MachineContext.tsx';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from './theme.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <MachineContext.Provider>
    <ThemeProvider theme={darkTheme}>
      <App />
    </ThemeProvider>
  </MachineContext.Provider>,
);
