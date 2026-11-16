export type CheckoutPlan = 'monthly' | 'annual';
export interface CheckoutAttempt { plan: CheckoutPlan; openedAt: number }

const key = (userId: string) => `checkout-recovery:${userId}`;

export function readCheckoutAttempt(userId: string): CheckoutAttempt | null {
  try {
    const value = JSON.parse(localStorage.getItem(key(userId)) || 'null');
    return value && (value.plan === 'monthly' || value.plan === 'annual') &&
      typeof value.openedAt === 'number' ? value : null;
  } catch { return null; }
}

export function saveCheckoutAttempt(userId: string, plan: CheckoutPlan) {
  try { localStorage.setItem(key(userId), JSON.stringify({ plan, openedAt: Date.now() })); } catch { /* Storage can be unavailable. */ }
}

export function clearCheckoutAttempt(userId: string) {
  try { localStorage.removeItem(key(userId)); } catch { /* Storage can be unavailable. */ }
}

export function shouldOfferRecovery(attempt: CheckoutAttempt | null, subscribed: boolean, returned: boolean) {
  return Boolean(attempt && !subscribed && returned);
}