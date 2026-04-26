import { getTranslations } from "next-intl/server";
import { CartNavLink } from "@/components/cart/cart-nav-link";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { MobileMenu } from "./mobile-menu";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Phone, User, Home, UtensilsCrossed, Zap } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { BRAND_INFO } from "@/lib/brand";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { cn } from "@/lib/utils";

/**
 * Cabecera global con marca, navegación principal y controles de tema / idioma.
 * Optimizada para dispositivos móviles con menú hamburguesa inteligente.
 */
export async function SiteHeader() {
  const t = await getTranslations("Shell");
  
  let user = null;
  let isAdmin = false;
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
    if (user) {
      const serviceClient = createServiceSupabaseClient();
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      isAdmin = profile?.role === "admin";
    }
  } catch (e) {
    // Ignore errors on client init during build
  }

  // Clases comunes para los enlaces del header
  const navLinkClass = "transition-colors hover:text-[#c8102e] flex items-center gap-1.5";
  const activeLinkClass = "text-[#c8102e] decoration-2 underline-offset-4 underline";

  return (
    <header className="sticky top-0 z-50 border-b border-border/20 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        
        {/* LOGO (LEFT) */}
        <Link href="/" className="hover:opacity-90 transition-opacity shrink-0">
          <div className="relative h-10 w-28 sm:h-12 sm:w-40 lg:h-14 lg:w-44">
            <Image 
              src="/images/logo.png" 
              alt="De Aquí y De Allá" 
              fill 
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* NAVIGATION (CENTER) */}
        <nav className="flex flex-1 items-center justify-center gap-1.5 sm:gap-4 md:gap-5 lg:gap-6 text-[11px] sm:text-xs md:text-sm lg:text-[15px] font-bold text-foreground/80 overflow-hidden px-2">
          {/* ALWAYS VISIBLE: Inicio, Carta */}
          <Link href="/" className={cn(navLinkClass, "text-[#c8102e]")}>
            <Home className="size-4 hidden xs:block" />
            <span>{t("navHome")}</span>
          </Link>
          <Link href="/menu" className={navLinkClass}>
            <UtensilsCrossed className="size-4 hidden xs:block" />
            <span>{t("navMenu")}</span>
          </Link>
          
          {/* VISIBLE ON TABLETS AND DESKTOP (MD+) */}
          <Link href="/about" className={cn(navLinkClass, "hidden md:flex")}>
            {t("navAbout")}
          </Link>
          <Link href="/contact" className={cn(navLinkClass, "hidden md:flex")}>
            {t("navContact")}
          </Link>

          {/* ALWAYS VISIBLE: Mi Cuenta */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-4 md:gap-5 lg:gap-6 border-l pl-2 sm:pl-4 border-border/40">
              <Link href="/profile" className={cn(navLinkClass, "text-[#c8102e]")}>
                <User className="size-4 hidden xs:block" />
                <span>{t("navProfile")}</span>
              </Link>
              {isAdmin && (
                <Link href="/admin" className={cn(navLinkClass, "text-[#c8102e] animate-pulse hidden md:flex")}>
                  <Zap className="w-4 h-4" /> {t("navAdmin") || "Admin"}
                </Link>
              )}
            </div>
          ) : (
            <Link href="/login" className={cn(navLinkClass, "text-[#c8102e] border-l pl-2 sm:pl-4 border-border/40")}>
              <User className="size-4 hidden xs:block" />
              <span>{t("navLogin")}</span>
            </Link>
          )}
        </nav>

        {/* ACTIONS (RIGHT) */}
        <div className="flex items-center gap-3 sm:gap-5 ml-2">
          <CartNavLink />
          
          <div className="hidden sm:flex items-center gap-1 border-l pl-2 border-border/40">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>

          {/* HAMBURGER MENU: Only visible below MD breakpoint */}
          <div className="md:hidden">
            <MobileMenu user={user} isAdmin={isAdmin} />
          </div>

          {/* CONTACT DROPDOWN: Only on MD and up */}
          <div className="hidden md:block shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 bg-[#c8102e] text-white px-3 lg:px-4 py-2 rounded-xl font-bold hover:bg-[#a00c24] transition-colors text-xs lg:text-sm">
                <Phone className="w-3.5 h-3.5 lg:w-4 h-4" />
                <div className="flex flex-col items-start leading-none text-left">
                  <span className="text-[8px] lg:text-[9px] uppercase opacity-90">{t("contactTrigger")}</span>
                  <span>{BRAND_INFO.phone}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <a href={`tel:${BRAND_INFO.phone.replace(/\s/g, '')}`} className="w-full cursor-pointer flex items-center font-medium">
                    <Phone className="mr-2 h-4 w-4" />
                    {t("callNormal")}
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={BRAND_INFO.whatsapp} target="_blank" rel="noopener noreferrer" className="w-full cursor-pointer flex items-center font-medium">
                    <svg className="mr-2 h-4 w-4 fill-current text-[#25D366]" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 .003 5.382.003 12.028c0 2.128.555 4.195 1.611 6.012L.037 24l6.113-1.603a11.967 11.967 0 005.881 1.543h.005c6.645 0 12.027-5.382 12.027-12.028C24.062 5.382 18.676 0 12.031 0zm0 21.944h-.003c-1.8 0-3.565-.484-5.111-1.401l-.367-.217-3.803.996.996-3.71-.238-.378a9.97 9.97 0 01-1.528-5.207c0-5.525 4.498-10.022 10.027-10.022 5.527 0 10.024 4.497 10.024 10.022 0 5.525-4.497 10.022-10.024 10.022zm5.503-7.525c-.302-.151-1.787-.881-2.064-.981-.277-.101-.479-.151-.68.151-.202.302-.782.981-.958 1.182-.176.201-.353.226-.655.075-1.554-.775-2.658-1.403-3.666-3.111-.258-.435.253-.404.832-1.564.101-.201.05-.378-.025-.529-.075-.151-.68-1.637-.932-2.242-.246-.591-.497-.512-.68-.522-.176-.008-.378-.008-.58-.008-.202 0-.529.075-.806.378-.277.302-1.058 1.032-1.058 2.518 0 1.486 1.083 2.921 1.234 3.123.151.201 2.128 3.249 5.155 4.556 2.057.886 2.827.755 3.356.63.612-.144 1.787-.73 2.039-1.435.252-.705.252-1.309.176-1.435-.075-.126-.277-.201-.58-.352z"/></svg>
                    {t("whatsapp")}
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

      </div>
    </header>
  );
}


