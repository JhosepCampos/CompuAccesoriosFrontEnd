import type { Producto } from './catalogo'

export interface DetalleVentaDto {
  id?: number
  ventaId?: number
  producto: Producto
  cantidad: number
  precio: number
}

export interface VentaMostradorRequest {
  vendedorId: number
  items: DetalleVentaDto[]
}

export interface VentaDto {
  id?: number
  pedido?: { id: number } | null
  cliente?: { id: number; nombre?: string } | null
  vendedor?: { id: number; nombre?: string }
  tipo?: string
  fecha?: string
  total?: number
}
