import Cookies from "js-cookie";
// import { cookies } from "next/headers";

export const getCookie = (name: string) => {
    if (typeof window === "undefined") {
        // const cookieStore = await cookies()
        // return cookieStore.get(name)?.value
        return undefined
    } else {
        return Cookies.get(name)
    }
}


export const addCookie = (name: string, value: string) => {
    
    if (typeof window === "undefined") {
        // const cookieStore = await cookies()
        // cookieStore.set(name, value)
        return
    } else {
        Cookies.set(name, value)
    }
}

export const removeCookie = (name: string) => {
    return Cookies.remove(name)
}