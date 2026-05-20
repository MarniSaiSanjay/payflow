import { Box } from '@mui/material';
import MonoLabel from './MonoLabel';

/**
 * Dashed-border slab used as a content placeholder on routes whose body
 * hasn't been built yet. The dashed rule signals "intentionally pending".
 */
export default function PlaceholderPanel({ label }: { label: string }) {
  return (
    <Box
      sx={{
        py: { xs: 6, md: 9 },
        px: 4,
        textAlign: 'center',
        border: '1px dashed',
        borderColor: 'rgba(26, 24, 21, 0.20)',
        bgcolor: 'rgba(26, 24, 21, 0.025)',
      }}
    >
      <MonoLabel>{label}</MonoLabel>
    </Box>
  );
}
