import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches uncaught render errors anywhere in the subtree and renders a
 * graceful fallback with a reset action.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught render error:', error, info.componentStack);
  }

  private reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ textAlign: 'center', py: { xs: 6, md: 10 } }}>
          <Typography variant="h2" sx={{ mb: 2 }}>
            Something went wrong
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: 'text.secondary', mb: 4, maxWidth: 480, mx: 'auto', fontSize: '1.05rem' }}
          >
            An unexpected error stopped the page from rendering. Try again, or refresh the browser.
          </Typography>
          <Button variant="contained" onClick={this.reset} disableElevation>
            Try again
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
