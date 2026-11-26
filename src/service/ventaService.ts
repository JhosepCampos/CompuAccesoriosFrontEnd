import type { VentaMostradorRequest, VentaDto } from '../type/venta'

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
    const errorTexto = await res.text()
    throw new Error(errorTexto || 'Error al registrar la venta en mostrador')
  }

  return res.json()
}

// --- Método para ReporteVentasPage ---
export const obtenerReporteVentas = async (
  desde: string,
  hasta: string
): Promise<VentaDto[]> => {
  // Spring Boot espera ISO.DATE_TIME (ej. 2026-11-25T00:00:00)
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
