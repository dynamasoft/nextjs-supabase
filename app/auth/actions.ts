"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function signup(formData: FormData) {
  debugger;
  const supabase = await createClient()

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  // Sign up without email verification
  const { data: signUpData, error } = await supabase.auth.signUp({
    ...data,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      // Set data.email_confirm to true to bypass email verification
      data: {
        email_confirm: true,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // If email confirmation is not required or the user is already confirmed
  if (
    signUpData?.user &&
    (!signUpData.user.identities || signUpData.user.identities.length === 0 || signUpData.user.confirmed_at)
  ) {
    // Sign in the user immediately
    const { error: signInError } = await supabase.auth.signInWithPassword(data)

    if (signInError) {
      return { error: signInError.message }
    }

    revalidatePath("/", "layout")
    redirect("/dashboard")
  }

  return { success: "Check your email for the confirmation link" }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/")
}
