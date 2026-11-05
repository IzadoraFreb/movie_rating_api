const TOKEN_KEY = 'auth_token';
let revision = 0;
const subscribers = new Set<() => void>();
function invalidateResources() {
  revision += 1;
  subscribers.forEach((listener) => listener());
}
export function getRevision() {
  return revision;
}
export function subscribeToMutations(listener: () => void) {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export function getToken() {
  return typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
  invalidateResources();
  window.dispatchEvent(new Event('auth-change'));
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  let response: Response;
  try {
    response = await fetch('/api' + path, {
      cache: 'no-store',
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error;
    throw new ApiError(
      'Não foi possível conectar à API. Verifique se o backend está em execução.',
      0,
    );
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) setToken(null);
    const message = body?.message;
    throw new ApiError(
      Array.isArray(message)
        ? message.join('. ')
        : message ||
            'Não foi possível concluir a solicitação. Tente novamente.',
      response.status,
    );
  }
  if (
    options.method &&
    !['GET', 'HEAD'].includes(options.method.toUpperCase())
  ) {
    invalidateResources();
  }
  return body as T;
}
export function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Não foi possível concluir a solicitação.';
}
export function query(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined && value !== '') params.set(key, String(value));
  return params.toString();
}
