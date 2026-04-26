import { getTranslations } from "next-intl/server";
import { Phone, MapPin, Clock, CreditCard, Banknote, Download, ExternalLink } from "lucide-react";
import { BRAND_INFO } from "@/lib/brand";
import { cn } from "@/lib/utils";

const WhatsappIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.031 0C5.385 0 .003 5.382.003 12.028c0 2.128.555 4.195 1.611 6.012L.037 24l6.113-1.603a11.967 11.967 0 005.881 1.543h.005c6.645 0 12.027-5.382 12.027-12.028C24.062 5.382 18.676 0 12.031 0zm0 21.944h-.003c-1.8 0-3.565-.484-5.111-1.401l-.367-.217-3.803.996.996-3.71-.238-.378a9.97 9.97 0 01-1.528-5.207c0-5.525 4.498-10.022 10.027-10.022 5.527 0 10.024 4.497 10.024 10.022 0 5.525-4.497 10.022-10.024 10.022zm5.503-7.525c-.302-.151-1.787-.881-2.064-.981-.277-.101-.479-.151-.68.151-.202.302-.782.981-.958 1.182-.176.201-.353.226-.655.075-1.554-.775-2.658-1.403-3.666-3.111-.258-.435.253-.404.832-1.564.101-.201.05-.378-.025-.529-.075-.151-.68-1.637-.932-2.242-.246-.591-.497-.512-.68-.522-.176-.008-.378-.008-.58-.008-.202 0-.529.075-.806.378-.277.302-1.058 1.032-1.058 2.518 0 1.486 1.083 2.921 1.234 3.123.151.201 2.128 3.249 5.155 4.556 2.057.886 2.827.755 3.356.63.612-.144 1.787-.73 2.039-1.435.252-.705.252-1.309.176-1.435-.075-.126-.277-.201-.58-.352z"/>
  </svg>
);

/**
 * @description Página de contacto unificada con información del local y descarga de menú.
 */
export default async function ContactPage() {
  const t = await getTranslations("Contact");

  return (
    <div className="flex flex-col min-h-screen bg-[#fdfbf7] dark:bg-background pb-20">
      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold flex flex-col md:flex-row items-center justify-center gap-3">
              <span className="font-cursive text-[#c8102e] text-6xl md:text-7xl">
                {t("title").split(" ")[0]}
              </span> 
              <span>{t("title").split(" ").slice(1).join(" ")}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            
            {/* OPCIONES DE CONTACTO Y HORARIOS */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6 border-b pb-2">{t("channels")}</h2>
              
              {/* LLÁMANOS */}
              <a 
                href={`tel:${BRAND_INFO.phone.replace(/\s/g, '')}`} 
                className="flex items-center justify-center gap-4 bg-[#ffc244] hover:bg-[#e6af3d] text-black p-6 rounded-2xl shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
              >
                <Phone className="w-8 h-8" />
                <div className="text-left">
                  <span className="block text-sm font-bold uppercase tracking-wider opacity-80">{t("callUs")}</span>
                  <span className="block text-2xl md:text-3xl font-black">{BRAND_INFO.phone}</span>
                </div>
              </a>

              {/* WHATSAPP */}
              <a 
                href={BRAND_INFO.whatsapp} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-4 bg-white dark:bg-[#1a1a1a] hover:bg-muted dark:hover:bg-[#222] border border-border/50 text-foreground p-6 rounded-2xl shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
              >
                <div className="bg-[#25D366] p-2 rounded-xl text-white shadow-sm">
                  <WhatsappIcon className="w-8 h-8" />
                </div>
                <span className="text-xl md:text-2xl font-semibold">{t("writeUs")}</span>
              </a>

              {/* HORARIOS */}
              <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow-sm border border-border/40 dark:border-white/10 mt-8 space-y-4">
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-[#c8102e] shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg">{t("hours")}</h3>
                    <ul className="text-muted-foreground mt-2 space-y-1.5 text-sm">
                      <li className="flex justify-between gap-8 border-b border-border/20 pb-1.5">
                        <span>Lunes, Martes, Miércoles</span>
                        <span className="font-bold text-foreground">12:00 – 16:00</span>
                      </li>
                      <li className="flex justify-between gap-8 border-b border-border/20 pb-1.5 text-[#c8102e]">
                        <span className="font-medium">Jueves</span>
                        <span className="font-black uppercase tracking-widest">Cerrado</span>
                      </li>
                      <li className="flex justify-between gap-8">
                        <span>Viernes, Sábado, Domingo</span>
                        <span className="font-bold text-foreground">12:00 – 21:30</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* MÉTODOS DE PAGO */}
              <div className="bg-[#fef9c3]/30 dark:bg-[#fef9c3]/5 p-6 rounded-2xl border border-[#ffc244]/30 space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#c8102e]" /> Métodos de Pago en Local
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-background p-3 rounded-xl flex items-center gap-3 border shadow-sm">
                    <Banknote className="text-green-600 w-5 h-5" />
                    <span className="text-sm font-bold">Efectivo</span>
                  </div>
                  <div className="bg-white dark:bg-background p-3 rounded-xl flex items-center gap-3 border shadow-sm">
                    <CreditCard className="text-blue-600 w-5 h-5" />
                    <span className="text-sm font-bold">Tarjeta / TPV</span>
                  </div>
                </div>
              </div>
            </div>

            {/* MAPA Y DESCARGA */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6 border-b pb-2">{t("visitUs")}</h2>
              
              <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow-sm border border-border/40 dark:border-white/10 space-y-4">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-[#c8102e] shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg">De aquí y de allá comida china</h3>
                    <p className="text-muted-foreground mt-1">Calle Poeta Zorrilla 3, Local 10<br />18003 Granada</p>
                  </div>
                </div>
              </div>

              {/* MAPA */}
              <a 
                href={BRAND_INFO.googleMapsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block relative rounded-2xl overflow-hidden shadow-md border border-border/50 group cursor-pointer"
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-10 flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm text-black font-bold px-6 py-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 shadow-lg flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-[#c8102e]" /> {t("viewMap")}
                  </div>
                </div>
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3179.336494921606!2d-3.5976046241916323!3d37.16561274686411!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd71fd88da656763%3A0x6508ae8d2a252c01!2sDe%20aqu%C3%AD%20y%20de%20all%C3%A1%20comida%20china!5e0!3m2!1sen!2ses!4v1708000000000!5m2!1sen!2ses" 
                  width="100%" 
                  height="350" 
                  style={{ border: 0, pointerEvents: 'none' }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  className="w-full grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                />
              </a>

              <a 
                href={BRAND_INFO.googleMapsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-bold py-4 rounded-xl transition-colors border border-border"
              >
                <MapPin className="w-5 h-5" /> Ver en Google Maps
              </a>

              {/* DESCARGA DE MENÚ */}
              <div className="mt-8 p-8 bg-[#c8102e] text-white rounded-2xl text-center space-y-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
                <h3 className="text-2xl font-bold relative z-10">Lleva el menú contigo</h3>
                <p className="opacity-90 relative z-10 text-sm">
                  Descarga nuestra carta completa en PDF para tenerla siempre a mano.
                </p>
                <a 
                  href="https://drive.google.com/file/d/1Nj0w1mObOY0xA8EtbZgH-7rj1V5wVVFk/view?usp=sharing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-[#ffc244] hover:bg-[#ffb000] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-lg relative z-10"
                >
                  <Download className="w-5 h-5 animate-bounce" /> 
                  Descargar Menú PDF
                </a>
              </div>

            </div>

          </div>
        </div>
      </section>
    </div>
  );
}

