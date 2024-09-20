import { Timestamp, FieldValue } from 'firebase/firestore';

export interface FinanceInterface {
  id?: string;
  isPaid: boolean;
  status: string;
  date: string;
  value: string;
  currency: string;
  name: string;
  provider: string;
  category: string | { name: string };
  obs: string;
  selected?: boolean;
  timestamp?: Timestamp | FieldValue;
}
