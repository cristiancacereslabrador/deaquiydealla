"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { signInAction } from "@/actions/auth-actions";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Utensils } from "lucide-react";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("Auth");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signInAction(formData);

    if (result.ok) {
      if (result.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/checkout"); // Ir al checkout tras login
      }
    } else {
      setError(result.message || "Error al iniciar sesión");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7] dark:bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl shadow-sm border border-border/40 dark:border-white/10">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#c8102e]/10">
            <Utensils className="h-6 w-6 text-[#c8102e]" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-foreground">{t("loginTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("loginSubtitle")}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-sm text-red-500 text-center font-medium">{error}</div>}
          
          <div className="space-y-4 rounded-md shadow-sm">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">{t("email")}</label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                required 
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" 
                placeholder="correo@ejemplo.com"
                onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/\s/g, '')}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">{t("password")}</label>
              <input id="password" name="password" type="password" required className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-[#ffc244] hover:bg-[#e6af3d] text-black rounded-xl h-12 text-base font-bold">
            {loading ? "..." : t("loginBtn")}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link href="/register" className="font-bold text-[#c8102e] hover:underline">
            {t("noAccount")}
          </Link>
        </div>
      </div>
    </div>
  );
}
