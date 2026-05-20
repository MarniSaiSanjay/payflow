import type {
  CreatePaymentInput,
  PaymentDto,
  PaymentStatus,
  PaymentWithHistoryDto,
  TransitionPaymentInput,
} from 'shared';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Thrown on non-2xx responses
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    [key: string]: unknown;
  };
}

/**
 * Generic typed request wrapper.
 *  - Prepends `API_BASE_URL` to `path`.
 *  - Sets `Content-Type: application/json`.
 *  - Parses JSON responses.
 *  - Throws `ApiError` on any non-2xx response, mapping the body to the
 *    SPEC error envelope shape.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // Response wasn't JSON; fall through with a generic error.
    }
    throw new ApiError(
      response.status,
      body?.error?.code ?? 'UNKNOWN',
      body?.error?.message ?? response.statusText,
      body?.error,
    );
  }

  return (await response.json()) as T;
}

export function listPayments(filter?: { status?: PaymentStatus }): Promise<PaymentDto[]> {
  const query = filter?.status ? `?status=${filter.status}` : '';
  return request<PaymentDto[]>(`/payments${query}`);
}

export function getPayment(id: string): Promise<PaymentWithHistoryDto> {
  return request<PaymentWithHistoryDto>(`/payments/${id}`);
}

export function createPayment(input: CreatePaymentInput): Promise<PaymentDto> {
  return request<PaymentDto>('/payments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function transitionPayment(
  id: string,
  input: TransitionPaymentInput,
): Promise<PaymentDto> {
  return request<PaymentDto>(`/payments/${id}/transition`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
