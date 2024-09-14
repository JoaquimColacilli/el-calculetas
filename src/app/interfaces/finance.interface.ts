export interface FinanceInterface {
  isPaid: boolean;
  status: string;
  date: string;
  value: string;
  currency: string;
  name: string;
  provider: string;
  category: string | { name: string };
  obs: string;
  selected?: boolean; // Nueva propiedad opcional para manejar la selección
}
