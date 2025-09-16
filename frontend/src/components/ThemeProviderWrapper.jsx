// ThemeProviderWrapper.jsx
import React, { useMemo, useState, createContext, useContext } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

const DarkModeContext = createContext({ mode: 'light', toggleMode: () => {} });

export function useDarkMode() {
  return useContext(DarkModeContext);
}

export function ThemeProviderWrapper({ children }) {
  const [mode, setMode] = useState('light');
  const toggleMode = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#ffffffff' }, // orange primary
          secondary: { main: '#1976d2' }, // blue secondary
          background: { default: mode === 'dark' ? '#121212' : '#fafafa' },
        },
        shape: { borderRadius: 8 },
        typography: { fontFamily: '"Public Sans", sans-serif' },
        components: {
          MuiAppBar: { styleOverrides: { root: { boxShadow: 'none' } } },
          MuiDrawer: { styleOverrides: { paper: { borderRight: 'none' } } },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                borderRadius: 6,
                '&.Mui-selected': {
                  backgroundColor: mode === 'dark' ? '#333' : '#ffe0b2',
                  color: '#1976d2',
                },
                '&.Mui-selected:hover': {
                  backgroundColor: mode === 'dark' ? '#444' : '#ffcc80',
                },
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <DarkModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </DarkModeContext.Provider>
  );
}
