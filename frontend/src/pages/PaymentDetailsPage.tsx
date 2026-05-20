import { Box, Typography, Stack } from '@mui/material';
import PlaceholderPanel from '../components/PlaceholderPanel';

export default function PaymentDetailsPage() {
  return (
    <Stack spacing={5}>
      <Box>
        <Typography variant="h2" sx={{ mb: 2 }}>
          Payment Record
        </Typography>
        <Typography
          variant="body1"
          sx={{ maxWidth: 540, color: 'text.secondary', fontSize: '1.05rem' }}
        >
          Payment details and history.
        </Typography>
      </Box>
      <PlaceholderPanel label="Payment record and history appear here" />
    </Stack>
  );
}
