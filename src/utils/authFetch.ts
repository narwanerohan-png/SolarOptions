import { auth } from "../lib/firebase";

/**
 * A reusable authenticated fetch helper that automatically attaches the
 * current Firebase user's ID token as a Bearer token in the Authorization header.
 * 
 * If the user is unauthenticated or the token cannot be obtained,
 * it safely falls back to a standard fetch request without the header.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let token: string | null = null;
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      token = await currentUser.getIdToken();
    }
  } catch (error) {
    console.error("[authFetch] Failed to retrieve Firebase ID token:", error);
  }

  const newInit: RequestInit = { ...init };
  if (token) {
    const headers = new Headers(newInit.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    newInit.headers = headers;
  }

  return fetch(input, newInit);
}
