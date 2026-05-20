import { Link } from 'react-router-dom';
import { Box, Typography, Stack, Button } from '@mui/material';

export default function NotFoundPage() {
  return (
    <Stack spacing={4} sx={{ textAlign: 'center', py: { xs: 4, md: 6 } }}>
      <Box>
        <Typography variant="h2" sx={{ mb: 2 }}>
          Not found
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            fontSize: '1.05rem',
            maxWidth: 480,
            mx: 'auto',
          }}
        >
          We couldn't find the page you were looking for.
        </Typography>
      </Box>
      <Box>
        <Button variant="contained" component={Link} to="/" disableElevation>
          Go to payments
        </Button>
      </Box>
    </Stack>
  );
}
