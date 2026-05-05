// Trusted device tokens for 2FA "remember this device".
// Stored locally per user_id. Default duration: 30 days.
const KEY = 'cc_trusted_devices_v1';
const DEFAULT_DAYS = 30;

type Entry = { token: string; expiresAt: number };
type Store = Record<string, Entry>;

function read(): Store {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') as Store; } catch { return {}; }
}
function write(s: Store) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
function rand(): string {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return Array.from(a).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function isDeviceTrusted(userId: string): boolean {
  if (!userId) return false;
  const s = read();
  const e = s[userId];
  if (!e) return false;
  if (Date.now() > e.expiresAt) {
    delete s[userId]; write(s); return false;
  }
  return true;
}

export function trustDevice(userId: string, days = DEFAULT_DAYS) {
  if (!userId) return;
  const s = read();
  s[userId] = { token: rand(), expiresAt: Date.now() + days * 24 * 60 * 60 * 1000 };
  write(s);
}

export function untrustDevice(userId: string) {
  const s = read();
  delete s[userId];
  write(s);
}

export function untrustAll() {
  localStorage.removeItem(KEY);
}

export function trustExpiresAt(userId: string): number | null {
  const s = read();
  return s[userId]?.expiresAt ?? null;
}
