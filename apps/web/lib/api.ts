// ==============================
// Axios Instance

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { getCookie, removeCookie } from "./cookies";
import { toast } from "sonner";
import { humanizeError } from "./error-codes";
import type { ApiResponse, FieldError } from "./types";

// ==============================
const apiInstance: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // ==============================
  // Request Interceptor
  // ==============================
  apiInstance.interceptors.request.use(
    (config) => {
      const url = (config.url ?? "").toString();
      const isPublic = url.startsWith("/public/") || url.startsWith("public/");

      config.headers = config.headers ?? {};

      const setHeader = (key: string, value: string) => {
        if (typeof config.headers!.set === "function") {
          config.headers!.set(key, value);
        } else {
          (config.headers as Record<string, string>)[key] = value;
        }
      };

      if (isPublic) {
        const tenantId =
          process.env.NEXT_PUBLIC_TENANT_ID || getCookie("sooq-tenant-id");

        if (tenantId) {
          setHeader("X-Tenant-Id", tenantId);
        }
      } else {
        const token = getCookie("sooq-access-token");

        if (token) {
          setHeader("Authorization", `Bearer ${token}`);
        }
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // ==============================
  // Response Interceptor
  // ==============================
  apiInstance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Handle 401 globally
      if (error.response?.status === 401 || error.response?.status === 403) {
        if (typeof window !== "undefined") {
            removeCookie('sooq-access-token');

          // Redirect to login page
          window.location.href = "/request-otp";
        }
      }

      return Promise.reject(handleError(error as AxiosError<ApiResponse<unknown>>));
    }
  );

  // ==============================
  // Error Handler
  // ==============================
  export type ApiError = {
    status: number
    message: string
    errorCode?: string
    fieldErrors?: FieldError[]
    data?: unknown
  }

  const handleError = (error: AxiosError<ApiResponse<unknown>>): ApiError => {
    const responseData = error.response?.data;
    const errorCode = responseData?.errorCode;
    const rawMessage = responseData?.message ?? error.message;
    const message = humanizeError(errorCode, rawMessage);

    // Show toast error
    toast.error(message);

    if (error.response) {
      return {
        status: error.response.status,
        message,
        errorCode,
        fieldErrors: responseData?.fieldErrors,
        data: error.response.data,
      };
    }

    if (error.request) {
      return {
        status: 0,
        message: "لا يوجد استجابة من الخادم",
      };
    }

    return {
      status: 0,
      message: error.message,
    };
  };

  // ==============================
  // Generic Request Function
  // ==============================
export type ApiOptions = Omit<AxiosRequestConfig, "url" | "data"> & {
  body?: AxiosRequestConfig["data"];
};

export const api = async <T = unknown>(
  url: string,
  options: ApiOptions = {}
): Promise<T> => {
  const { body, headers, method = "GET", ...restOptions } = options;

  // For FormData, the browser must set Content-Type with the multipart
  // boundary itself. Setting Content-Type to undefined here cancels the
  // instance-level "application/json" default for this request only.
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const response = await apiInstance.request<T>({
    url,
    method,
    withCredentials: true,
    data: body,
    headers: {
      ...headers,
      ...(isFormData ? { "Content-Type": undefined } : {}),
    },
    ...restOptions,
  });

  return response.data;
};

export default api;
