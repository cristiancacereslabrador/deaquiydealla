import { setRequestLocale } from "next-intl/server";
import { BRAND_INFO } from "@/lib/brand";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  MapPin, 
  Phone, 
  CreditCard, 
  Banknote, 
  Clock, 
  Download,
  ExternalLink
} from "lucide-react";

/**
 * @description Página de Información, Ubicación y contacto.
 */
export default async function InfoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="container mx-auto max-w-5xl px-4 py-12 space-y-16">
      <section className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold text-primary">¿Cómo llegar?</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Te esperamos en el corazón de Granada con el mejor arroz chino-latino de la ciudad.
        </p>
      </section>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Columna Izquierda: Detalles */}
        <div className="space-y-8">
          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Dirección</h3>
                <p className="text-muted-foreground">{BRAND_INFO.address}</p>
                <a 
                  href={BRAND_INFO.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 text-primary font-bold hover:underline"
                >
                  Abrir en Google Maps <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Horarios</h3>
                <ul className="text-muted-foreground space-y-1">
                  <li>Lunes a Miércoles: {BRAND_INFO.schedule.mon_wed}</li>
                  <li>Jueves: <span className="text-destructive font-bold">{BRAND_INFO.schedule.thu}</span></li>
                  <li>Viernes a Domingo: {BRAND_INFO.schedule.fri_sun}</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Contacto</h3>
                <p className="text-muted-foreground">Teléfono: {BRAND_INFO.phone}</p>
                <div className="flex gap-4 mt-2">
                  <a href={BRAND_INFO.whatsapp} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "sm" })}>
                    WhatsApp Directo
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-secondary/30 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <CreditCard className="w-6 h-6" /> Métodos de Pago
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background p-4 rounded-xl flex items-center gap-3 border shadow-sm">
                <Banknote className="text-green-600" />
                <span className="font-medium">Efectivo</span>
              </div>
              <div className="bg-background p-4 rounded-xl flex items-center gap-3 border shadow-sm">
                <CreditCard className="text-blue-600" />
                <span className="font-medium">Tarjeta / TPV</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground italic">
              Aceptamos pagos en local tanto en efectivo como con tarjeta de crédito/débito.
            </p>
          </div>
        </div>

        {/* Columna Derecha: Mapa y Descarga */}
        <div className="space-y-8">
          <div className="aspect-square bg-muted rounded-2xl overflow-hidden border-4 border-card shadow-lg relative">
             {/* Simulación de mapa con imagen estática o iframe si se prefiere */}
             <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3179.023253303649!2d-3.6066!3d37.1773!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDEwJzM4LjMiTiAzwrAzNicxMi40Ilc!5e0!3m2!1ses!2ses!4v1714000000000!5m2!1ses!2ses" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale contrast-125"
             ></iframe>
          </div>

          <div className="p-8 bg-primary text-primary-foreground rounded-2xl text-center space-y-6 shadow-xl">
            <h3 className="text-2xl font-bold">Lleva el menú contigo</h3>
            <p className="opacity-90">
              Descarga nuestra carta completa en PDF de alta definición para tenerla siempre a mano.
            </p>
            <a 
              href="https://drive.google.com/file/d/1Nj0w1mObOY0xA8EtbZgH-7rj1V5wVVFk/view?usp=sharing" 
              target="_blank" 
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full font-bold group flex items-center justify-center gap-2")}
            >
              <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" /> Descargar Menú PDF
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
