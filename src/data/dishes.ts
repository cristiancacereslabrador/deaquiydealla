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
  category: DishCategory;
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
 * Nombres y descripciones sincronizados exactamente con la plataforma Glovo.
 */
export const DISHES: readonly Dish[] = [
  // ENTRANTES
  {
    id: "rollito-primavera",
    category: "entrantes",
    nameEs: "Rollitos Primavera (2 Uds.)",
    nameEn: "Spring rolls (2 pieces)",
    descriptionEs: "Dos unidades de crujientes rollitos rellenos de verduras.",
    descriptionEn: "Crispy vegetable rolls with sweet and sour sauce.",
    priceCents: 350,
    imageUrl: "/images/dishes/rollito.png",
    allergens: ["gluten", "soja"],
  },
  {
    id: "papas-fritas",
    category: "entrantes",
    nameEs: "Papas Fritas",
    nameEn: "French fries",
    descriptionEs: "Ración de patatas fritas clásicas.",
    descriptionEn: "Portion of crispy french fries.",
    priceCents: 250,
    imageUrl: "/images/dishes/papas.png",
    allergens: [],
  },

  // COMBOS PERSONALES
  {
    id: "combo-costillas",
    category: "combos",
    nameEs: "Combo Personal Costillas",
    nameEn: "Ribs Combo",
    descriptionEs: "Porción de arroz chino especial, porción de costillas asadas y un (1) rollito primavera.",
    descriptionEn: "Special fried rice, roasted ribs and one (1) spring roll.",
    priceCents: 1099,
    imageUrl: "/images/dishes/combo-costillas.png",
    allergens: ["gluten", "soja", "huevos"],
  },
  {
    id: "combo-pechuga",
    category: "combos",
    nameEs: "Combo Personal Pechuga",
    nameEn: "Chicken Breast Combo",
    descriptionEs: "Porción de arroz chino especial, pechuga de pollo frita y un (1) rollito primavera.",
    descriptionEn: "Special fried rice, fried chicken breast and one (1) spring roll.",
    priceCents: 1099,
    imageUrl: "/images/dishes/combo-pechuga.jpg",
    allergens: ["gluten", "soja", "huevos"],
  },
  {
    id: "combo-pescado",
    category: "combos",
    nameEs: "Combo Personal Pescado",
    nameEn: "Fish Combo",
    descriptionEs: "Porción de arroz chino especial, filete de pescado frito y un (1) rollito primavera.",
    descriptionEn: "Special fried rice, fried fish fillet and one (1) spring roll.",
    priceCents: 1199,
    imageUrl: "/images/dishes/combo-pescado.jpg",
    allergens: ["gluten", "soja", "huevos", "pescado"],
  },

  // ARROCES (1 KILO / COMPARTIR)
  {
    id: "arroz-especial",
    category: "arroces",
    nameEs: "Arroz Chino Especial",
    nameEn: "Special Chinese Rice",
    descriptionEs: "1 kilo de Arroz salteado con cerdo, pollo, jamón york, brotes y cebollin.",
    descriptionEn: "1 kg of stir-fried rice with pork, chicken, ham, sprouts and chives.",
    priceCents: 1250,
    imageUrl: "/images/dishes/arroz-especial.png",
    allergens: ["soja", "huevos", "gluten"],
  },
  {
    id: "arroz-veggie",
    category: "arroces",
    nameEs: "Arroz Veggie",
    nameEn: "Veggie Rice",
    descriptionEs: "1 kilo de arroz salteado con pimientos, cebolla, brotes de soja y cebollín.",
    descriptionEn: "1 kg of stir-fried rice with peppers, onions, bean sprouts and chives.",
    priceCents: 1150,
    imageUrl: "/images/dishes/arroz-veggie.jpg",
    allergens: ["soja", "gluten"],
  },
  {
    id: "arroz-especial-gambas",
    category: "arroces",
    nameEs: "Especial con Gambas",
    nameEn: "Special with Prawns",
    descriptionEs: "Arroz frito premium con gambas y carnes.",
    descriptionEn: "Premium fried rice with prawns and meats.",
    priceCents: 1499,
    imageUrl: "/images/dishes/arroz-gambas.jpg",
    allergens: ["soja", "huevos", "gluten", "crustaceos"],
  },

  // VEGETALES AL WOK
  {
    id: "chop-suey-compartir",
    category: "vegetales",
    nameEs: "Chop Suey Especial (Compartir)",
    nameEn: "Special Chop Suey (Share)",
    descriptionEs: "Variedad de vegetales frescos salteados al wok.",
    descriptionEn: "Variety of fresh wok-sautéed vegetables.",
    priceCents: 1250,
    imageUrl: "/images/dishes/chopsuey.jpg",
    allergens: ["soja", "gluten"],
  },
  {
    id: "chop-suey-personal",
    category: "vegetales",
    nameEs: "Chop Suey Especial (Personal)",
    nameEn: "Special Chop Suey (Personal)",
    descriptionEs: "Vegetales salteados en formato individual.",
    descriptionEn: "Sautéed vegetables in individual portion.",
    priceCents: 750,
    imageUrl: "/images/dishes/chopsuey-personal.jpg",
    allergens: ["soja", "gluten"],
  },

  // TALLARINES
  {
    id: "chow-mein-compartir",
    category: "tallarines",
    nameEs: "Chow Mein Especial",
    nameEn: "Special Chow Mein",
    descriptionEs: "Tallarines salteados con cerdo, pollo, pimientos y cebolla.",
    descriptionEn: "Stir-fried noodles with pork, chicken, peppers and onions.",
    priceCents: 1250,
    imageUrl: "/images/dishes/chowmein.jpg",
    allergens: ["gluten", "soja", "huevos"],
  },
  {
    id: "chow-mein-personal",
    category: "tallarines",
    nameEs: "Chow Mein Especial (Personal)",
    nameEn: "Special Chow Mein (Personal)",
    descriptionEs: "Tallarines salteados en formato individual.",
    descriptionEn: "Stir-fried noodles in individual portion.",
    priceCents: 750,
    imageUrl: "/images/dishes/chowmein-personal.jpg",
    allergens: ["gluten", "soja", "huevos"],
  },

  // OTROS
  {
    id: "gambas-agridulces",
    category: "otros",
    nameEs: "Gambas Agridulces",
    nameEn: "Sweet and Sour Prawns",
    descriptionEs: "Gambas tempurizadas con pimientos, cebolla y salsa agridulce.",
    descriptionEn: "Tempura prawns with peppers, onions and sweet and sour sauce.",
    priceCents: 1350,
    imageUrl: "/images/dishes/gambas-agridulce.png",
    allergens: ["crustaceos", "gluten", "soja"],
  },
  {
    id: "cerdo-curry",
    category: "otros",
    nameEs: "Cerdo Al Curry",
    nameEn: "Curry Pork",
    descriptionEs: "Cerdo con pimientos, cebolla y salsa de curry acompañado de arroz blanco.",
    descriptionEn: "Pork with peppers, onions and curry sauce accompanied by white rice.",
    priceCents: 1499,
    imageUrl: "/images/dishes/cerdo-curry.jpg",
    allergens: ["soja", "gluten", "mostaza"],
  },
];
