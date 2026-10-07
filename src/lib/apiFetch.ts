export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Universal client-side fetch wrapper that handles 401 session expiration,
 * automatic redirect to /login, safe JSON parsing, and unified error handling.
 */
export async function apiFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);

  // If unauthorized, smoothly redirect to /login instead of displaying a blank or broken page
  if (response.status === 401) {
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      const redirectTarget = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?redirect=${redirectTarget}`;
    }
    throw new ApiError("انتهت الجلسة. يرجى تسجيل الدخول مجدداً.", 401);
  }

  let data: any = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMsg = data?.error || `فشل الطلب برمز الحالة (${response.status})`;
    throw new ApiError(errorMsg, response.status, data);
  }

  return data as T;
}
