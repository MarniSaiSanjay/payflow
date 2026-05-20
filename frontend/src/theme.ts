import { createTheme } from '@mui/material';

/* Design tokens — exported so non-theme styles can still reference them. */
export const INK = '#1A1815';
export const INK_SOFT = '#5A574F';
export const PAPER = '#FAF7F2';
export const RULE = 'rgba(26, 24, 21, 0.14)';

export const FONT_DISPLAY = '"Fraunces", "Georgia", serif';
export const FONT_BODY = '"Manrope", "Helvetica Neue", system-ui, sans-serif';
export const FONT_MONO = '"JetBrains Mono", ui-monospace, monospace';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: INK },
    secondary: { main: '#9C2A1A' },
    background: { default: PAPER, paper: '#FFFFFF' },
    text: { primary: INK, secondary: INK_SOFT },
    divider: RULE,
  },
  typography: {
    fontFamily: FONT_BODY,
    h1: { fontFamily: FONT_DISPLAY, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.05 },
    h2: {
      fontFamily: FONT_DISPLAY,
      fontWeight: 600,
      letterSpacing: '-0.025em',
      fontSize: 'clamp(2.25rem, 4.5vw, 3rem)',
      lineHeight: 1.1,
    },
    h3: { fontFamily: FONT_DISPLAY, fontWeight: 500, letterSpacing: '-0.015em' },
    h4: { fontFamily: FONT_DISPLAY, fontWeight: 500, letterSpacing: '-0.01em' },
    h5: { fontFamily: FONT_DISPLAY, fontWeight: 500 },
    h6: { fontFamily: FONT_DISPLAY, fontWeight: 500 },
    body1: { fontSize: '0.95rem', lineHeight: 1.65 },
    body2: { fontSize: '0.85rem', lineHeight: 1.6 },
    overline: {
      fontFamily: FONT_MONO,
      fontSize: '0.7rem',
      fontWeight: 500,
      letterSpacing: '0.22em',
    },
    button: { textTransform: 'none', fontWeight: 500, letterSpacing: '0.005em' },
  },
  shape: { borderRadius: 2 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 2,
          paddingInline: 20,
          paddingBlock: 10,
          fontSize: '0.875rem',
          fontWeight: 500,
        },
        contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
});
