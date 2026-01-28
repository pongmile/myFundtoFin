'use client';

import { createTheme } from '@mui/material/styles';
import { Noto_Sans_Thai } from 'next/font/google';

const notoSansThai = Noto_Sans_Thai({
  weight: ['300', '400', '500', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
});

// Material Design 3 Theme with Dark Mode
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#BB86FC', // Purple
      light: '#E1BEE7',
      dark: '#6200EA',
      contrastText: '#000000',
    },
    secondary: {
      main: '#03DAC6', // Teal
      light: '#66FFF9',
      dark: '#00A896',
      contrastText: '#000000',
    },
    error: {
      main: '#CF6679',
      light: '#FF9999',
      dark: '#B00020',
    },
    warning: {
      main: '#FFB74D',
      light: '#FFE082',
      dark: '#F57C00',
    },
    info: {
      main: '#64B5F6',
      light: '#90CAF9',
      dark: '#1976D2',
    },
    success: {
      main: '#81C784',
      light: '#A5D6A7',
      dark: '#388E3C',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  typography: {
    fontFamily: notoSansThai.style.fontFamily,
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      letterSpacing: '-0.015em',
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '0em',
    },
    h4: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '0.0025em',
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '0.0015em',
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      letterSpacing: '0.03125em',
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      letterSpacing: '0.01786em',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      letterSpacing: '0.0892em',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 16, // MD3 rounded corners
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0,0,0,0.3)',
    '0px 1px 3px rgba(0,0,0,0.4)',
    '0px 2px 4px rgba(0,0,0,0.4)',
    '0px 3px 5px rgba(0,0,0,0.4)',
    '0px 4px 6px rgba(0,0,0,0.4)',
    '0px 5px 7px rgba(0,0,0,0.4)',
    '0px 6px 8px rgba(0,0,0,0.4)',
    '0px 7px 9px rgba(0,0,0,0.4)',
    '0px 8px 10px rgba(0,0,0,0.4)',
    '0px 9px 11px rgba(0,0,0,0.4)',
    '0px 10px 12px rgba(0,0,0,0.4)',
    '0px 11px 13px rgba(0,0,0,0.4)',
    '0px 12px 14px rgba(0,0,0,0.4)',
    '0px 13px 15px rgba(0,0,0,0.4)',
    '0px 14px 16px rgba(0,0,0,0.4)',
    '0px 15px 17px rgba(0,0,0,0.4)',
    '0px 16px 18px rgba(0,0,0,0.4)',
    '0px 17px 19px rgba(0,0,0,0.4)',
    '0px 18px 20px rgba(0,0,0,0.4)',
    '0px 19px 21px rgba(0,0,0,0.4)',
    '0px 20px 22px rgba(0,0,0,0.4)',
    '0px 21px 23px rgba(0,0,0,0.4)',
    '0px 22px 24px rgba(0,0,0,0.4)',
    '0px 23px 25px rgba(0,0,0,0.4)',
  ],
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          padding: '10px 24px',
          textTransform: 'none',
          fontWeight: 500,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0,0,0,0.3)',
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

export default theme;
