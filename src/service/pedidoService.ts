import type {
  ConfirmarPedidoRequest,
  DetallePedidoDto,
  ItemCarrito,
  PedidoDto,
} from '../type/pedido'
import type { Producto } from '../type/catalogo'



const API_URL = 'http://localhost:8080/pedidos'
const STORAGE_KEY = 'compu_accesorios_carrito'

// --- Manejo del Carrito en LocalStorage ---
export const obtenerCarrito = (): ItemCarrito[] => {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export const agregarAlCarrito = (producto: Producto): void => {
  const carrito = obtenerCarrito()
  const existente = carrito.find((item) => item.producto.id === producto.id)

  if (existente) {
    if (existente.cantidad < 99) existente.cantidad += 1
  } else {
    carrito.push({ producto, cantidad: 1 })
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito))
}

export const guardarCarrito = (carrito: ItemCarrito[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito))
}

export const limpiarCarrito = (): void => {
  localStorage.removeItem(STORAGE_KEY)
}

// --- Consumo API Backend ---
export const confirmarPedido = async (
  request: ConfirmarPedidoRequest
): Promise<PedidoDto> => {
  const res = await fetch(`${API_URL}/confirmar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    const errorTexto = await res.text()
    throw new Error(errorTexto || 'Error al confirmar el pedido')
  }

  return res.json()
}

export const listarPedidosPorCliente = async (
  clienteId: number
): Promise<PedidoDto[]> => {
  const res = await fetch(`${API_URL}/cliente/${clienteId}`)
  if (!res.ok) throw new Error('Error al cargar tus pedidos')
  return res.json()
}

export const listarDetallesPedido = async (
  pedidoId: number
): Promise<DetallePedidoDto[]> => {
  const res = await fetch(`${API_URL}/${pedidoId}/detalles`)
  if (!res.ok) throw new Error('Error al cargar los detalles del pedido')
  return res.json()
}

export const cancelarPedido = async (
  pedidoId: number,
  usuarioId: number
): Promise<PedidoDto> => {
  // Tu PedidoController pide estado y usuarioId como @RequestParam
  const res = await fetch(
    `${API_URL}/${pedidoId}/estado?estado=CANCELADO&usuarioId=${usuarioId}`,
    { method: 'PATCH' }
  )
  if (!res.ok) {
    const errorTexto = await res.text()
    throw new Error(errorTexto || 'No se pudo cancelar el pedido')
  }
  return res.json()
}

// --- Nuevos métodos para GestionPedidosPage ---
export const obtenerPedidoPorId = async (id: number): Promise<PedidoDto> => {
  const res = await fetch(`${API_URL}/${id}`)
  if (!res.ok) throw new Error(`No se encontró el pedido #${id}`)
  return res.json()
}

export const cambiarEstadoPedido = async (
  pedidoId: number,
  nuevoEstado: string,
  usuarioId: number
): Promise<PedidoDto> => {
  const res = await fetch(
    `${API_URL}/${pedidoId}/estado?estado=${nuevoEstado}&usuarioId=${usuarioId}`,
    { method: 'PATCH' }
  )
  if (!res.ok) {
    const errorTexto = await res.text()
    throw new Error(errorTexto || 'Error al cambiar el estado del pedido')
  }
  return res.json()
}