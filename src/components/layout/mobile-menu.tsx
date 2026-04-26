"use client";

import { useState, useEffect } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { 
  Menu, 
  X, 
  Home, 
  UtensilsCrossed, 
  Users, 
  Mail, 
  User, 
  Zap,
  Phone,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND_INFO } from "@/lib/brand";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useTranslations } from "next-intl";

interface MobileMenuProps {
  user: any;
  isAdmin: boolean;
}

export function MobileMenu({ user, isAdmin }: MobileMenuProps) {
  const t = useTranslations("Shell");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Lock body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const navItems = [
    { href: "/", label: t("navHome"), icon: Home },
    { href: "/menu", label: t("navMenu"), icon: UtensilsCrossed },
    ...(user
      ? [{ href: "/profile", label: t("navProfile"), icon: User }]
      : [{ href: "/login", label: t("navLogin"), icon: User }]),
    { href: "/about", label: t("navAbout"), icon: Users },
    { href: "/contact", label: t("navContact"), icon: Mail },
    ...(isAdmin ? [{ href: "/admin", label: t("navAdmin") || "Admin", icon: Zap }] : []),
  ];

  return (
    <>
      {/* Botón hamburguesa – solo en móvil (< md) */}
      <Button
        variant="outline"
        size="icon"
        className="md:hidden h-11 w-11 rounded-xl shadow-md border-border/50 bg-white dark:bg-muted/50 hover:bg-[#c8102e]/10 active:scale-95 transition-all"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6 text-[#c8102e]" />
      </Button>

      {/* Solo renderizar overlay y panel cuando está abierto */}
      {open && (
        <>
          {/* Overlay oscuro semitransparente */}
          <div
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel lateral — fondo SÓLIDO, sin transparencia */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="fixed inset-y-0 right-0 z-[101] w-[85vw] max-w-[300px] bg-[#fdfbf7] dark:bg-[#111] shadow-2xl flex flex-col"
          >
            {/* Cabecera del panel */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <span className="text-xl font-black text-[#c8102e] tracking-tight">
                {t("brand")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="rounded-full hover:bg-muted"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Navegación */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-base font-bold transition-all",
                      isActive
                        ? "bg-[#c8102e] text-white shadow-lg shadow-[#c8102e]/20"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        item.href === "/admin" && !isActive && "text-amber-500"
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer: Tema, Idioma y Contacto rápido */}
            <div className="border-t border-border/40 px-5 py-4 space-y-4">
              {/* Tema e Idioma */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  Preferencias
                </span>
                <div className="flex items-center gap-2">
                  <LocaleSwitcher />
                  <ThemeToggle />
                </div>
              </div>

              {/* Contacto rápido */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`tel:${BRAND_INFO.phone.replace(/\s/g, "")}`}
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-muted/50 hover:bg-[#ffc244] hover:text-black transition-all font-bold text-sm"
                >
                  <Phone className="h-4 w-4 text-[#c8102e]" />
                  Llamar
                </a>
                <a
                  href={BRAND_INFO.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-muted/50 hover:bg-[#25D366] hover:text-white transition-all font-bold text-sm"
                >
                  <MessageCircle className="h-4 w-4 text-[#25D366]" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
