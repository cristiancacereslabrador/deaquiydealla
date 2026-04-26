import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ChevronRight, Clock, MapPin, Phone, Truck, Smile } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { getTranslations } from "next-intl/server";
import { BRAND_INFO } from "@/lib/brand";

/**
 * @description Landing page clonada del diseño Light Mode (Chatsito Comida China).
 */
export default async function HomePage() {
  const t = await getTranslations("Home");
  const ts = await getTranslations("Shell");
  return (
    <div className="flex flex-col bg-[#fdfbf7] dark:bg-background">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="container relative z-10 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="space-y-8 text-center lg:text-left">
              <h1 className="text-5xl md:text-[64px] leading-[1.1] font-bold text-[#2a2a2a] dark:text-white tracking-tight">
                {t("heroTitle")} <br />
                <span className="font-cursive text-[#c8102e] text-7xl md:text-[85px] font-normal block mt-1 leading-none">
                  {t("heroTitleOriental")}
                </span>
                <span className="block mt-2">{t("heroTitleGranada")}</span>
              </h1>
              
              <p className="text-lg text-[#555] dark:text-white/80 max-w-md mx-auto lg:mx-0 font-medium leading-relaxed">
                {t("heroSubtitle")}
              </p>

              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/carta-digital"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-[#c8102e] px-8 text-sm font-bold text-white transition-colors hover:bg-[#a00c24]"
                >
                  {t("ctaCarta")} <ChevronRight className="ml-2 w-4 h-4" />
                </Link>
                <Link
                  href="/menu"
                  className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-[#ffc244] px-8 text-sm font-bold text-[#b58500] transition-colors hover:bg-[#ffc244]/10"
                >
                  {t("ctaPedido")} <Truck className="ml-2 w-4 h-4" />
                </Link>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-6 text-sm font-medium text-[#777] dark:text-white/60">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border border-[#d2b48c] text-[#d2b48c]">
                    <span className="text-lg">🌿</span>
                  </div>
                  <span>{t("badgeFresh")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border border-[#d2b48c] text-[#d2b48c]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span>{t("badgeEasy")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border border-[#d2b48c] text-[#d2b48c]">
                    <span className="text-lg">❤️</span>
                  </div>
                  <span>{t("badgeLove")}</span>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative mt-8 lg:mt-0">
              <div className="relative w-full aspect-square max-w-[600px] mx-auto">
                <Image 
                  src="/images/dishes/arroz-especial.png" 
                  alt="Plato Estrella"
                  fill
                  className="object-contain drop-shadow-2xl scale-110"
                  priority
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. ELIGE TU FAVORITO (CAROUSEL) */}
      <section className="py-16 bg-white/50 dark:bg-black/20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
              <span className="text-[#ffc244]">✨</span> 
              <span className="font-cursive text-[#c8102e] text-5xl font-normal">{t("chooseTitle")}</span> 
              <span className="text-[#ffc244]">✨</span>
            </h2>
            <p className="text-[#666] dark:text-white/70 mt-2 font-medium">{t("chooseSubtitle")}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {[
              { title: "ARROCES", img: "/images/dishes/arroz-especial.png" },
              { title: "TALLARINES", img: "/images/dishes/combo-costillas.png" },
              { title: "POLLOS", img: "/images/dishes/gambas-agridulce.png" },
              { title: "ENTRANTES", img: "/images/dishes/arroz-especial.png" },
            ].map((cat, i) => (
              <div key={i} className="group bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-border/40 dark:border-white/10 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative aspect-[4/3] bg-muted/20 p-4">
                  <Image src={cat.img} alt={cat.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500 rounded-t-2xl" />
                </div>
                <div className="p-5 text-center bg-white dark:bg-[#1a1a1a] relative z-10 -mt-4 rounded-t-2xl border-t border-white dark:border-white/5">
                  <h3 className="font-bold text-[#c8102e] text-lg tracking-wide">{cat.title}</h3>
                  <Link href={`/menu?cat=${cat.title.toLowerCase()}`} className="text-[#888] dark:text-white/40 text-sm mt-1 inline-flex items-center hover:text-[#c8102e] transition-colors">
                    Ver platos <ChevronRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. RED PROMO BANNER */}
      <section className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl bg-[#c8102e] rounded-[2rem] overflow-hidden relative shadow-xl">
          {/* Subtle pattern / decorative elements could go here */}
          <div className="grid md:grid-cols-2 items-center">
            <div className="p-8 md:p-12 text-center md:text-left text-white space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold flex items-center justify-center md:justify-start gap-3">
                {t("promoTitle")} <span className="text-[#ffc244] rotate-12">✨</span>
              </h2>
              <p className="text-white/90 text-lg">
                {t("promoSubtitle")}
              </p>
              <div className="pt-4">
                <Link href="/menu" className="inline-flex h-12 items-center justify-center rounded-xl bg-[#ffc244] px-8 text-sm font-bold text-black transition-colors hover:bg-[#e6af3d]">
                  {t("ctaPedirAhora")} <Truck className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="relative h-64 md:h-full w-full hidden md:block">
              <Image 
                src="/images/dishes/gambas-agridulce.png" 
                alt="Plato delicioso" 
                fill 
                className="object-cover object-left"
              />
              {/* Gradient mask to blend image */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#c8102e] to-transparent w-1/3"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURES BANNER */}
      <section className="py-8 bg-[#fdfbf7] dark:bg-background">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-border/50 dark:divide-white/10 bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-sm border border-border/40 dark:border-white/10">
            <div className="flex items-center gap-4 p-2 md:justify-center">
              <Truck className="w-8 h-8 text-[#c8102e]" />
              <div>
                <h4 className="font-bold text-sm">{t("featureShipping")}</h4>
                <p className="text-xs text-[#666] dark:text-white/70">{t("featureShippingSub")}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-2 md:justify-center">
              <Clock className="w-8 h-8 text-[#c8102e]" />
              <div>
                <h4 className="font-bold text-sm">{t("featureFast")}</h4>
                <p className="text-xs text-[#666] dark:text-white/70">{t("featureFastSub")}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-2 md:justify-center">
              <Smile className="w-8 h-8 text-[#c8102e]" />
              <div>
                <h4 className="font-bold text-sm">{t("featureSatis")}</h4>
                <p className="text-xs text-[#666] dark:text-white/70">{t("featureSatisSub")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIALS */}
      <section className="py-16 overflow-hidden">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
              <span className="text-[#ffc244]">✨</span> 
              <span className="font-cursive text-[#c8102e] text-5xl font-normal">{t("reviewsTitle")}</span> 
              <span className="text-[#ffc244]">✨</span>
            </h2>
            <p className="text-[#666] dark:text-white/70 mt-2 font-medium">{t("reviewsSubtitle")}</p>
          </div>

          {(() => {
            const reviews = [
              {
                text: t("review1Text"),
                author: t("review1Author")
              },
              {
                text: t("review2Text"),
                author: t("review2Author")
              },
              {
                text: t("review3Text"),
                author: t("review3Author")
              },
              {
                text: t("review4Text"),
                author: t("review4Author")
              },
              {
                text: t("review5Text"),
                author: t("review5Author")
              }
            ];

            return (
              <div className="relative flex overflow-hidden group">
                {/* Primer set de reseñas */}
                <div className="flex w-max animate-marquee space-x-6 group-hover:[animation-play-state:paused] pr-6">
                  {reviews.map((t, i) => (
                    <div key={`set1-${i}`} className="w-[350px] shrink-0 bg-white dark:bg-[#1a1a1a] p-8 rounded-2xl shadow-sm border border-border/40 dark:border-white/10 text-center flex flex-col items-center justify-center gap-4">
                      <div className="flex justify-center gap-1 text-[#ffc244]">
                        {Array.from({length: 5}).map((_, j) => (
                          <svg key={j} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        ))}
                      </div>
                      <p className="text-[#555] dark:text-white/80 text-sm italic leading-relaxed line-clamp-4 flex-1">&quot;{t.text}&quot;</p>
                      <p className="font-bold text-[#333] dark:text-white text-sm mt-auto">{t.author}</p>
                    </div>
                  ))}
                </div>
                {/* Segundo set de reseñas (duplicado para scroll infinito) */}
                <div className="flex w-max animate-marquee space-x-6 group-hover:[animation-play-state:paused] pr-6" aria-hidden="true">
                  {reviews.map((t, i) => (
                    <div key={`set2-${i}`} className="w-[350px] shrink-0 bg-white dark:bg-[#1a1a1a] p-8 rounded-2xl shadow-sm border border-border/40 dark:border-white/10 text-center flex flex-col items-center justify-center gap-4">
                      <div className="flex justify-center gap-1 text-[#ffc244]">
                        {Array.from({length: 5}).map((_, j) => (
                          <svg key={j} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        ))}
                      </div>
                      <p className="text-[#555] dark:text-white/80 text-sm italic leading-relaxed line-clamp-4 flex-1">&quot;{t.text}&quot;</p>
                      <p className="font-bold text-[#333] dark:text-white text-sm mt-auto">{t.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* 6. YELLOW CTA BANNER */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 mb-10">
        <div className="container mx-auto max-w-5xl bg-[#ffc244] rounded-[2rem] px-8 py-10 shadow-lg border border-[#e6af3d]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold text-[#2a2a2a] dark:text-white max-w-lg">
                {t("lastCtaTitle1")} <br/>
                <span className="font-cursive text-[#c8102e] text-5xl">{t("lastCtaTitle2")}</span><br/>
                <span className="text-[#c8102e] text-3xl font-cursive">{t("lastCtaTitle3")}</span>
              </h2>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <Link href="/menu" className="inline-flex h-14 items-center justify-center rounded-xl bg-[#c8102e] px-10 text-base font-bold text-white transition-colors hover:bg-[#a00c24] shadow-md hover:scale-105 transform duration-200">
                {t("lastCtaPedido")} <Truck className="ml-3 w-5 h-5" />
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 text-black dark:text-white font-bold hover:opacity-80 transition-opacity">
                  <Phone className="w-4 h-4" /> {BRAND_INFO.phone}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48">
                  <DropdownMenuItem>
                    <a href="tel:+34603370663" className="w-full cursor-pointer flex items-center font-medium">
                      <Phone className="mr-2 h-4 w-4" />
                      {ts("callNormal")}
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <a href="https://wa.me/34603370663" target="_blank" rel="noopener noreferrer" className="w-full cursor-pointer flex items-center font-medium">
                      <svg className="mr-2 h-4 w-4 fill-current text-[#25D366]" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 .003 5.382.003 12.028c0 2.128.555 4.195 1.611 6.012L.037 24l6.113-1.603a11.967 11.967 0 005.881 1.543h.005c6.645 0 12.027-5.382 12.027-12.028C24.062 5.382 18.676 0 12.031 0zm0 21.944h-.003c-1.8 0-3.565-.484-5.111-1.401l-.367-.217-3.803.996.996-3.71-.238-.378a9.97 9.97 0 01-1.528-5.207c0-5.525 4.498-10.022 10.027-10.022 5.527 0 10.024 4.497 10.024 10.022 0 5.525-4.497 10.022-10.024 10.022zm5.503-7.525c-.302-.151-1.787-.881-2.064-.981-.277-.101-.479-.151-.68.151-.202.302-.782.981-.958 1.182-.176.201-.353.226-.655.075-1.554-.775-2.658-1.403-3.666-3.111-.258-.435.253-.404.832-1.564.101-.201.05-.378-.025-.529-.075-.151-.68-1.637-.932-2.242-.246-.591-.497-.512-.68-.522-.176-.008-.378-.008-.58-.008-.202 0-.529.075-.806.378-.277.302-1.058 1.032-1.058 2.518 0 1.486 1.083 2.921 1.234 3.123.151.201 2.128 3.249 5.155 4.556 2.057.886 2.827.755 3.356.63.612-.144 1.787-.73 2.039-1.435.252-.705.252-1.309.176-1.435-.075-.126-.277-.201-.58-.352z"/></svg>
                      {ts("whatsapp")}
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  );
}
