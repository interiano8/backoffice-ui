/**
 * Utilidades para generación automática de códigos de catálogo y EAN-13 válido
 */

/**
 * Calcula el dígito de control estándar para un código EAN-13 (GS1)
 * @param base12 Los primeros 12 dígitos del código
 */
export function calculateEan13Checksum(base12: string): number {
  if (base12.length !== 12 || !/^\d+$/.test(base12)) {
    throw new Error('La base del EAN-13 debe contener exactamente 12 dígitos numéricos.');
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base12[i], 10);
    // Posición impar (índice par 0, 2, 4...) peso 1; posición par peso 3
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Genera un código de barras numérico válido EAN-13 para uso interno (prefijo 20)
 * Formato: 20 + 10 dígitos numéricos aleatorios/únicos + 1 dígito checksum
 */
export function generateInternalEan13(existingBarcodes: string[] = []): string {
  const existingSet = new Set(existingBarcodes.map((b) => b.trim()));

  for (let attempt = 0; attempt < 50; attempt++) {
    // 20 + 4 dígitos de timestamp mod + 6 dígitos aleatorios
    const timePart = String(Date.now() % 10000).padStart(4, '0');
    const randomPart = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    const base12 = `20${timePart}${randomPart}`;
    const checksum = calculateEan13Checksum(base12);
    const ean13 = `${base12}${checksum}`;

    if (!existingSet.has(ean13)) {
      return ean13;
    }
  }

  // Fallback con timestamp exacto
  const base12 = `20${String(Date.now()).slice(-10)}`;
  return `${base12}${calculateEan13Checksum(base12)}`;
}

/**
 * Genera el siguiente código sugerido para SKU de producto (ej. PRD-00001)
 */
export function generateSuggestedProductSku(existingCodes: string[]): string {
  const prefix = 'PRD-';
  const numbers = existingCodes
    .map((c) => {
      const match = c.toUpperCase().match(/^PRD-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : existingCodes.length + 1;
  return `${prefix}${String(nextNum).padStart(5, '0')}`;
}

/**
 * Genera el siguiente código para departamento (ej. DEP-01)
 */
export function generateSuggestedDepartmentCode(existingCodes: string[]): string {
  const prefix = 'DEP-';
  const numbers = existingCodes
    .map((c) => {
      const match = c.toUpperCase().match(/^DEP-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : existingCodes.length + 1;
  return `${prefix}${String(nextNum).padStart(2, '0')}`;
}

/**
 * Genera el siguiente código para categoría (ej. CAT-01)
 */
export function generateSuggestedCategoryCode(existingCodes: string[]): string {
  const prefix = 'CAT-';
  const numbers = existingCodes
    .map((c) => {
      const match = c.toUpperCase().match(/^CAT-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : existingCodes.length + 1;
  return `${prefix}${String(nextNum).padStart(2, '0')}`;
}

/**
 * Genera el siguiente código para proveedor (ej. PRV-001)
 */
export function generateSuggestedSupplierCode(existingCodes: string[]): string {
  const prefix = 'PRV-';
  const numbers = existingCodes
    .map((c) => {
      const match = c.toUpperCase().match(/^PRV-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : existingCodes.length + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}
