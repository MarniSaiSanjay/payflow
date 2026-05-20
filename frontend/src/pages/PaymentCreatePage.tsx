import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CreatePaymentSchema, type CreatePaymentInput } from 'shared';
import { createPayment, ApiError } from '../api/payments';

type FieldErrors = Partial<Record<keyof CreatePaymentInput, string>>;

interface FormState {
  senderName: string;
  recipientName: string;
  amount: string;
  currency: string;
  notes: string;
}

const INITIAL: FormState = {
  senderName: '',
  recipientName: '',
  amount: '',
  currency: '',
  notes: '',
};

export default function PaymentCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);

  const setField =
    (key: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleCurrency = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setTopError(null);

    const parsed = CreatePaymentSchema.safeParse({
      senderName: form.senderName,
      recipientName: form.recipientName,
      amount: form.amount === '' ? undefined : Number(form.amount),
      currency: form.currency,
      notes: form.notes === '' ? undefined : form.notes,
    });

    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof CreatePaymentInput;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payment = await createPayment(parsed.data);
      navigate(`/payments/${payment.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION' && err.details) {
        // Map server-side field errors (defense-in-depth) into the same shape.
        const serverErrors: FieldErrors = {};
        const details = err.details as Record<string, string[] | undefined>;
        for (const [field, msgs] of Object.entries(details)) {
          if (msgs && msgs[0]) {
            serverErrors[field as keyof CreatePaymentInput] = msgs[0];
          }
        }
        setErrors(serverErrors);
      } else {
        setTopError(err instanceof ApiError ? err.message : 'Failed to create payment.');
      }
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={4}>
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

      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 560 }} noValidate>
        <Stack spacing={3}>
          {topError && <Alert severity="error">{topError}</Alert>}

          <TextField
            label="Sender name"
            value={form.senderName}
            onChange={setField('senderName')}
            error={Boolean(errors.senderName)}
            helperText={errors.senderName ?? ' '}
            fullWidth
          />
          <TextField
            label="Recipient name"
            value={form.recipientName}
            onChange={setField('recipientName')}
            error={Boolean(errors.recipientName)}
            helperText={errors.recipientName ?? ' '}
            fullWidth
          />
          <TextField
            label="Amount"
            type="number"
            value={form.amount}
            onChange={setField('amount')}
            error={Boolean(errors.amount)}
            helperText={errors.amount ?? ' '}
            slotProps={{ htmlInput: { step: '0.01', min: 0 } }}
            fullWidth
          />
          <TextField
            label="Currency"
            value={form.currency}
            onChange={handleCurrency}
            error={Boolean(errors.currency)}
            helperText={errors.currency ?? 'ISO 4217 code (USD, EUR, INR, ...)'}
            slotProps={{ htmlInput: { maxLength: 3 } }}
            fullWidth
          />
          <TextField
            label="Notes"
            value={form.notes}
            onChange={setField('notes')}
            error={Boolean(errors.notes)}
            helperText={errors.notes ?? 'Optional'}
            multiline
            minRows={2}
            fullWidth
          />

          <Box>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              disableElevation
              sx={{ minWidth: 180 }}
            >
              {submitting ? <CircularProgress size={20} sx={{ color: 'inherit' }} /> : 'Create payment'}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}
