/**
 * @description Servicio de logging centralizado para el cumplimiento de estándares de élite.
 * Registra eventos e información de error con contexto de archivo y función.
 */
export class LoggerService {
  /**
   * @description Registra un error con contexto.
   * @param {string} context - Ubicación o función donde ocurrió el error (ej: 'submit-order-action').
   * @param {any} error - El objeto de error o mensaje.
   * @param {Record<string, any>} extra - Datos adicionales para depuración.
   */
  static error(context: string, error: Error | string | unknown, extra: Record<string, unknown> = {}): void {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : 'No stack trace';

    console.error(`[ERROR][${timestamp}][${context}] ${errorMessage}`, {
      extra,
      stack,
    });

    // En producción, aquí se podría integrar Sentry o un servicio de monitoreo externo.
  }

  /**
   * @description Registra información general.
   * @param {string} context - Ubicación de la traza.
   * @param {string} message - Mensaje informativo.
   */
  static info(context: string, message: string): void {
    const timestamp = new Date().toISOString();
    console.info(`[INFO][${timestamp}][${context}] ${message}`);
  }
}
