// ==============================
// Axios Instance

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { getCookie, removeCookie } from "./cookies";

// ==============================
const api: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  // ==============================
  // Request Interceptor
  // ==============================
  api.interceptors.request.use(
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
  api.interceptors.response.use(
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
  const handleError = (error: AxiosError) => {
    if (error.response) {
      return {
        status: error.response.status,
        message:
          (error.response.data as any)?.message ||
          "Something went wrong",
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
  export const apiRequest = async <T = any>(
    config: AxiosRequestConfig
  ): Promise<T> => {
    try {
      const response = await api.request<T>(config);
      return response.data;
    } catch (error: any) {
      throw error;
    }
    
  };
  export default api;