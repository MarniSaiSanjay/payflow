import { useState, type FormEvent } from 'react';
import {
  Box,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  CircularProgress,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import { ALLOWED_TRANSITIONS, type PaymentStatus } from 'shared';
import { transitionPayment, ApiError } from '../api/payments';

interface TransitionFormProps {
  paymentId: string;
  currentStatus: PaymentStatus;
  /** Called after a successful transition so the parent can refetch payment + history. */
  onTransitioned: () => void;
}

/**
 * The state-machine UI. Renders only the transitions allowed from the current
 * status (per `ALLOWED_TRANSITIONS`), so an invalid move cannot be selected
 */
export default function TransitionForm({
  paymentId,
  currentStatus,
  onTransitioned,
}: TransitionFormProps) {
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus];
  const [toStatus, setToStatus] = useState<PaymentStatus | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (allowedNext.length === 0) {
    return (
      <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
        Terminal — no transitions available.
      </Typography>
    );
  }

  const handleSelectChange = (event: SelectChangeEvent<PaymentStatus | ''>) => {
    setToStatus(event.target.value as PaymentStatus | '');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (toStatus === '') return;
    setSubmitting(true);
    setError(null);
    try {
      await transitionPayment(paymentId, { toStatus });
      setToStatus('');
      onTransitioned();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to transition payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}

        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel id="transition-status-label">Move to</InputLabel>
          <Select
            labelId="transition-status-label"
            label="Move to"
            value={toStatus}
            onChange={handleSelectChange}
            disabled={submitting}
          >
            {allowedNext.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || toStatus === ''}
            disableElevation
            sx={{ minWidth: 180 }}
          >
            {submitting ? (
              <CircularProgress size={20} sx={{ color: 'inherit' }} />
            ) : (
              'Apply transition'
            )}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
