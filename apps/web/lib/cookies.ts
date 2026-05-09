import Cookies from "js-cookie"

export const getCookie = (name: string): string | undefined => {
  if (typeof window === "undefined") return undefined
  return Cookies.get(name)
}

export const addCookie = (
  name: string,
  value: string,
  options?: Cookies.CookieAttributes
) => {
  if (typeof window === "undefined") return
  Cookies.set(name, value, { path: "/", sameSite: "lax", ...options })
}

export const removeCookie = (name: string) => {
  if (typeof window === "undefined") return
  Cookies.remove(name, { path: "/" })
}
