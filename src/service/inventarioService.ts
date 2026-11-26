import type {
  InventarioDto,
  MovimientoInventarioRequest,
} from '../type/inventario'

const API_URL = 'http://localhost:8080/inventario'

export const consultarInventarioPorProducto = async (
  productoId: number
): Promise<InventarioDto> => {
  const res = await fetch(`${API_URL}/${productoId}`)
  if (!res.ok) {
    throw new Error(`No se encontró inventario para el producto #${productoId}`)
  }
  return res.json()
}

export const registrarEntradaInventario = async (
  productoId: number,
  movimiento: MovimientoInventarioRequest
): Promise<InventarioDto> => {
  const res = await fetch(`${API_URL}/${productoId}/entrada`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(movimiento),
  })

  if (!res.ok) {
    const errorTexto = await res.text()
    throw new Error(errorTexto || 'Error al registrar entrada de mercadería')
  }

  return res.json()
}

export const obtenerTodoElInventario = async (): Promise<InventarioDto[]> => {
  const res = await fetch(API_URL)
  if (!res.ok) {
    throw new Error('Error al obtener el inventario completo')
  }
  return res.json()
}

