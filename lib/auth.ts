import { cookies } from "next/headers"

export async function getUser() {
  const cookieStore = cookies() as any

  const token = cookieStore.get("access_token")?.value

  if (!token) {
    return null
  }

  try {
    return {
      id: "user_1",
      onboardingCompleted: false,
    }
  } catch {
    return null
  }
}