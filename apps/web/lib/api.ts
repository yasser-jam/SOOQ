// ==============================
// Axios Instance

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { getCookie, removeCookie } from "./cookies";
import { toast } from "sonner";

// ==============================
const apiInstance: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  // ==============================
  // Request Interceptor
  // ==============================
  apiInstance.interceptors.request.use(
    (config) => {
      const token = getCookie('sooq-access-token');
  
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
      if (error.response?.status === 401) {
        if (typeof window !== "undefined") {
            removeCookie('sooq-access-token');
  
          // Redirect to login page
          window.location.href = "/login";
        }
      }
  
      return Promise.reject(handleError(error));
    }
  );
  
  // ==============================
  // Error Handler
  // ==============================
  const handleError = (error: AxiosError<any>) => {
    
    // Show toast error
    toast.error(error.response?.data?.message || "حدث خطأ ما");


    if (error.response) {
      const responseData = error.response.data as { message?: string } | undefined;

      return {
        status: error.response.status,
        message: responseData?.message || "Something went wrong",
        data: error.response.data,
      };
    }
  
    if (error.request) {
      return {
        status: 0,
        message: "No response from server",
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

  const response = await apiInstance.request<T>({
    url,
    method,
    data: body,
    headers: {
      ...headers,
    },
    ...restOptions,
  });

  return response.data;
};

export default api;