import { Box, Typography, Stack } from '@mui/material';
import PlaceholderPanel from '../components/PlaceholderPanel';

export default function PaymentCreatePage() {
  return (
    <Stack spacing={5}>
      <Box>
        <Typography variant="h2" sx={{ mb: 2 }}>
          New Payment
        </Typography>
        <Typography
          variant="body1"
          sx={{ maxWidth: 540, color: 'text.secondary', fontSize: '1.05rem' }}
        >
          Record an outbound transfer to a vendor.
        </Typography>
      </Box>
      <PlaceholderPanel label="New payment form appears here" />
    </Stack>
  );
}
