import { getTranslations } from "next-intl/server";
import { CartNavLink } from "@/components/cart/cart-nav-link";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

/**
 * Cabecera global con marca, navegación principal y controles de tema / idioma.
 *
 * @returns Barra superior responsive.
 */
export async function SiteHeader() {
  const t = await getTranslations("Shell");

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-0 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 sm:contents">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <div className="relative h-10 w-28 sm:h-12 sm:w-32">
              <Image 
                src="/images/logo.png" 
                alt="De Aquí y De Allá" 
                fill 
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:order-last">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>

        <nav
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border/40 pt-3 text-sm font-medium text-muted-foreground sm:flex-1 sm:border-t-0 sm:pt-0 md:justify-center"
          aria-label="Principal"
        >
          <Link href="/" className="transition-colors hover:text-foreground">
            {t("navHome")}
          </Link>
          <Link
            href="/menu"
            className="transition-colors hover:text-foreground"
          >
            {t("navMenu")}
          </Link>
          <Link href="/info" className="transition-colors hover:text-foreground">
            Info
          </Link>
          <Link href="/about" className="transition-colors hover:text-foreground">
            Sobre Nosotros
          </Link>
          <CartNavLink />

        </nav>
      </div>
    </header>
  );
}
