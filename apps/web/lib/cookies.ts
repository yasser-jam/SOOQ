import Cookies from "js-cookie"

import { cookies } from "@/config/cookies"
import { environmentManager } from "@tanstack/react-query"

export function getCookie(name: string) {
  if (environmentManager.isServer()) {
    // Server side
    return (async () => {
      const { cookies } = await import("next/headers")
      const cookieStore = await cookies()
      return cookieStore.get(name)?.value
    })()
  }

  // Client side
  return Cookies.get(name)
}

export function setCookie(name: string, value: string) {
  Cookies.set(name, value, cookies.options)
}

export function removeCookie(name: string) {
  Cookies.remove(name)
}
