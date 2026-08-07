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
  select_by?: string
}

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    ux_mode?: "popup" | "redirect"
    auto_select?: boolean
  }) => void
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon"
      theme?: "outline" | "filled_blue" | "filled_black"
      size?: "small" | "medium" | "large"
      width?: number | string
      shape?: "rectangular" | "pill"
      text?: "signin_with" | "signup_with" | "continue_with" | "signin"
      locale?: string
    }
  ) => void
  prompt: () => void
  cancel: () => void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId
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

export default function GoogleSignInButton({
  role = "OWNER",
}: {
  role?: Role
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const buttonRef = React.useRef<HTMLDivElement | null>(null)
  const [scriptReady, setScriptReady] = React.useState(false)

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  const { mutate, isPending } = useMutation({
    ...getGoogleOAuthMutationOptions({
      queryClient,
      onSuccess: (response, isHub) => {
        toast.success("تم تسجيل الدخول")
        // Non-owners may create a store and become OWNER via onboarding.
        // Slug is written to localStorage inside persistAuthResponse.
        if (!response.roles?.includes("OWNER") || isHub) {
          router.push("/onboarding/create-store")
          return
        }
        router.push("/")
      },
    }),
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
          tenantSlug: undefined,
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

  if (!clientId) {
    // Quietly hide the button when no client ID is configured. Document
    // NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment to enable.
    return null
  }

  return (
    <>
      <Script
        src={GSI_SCRIPT_SRC}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
      />
      <div className="flex w-full flex-col items-center gap-2">
        <div
          ref={buttonRef}
          aria-busy={isPending}
          className="flex justify-center"
        />
      </div>
    </>
  )
}
