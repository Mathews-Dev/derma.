import { Timestamp } from 'firebase/firestore';

export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste';

export type MotivoSalida =
  | 'uso_tratamiento'
  | 'vencimiento'
  | 'deterioro'
  | 'otro';

export type MotivoEntrada =
  | 'compra'
  | 'devolucion'
  | 'otro';

export const MOTIVO_SALIDA_LABELS: Record<MotivoSalida, string> = {
  uso_tratamiento: 'Uso en tratamiento',
  vencimiento:     'Vencimiento',
  deterioro:       'Deterioro',
  otro:            'Otro',
};

export const MOTIVO_ENTRADA_LABELS: Record<MotivoEntrada, string> = {
  compra:     'Compra',
  devolucion: 'Devolución',
  otro:       'Otro',
};

export interface MovimientoInsumo {
  id: string;
  insumoId: string;
  insumoNombre: string;
  tipo: TipoMovimiento;
  cantidad: number;
  stockAnterior: number;
  stockResultante: number;
  motivoSalida?: MotivoSalida;
  motivoEntrada?: MotivoEntrada;
  referenciaCompra?: string;
  lote?: string;
  fechaVencimientoLote?: Timestamp;
  realizadoPor: string;
  realizadoPorNombre: string;
  fecha: Timestamp;
  notas?: string;
}

export type MovimientoInsumoInput = Omit<MovimientoInsumo, 'id'>;
