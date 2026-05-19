import { ALLOWED_TRANSITIONS, type PaymentStatus } from 'shared';
import { HttpError } from '../middleware/error';

/**
 * Thrown when a status transition would violate `ALLOWED_TRANSITIONS`.
 * Serializes as HTTP 409 with code `INVALID_TRANSITION` via the error middleware.
 */
export class InvalidTransitionError extends HttpError {
  constructor(from: PaymentStatus, to: PaymentStatus) {
    super(409, 'INVALID_TRANSITION', `Cannot move ${from} to ${to}`, { from, to });
  }
}

/**
 * The single decision point for whether a status transition is legal.
 * Every code path that mutates payment status MUST call this first.
 * Throws `InvalidTransitionError` on any disallowed move.
 */
export function assertCanTransition(from: PaymentStatus, to: PaymentStatus): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new InvalidTransitionError(from, to);
  }
}
