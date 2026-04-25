import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { BRAND_INFO } from "@/lib/brand";

/**
 * @description Página "Sobre Nosotros" que presenta al Chef Hugo Salgar Camacho.
 */
export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Nota: Usamos useTranslations para contenido traducible en el futuro. 
  // Por ahora, como es una historia específica, la redactamos con sentimiento.

  return (
    <main className="container py-12 space-y-12">
      <section className="grid md:grid-cols-2 gap-12 items-center">
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-primary/20">
          <Image
            src="/images/hugo.png"
            alt="Hugo Salgar Camacho - Chef y Dueño"
            fill
            className="object-cover"
            priority
          />

        </div>
        
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary">
            Hugo Salgar Camacho
          </h1>
          <p className="text-xl font-medium text-muted-foreground italic">
            &quot;Fusionando mundos a través del sabor.&quot;
          </p>
          
          <div className="prose prose-lg dark:prose-invert">
            <p>
              Hugo Salgar Camacho es el alma y la fuerza creativa detrás de 
              <strong> De Aquí y De Allá</strong>. Con una visión única que une la 
              tradición milenaria de la cocina china con la calidez y el sazón latino, 
              Hugo ha creado un concepto gastronómico que trasciende fronteras en el 
              corazón de Granada.
            </p>
            <p>
              Su pasión por las artes marciales y la disciplina se refleja en cada plato 
              que sale de su cocina: precisión en el corte, dominio del fuego en el wok 
              y un respeto absoluto por el producto fresco.
            </p>
            <p>
              Para Hugo, cocinar no es solo alimentar, es contar una historia. La historia 
              de un viaje que empezó &quot;allá&quot; y que hoy compartimos con todos vosotros &quot;aquí&quot;. 
              Bienvenidos a su casa.
            </p>

          </div>

          <div className="pt-6 flex gap-4">
            <a 
              href={BRAND_INFO.instagram} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
            >
              Síguelo en Instagram
            </a>
            <a 
              href={BRAND_INFO.tiktok} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-black text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
            >
              TikTok
            </a>
          </div>
        </div>
      </section>

      <section className="bg-primary/5 rounded-3xl p-8 md:p-12 text-center space-y-6">
        <h2 className="text-3xl font-bold">Nuestra Filosofía</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="text-4xl">🔥</div>
            <h3 className="font-bold text-xl">Wok Auténtico</h3>
            <p className="text-muted-foreground">El &quot;Heidi&quot; del wok: el aliento del fuego en cada grano de arroz.</p>
          </div>
          <div className="space-y-2">
            <div className="text-4xl">🌿</div>
            <h3 className="font-bold text-xl">Ingredientes Local</h3>
            <p className="text-muted-foreground">Producto de Granada con técnicas de Asia Central.</p>
          </div>
          <div className="space-y-2">
            <div className="text-4xl">❤️</div>
            <h3 className="font-bold text-xl">Hecho con Pasión</h3>
            <p className="text-muted-foreground">Porciones generosas porque nos importa tu felicidad.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
