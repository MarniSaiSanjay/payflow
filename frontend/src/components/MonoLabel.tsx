import type { ReactNode } from 'react';
import { Typography } from '@mui/material';
import { FONT_MONO } from '../theme';

/**
 * Shared mono-caps eyebrow label. Used wherever a small uppercase monospace
 * tag belongs — header subtitle, footer marks, placeholder labels.
 */
export default function MonoLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      component="span"
      sx={{
        fontFamily: FONT_MONO,
        fontSize: '0.7rem',
        fontWeight: 500,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: 'text.secondary',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </Typography>
  );
}
