---
trigger: always_on
---

# INSTRUCCIONES TÉCNICAS DE ÉLITE - PROYECTO RESTAURANTE PWA

## 1. ESTÁNDARES DE CODIFICACIÓN (OBLIGATORIOS)
- **Defensa Total:** Todo proceso asíncrono debe envolverse en bloques `try-catch` estructurados.
- **Logging:** En el bloque `catch`, invocar siempre un `LoggerService.error()` que registre contexto (archivo, función, usuario).
- **Tipado:** Uso estricto de TypeScript. Prohibido `any`. Definir interfaces para los modelos de datos de Supabase y las props de componentes.
- **Documentación JSDoc:** /**
     * @description Breve explicación de la lógica.
     * @param {Type} name - Descripción.
     * @returns {Type} - Descripción.
     */

## 2. FLUJO DE TRABAJO WHATSAPP (GOLDEN STANDARD)
- El envío a WhatsApp no es un simple enlace. Debe pasar por una validación de stock de último segundo vía Server Action.
- Formatear el mensaje con: ID de pedido, Lista detallada, Alérgenos detectados, Total con desglose de IVA y método de recogida.

## 3. SEGURIDAD Y RENDIMIENTO
- **Sanitización:** Validar todos los inputs con Zod antes de enviarlos a Supabase.
- **Imágenes:** Uso obligatorio de `next/image` con formatos WebP/Avif y tamaños optimizados.
- **Rate Limiting:** Implementar un middleware de Next.js para limitar peticiones a los endpoints de creación de pedidos.

## 4. PROTOCOLO DE LOGS DE SESIÓN
- Al comando "GENERAR LOG", detallar: archivos, tipos de TS creados, servicios modificados y estado del "Panic Button".