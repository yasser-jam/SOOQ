/**
 * Centralized API Client
 *
 * Single entry point for all HTTP calls to the backend, compatible with both
 * server-side and client-side rendering contexts (detected via TanStack Query's
 * `environmentManager.isServer()` flag).
 *
 * Key responsibilities:
 *  - Attaches the Bearer access token from cookies to every outgoing request.
 *  - On a 401 response, checks whether a refresh token exists:
 *      • If it does → redirects to /api/auth/refresh (which will obtain a new
 *        access token and replay the original destination via `callbackUrl` which uses `x-pathname` header to know the current route).
 *      • If it doesn't → redirects to /api/auth/logout to clear stale state.
 *  - Displays a toast notification for any error when running on the client
 *    (unless the caller opts out via `showToaster: false`).
 */
import axios, { AxiosRequestConfig, AxiosResponse } from "axios"
import { getCookie } from "@/lib/cookies"
import { cookies } from "@/config/cookies"
import { environmentManager } from "@tanstack/react-query"
import { Toaster } from "@workspace/ui/components/sonner";

export type APIOptions = AxiosRequestConfig & {
  showToaster?: boolean
  params?: Record<string, unknown>
  body?: any
  _retry?: boolean
  // skip redirect to login (or to refreshToken) if the request is not authorized (if response: 401)
  skipAuthRedirect?: boolean
}

// create a new axios instance with the base URL and headers
const axiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}`,
  headers: {
    Accept: "application/json",
  },
})

export interface APIResponse<T> extends Omit<
  AxiosResponse<T>,
  "headers" | "config" | "request"
> {
  headers: string
}

export async function api<T = any>(
  url: string,
  options: APIOptions = {}
): Promise<APIResponse<T>> {
  // get access token and refresh token from cookie
  const accessToken = await getCookie(cookies.accessToken)

  try {
    // make the request to the API
    const res = await axiosInstance.request<T>({
      ...options,
      url,
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : "",
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...options.headers,
      },
      params: options.params,
      data: options.body,
    })

    return {
      data: res.data,
      status: res.status,
      statusText: res.statusText,
      headers: JSON.stringify(res.headers),
      // config: JSON.stringify(res.config),
      // request: JSON.stringify(res.request),
    }
  } catch (err: any) {
    // get the status code from the response
    const status = err?.response?.status

    if (status === 401 && !options._retry && !options.skipAuthRedirect) {
      // if the status code is 401 and the request has not been retried yet, check if the refresh token is present
      // if (!refreshToken) redirect("/api/auth/logout")
      // if the refresh token is present, redirect to the refresh page
      // else await redirectToRefresh()
    }

    // get the message from the response
    const message: string =
      err?.response?.data?.message || "Something went wrong, try again later"

    // if the request is not on the server and the showToaster option is not false, show the toast
    if (!environmentManager.isServer() && options.showToaster !== false) {

    }

    // log the error response (for debugging purposes)
    console.error(err.response)

    // throw the error
    throw err
  }
}
