import { auth } from "../lib/firebase";

/**
 * A reusable authenticated fetch helper that automatically attaches the
 * current Firebase user's ID token as a Bearer token in the Authorization header
 * and the active sessionId in the X-Session-ID header.
 * 
 * Intercepts "Session expired" errors to automatically sign the user out.
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
  const headers = new Headers(newInit.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const sessionId = localStorage.getItem("activeSessionId");
  if (sessionId) {
    headers.set("X-Session-ID", sessionId);
  }

  newInit.headers = headers;

  const response = await fetch(input, newInit);

  if (response.status === 401) {
    try {
      const clonedResponse = response.clone();
      const body = await clonedResponse.json();
      if (body.error === "Session expired") {
        console.warn("[authFetch] Session expired. Signing out automatically...");
        localStorage.removeItem("activeSessionId");
        await auth.signOut();
        // Force fully redirect to login/landing to clear all in-memory state
        window.location.href = "/";
      }
    } catch (e) {
      // Body was not JSON, or error parsing JSON. Ignore.
    }
  }

  return response;
}
