import { Timestamp, FieldValue } from 'firebase/firestore';

export interface FinanceInterface {
  id?: string;
  isPaid: boolean;
  status: string;
  date: string;
  value: string;
  valueFormatted?: string;
  currency: string;
  name: string;
  provider: string;
  category: string | { name: string };
  obs: string;
  selected?: boolean;
  cardId?: string;
  timestamp?: Timestamp;
  dateAdded?: string;
  numCuotas?: number;
  currentCuota?: number;
}
