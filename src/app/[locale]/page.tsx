import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { BRAND_INFO } from "@/lib/brand";
import { ExternalLink, ChevronRight, MapPin, Truck } from "lucide-react";
import Image from "next/image";
import { RepeatOrderBanner } from "@/components/ui/repeat-order-banner";

/**
 * @description Portada principal optimizada con estética premium y accesos directos.
 */
export default async function HomePage() {
  return (
    <div className="flex flex-col">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background pt-20 pb-32">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238B0000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        
        <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Abierto ahora en Granada
              </div>
              
              <div className="relative mb-6">
                <div className="absolute -inset-4 bg-primary/10 blur-2xl rounded-full opacity-50 z-0"></div>
                <div className="relative z-10 bg-background/30 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-[3rem] shadow-2xl inline-block">
                  <h1 className="sr-only">De Aquí y De Allá - Sabor que une dos mundos</h1>
                  <div className="relative h-24 sm:h-32 md:h-40 w-[280px] sm:w-[350px] md:w-[450px]">
                    <Image 
                      src="/images/logo.png" 
                      alt="De Aquí y De Allá" 
                      fill 
                      className="object-contain drop-shadow-xl"
                      priority
                    />
                  </div>
                </div>
              </div>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
                Descubre la fusión perfecta de la auténtica comida china con el alma latina. 
                Porciones generosas, ingredientes frescos y el fuego del wok de Hugo Salgar.
              </p>

              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <Link
                  href="/menu"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-14 px-8 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                  )}
                >
                  Ver el Menú <ChevronRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  href="/info"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "h-14 px-8 text-lg font-bold rounded-2xl bg-background/50 backdrop-blur-sm hover:bg-muted"
                  )}
                >
                  <MapPin className="mr-2 w-5 h-5" /> ¿Cómo llegar?
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative aspect-square rounded-[3rem] bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-4 shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                <Image 
                  src="/images/hugo.png" 
                  alt="De Aquí y De Allá Concept"
                  fill
                  className="object-cover rounded-[2.5rem] transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute bottom-8 left-8 right-8 p-6 bg-background/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl z-20">
                  <p className="font-serif text-xl font-bold">&quot;Nuestra cocina no tiene fronteras, solo sabor.&quot;</p>
                  <p className="text-primary font-bold mt-1">— Hugo Salgar Camacho</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REPEAT ORDER BANNER */}
      <RepeatOrderBanner />

      {/* QUICK INFO BAR */}
      <section className="bg-card border-y py-12">
        <div className="container grid md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4 px-6">
            <div className="bg-primary/10 p-4 rounded-2xl text-primary">
              <MapPin className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold">Calle Poeta Zorrilla 3</h3>
              <p className="text-sm text-muted-foreground">Local 10, Granada</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-6">
            <div className="bg-primary/10 p-4 rounded-2xl text-primary">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold">Recogida en Local</h3>
              <p className="text-sm text-muted-foreground">Pago en Efectivo / TPV</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-6">
            <a 
              href={BRAND_INFO.glovo}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 py-4 bg-[#ffc244] text-black font-bold rounded-2xl hover:bg-[#e6af3d] transition-all shadow-lg group"
            >
              Pedir por Glovo <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* DISH HIGHLIGHTS */}
      <section className="py-24 space-y-16">
        <div className="container text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-serif font-bold italic">Favoritos de la Casa</h2>
          <p className="text-muted-foreground text-lg">Prueba nuestras especialidades más pedidas</p>
        </div>
        
        <div className="container grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="group space-y-4">
             <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-border/50">
               <Image src="/images/dishes/arroz-especial.png" alt="Arroz Especial" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
             </div>
             <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold">Arroz Especial (1kg)</h3>
                <span className="text-primary font-bold">12,50€</span>
             </div>
             <p className="text-sm text-muted-foreground">Cerdo, pollo y jamón york al estilo auténtico.</p>
          </div>
          <div className="group space-y-4">
             <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-border/50">
               <Image src="/images/dishes/combo-costillas.png" alt="Combo Costillas" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
             </div>
             <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold">Combo Costillas</h3>
                <span className="text-primary font-bold">10,99€</span>
             </div>
             <p className="text-sm text-muted-foreground">Arroz frito, rollito y nuestras costillas glaseadas.</p>
          </div>
          <div className="group space-y-4">
             <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-border/50">
               <Image src="/images/dishes/gambas-agridulce.png" alt="Gambas Agridulces" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
             </div>
             <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold">Gambas Agridulces</h3>
                <span className="text-primary font-bold">13,50€</span>
             </div>
             <p className="text-sm text-muted-foreground">Crujientes, doradas y con el toque secreto de Hugo.</p>
          </div>

        </div>
      </section>
    </div>
  );
}
