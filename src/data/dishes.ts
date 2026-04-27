/**
 * @description Categorías de menú para filtros en el catálogo.
 */
export type DishCategory = "entrantes" | "combos" | "arroces" | "vegetales" | "tallarines" | "otros" | "bebidas";

/**
 * @description Alérgenos comunes según normativa UE 1169/2011.
 */
export type Allergen = 
  | "gluten" 
  | "crustaceos" 
  | "huevos" 
  | "pescado" 
  | "cacahuetes" 
  | "soja" 
  | "lacteos" 
  | "frutos_cascara" 
  | "apio" 
  | "mostaza" 
  | "sesamo" 
  | "sulfitos" 
  | "altramuces" 
  | "moluscos";

/**
 * @description Plato del catálogo.
 */
export type Dish = {
  id: string;
  category: string; // Changed from DishCategory to string for dynamic support
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  priceCents: number;
  imageUrl: string;
  allergens: Allergen[];
};

/**
 * @description Catálogo real de "De Aquí y De Allá".
 * Ahora se gestiona dinámicamente desde el panel de administración (Supabase).
 * Esta lista se deja vacía para eliminar los productos de muestra.
 */
export const DISHES: readonly Dish[] = [];

