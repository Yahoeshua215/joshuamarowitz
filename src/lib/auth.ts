import { cookies } from "next/headers";

const AUTH_COOKIE = "josh-log-admin";

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  const password = process.env.ADMIN_PASSWORD;

  if (!password) return false;
  return token === hashPassword(password);
}

export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return `admin-${Math.abs(hash)}`;
}

export function getAuthCookieValue(password: string): string {
  return hashPassword(password);
}

export { AUTH_COOKIE };
