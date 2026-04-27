"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  MessageCircle,
  ShoppingCart,
} from "lucide-react";
import { BRAND_INFO } from "@/lib/brand";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

interface MobileMenuProps {
  user: { id: string } | null;
  isAdmin: boolean;
}

/**
 * Menú lateral para móvil.
 * Usa createPortal para renderizar el overlay y el panel FUERA del <header>.
 */
export function MobileMenu({ user, isAdmin }: MobileMenuProps) {
  const t = useTranslations("Shell");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isTableMode = searchParams.get("modo") === "mesa";

  // Montar solo en cliente (portal necesita document)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloquear scroll cuando el menú está abierto
  useEffect(() => {
    if (mounted) {
      document.body.style.overflow = open ? "hidden" : "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open, mounted]);

  // Cerrar al navegar
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const navItems = [
    { href: "/",        label: t("navHome"),    icon: Home },
    { href: "/menu",    label: t("navMenu"),    icon: UtensilsCrossed },
    ...(!isTableMode ? [{ href: "/cart", label: t("navCart"), icon: ShoppingCart }] : []),
    ...(user
      ? [{ href: "/profile", label: t("navProfile"), icon: User }]
      : [{ href: "/login",   label: t("navLogin"),   icon: User }]
    ),
    { href: "/about",   label: t("navAbout"),   icon: Users },
    { href: "/contact", label: t("navContact"), icon: Mail },
    ...(isAdmin
      ? [{ href: "/admin", label: t("navAdmin") ?? "Admin", icon: Zap }]
      : []
    ),
  ];

  // Panel y overlay que se renderizan fuera del header mediante Portal
  const menuPortal = mounted && open
    ? createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
          {/* Overlay oscuro */}
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.65)",
            }}
          />

          {/* Panel lateral con fondo sólido */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="bg-background dark:bg-card"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "min(85vw, 300px)",
              maxHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-12px 12px 60px rgba(0,0,0,0.28)",
              overflowY: "auto",
              borderRadius: "0 0 0 24px",
            }}
          >
            {/* Cabecera */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <span className="font-heading font-black text-[#c8102e] text-xl">
                {t("brand")}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navegación */}
            <nav style={{ flex: 1, padding: "12px" }}>
              {navItems.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href + (isTableMode ? "?modo=mesa" : "")}
                    onClick={() => setOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 16px",
                      borderRadius: 16,
                      marginBottom: 4,
                      fontWeight: 700,
                      fontSize: 16,
                      textDecoration: "none",
                    }}
                    className={cn(
                      isActive 
                        ? "bg-[#c8102e] text-white" 
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon
                      style={{ width: 20, height: 20, flexShrink: 0 }}
                      className={cn(!isActive && item.href === "/admin" && "text-amber-500")}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div
              style={{
                borderTop: "1px solid rgba(0,0,0,0.08)",
                padding: "16px 20px 24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
                  Preferencias
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <LocaleSwitcher />
                  <ThemeToggle />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <a
                  href={`tel:${BRAND_INFO.phone.replace(/\s/g, "")}`}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-sm bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#c8102e]" />
                  Llamar
                </a>
                <a
                  href={BRAND_INFO.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-sm bg-muted hover:bg-muted/80 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="md:hidden flex items-center justify-center h-11 w-11 rounded-xl border border-border shadow-md bg-card hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-95 transition-all"
      >
        <Menu className="h-6 w-6 text-[#c8102e]" />
      </button>
      {menuPortal}
    </>
  );
}
