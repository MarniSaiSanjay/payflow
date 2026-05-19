/**
 * Exhaustive tests for the payment status machine.
 *
 * The test matrix iterates every (from, to) pair across the five states:
 *   - 5 valid transitions assert no throw
 *   - 20 invalid transitions assert InvalidTransitionError
 *   - 2 targeted edge cases (COMPLETED is terminal, thrown error shape)
 */
import { describe, it, expect } from 'vitest';
import { ALLOWED_TRANSITIONS, type PaymentStatus } from 'shared';
import { assertCanTransition, InvalidTransitionError } from './statusMachine';

const ALL_STATES: PaymentStatus[] = [
  'CREATED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'RETRIED',
];

describe('assertCanTransition', () => {
  describe('valid transitions succeed', () => {
    for (const from of ALL_STATES) {
      for (const to of ALLOWED_TRANSITIONS[from]) {
        it(`${from} → ${to}`, () => {
          expect(() => assertCanTransition(from, to)).not.toThrow();
        });
      }
    }
  });

  describe('invalid transitions throw InvalidTransitionError', () => {
    for (const from of ALL_STATES) {
      for (const to of ALL_STATES) {
        if (!ALLOWED_TRANSITIONS[from].includes(to)) {
          it(`${from} → ${to}`, () => {
            expect(() => assertCanTransition(from, to)).toThrow(InvalidTransitionError);
          });
        }
      }
    }
  });

  describe('edge cases', () => {
    it('COMPLETED is terminal — every outbound transition throws', () => {
      for (const to of ALL_STATES) {
        expect(() => assertCanTransition('COMPLETED', to)).toThrow(InvalidTransitionError);
      }
    });

    it('thrown error carries statusCode 409, code INVALID_TRANSITION, and from/to details', () => {
      try {
        assertCanTransition('CREATED', 'COMPLETED');
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidTransitionError);
        const err = e as InvalidTransitionError;
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe('INVALID_TRANSITION');
        expect(err.details).toEqual({ from: 'CREATED', to: 'COMPLETED' });
      }
    });
  });
});
