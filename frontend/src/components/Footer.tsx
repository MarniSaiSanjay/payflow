import { Box, Container, Stack } from '@mui/material';
import { RULE, PAPER } from '../theme';
import MonoLabel from './MonoLabel';

/**
 * App footer — hairline-divided strip with mono-caps marks left and right.
 * Mirrors a newspaper's masthead/colophon at the foot of a page.
 */
export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid',
        borderColor: RULE,
        mt: 10,
        py: 3,
        bgcolor: PAPER,
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <MonoLabel>PayFlow Tracker · Ledger Edition</MonoLabel>
          <MonoLabel>v0.1 / {new Date().getFullYear()}</MonoLabel>
        </Stack>
      </Container>
    </Box>
  );
}
