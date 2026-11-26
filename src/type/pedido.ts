import type { Producto } from './catalogo'

export interface ItemCarrito {
  producto: Producto
  cantidad: number
}

export interface DetallePedidoDto {
  id?: number
  pedidoId?: number
  producto: Producto
  cantidad: number
  precio: number
}

export interface PedidoDto {
  id?: number
  cliente: { id: number; nombre?: string }
  token: string
  fecha?: string
  vence?: string
  estado?: string
  total: number
}

export interface ConfirmarPedidoRequest {
  pedido: PedidoDto
  items: DetallePedidoDto[]
}
