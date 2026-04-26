import { BRAND_INFO } from "@/lib/brand";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TiktokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const WhatsappIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.031 0C5.385 0 .003 5.382.003 12.028c0 2.128.555 4.195 1.611 6.012L.037 24l6.113-1.603a11.967 11.967 0 005.881 1.543h.005c6.645 0 12.027-5.382 12.027-12.028C24.062 5.382 18.676 0 12.031 0zm0 21.944h-.003c-1.8 0-3.565-.484-5.111-1.401l-.367-.217-3.803.996.996-3.71-.238-.378a9.97 9.97 0 01-1.528-5.207c0-5.525 4.498-10.022 10.027-10.022 5.527 0 10.024 4.497 10.024 10.022 0 5.525-4.497 10.022-10.024 10.022zm5.503-7.525c-.302-.151-1.787-.881-2.064-.981-.277-.101-.479-.151-.68.151-.202.302-.782.981-.958 1.182-.176.201-.353.226-.655.075-1.554-.775-2.658-1.403-3.666-3.111-.258-.435.253-.404.832-1.564.101-.201.05-.378-.025-.529-.075-.151-.68-1.637-.932-2.242-.246-.591-.497-.512-.68-.522-.176-.008-.378-.008-.58-.008-.202 0-.529.075-.806.378-.277.302-1.058 1.032-1.058 2.518 0 1.486 1.083 2.921 1.234 3.123.151.201 2.128 3.249 5.155 4.556 2.057.886 2.827.755 3.356.63.612-.144 1.787-.73 2.039-1.435.252-.705.252-1.309.176-1.435-.075-.126-.277-.201-.58-.352z"/>
  </svg>
);

/**
 * @description Pie de página enriquecido con redes sociales y enlaces externos.
 */
export async function SiteFooter() {
  const t = await getTranslations("Shell");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          
          {/* Columna 1: Marca y Concepto */}
          <div className="space-y-4">
            <div className="relative h-16 w-40 mx-auto md:mx-0">
              <Image 
                src="/images/logo.png" 
                alt={BRAND_INFO.name}
                fill 
                className="object-contain"
              />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("footerTagline")}
            </p>
          </div>

          {/* Columna 2: Redes Sociales */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">{t("footerFollow")}</h3>
            <div className="flex justify-center md:justify-start gap-4">
              <a 
                href={BRAND_INFO.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-card rounded-full hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>

              <a 
                href={BRAND_INFO.tiktok} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-card rounded-full hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
                aria-label="TikTok"
              >
                <TiktokIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Columna 3: Delivery Externo */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">{t("footerDeliveryTitle")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("footerDeliverySub")}
            </p>
            <a 
              href={BRAND_INFO.glovo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2 bg-[#ffc244] text-black font-bold rounded-lg hover:bg-[#e6af3d] transition-colors shadow-md"
            >
              {t("footerGlovo")} <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <p>© {year} {BRAND_INFO.name}. {t("footerRights")}</p>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
             <p>{t("footerClosed")}</p>
             <a 
               href={`https://wa.me/${BRAND_INFO.phone.replace(/[^0-9]/g, '')}`} 
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center gap-2 hover:opacity-80 transition-opacity font-medium bg-muted/50 rounded-full pr-4 p-1"
             >
               <div className="bg-[#25D366] p-1.5 rounded-full text-white shadow-sm flex items-center justify-center">
                 <WhatsappIcon className="w-4 h-4" />
               </div>
               {t("footerWhatsapp")}
             </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
