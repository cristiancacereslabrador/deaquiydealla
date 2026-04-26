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
} from "lucide-react";
import { BRAND_INFO } from "@/lib/brand";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useTranslations } from "next-intl";

interface MobileMenuProps {
  user: { id: string } | null;
  isAdmin: boolean;
}

/**
 * Menú lateral para móvil.
 * Usa createPortal para renderizar el overlay y el panel FUERA del <header>,
 * evitando que el backdrop-filter del header cree un nuevo containing block
 * que atrape los elementos position:fixed dentro de él.
 */
export function MobileMenu({ user, isAdmin }: MobileMenuProps) {
  const t = useTranslations("Shell");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Montar solo en cliente (portal necesita document)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloquear scroll cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Cerrar al navegar
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const navItems = [
    { href: "/",        label: t("navHome"),    icon: Home },
    { href: "/menu",    label: t("navMenu"),    icon: UtensilsCrossed },
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

          {/* Panel lateral con fondo BLANCO sólido */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "min(85vw, 300px)",
              maxHeight: "90vh",
              backgroundColor: "#ffffff",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-12px 12px 60px rgba(0,0,0,0.28), -4px 4px 16px rgba(0,0,0,0.12)",
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
              <span style={{ fontSize: 20, fontWeight: 900, color: "#c8102e", letterSpacing: -0.5 }}>
                {t("brand")}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 40, height: 40, borderRadius: "50%",
                  border: "none", background: "transparent",
                  cursor: "pointer", fontSize: 0,
                }}
              >
                <X style={{ width: 24, height: 24 }} />
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
                    href={item.href}
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
                      color: isActive ? "#ffffff" : "#1a1a1a",
                      backgroundColor: isActive ? "#c8102e" : "transparent",
                    }}
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

            {/* Footer: Preferencias y Contacto */}
            <div
              style={{
                borderTop: "1px solid rgba(0,0,0,0.08)",
                padding: "16px 20px 24px",
              }}
            >
              {/* Idioma y Tema */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", opacity: 0.5, color: "#1a1a1a" }}>
                  Preferencias
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <LocaleSwitcher />
                  <ThemeToggle />
                </div>
              </div>

              {/* Llamar & WhatsApp */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <a
                  href={`tel:${BRAND_INFO.phone.replace(/\s/g, "")}`}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 8, padding: 12, borderRadius: 14,
                    fontWeight: 700, fontSize: 14,
                    textDecoration: "none", color: "#1a1a1a",
                    backgroundColor: "rgba(0,0,0,0.05)",
                  }}
                >
                  <Phone style={{ width: 16, height: 16, color: "#c8102e" }} />
                  Llamar
                </a>
                <a
                  href={BRAND_INFO.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 8, padding: 12, borderRadius: 14,
                    fontWeight: 700, fontSize: 14,
                    textDecoration: "none", color: "#1a1a1a",
                    backgroundColor: "rgba(0,0,0,0.05)",
                  }}
                >
                  <MessageCircle style={{ width: 16, height: 16, color: "#25D366" }} />
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
      {/* Botón hamburguesa */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="md:hidden flex items-center justify-center h-11 w-11 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-800 hover:bg-red-50 active:scale-95 transition-all"
      >
        <Menu className="h-6 w-6 text-[#c8102e]" />
      </button>

      {/* Portal: se monta directamente en document.body */}
      {menuPortal}
    </>
  );
}
