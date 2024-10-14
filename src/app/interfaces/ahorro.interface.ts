export interface AhorroInterface {
  id?: string;
  timestamp: Date;
  montoUsd: number;
  montoArs: number;
  valorUsdActual: number;
  isCompra: boolean;
  isVenta: boolean;
}
