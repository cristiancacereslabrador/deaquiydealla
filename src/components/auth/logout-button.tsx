"use client";

import { signOutAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { LoggerService } from "@/lib/logger";

export function LogoutButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    try {
      // Limpiar los datos del último pedido del navegador al cerrar sesión para garantizar la privacidad
      localStorage.removeItem("last_order_id");
      localStorage.removeItem("last_order_cart");
      localStorage.removeItem("last_order_at");
      
      await signOutAction();
      // Refrescar y redirigir manualmente para evitar errores de estado
      router.push("/");
      router.refresh();
    } catch (error) {
      LoggerService.error("LogoutButton:handleLogout", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleLogout} 
      disabled={loading}
      variant="destructive" 
      className="flex items-center gap-2"
    >
      <LogOut className="w-4 h-4" /> {loading ? "..." : label}
    </Button>
  );
}
