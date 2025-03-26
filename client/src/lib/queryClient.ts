import { QueryClient, QueryFunction } from "@tanstack/react-query";
import config from './config';

const defaultHeaders = {
  "Accept": "application/json",
  "Content-Type": "application/json",
};

async function getResponseData(res: Response): Promise<any> {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch (error) {
      console.error("[API] Failed to parse JSON response:", error);
      throw new Error("Invalid JSON response from server");
    }
  } else {
    return await res.text();
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const errorData = await getResponseData(res);
    const errorMessage = typeof errorData === 'object' ? errorData.message : errorData;
    throw new Error(`${res.status}: ${errorMessage || res.statusText}`);
  }
}

export async function apiRequest(
  methodOrUrl: string,
  urlOrData?: string | RequestInit,
  data?: unknown | undefined,
): Promise<any> {
  let response: Response;

  if (methodOrUrl === 'GET' || methodOrUrl === 'POST' || methodOrUrl === 'PUT' || methodOrUrl === 'DELETE' || methodOrUrl === 'PATCH') {
    const method = methodOrUrl;
    let url = urlOrData as string;
    
    // If the URL starts with /api, use the config API base URL
    if (url.startsWith('/api/')) {
      url = `${config.apiBaseUrl}${url.substring(4)}`;
    }

    console.log(`[API Request] ${method} ${url}`);
    response = await fetch(url, {
      method,
      headers: {
        ...defaultHeaders,
        ...(method !== 'GET' && data ? { "Content-Type": "application/json" } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
  } else {
    let url = methodOrUrl;
    const options = urlOrData as RequestInit;
    
    // If the URL starts with /api, use the config API base URL
    if (url.startsWith('/api/')) {
      url = `${config.apiBaseUrl}${url.substring(4)}`;
    }

    console.log(`[API Request] ${options?.method || 'GET'} ${url}`);
    response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options?.method !== 'GET' && options?.body ? { "Content-Type": "application/json" } : {}),
        ...(options?.headers || {}),
      },
      credentials: "include",
    });
  }

  console.log(`[API Response] Status:`, response.status);
  
  // For debugging purposes, clone the response and log its contents
  const responseClone = response.clone();
  responseClone.text().then(text => {
    try {
      const jsonData = JSON.parse(text);
      console.log("[API Response] Data:", jsonData);
    } catch (e) {
      console.log("[API Response] Raw Response:", text);
    }
  }).catch(err => {
    console.error("[API Response] Error parsing response:", err);
  });
  
  await throwIfResNotOk(response);
  return await getResponseData(response);
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let url = queryKey[0] as string;
    
    // If the URL starts with /api, use the config API base URL
    if (url.startsWith('/api/')) {
      url = `${config.apiBaseUrl}${url.substring(4)}`;
    }
    
    console.log(`[Query] Fetching ${url}`);
    const response = await fetch(url, {
      headers: defaultHeaders,
      credentials: "include",
    });

    console.log(`[Query] ${url} - Status:`, response.status);
    if (unauthorizedBehavior === "returnNull" && response.status === 401) {
      console.log(`[Query] Returning null for unauthorized request to ${url}`);
      return null;
    }

    await throwIfResNotOk(response);
    return await getResponseData(response);
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0,
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.startsWith("401:")) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});