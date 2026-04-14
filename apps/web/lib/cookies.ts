import { environmentManager } from "@tanstack/react-query";
import Cookies from "js-cookie";
// import { cookies } from "next/headers";

export const getCookie = async (name: string) => {
    if (environmentManager.isServer()) {
        // const cookieStore = await cookies()
        // return cookieStore.get(name)?.value
    } else {
        return Cookies.get(name)
    }
}


export const addCookie = async (name: string, value: string) => {
    
    if (environmentManager.isServer()) {
        // const cookieStore = await cookies()
        // cookieStore.set(name, value)
    } else {
        Cookies.set(name, value)
    }
}

export const removeCookie = (name: string) => {
    return Cookies.remove(name)
}