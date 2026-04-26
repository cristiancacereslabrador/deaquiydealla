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

  // Lock body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

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
        variant="outline"
        size="icon"
        className="md:hidden h-11 w-11 rounded-xl shadow-md border-border/50 bg-white dark:bg-muted/50 hover:bg-[#c8102e]/10 active:scale-95 transition-all"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6 text-[#c8102e]" />
      </Button>

      {/* Overlay: Higher opacity and blur */}
      {open && (
        <div 
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Side Menu: Solid background, better shadow */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-[101] w-full max-w-[280px] bg-white dark:bg-[#0a0a0a] p-6 shadow-2xl border-l border-border/10 transition-all duration-300 ease-in-out md:hidden flex flex-col",
          open ? "translate-x-0 opacity-100 visible" : "translate-x-full opacity-0 invisible pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between mb-8">
          <span className="text-xl font-black text-[#c8102e] tracking-tight">{t("brand")}</span>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-full hover:bg-muted">
            <X className="h-6 w-6" />
          </Button>
        </div>

        <nav className="space-y-2">
          {/* Main items (even if they are visible in header, it's good to have them here too for redundancy) */}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-4 px-4 py-4 rounded-2xl text-base font-bold transition-all",
              pathname === "/" ? "bg-[#c8102e] text-white shadow-lg shadow-[#c8102e]/20" : "hover:bg-muted"
            )}
          >
            <Home className="h-5 w-5" /> {t("navHome")}
          </Link>
          <Link
            href="/menu"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-4 px-4 py-4 rounded-2xl text-base font-bold transition-all",
              pathname.includes("/menu") ? "bg-[#c8102e] text-white shadow-lg shadow-[#c8102e]/20" : "hover:bg-muted"
            )}
          >
            <UtensilsCrossed className="h-5 w-5" /> {t("navMenu")}
          </Link>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-4 px-4 py-4 rounded-2xl text-base font-bold transition-all",
              pathname.includes("/profile") ? "bg-[#c8102e] text-white shadow-lg shadow-[#c8102e]/20" : "hover:bg-muted"
            )}
          >
            <User className="h-5 w-5" /> {t("navProfile")}
          </Link>

          <div className="h-px bg-border/50 my-4 mx-2" />

          {/* Secondary items (the ones that go into the hamburger) */}
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-4 px-4 py-4 rounded-2xl text-base font-bold transition-all",
                pathname.includes(item.href) ? "bg-[#c8102e] text-white shadow-lg shadow-[#c8102e]/20" : "hover:bg-muted"
              )}
            >
              <item.icon className={cn("h-5 w-5", item.href === "/admin" && !pathname.includes("/admin") && "text-amber-500")} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Contact info in menu */}
        <div className="mt-auto pt-8 border-t border-border/50 space-y-4">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">Atención al Cliente</p>
          <div className="grid grid-cols-2 gap-3">
            <a 
              href={`tel:${BRAND_INFO.phone.replace(/\s/g, '')}`}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-muted/30 text-center hover:bg-[#ffc244] hover:text-black transition-all"
            >
              <Phone className="h-6 w-6 text-[#c8102e]" />
              <span className="text-xs font-black">Llamar</span>
            </a>
            <a 
              href={BRAND_INFO.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-muted/30 text-center hover:bg-[#25D366] hover:text-white transition-all"
            >
              <MessageCircle className="h-6 w-6 text-[#25D366]" />
              <span className="text-xs font-black">WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
