export interface UserInterface {
  uid: string;
  username: string;
  email: string;
  profilePicture?: string;
  providerId?: string;
  ubicacion?: string;
  isFirstTime?: boolean;
  saldoAcumulado?: number;
  saldoAcumuladoUsd?: number;
  themeColor?: string;
}
