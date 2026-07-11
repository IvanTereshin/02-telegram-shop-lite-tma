export function loadState<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveState<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The demo stays usable when storage is blocked or full.
  }
}

export function removeState(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage is an enhancement, not a runtime dependency.
  }
}
