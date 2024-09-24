export interface Category {
  id?: string;
  name: string;
  type: string;
}

export const DefaultCategories: Category[] = [
  { name: 'Alquiler', type: 'rent' },
  { name: 'Servicios Públicos', type: 'utilities' },
  { name: 'Transporte', type: 'transport' },
  { name: 'Comida y Bebida', type: 'food' },
  { name: 'Educación', type: 'education' },
  { name: 'Salud', type: 'health' },
  { name: 'Entretenimiento', type: 'entertainment' },
  { name: 'Ropa', type: 'clothing' },
  { name: 'Viajes', type: 'travel' },
  { name: 'Ahorro e Inversiones', type: 'savings' },
  { name: 'Deuda', type: 'debt' },
  { name: 'Regalos y Donaciones', type: 'gifts' },
  { name: 'Mantenimiento de Hogar', type: 'maintenance' },
  { name: 'Impuestos', type: 'taxes' },
  { name: 'Otros', type: 'others' },
];
