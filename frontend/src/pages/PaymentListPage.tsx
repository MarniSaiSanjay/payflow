import { Box, Typography, Stack } from '@mui/material';
import PlaceholderPanel from '../components/PlaceholderPanel';

export default function PaymentListPage() {
  return (
    <Stack spacing={5}>
      <Box>
        <Typography variant="h2" sx={{ mb: 2 }}>
          Payments
        </Typography>
        <Typography
          variant="body1"
          sx={{ maxWidth: 540, color: 'text.secondary', fontSize: '1.05rem' }}
        >
          All payments listed below. Filter by status to narrow the view.
        </Typography>
      </Box>
      <PlaceholderPanel label="All payments appear here" />
    </Stack>
  );
}
