import type { Producto } from './catalogo'

export interface InventarioDto {
  productoId: number
  producto: Producto
  stockFisico: number
  reservado: number
}

export interface MovimientoInventarioRequest {
  producto: { id: number }
  usuario: { id: number }
  tipo: 'ENTRADA'
  cantidad: number
  motivo: string
}
