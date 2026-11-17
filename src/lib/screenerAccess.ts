const RETURN_KEY = 'bkp-post-auth-route';
const FAILURE_KEY = 'bkp-screener-auth-failed';
const RETURN_COOKIE = 'bkp_screener_return';
const FAILURE_COOKIE = 'bkp_screener_auth_failed';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const entry = document.cookie.split('; ').find((cookie) => cookie.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

function writeCookie(name: string, value: string, maxAge: number) {
  if (typeof document === 'undefined' || window.location.protocol !== 'https:') return;
  const hostname = window.location.hostname;
  const domain = hostname === 'bicarakrypto.com' || hostname.endsWith('.bicarakrypto.com')
    ? '; Domain=.bicarakrypto.com'
    : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure${domain}`;
}

function clearCookie(name: string) {
  writeCookie(name, '', 0);
}

export function markScreenerAuthPending() {
  window.sessionStorage.setItem(RETURN_KEY, '/screener');
  writeCookie(RETURN_COOKIE, '/screener', 900);
}

export function hasPendingScreenerAuth(): boolean {
  return window.sessionStorage.getItem(RETURN_KEY) === '/screener' || readCookie(RETURN_COOKIE) === '/screener';
}

export function clearPendingScreenerAuth() {
  window.sessionStorage.removeItem(RETURN_KEY);
  clearCookie(RETURN_COOKIE);
}

export function markScreenerAuthFailed() {
  window.sessionStorage.setItem(FAILURE_KEY, '1');
  writeCookie(FAILURE_COOKIE, '1', 900);
}

export function consumeScreenerAuthFailure(): boolean {
  const failed = window.sessionStorage.getItem(FAILURE_KEY) === '1' || readCookie(FAILURE_COOKIE) === '1';
  window.sessionStorage.removeItem(FAILURE_KEY);
  clearCookie(FAILURE_COOKIE);
  return failed;
}
