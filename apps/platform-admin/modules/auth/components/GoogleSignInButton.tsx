"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import Script from "next/script"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { getGoogleOAuthMutationOptions } from "../actions"
import type { Role } from "../types"

const GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client"

type GoogleCredentialResponse = {
  credential?: string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: GoogleCredentialResponse) => void
            ux_mode?: "popup" | "redirect"
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>
          ) => void
        }
      }
    }
  }
}

const decodeJwtSegment = (token: string): { email?: string; name?: string } => {
  try {
    const segment = token.split(".")[1] ?? ""
    const padded =
      segment.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (segment.length % 4)) % 4)
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return {}
  }
}

export function GoogleSignInButton({ role = "PLATFORM_ADMIN" }: { role?: Role }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const buttonRef = React.useRef<HTMLDivElement | null>(null)
  const [scriptReady, setScriptReady] = React.useState(false)

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  const { mutate, isPending } = useMutation({
    ...getGoogleOAuthMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تسجيل الدخول")
        router.push("/dashboard")
      },
    }),
    onError: (error: Error) => {
      toast.error(error.message || "تعذّر تسجيل الدخول")
    },
  })

  React.useEffect(() => {
    if (!scriptReady || !clientId || !buttonRef.current) return
    if (typeof window === "undefined" || !window.google) return

    window.google.accounts.id.initialize({
      client_id: clientId,
      ux_mode: "popup",
      callback: (response) => {
        if (!response.credential) return
        const { email, name } = decodeJwtSegment(response.credential)
        mutate({
          idToken: response.credential,
          email,
          fullName: name,
          role,
        })
      },
    })

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      width: 320,
      shape: "rectangular",
      text: "signin_with",
      locale: "ar",
    })
  }, [scriptReady, clientId, mutate, role])

  if (!clientId) return null

  return (
    <>
      <Script
        src={GSI_SCRIPT_SRC}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
      />
      <div className="flex w-full flex-col items-center gap-2">
        <div ref={buttonRef} aria-busy={isPending} className="flex justify-center" />
      </div>
    </>
  )
}
