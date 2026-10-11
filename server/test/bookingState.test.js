import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransition } from '../src/utils/bookingState.js';

test('valid happy path', () => {
  assert.ok(canTransition('DRAFT', 'PAYMENT_PENDING'));
  assert.ok(canTransition('PAYMENT_PENDING', 'CONFIRMED'));
  assert.ok(canTransition('CONFIRMED', 'CANCELLED'));
  assert.ok(canTransition('CANCELLED', 'REFUND_PENDING'));
  assert.ok(canTransition('REFUND_PENDING', 'REFUNDED'));
});

test('invalid jumps are blocked', () => {
  assert.equal(canTransition('DRAFT', 'CONFIRMED'), false);
  assert.equal(canTransition('REFUNDED', 'CONFIRMED'), false);
  assert.equal(canTransition('CONFIRMED', 'DRAFT'), false);
});
