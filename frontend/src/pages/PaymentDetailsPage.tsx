import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
  Paper,
  CircularProgress,
  Button,
} from '@mui/material';
import { ALLOWED_TRANSITIONS, type PaymentWithHistoryDto } from 'shared';
import { getPayment, ApiError } from '../api/payments';
import StatusBadge from '../components/StatusBadge';
import StatusTimeline from '../components/StatusTimeline';
import TransitionForm from '../components/TransitionForm';
import { RULE } from '../theme';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatAmount(amount: number, currency: string): string {
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`;
}

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError';
}

interface FetchError {
  status: number;
  message: string;
}

export default function PaymentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<PaymentWithHistoryDto | null>(null);
  const [error, setError] = useState<FetchError | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setPayment(null);
    setError(null);
    getPayment(id, controller.signal)
      .then((data) => setPayment(data))
      .catch((e) => {
        if (isAbortError(e)) return;
        if (e instanceof ApiError) {
          setError({ status: e.status, message: e.message });
        } else {
          setError({ status: 500, message: 'Failed to load payment.' });
        }
      });
    return () => controller.abort();
  }, [id, refetchToken]);

  if (!id) return null;

  if (payment === null && error === null) {
    return <Loading />;
  }
  if (error !== null) {
    return <ErrorState error={error} />;
  }
  if (payment === null) {
    return null;
  }

  return (
    <Stack spacing={5}>
      <Box>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 1 }}
        >
          <Typography variant="h2">Payment Record</Typography>
          <StatusBadge status={payment.status} />
        </Stack>
      </Box>

      <Paper
        variant="outlined"
        sx={{ p: 3, borderColor: RULE, bgcolor: 'background.paper' }}
      >
        <Stack spacing={2}>
          <Field label="From" value={payment.senderName} />
          <Field label="To" value={payment.recipientName} />
          <Field
            label="Amount"
            value={formatAmount(payment.amount, payment.currency)}
          />
          {payment.notes && <Field label="Notes" value={payment.notes} />}
          <Field
            label="Created"
            value={dateFormatter.format(new Date(payment.createdAt))}
          />
        </Stack>
      </Paper>

      <Box>
        <Typography variant="h5" sx={{ mb: 3 }}>
          History
        </Typography>
        <StatusTimeline events={payment.history} />
      </Box>

      <Box>
        {ALLOWED_TRANSITIONS[payment.status].length === 0 ? (
          <Typography variant="h5" sx={{ color: 'text.secondary' }}>
            Payment completed successfully.
          </Typography>
        ) : (
          <>
            <Typography variant="h5" sx={{ mb: 3 }}>
              Next status
            </Typography>
            <TransitionForm
              paymentId={payment.id}
              currentStatus={payment.status}
              onTransitioned={() => setRefetchToken((t) => t + 1)}
            />
          </>
        )}
      </Box>
    </Stack>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 3 }}>
      <Typography
        sx={{
          minWidth: 110,
          color: 'text.secondary',
          fontSize: '0.9rem',
          pt: 0.25,
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ flex: 1 }}>{value}</Typography>
    </Box>
  );
}

function Loading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress size={28} sx={{ color: 'text.secondary' }} />
    </Box>
  );
}

function ErrorState({ error }: { error: FetchError }) {
  const isNotFound = error.status === 404;
  return (
    <Stack spacing={4} sx={{ textAlign: 'center', py: { xs: 4, md: 6 } }}>
      <Box>
        <Typography variant="h2" sx={{ mb: 2 }}>
          {isNotFound ? 'Payment not found' : 'Something went wrong'}
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: 'text.secondary', fontSize: '1.05rem' }}
        >
          {error.message}
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
