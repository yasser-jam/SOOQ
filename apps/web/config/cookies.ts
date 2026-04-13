export const cookies = {
    accessToken: "sooq.access-token",
    options: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    } as const,
  }
  