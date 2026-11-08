const KEY = 'loopscreen.deviceToken';

/** Token do dispositivo no localStorage do player (nunca falha). */
export const deviceStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(KEY, token);
    } catch {
      /* ignora */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignora */
    }
  },
};
