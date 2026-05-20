import { Box } from '@mui/material';
import type { PaymentStatus } from 'shared';
import { FONT_MONO } from '../theme';

// Per-status palette so the 5 lifecycle states are distinguishable at a glance.
const COLORS: Record<PaymentStatus, { bg: string; fg: string; border: string }> = {
  CREATED:    { bg: '#F0EDE7', fg: '#5A574F', border: '#D6D2C8' },
  PROCESSING: { bg: '#FEF3C7', fg: '#854D0E', border: '#FDE68A' },
  COMPLETED:  { bg: '#D1FAE5', fg: '#065F46', border: '#A7F3D0' },
  FAILED:     { bg: '#FEE2E2', fg: '#991B1B', border: '#FECACA' },
  RETRIED:    { bg: '#DBEAFE', fg: '#1E40AF', border: '#BFDBFE' },
};

export default function StatusBadge({ status }: { status: PaymentStatus }) {
  const c = COLORS[status];
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        bgcolor: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
        borderRadius: 1,
        px: 1,
        py: 0.25,
        fontFamily: FONT_MONO,
        fontSize: '0.7rem',
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </Box>
  );
}
