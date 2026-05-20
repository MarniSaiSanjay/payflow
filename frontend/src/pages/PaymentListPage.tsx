import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  CircularProgress,
  Button,
  type SelectChangeEvent,
} from '@mui/material';
import type { PaymentDto, PaymentStatus } from 'shared';
import { listPayments, ApiError } from '../api/payments';
import StatusBadge from '../components/StatusBadge';
import { RULE } from '../theme';

type FilterValue = 'ALL' | PaymentStatus;

const ALL_STATUSES: PaymentStatus[] = [
  'CREATED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'RETRIED',
];

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

export default function PaymentListPage() {
  const [filter, setFilter] = useState<FilterValue>('ALL');
  const [retryToken, setRetryToken] = useState(0);
  const [payments, setPayments] = useState<PaymentDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    setPayments(null);
    setError(null);
    const args = filter === 'ALL' ? undefined : { status: filter };
    listPayments(args, controller.signal)
      .then((data) => setPayments(data))
      .catch((e) => {
        if (isAbortError(e)) return;
        setError(e instanceof ApiError ? e.message : 'Failed to load payments.');
      });
    return () => controller.abort();
  }, [filter, retryToken]);

  const handleFilterChange = (event: SelectChangeEvent<FilterValue>) => {
    setFilter(event.target.value as FilterValue);
  };

  const handleRetry = () => setRetryToken((t) => t + 1);

  return (
    <Stack spacing={4}>
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

      <FormControl size="small" sx={{ minWidth: 220 }}>
        <InputLabel id="status-filter-label">Status</InputLabel>
        <Select
          labelId="status-filter-label"
          label="Status"
          value={filter}
          onChange={handleFilterChange}
        >
          <MenuItem value="ALL">All payments</MenuItem>
          {ALL_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {payments === null && error === null && <LoadingState />}
      {error !== null && <ErrorState message={error} onRetry={handleRetry} />}
      {payments !== null && payments.length === 0 && (
        <EmptyState hasFilter={filter !== 'ALL'} onClear={() => setFilter('ALL')} />
      )}
      {payments !== null && payments.length > 0 && (
        <PaymentsTable payments={payments} onRowClick={(id) => navigate(`/payments/${id}`)} />
      )}
    </Stack>
  );
}

function LoadingState() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
      <CircularProgress size={28} sx={{ color: 'text.secondary' }} />
    </Box>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Typography sx={{ color: 'text.primary', mb: 2 }}>{message}</Typography>
      <Button variant="contained" onClick={onRetry} disableElevation>
        Try again
      </Button>
    </Box>
  );
}

function EmptyState({ hasFilter, onClear }: { hasFilter: boolean; onClear: () => void }) {
  return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Typography sx={{ color: 'text.secondary', mb: hasFilter ? 2 : 0 }}>
        {hasFilter ? 'No payments match this filter.' : 'No payments yet.'}
      </Typography>
      {hasFilter && (
        <Button
          variant="outlined"
          onClick={onClear}
          disableElevation
          sx={{ borderColor: RULE, color: 'text.primary' }}
        >
          Clear filter
        </Button>
      )}
    </Box>
  );
}

function PaymentsTable({
  payments,
  onRowClick,
}: {
  payments: PaymentDto[];
  onRowClick: (id: string) => void;
}) {
  return (
    <TableContainer
      sx={{
        border: '1px solid',
        borderColor: RULE,
        borderRadius: 1,
        bgcolor: 'background.paper',
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>From → To</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payments.map((p) => (
            <TableRow
              key={p.id}
              hover
              onClick={() => onRowClick(p.id)}
              sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
            >
              <TableCell>
                <Box sx={{ fontWeight: 500 }}>
                  {p.senderName} → {p.recipientName}
                </Box>
                {p.notes && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    {p.notes}
                  </Typography>
                )}
              </TableCell>
              <TableCell>{formatAmount(p.amount, p.currency)}</TableCell>
              <TableCell>
                <StatusBadge status={p.status} />
              </TableCell>
              <TableCell sx={{ color: 'text.secondary' }}>
                {dateFormatter.format(new Date(p.createdAt))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
