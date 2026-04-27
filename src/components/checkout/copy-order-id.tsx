"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyOrderId({ orderId }: { orderId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="mt-2 group flex items-center gap-1.5 mx-auto text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          ¡Copiado!
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          Copiar número
        </>
      )}
    </button>
  );
}
