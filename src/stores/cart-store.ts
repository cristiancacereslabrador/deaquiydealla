import {
  addToCartPayloadSchema,
  safeParseCartLines,
  type CartLineInput,
} from "@/lib/schemas/cart-schemas";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const STORAGE_KEY = "de-aqui-de-alla-cart";

type CartStoreState = {
  /** Líneas del carrito (precios congelados al añadir). */
  items: CartLineInput[];
  /**
   * Añade o incrementa cantidad de un plato (validado con Zod).
   *
   * @param payload - Campos del plato y cantidad opcional.
   * @returns `true` si se aplicó el cambio.
   */
  addItem: (payload: unknown) => boolean;
  /**
   * Establece la cantidad de una línea; cantidad `≤ 0` elimina la línea.
   *
   * @param dishId - Identificador del plato.
   * @param quantity - Nueva cantidad.
   */
  setQuantity: (dishId: string, quantity: number) => void;
  /**
   * Elimina una línea por `dishId`.
   *
   * @param dishId - Identificador del plato.
   */
  removeItem: (dishId: string) => void;
  /** Vacía el carrito. */
  clearCart: () => void;
  /** Total en céntimos (suma de `unitPriceCents * quantity`). */
  getTotalCents: () => number;
  /** Unidades totales (suma de cantidades). */
  getTotalCount: () => number;
};

/**
 * Store global del carrito con persistencia en `localStorage` y saneado al hidratar.
 */
export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem(payload: unknown) {
        const parsed = addToCartPayloadSchema.safeParse(payload);
        if (!parsed.success) {
          return false;
        }
        const p = parsed.data;
        set((state) => {
          const idx = state.items.findIndex((i) => i.dishId === p.dishId);
          if (idx >= 0) {
            const next = [...state.items];
            const merged = Math.min(
              99,
              next[idx].quantity + p.quantity
            );
            next[idx] = { ...next[idx], quantity: merged };
            return { items: next };
          }
          const line: CartLineInput = {
            dishId: p.dishId,
            quantity: p.quantity,
            nameEs: p.nameEs,
            nameEn: p.nameEn,
            unitPriceCents: p.unitPriceCents,
            imageUrl: p.imageUrl,
          };
          return { items: [...state.items, line] };
        });
        return true;
      },

      setQuantity(dishId, quantity) {
        if (quantity <= 0) {
          get().removeItem(dishId);
          return;
        }
        const q = Math.min(99, Math.floor(quantity));
        set((state) => ({
          items: state.items.map((i) =>
            i.dishId === dishId ? { ...i, quantity: q } : i
          ),
        }));
      },

      removeItem(dishId) {
        set((state) => ({
          items: state.items.filter((i) => i.dishId !== dishId),
        }));
      },

      clearCart() {
        set({ items: [] });
      },

      getTotalCents() {
        return get().items.reduce(
          (acc, line) => acc + line.unitPriceCents * line.quantity,
          0
        );
      },

      getTotalCount() {
        return get().items.reduce((acc, line) => acc + line.quantity, 0);
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      merge: (persisted, current) => {
        const p = persisted as Partial<CartStoreState> | undefined;
        return {
          ...current,
          items: safeParseCartLines(p?.items),
        };
      },
    }
  )
);
