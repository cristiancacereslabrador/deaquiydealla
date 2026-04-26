"use client";

import { useState } from "react";
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

import { useTranslations } from "next-intl";

interface MobileMenuProps {
  user: any;
  isAdmin: boolean;
}

export function MobileMenu({ user, isAdmin }: MobileMenuProps) {
  const t = useTranslations("Shell");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/about", label: t("navAbout"), icon: Users },
    { href: "/contact", label: t("navContact"), icon: Mail },
  ];

  if (isAdmin) {
    navItems.push({ href: "/admin", label: t("navAdmin") || "Admin", icon: Zap });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Side Menu */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-[101] w-full max-w-xs bg-background p-6 shadow-xl transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between mb-8">
          <span className="text-lg font-bold text-[#c8102e]">{t("brand")}</span>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        <nav className="space-y-1">
          {/* Main items (even if they are visible in header, it's good to have them here too for redundancy) */}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-colors",
              pathname === "/" ? "bg-[#c8102e]/10 text-[#c8102e]" : "hover:bg-muted"
            )}
          >
            <Home className="h-5 w-5" /> {t("navHome")}
          </Link>
          <Link
            href="/menu"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-colors",
              pathname.includes("/menu") ? "bg-[#c8102e]/10 text-[#c8102e]" : "hover:bg-muted"
            )}
          >
            <UtensilsCrossed className="h-5 w-5" /> {t("navMenu")}
          </Link>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-colors",
              pathname.includes("/profile") ? "bg-[#c8102e]/10 text-[#c8102e]" : "hover:bg-muted"
            )}
          >
            <User className="h-5 w-5" /> {t("navProfile")}
          </Link>

          <div className="h-px bg-border/50 my-4" />

          {/* Secondary items (the ones that go into the hamburger) */}
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-colors",
                pathname.includes(item.href) ? "bg-[#c8102e]/10 text-[#c8102e]" : "hover:bg-muted"
              )}
            >
              <item.icon className={cn("h-5 w-5", item.href === "/admin" && "text-amber-500")} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Contact info in menu */}
        <div className="mt-auto pt-8 space-y-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3">Contacto Directo</p>
          <div className="grid grid-cols-2 gap-2">
            <a 
              href={`tel:${BRAND_INFO.phone.replace(/\s/g, '')}`}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/50 text-center hover:bg-muted transition-colors"
            >
              <Phone className="h-5 w-5 text-[#c8102e]" />
              <span className="text-xs font-bold">Llamar</span>
            </a>
            <a 
              href={BRAND_INFO.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/50 text-center hover:bg-muted transition-colors"
            >
              <MessageCircle className="h-5 w-5 text-[#25D366]" />
              <span className="text-xs font-bold">WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
