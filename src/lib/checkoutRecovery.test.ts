import { beforeEach, describe, expect, it } from 'vitest';
import { clearCheckoutAttempt, readCheckoutAttempt, saveCheckoutAttempt, shouldOfferRecovery } from './checkoutRecovery';

describe('in-app checkout recovery', () => {
  beforeEach(() => localStorage.clear());
  it('offers only after returning from an opened checkout without a subscription', () => {
    saveCheckoutAttempt('user-a', 'monthly');
    const attempt = readCheckoutAttempt('user-a');
    expect(attempt?.plan).toBe('monthly');
    expect(shouldOfferRecovery(attempt, false, true)).toBe(true);
    expect(shouldOfferRecovery(attempt, false, false)).toBe(false);
    expect(shouldOfferRecovery(attempt, true, true)).toBe(false);
    expect(shouldOfferRecovery(null, false, true)).toBe(false);
  });
  it('keeps attempts separate for each account', () => {
    saveCheckoutAttempt('user-a', 'annual');
    expect(readCheckoutAttempt('user-b')).toBeNull();
  });
  it('does not repeat a dismissed or completed attempt', () => {
    saveCheckoutAttempt('user-a', 'monthly');
    clearCheckoutAttempt('user-a');
    expect(shouldOfferRecovery(readCheckoutAttempt('user-a'), false, true)).toBe(false);
  });
  it('ignores invalid saved attempts', () => {
    localStorage.setItem('checkout-recovery:user-a', '{"plan":"free","openedAt":1}');
    expect(readCheckoutAttempt('user-a')).toBeNull();
  });
});