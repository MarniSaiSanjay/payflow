import { Link, useLocation } from 'react-router-dom';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { RULE, FONT_DISPLAY } from '../theme';
import MonoLabel from './MonoLabel';

/**
 * Sticky app header — brand wordmark on the left, a single primary action
 * button on the right whose label and destination flip based on the route.
 */
export default function Header() {
  const location = useLocation();
  const onCreate = location.pathname === '/payments/new';
  return (
    <Box
      component="header"
      sx={{
        borderBottom: '1px solid',
        borderColor: RULE,
        bgcolor: 'rgba(250, 247, 242, 0.78)',
        backdropFilter: 'saturate(180%) blur(10px)',
        WebkitBackdropFilter: 'saturate(180%) blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 1100,
      }}
    >
      <Container maxWidth="lg" sx={{ py: 2.5 }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box
            component={Link}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 1.25,
            }}
          >
            <Typography
              sx={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 600,
                fontSize: '1.5rem',
                letterSpacing: '-0.02em',
                fontStyle: 'italic',
                lineHeight: 1,
              }}
            >
              PayFlow
            </Typography>
            <MonoLabel>Tracker</MonoLabel>
          </Box>
          <Button
            variant="contained"
            component={Link}
            to={onCreate ? '/' : '/payments/new'}
            disableElevation
          >
            {onCreate ? '← All payments' : 'New Payment'}
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
