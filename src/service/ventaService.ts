import type { VentaMostradorRequest, VentaDto, DetalleVentaDto } from '../type/venta'

const API_URL = 'http://localhost:8080/ventas'

export const registrarVentaMostrador = async (
  request: VentaMostradorRequest
): Promise<VentaDto> => {
  const res = await fetch(`${API_URL}/mostrador`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    let mensaje = 'No se pudo procesar la venta'
    try {
      const errorData = await res.json()
      if (errorData.message) mensaje = errorData.message
    } catch {
      const texto = await res.text()
      if (texto) mensaje = texto
    }
    throw new Error(mensaje)
  }


  return res.json()
}

export const obtenerReporteVentas = async (
  desde: string,
  hasta: string
): Promise<VentaDto[]> => {

  const desdeIso = `${desde}T00:00:00`
  const hastaIso = `${hasta}T23:59:59`

  const res = await fetch(
    `${API_URL}/reporte?desde=${encodeURIComponent(
      desdeIso
    )}&hasta=${encodeURIComponent(hastaIso)}`
  )

  if (!res.ok) {
    const errorTexto = await res.text()
    throw new Error(errorTexto || 'Error al obtener el reporte de ventas')
  }

  return res.json()
}

export const listarDetallesVenta = async (
  ventaId: number
): Promise<DetalleVentaDto[]> => {
  const res = await fetch(`${API_URL}/${ventaId}/detalles`)
  if (!res.ok) {
    throw new Error('Error al cargar los detalles de la venta')
  }
  return res.json()
}