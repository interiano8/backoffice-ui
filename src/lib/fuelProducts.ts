export interface FuelProduct {
  id: string;
  gradeName: string;
  genericCode: string;
  posCode?: string;
  tankId: string;
  gradeId: number;
}

export const DEFAULT_FUEL_PRODUCTS: FuelProduct[] = [
  { id: '1', gradeName: 'GASOLINA SUPERIOR', genericCode: 'SUPER', posCode: 'SUPER', tankId: '1', gradeId: 1 },
  { id: '2', gradeName: 'GASOLINA REGULAR', genericCode: 'REGULAR', posCode: 'REGULAR', tankId: '2', gradeId: 2 },
  { id: '3', gradeName: 'DIESEL 50PPM', genericCode: 'DIESEL', posCode: 'DIESEL', tankId: '3', gradeId: 3 },
  { id: '4', gradeName: 'KEROSENE', genericCode: 'KEROSENE', posCode: 'KEROSENE', tankId: '4', gradeId: 4 },
  { id: '5', gradeName: 'GLP', genericCode: 'GLP', posCode: 'GLP', tankId: '5', gradeId: 5 },
];
