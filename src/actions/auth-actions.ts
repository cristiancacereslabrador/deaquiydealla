"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import { redirect } from "@/i18n/navigation";

export async function signUpAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone,
      },
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  return { ok: true };
}

import { createServiceSupabaseClient } from "@/lib/supabase/service";

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, message: "Credenciales inválidas" };
  }

  // Leer rol con cliente de servicio para evitar problemas de propagación de RLS
  const serviceClient = createServiceSupabaseClient();
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  revalidatePath("/");
  return { ok: true, role: profile?.role || "customer" };
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  return { ok: true };
}

export async function updateProfileAddressAction(address: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "No autenticado" };

  const { error } = await supabase
    .from("profiles")
    .update({ address })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
