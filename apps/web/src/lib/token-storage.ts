const KEY = 'loopscreen.token';

// localStorage pode falhar (modo privado, storage bloqueado): nunca quebra o app.
export const tokenStorage = {
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
