import { setRequestLocale } from "next-intl/server";
import { Zap, PackageSearch, ChefHat, BarChart3, Clock, BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background pb-16 sm:pb-0">
      {/* App-style Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          <div>
            <h1 className="font-bold text-lg leading-none">Panel de Cocina</h1>
            <p className="text-xs opacity-70">De Aquí y De Allá</p>
          </div>
        </div>
        <div className="text-xs opacity-70 text-right">
          <p>Admin</p>
          <p className="font-mono">{new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden">
        {children}
      </div>

      {/* Mobile Bottom Navigation Bar (PWA Style) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-around sm:hidden">
        <Link href="/admin" className="flex flex-col items-center py-3 px-1 text-muted-foreground hover:text-primary focus:text-primary">
          <Clock className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Pedidos</span>
        </Link>
        <Link href="/admin/inventory" className="flex flex-col items-center py-3 px-1 text-muted-foreground hover:text-primary focus:text-primary">
          <PackageSearch className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Inventario</span>
        </Link>
        <Link href="/admin/catalog" className="flex flex-col items-center py-3 px-1 text-muted-foreground hover:text-primary focus:text-primary">
          <BookOpen className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Catálogo</span>
        </Link>
        <Link href="/admin/recipes" className="flex flex-col items-center py-3 px-1 text-muted-foreground hover:text-primary focus:text-primary">
          <ChefHat className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Recetas</span>
        </Link>
        <Link href="/admin/reports" className="flex flex-col items-center py-3 px-1 text-muted-foreground hover:text-primary focus:text-primary">
          <BarChart3 className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Reportes</span>
        </Link>
      </nav>

      {/* Desktop Sidebar / Top Nav Area (optional, keeping it simple with a sub-header for sm+) */}
      <nav className="hidden sm:flex items-center justify-center gap-6 bg-card border-b py-3 px-6 shadow-sm mb-4">
        <Link href="/admin" className="flex items-center gap-2 font-semibold text-muted-foreground hover:text-primary">
          <Clock className="w-4 h-4" /> Pedidos
        </Link>
        <Link href="/admin/inventory" className="flex items-center gap-2 font-semibold text-muted-foreground hover:text-primary">
          <PackageSearch className="w-4 h-4" /> Inventario
        </Link>
        <Link href="/admin/catalog" className="flex items-center gap-2 font-semibold text-muted-foreground hover:text-primary">
          <BookOpen className="w-4 h-4" /> Catálogo & Precios
        </Link>
        <Link href="/admin/recipes" className="flex items-center gap-2 font-semibold text-muted-foreground hover:text-primary">
          <ChefHat className="w-4 h-4" /> Escandallos (Recetas)
        </Link>
        <Link href="/admin/reports" className="flex items-center gap-2 font-semibold text-muted-foreground hover:text-primary">
          <BarChart3 className="w-4 h-4" /> Cierre & Reportes
        </Link>
      </nav>
    </div>
  );
}
