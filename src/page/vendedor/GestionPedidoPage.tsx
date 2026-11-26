import { useEffect, useState } from 'react'
import {
  listarDetallesPedido,
  cambiarEstadoPedido,
  obtenerTodosLosPedidos,
} from '../../service/pedidoService'
import type { PedidoDto, DetallePedidoDto } from '../../type/pedido'
import { obtenerSesion } from '../../service/usuarioService'

export default function GestionPedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoDto[]>([])
  const [busquedaId, setBusquedaId] = useState<string>('')
  const [detallesMap, setDetallesMap] = useState<
    Record<number, DetallePedidoDto[]>
  >({})
  const [pedidoExpandido, setPedidoExpandido] = useState<number | null>(null)
  const [cargando, setCargando] = useState<boolean>(true)
  const [procesandoId, setProcesandoId] = useState<number | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const usuarioLogueado = obtenerSesion()
  const usuarioDespachoId = usuarioLogueado?.id ?? 0


  const cargarBandejaInicial = async () => {
    setCargando(true)
    setError(null)
    try {
      const data = await obtenerTodosLosPedidos()
      setPedidos(data)
      window.dispatchEvent(new Event('pedidosActualizados'))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarBandejaInicial()
  }, [])

  const pedidosFiltrados = pedidos.filter((p) => {
    const texto = busquedaId.trim().toLowerCase()
    if (!texto) return true

    return (
      String(p.id).includes(texto) ||
      (p.cliente?.nombre?.toLowerCase().includes(texto) ?? false)
    )
  })

  const obtenerSiguientePaso = (estado?: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return {
          siguienteEstado: 'EN_PREPARACION',
          textoBoton: 'Pasar a Preparación',
          colorBoton: 'bg-blue-600 hover:bg-blue-700',
        }
      case 'EN_PREPARACION':
        return {
          siguienteEstado: 'LISTO_PARA_RECOGER',
          textoBoton: 'Listo para Recoger',
          colorBoton: 'bg-indigo-600 hover:bg-indigo-700',
        }
      case 'LISTO_PARA_RECOGER':
        return {
          siguienteEstado: 'ENTREGADO',
          textoBoton: 'Registrar Entrega',
          colorBoton: 'bg-emerald-600 hover:bg-emerald-700',
        }
      default:
        return null
    }
  }

  const handleAvanzarEstado = async (pedidoId: number, nuevoEstado: string) => {

    if (!usuarioDespachoId) {
      setError('Debes iniciar sesión para gestionar pedidos.')
      return
    }

    setProcesandoId(pedidoId)
    setError(null)
    setMensajeExito(null)

    try {
      const actualizado = await cambiarEstadoPedido(
        pedidoId,
        nuevoEstado,
        usuarioDespachoId
      )
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? actualizado : p))
      )
      if (nuevoEstado === 'ENTREGADO') {
        setMensajeExito(
          `¡Pedido #${pedidoId} ENTREGADO! Stock descontado y venta generada automáticamente.`
        )
      } else {
        setMensajeExito(`Pedido #${pedidoId} actualizado a ${nuevoEstado}.`)
      }
      window.dispatchEvent(new Event('pedidosActualizados'))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar estado'
      setError(msg)
    } finally {
      setProcesandoId(null)
    }
  }

  const toggleDetalles = async (pedidoId: number) => {
    if (pedidoExpandido === pedidoId) {
      setPedidoExpandido(null)
      return
    }
    setPedidoExpandido(pedidoId)
    if (!detallesMap[pedidoId]) {
      try {
        const dets = await listarDetallesPedido(pedidoId)
        setDetallesMap((prev) => ({ ...prev, [pedidoId]: dets }))
      } catch (err) {
        console.error(err)
      }
    }
  }

  const obtenerBadgeEstado = (estado?: string) => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Gestión de Pedidos (Despacho)
          </h2>
          <p className="text-sm text-slate-500">
            Flujo secuencial: Pendiente → Preparación → Listo → Entregado
          </p>
        </div>

                <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar N° pedido o cliente..."
            value={busquedaId}
            onChange={(e) => setBusquedaId(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white w-56 focus:outline-none focus:border-blue-500"
          />

          {busquedaId && (
            <button
              type="button"
              onClick={() => setBusquedaId('')}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer"
            >
              Limpiar
            </button>
          )}

          <button
            type="button"
            onClick={cargarBandejaInicial}
            disabled={cargando}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50"
          >
            {cargando ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

      </div>

      {mensajeExito && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-4 rounded-lg font-medium">
          {mensajeExito}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {cargando ? (
        <p className="text-center text-slate-500 py-10">
          Cargando bandeja de pedidos...
        </p>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500">
          No hay pedidos en curso. Usa el buscador superior para consultar un ID.
        </div>
      ) : (
        <div className="space-y-4">
          {pedidosFiltrados.map((pedido) => {
            const id = pedido.id!
            const siguiente = obtenerSiguientePaso(pedido.estado)
            const estaProcesando = procesandoId === id
            const estaAbierto = pedidoExpandido === id
            const detalles = detallesMap[id]

            return (
              <div
                key={id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-lg font-bold text-slate-800">
                        Pedido #{id}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${obtenerBadgeEstado(
                          pedido.estado
                        )}`}
                      >
                        {pedido.estado}
                      </span>
                      {pedido.cliente?.nombre && (
                        <span className="text-sm text-slate-600">
                          • Cliente: <strong>{pedido.cliente.nombre}</strong>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap gap-4">
                      {pedido.fecha && (
                        <span>
                          Creado: {new Date(pedido.fecha).toLocaleString()}
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
                      S/ {Number(pedido.total).toFixed(2)}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleDetalles(id)}
                      className="px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer"
                    >
                      {estaAbierto ? 'Ocultar Items' : 'Ver Items'}
                    </button>

                    {siguiente && (
                      <button
                        type="button"
                        disabled={estaProcesando}
                        onClick={() =>
                          handleAvanzarEstado(id, siguiente.siguienteEstado)
                        }
                        className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition cursor-pointer ${estaProcesando
                          ? 'bg-slate-400 cursor-not-allowed'
                          : siguiente.colorBoton
                          }`}
                      >
                        {estaProcesando
                          ? 'Actualizando...'
                          : siguiente.textoBoton}
                      </button>
                    )}
                  </div>
                </div>

                {estaAbierto && (
                  <div className="bg-slate-50 border-t border-slate-200 p-4">
                    {!detalles ? (
                      <p className="text-sm text-slate-500">
                        Cargando productos...
                      </p>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead className="text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="py-2">SKU</th>
                            <th className="py-2">Producto</th>
                            <th className="py-2 text-center">Cantidad</th>
                            <th className="py-2 text-right">Precio</th>
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
                              <td className="py-2 text-center font-bold">
                                {det.cantidad}
                              </td>
                              <td className="py-2 text-right">
                                S/ {Number(det.precio).toFixed(2)}
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
