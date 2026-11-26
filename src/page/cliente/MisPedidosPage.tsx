import { useEffect, useState } from 'react'
import {
  listarPedidosPorCliente,
  listarDetallesPedido,
  cancelarPedido,
} from '../../service/pedidoService'
import type { PedidoDto, DetallePedidoDto } from '../../type/pedido'
import { obtenerSesion } from '../../service/usuarioService'

export default function MisPedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoDto[]>([])
  const [detallesAbiertos, setDetallesAbiertos] = useState<
    Record<number, DetallePedidoDto[]>
  >({})
  const [pedidoExpandido, setPedidoExpandido] = useState<number | null>(null)
  const [cargando, setCargando] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const usuarioLogueado = obtenerSesion()
  const clienteIdActual = usuarioLogueado?.id ?? 0


  const cargarPedidos = () => {
    setCargando(true)
    listarPedidosPorCliente(clienteIdActual)
      .then((data) => {
        // Ordenamos para ver los más recientes primero
        const ordenados = [...data].sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
        setPedidos(ordenados)
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    cargarPedidos()
  }, [])

  const handleVerDetalles = async (pedidoId: number) => {
    if (pedidoExpandido === pedidoId) {
      setPedidoExpandido(null)
      return
    }

    setPedidoExpandido(pedidoId)

    // Si aún no hemos consultado los detalles de este pedido, los pedimos al backend
    if (!detallesAbiertos[pedidoId]) {
      try {
        const detalles = await listarDetallesPedido(pedidoId)
        setDetallesAbiertos((prev) => ({ ...prev, [pedidoId]: detalles }))
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al ver detalles'
        setError(msg)
      }
    }
  }

  const handleCancelar = async (pedidoId: number) => {
    const confirmar = window.confirm(
      `¿Estás seguro de cancelar el Pedido #${pedidoId}? Se liberará el stock reservado.`
    )
    if (!confirmar) return

    try {
      const pedidoActualizado = await cancelarPedido(pedidoId, clienteIdActual)
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? pedidoActualizado : p))
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cancelar'
      alert(msg)
    }
  }

  const obtenerColorEstado = (estado?: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-amber-100 text-amber-800 border-amber-300'
      case 'EN_PREPARACION':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'LISTO_PARA_RECOGER':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300'
      case 'ENTREGADO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      case 'CANCELADO':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300'
    }
  }

  if (cargando) {
    return <p className="text-center text-slate-600 py-10">Cargando tus pedidos...</p>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Mis Pedidos</h2>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {pedidos.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500">
          Aún no tienes pedidos registrados.
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => {
            const id = pedido.id!
            // Regla de negocio: solo puede cancelar si aún no fue entregado (ni ya está cancelado)
            const puedeCancelar =
              pedido.estado !== 'ENTREGADO' && pedido.estado !== 'CANCELADO'
            const estaAbierto = pedidoExpandido === id
            const detalles = detallesAbiertos[id]

            return (
              <div
                key={id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                {/* Cabecera del Pedido */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-slate-800">
                        Pedido #{id}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${obtenerColorEstado(
                          pedido.estado
                        )}`}
                      >
                        {pedido.estado}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap gap-4">
                      {pedido.fecha && (
                        <span>
                          Fecha: {new Date(pedido.fecha).toLocaleString()}
                        </span>
                      )}
                      {pedido.vence && pedido.estado === 'PENDIENTE' && (
                        <span className="text-amber-700 font-medium">
                          Vence: {new Date(pedido.vence).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-lg font-bold text-blue-600 mr-2">
                      Total: S/ {Number(pedido.total).toFixed(2)}
                    </span>

                    <button
                      onClick={() => handleVerDetalles(id)}
                      className="px-3 py-1.5 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer"
                    >
                      {estaAbierto ? 'Ocultar Detalles' : 'Ver Productos'}
                    </button>

                    {puedeCancelar && (
                      <button
                        onClick={() => handleCancelar(id)}
                        className="px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
                      >
                        Cancelar Pedido
                      </button>
                    )}
                  </div>
                </div>

                {/* Desplegable de Detalles del Pedido */}
                {estaAbierto && (
                  <div className="bg-slate-50 border-t border-slate-200 p-4">
                    {!detalles ? (
                      <p className="text-sm text-slate-500">Cargando productos...</p>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead className="text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="py-2">SKU</th>
                            <th className="py-2">Producto</th>
                            <th className="py-2 text-center">Cant.</th>
                            <th className="py-2 text-right">Precio Unit.</th>
                            <th className="py-2 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {detalles.map((det) => (
                            <tr key={det.id}>
                              <td className="py-2 font-mono text-xs text-slate-500">
                                {det.producto?.sku}
                              </td>
                              <td className="py-2 font-medium text-slate-800">
                                {det.producto?.nombre}
                              </td>
                              <td className="py-2 text-center">{det.cantidad}</td>
                              <td className="py-2 text-right">
                                S/ {Number(det.precio).toFixed(2)}
                              </td>
                              <td className="py-2 text-right font-semibold">
                                S/ {(Number(det.precio) * det.cantidad).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
