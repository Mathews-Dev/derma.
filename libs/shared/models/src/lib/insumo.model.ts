import { Timestamp } from 'firebase/firestore';

export type CategoriaInsumo =
  | 'cosmetico_activo'
  | 'descartable_medico'
  | 'medicamento'
  | 'aparatologia'
  | 'limpieza_desinfeccion'
  | 'oficina'
  | 'otro';

export type UnidadMedida =
  | 'unidades'
  | 'cajas'
  | 'litros'
  | 'mililitros'
  | 'gramos'
  | 'ampollas'
  | 'rollos'
  | 'pares'
  | 'otro';

export type EstadoStock = 'ok' | 'bajo_minimo' | 'sin_stock';

export const CATEGORIA_INSUMO_LABELS: Record<CategoriaInsumo, string> = {
  cosmetico_activo:      'Cosmético / Activo',
  descartable_medico:    'Descartable médico',
  medicamento:           'Medicamento',
  aparatologia:          'Aparatología',
  limpieza_desinfeccion: 'Limpieza y desinfección',
  oficina:               'Oficina',
  otro:                  'Otro',
};

export const UNIDAD_MEDIDA_LABELS: Record<UnidadMedida, string> = {
  unidades:   'Unidades',
  cajas:      'Cajas',
  litros:     'Litros',
  mililitros: 'Mililitros',
  gramos:     'Gramos',
  ampollas:   'Ampollas',
  rollos:     'Rollos',
  pares:      'Pares',
  otro:       'Otro',
};

export interface ProveedorInfo {
  nombre: string;
  telefono?: string;
  email?: string;
  contacto?: string;
}

export interface Insumo {
  id: string;
  nombre: string;
  descripcion?: string;
  codigo?: string;
  categoria: CategoriaInsumo;
  unidadMedida: UnidadMedida;
  stockActual: number;
  stockMinimo: number;
  stockMaximo?: number;
  proveedor?: ProveedorInfo;
  precioUnitario?: number;
  fechaVencimiento?: Timestamp;
  loteActual?: string;
  ubicacion?: string;
  fotoUrl?: string;
  fotoPublicId?: string;
  activo: boolean;
  notifBajoEnviada?: boolean;
  notifVencimientoEnviada?: boolean;
  notifVencidoEnviada?: boolean;
  creadoPor: string;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}

export type InsumoInput = Omit<Insumo, 'id' | 'creadoEn' | 'actualizadoEn'>;

export function getEstadoStock(insumo: Pick<Insumo, 'stockActual' | 'stockMinimo'>): EstadoStock {
  if (insumo.stockActual <= 0) return 'sin_stock';
  if (insumo.stockActual <= insumo.stockMinimo) return 'bajo_minimo';
  return 'ok';
}
