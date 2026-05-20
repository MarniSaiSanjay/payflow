import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Container, GlobalStyles } from '@mui/material';
import { theme, INK, PAPER } from './theme';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import PaymentListPage from './pages/PaymentListPage';
import PaymentCreatePage from './pages/PaymentCreatePage';
import PaymentDetailsPage from './pages/PaymentDetailsPage';
import NotFoundPage from './pages/NotFoundPage';

const globalStyles = (
  <GlobalStyles
    styles={{
      '*': { boxSizing: 'border-box' },
      body: {
        background: PAPER,
        fontFeatureSettings: '"ss01", "ss02", "cv11"',
      },
      '::selection': { backgroundColor: INK, color: PAPER },
      '@keyframes pf-rise': {
        from: { opacity: 0, transform: 'translateY(8px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
      },
    }}
  />
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {globalStyles}
      <BrowserRouter>
        <ScrollToTop />
        <Box
          sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Header />
          <Container
            maxWidth="lg"
            sx={{
              py: { xs: 5, md: 8 },
              flex: 1,
              animation: 'pf-rise 360ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
            }}
          >
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<PaymentListPage />} />
                <Route path="/payments/new" element={<PaymentCreatePage />} />
                <Route path="/payments/:id" element={<PaymentDetailsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </ErrorBoundary>
          </Container>
          <Footer />
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
