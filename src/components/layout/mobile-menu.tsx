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
  MessageCircle,
} from "lucide-react";
import { BRAND_INFO } from "@/lib/brand";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useTranslations } from "next-intl";

interface MobileMenuProps {
  /** Usuario autenticado (null si no hay sesión) */
  user: { id: string } | null;
  /** True si el usuario es administrador */
  isAdmin: boolean;
}

/**
 * Menú lateral para dispositivos móviles (< md breakpoint).
 * Renderiza el botón hamburguesa y el panel deslizante.
 * El panel usa estilos inline para garantizar el fondo sólido
 * independientemente de cómo Tailwind purgue las clases.
 */
export function MobileMenu({ user, isAdmin }: MobileMenuProps) {
  const t = useTranslations("Shell");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Bloquear scroll del body cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Cerrar el menú cuando cambia la ruta
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Construcción dinámica de los ítems de navegación
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

  return (
    <>
      {/* ─── BOTÓN HAMBURGUESA (solo visible en móvil < md) ─── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú de navegación"
        className="md:hidden flex items-center justify-center h-11 w-11 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-800 text-[#c8102e] hover:bg-red-50 active:scale-95 transition-all"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* ─── PORTAL DEL MENÚ (solo renderizado cuando está abierto) ─── */}
      {open && (
        <>
          {/* Overlay: fondo oscuro para cubrir la página */}
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              backgroundColor: "rgba(0,0,0,0.7)",
            }}
          />

          {/* Panel lateral */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú principal"
            className="mobile-menu-panel"
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              zIndex: 201,
              width: "min(85vw, 300px)",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-8px 0 40px rgba(0,0,0,0.35)",
              overflowY: "auto",
              borderLeft: "1px solid rgba(0,0,0,0.1)",
              backgroundColor: "#ffffff",
            }}
          >
            {/* Cabecera del panel */}
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "currentColor",
                }}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navegación */}
            <nav style={{ flex: 1, padding: "12px 12px 0" }}>
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
                      color: isActive ? "#fff" : "currentColor",
                      backgroundColor: isActive ? "#c8102e" : "transparent",
                      transition: "background 0.15s",
                    }}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        !isActive && item.href === "/admin" && "text-amber-500"
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer con Preferencias y Contacto rápido */}
            <div
              style={{
                borderTop: "1px solid rgba(0,0,0,0.08)",
                padding: "16px 20px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* Tema e Idioma */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", opacity: 0.5 }}>
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
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "12px",
                    borderRadius: 14,
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: "none",
                    backgroundColor: "rgba(0,0,0,0.05)",
                    color: "currentColor",
                    transition: "background 0.15s",
                  }}
                >
                  <Phone className="h-4 w-4 text-[#c8102e]" />
                  Llamar
                </a>
                <a
                  href={BRAND_INFO.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "12px",
                    borderRadius: 14,
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: "none",
                    backgroundColor: "rgba(0,0,0,0.05)",
                    color: "currentColor",
                    transition: "background 0.15s",
                  }}
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
