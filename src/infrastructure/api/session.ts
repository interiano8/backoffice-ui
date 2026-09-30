export function getStoreCode(): string {
  try {
    const store = sessionStorage.getItem('selectedStore');
    return store ? (JSON.parse(store).code || 'GLOBAL') : 'GLOBAL';
  } catch {
    return 'GLOBAL';
  }
}

export function getToken(): string | null {
  return sessionStorage.getItem('token');
}

export function getActiveApiUrl(): string | null {
  return sessionStorage.getItem('activeApiUrl');
}

export function clearSession(): void {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('selectedStore');
  sessionStorage.removeItem('activeApiUrl');
}

export function setSessionExpired(): void {
  sessionStorage.setItem('session_expired', 'true');
}
