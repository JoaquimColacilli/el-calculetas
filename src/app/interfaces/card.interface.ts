export interface Card {
  id: string;
  background: string;
  logo: string;
  bottom: string;
  zIndex: number;
  selectedDay: number | null;
  selectedMonth: number | null;
  date: Date | null;
  name: string;
}
