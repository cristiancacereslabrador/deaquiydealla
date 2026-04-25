/**
 * @description Constantes de marca y contacto para el restaurante.
 */
export const RESTAURANT_BRAND_NAME = "De Aquí y De Allá" as const;

export const BRAND_INFO = {
  name: RESTAURANT_BRAND_NAME,
  phone: "+34603370663",
  address: "Calle Poeta Zorrilla 3, local 10, Granada, España",
  googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=De+Aquí+y+De+Allá+Granada+Calle+Poeta+Zorrilla+3",
  instagram: "https://www.instagram.com/deaquiydeallagr/",
  tiktok: "https://www.tiktok.com/@deaquiydeallagr",
  glovo: "https://glovoapp.com/es/es/granada/stores/de-aqui-y-de-alla-comida-para-llevar-granada",
  whatsapp: "https://wa.me/34603370663",
  schedule: {
    mon_wed: "12:00 - 16:00",
    thu: "Cerrado",
    fri_sun: "12:00 - 21:30",
  }
} as const;
