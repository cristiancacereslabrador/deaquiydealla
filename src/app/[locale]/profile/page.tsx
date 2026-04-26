import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { redirect } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { LogOut, User as UserIcon } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function ProfilePage() {
  const t = await getTranslations("Profile");
  const ta = await getTranslations("Auth");
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Usar cliente de servicio para saltar RLS y leer todos los campos del perfil
  const serviceClient = createServiceSupabaseClient();
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 border-b pb-4 mb-8">
        <UserIcon className="w-8 h-8 text-[#c8102e]" /> {t("title")}
      </h1>

      <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl shadow-sm border border-border/40 dark:border-white/10 space-y-8 relative overflow-hidden">
        {isAdmin && (
          <div className="absolute top-0 right-0 bg-[#ffc244] text-black px-4 py-1 text-xs font-bold rounded-bl-xl shadow-sm">
            ADMINISTRADOR
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-[#c8102e] uppercase tracking-[0.2em]">{ta("fullName")}</h3>
            <p className="text-xl font-semibold tracking-tight">{profile?.full_name || "-"}</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-[#c8102e] uppercase tracking-[0.2em]">{ta("email")}</h3>
            <p className="text-xl font-semibold tracking-tight break-all">{user.email}</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-[#c8102e] uppercase tracking-[0.2em]">{ta("phone")}</h3>
            <p className="text-xl font-semibold tracking-tight">{profile?.phone || "-"}</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-[#c8102e] uppercase tracking-[0.2em]">ESTADO</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-sm font-medium text-muted-foreground">Cuenta Activa</p>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-border/50">
          <LogoutButton label={t("logout")} />
        </div>
      </div>
    </div>
  );
}
