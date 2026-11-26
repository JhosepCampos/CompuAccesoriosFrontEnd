import { Fragment, useEffect, useState } from 'react'
import { listarDetallesVenta, obtenerReporteVentas } from '../../service/ventaService'
import type { DetalleVentaDto, VentaDto } from '../../type/venta'

export default function ReporteVentasPage() {
    const obtenerFechaHoyLocal = () => {
        const hoy = new Date()
        const offset = hoy.getTimezoneOffset()
        const local = new Date(hoy.getTime() - offset * 60 * 1000)
        return local.toISOString().split('T')[0]
    }

    const [fechaDesde, setFechaDesde] = useState<string>(obtenerFechaHoyLocal)
    const [fechaHasta, setFechaHasta] = useState<string>(obtenerFechaHoyLocal)
    const [ventas, setVentas] = useState<VentaDto[]>([])
    const [cargando, setCargando] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const [ventaExpandida, setVentaExpandida] = useState<number | null>(null)
    const [detallesMap, setDetallesMap] = useState<Record<number, DetalleVentaDto[]>>({})

    const toggleDetalles = async (ventaId: number) => {
        if (ventaExpandida === ventaId) {
            setVentaExpandida(null)
            return
        }

        setVentaExpandida(ventaId)

        if (!detallesMap[ventaId]) {
            try {
                const detalles = await listarDetallesVenta(ventaId)
                setDetallesMap((prev) => ({ ...prev, [ventaId]: detalles }))
            } catch (err) {
                console.error(err)
            }
        }
    }

    const consultarReporte = async () => {
        if (!fechaDesde || !fechaHasta) {
            setError('Selecciona ambas fechas (Desde y Hasta).')
            return
        }
        if (fechaDesde > fechaHasta) {
            setError('La fecha "Desde" no puede ser mayor que la fecha "Hasta".')
            return
        }

        setCargando(true)
        setError(null)
        try {
            const data = await obtenerReporteVentas(fechaDesde, fechaHasta)            
            const ordenadas = [...data].sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
            setVentas(ordenadas)
        } catch (err: unknown) {
            const msg =
                err instanceof Error ? err.message : 'Error al consultar reporte'
            setError(msg)
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        consultarReporte()
    }, [])

    const handleFiltrar = (e: React.FormEvent) => {
        e.preventDefault()
        consultarReporte()
    }

    const totalRecaudado = ventas.reduce(
        (acc, v) => acc + Number(v.total ?? 0),
        0
    )

    const totalMostrador = ventas
        .filter((v) => !v.pedido)
        .reduce((acc, v) => acc + Number(v.total ?? 0), 0)

    const totalPedidosOnline = ventas
        .filter((v) => Boolean(v.pedido))
        .reduce((acc, v) => acc + Number(v.total ?? 0), 0)

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        Reporte de Ventas
                    </h2>
                    <p className="text-sm text-slate-500">
                        Ingresos por ventas en mostrador y pedidos online entregados
                    </p>
                </div>

                {/* Filtro de fechas Desde / Hasta */}
                <form
                    onSubmit={handleFiltrar}
                    className="flex flex-wrap items-end gap-3 bg-white p-3.5 rounded-xl shadow-sm border border-slate-200"
                >
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Desde
                        </label>
                        <input
                            type="date"
                            required
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Hasta
                        </label>
                        <input
                            type="date"
                            required
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={cargando}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold cursor-pointer transition h-[34px]"
                    >
                        {cargando ? 'Consultando...' : 'Filtrar'}
                    </button>
                </form>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-lg">
                    {error}
                </div>
            )}

            {/* Tarjetas Resumen de Recaudación */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                        Total Recaudado ({ventas.length} ventas)
                    </p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                        S/ {totalRecaudado.toFixed(2)}
                    </p>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                        Ventas en Mostrador
                    </p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">
                        S/ {totalMostrador.toFixed(2)}
                    </p>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                        Pedidos Online Entregados
                    </p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                        S/ {totalPedidosOnline.toFixed(2)}
                    </p>
                </div>
            </div>

            {cargando ? (
                <p className="text-center text-slate-500 py-10">
                    Generando reporte de ventas...
                </p>
            ) : (
                <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-slate-800 text-white">
                            <tr>
                                <th className="p-4">ID Venta</th>
                                <th className="p-4">Fecha y Hora</th>
                                <th className="p-4">Origen / Tipo</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Vendedor Responsable</th>
                                <th className="p-4 text-right">Total</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {ventas.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-6 text-center text-slate-400">
                                        No se encontraron ventas en el rango de fechas seleccionado.
                                    </td>
                                </tr>
                            ) : (
                                ventas.map((venta) => {
                                    const id = venta.id!
                                    const esPedidoOnline = Boolean(venta.pedido)
                                    const estaAbierto = ventaExpandida === id
                                    const detalles = detallesMap[id]

                                    return (
                                        <Fragment key={id}>
                                            <tr className="hover:bg-slate-50">
                                                <td className="p-4 font-mono font-semibold text-slate-700">
                                                    #{id}
                                                </td>
                                                <td className="p-4 text-slate-600">
                                                    {venta.fecha
                                                        ? new Date(venta.fecha).toLocaleString()
                                                        : '-'}
                                                </td>
                                                <td className="p-4">
                                                    {esPedidoOnline ? (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                            Pedido Online #{venta.pedido?.id}
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                                            {venta.tipo || 'Mostrador'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-slate-700">
                                                    {venta.cliente?.nombre || 'Público General'}
                                                </td>
                                                <td className="p-4 font-medium text-slate-800">
                                                    {venta.vendedor?.nombre ||
                                                        (venta.vendedor?.id
                                                            ? `Usuario #${venta.vendedor.id}`
                                                            : '-')}
                                                </td>
                                                <td className="p-4 text-right font-bold text-slate-900">
                                                    S/ {Number(venta.total ?? 0).toFixed(2)}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleDetalles(id)}
                                                        className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
                                                    >
                                                        {estaAbierto ? 'Ocultar Ítems' : 'Ver Ítems'}
                                                    </button>
                                                </td>
                                            </tr>

                                            {estaAbierto && (
                                                <tr className="bg-slate-50">
                                                    <td colSpan={7} className="p-4 border-t border-slate-200">
                                                        {!detalles ? (
                                                            <p className="text-xs text-slate-500">
                                                                Cargando productos vendidos...
                                                            </p>
                                                        ) : detalles.length === 0 ? (
                                                            <p className="text-xs text-slate-500">
                                                                Esta venta no tiene ítems registrados.
                                                            </p>
                                                        ) : (
                                                            <div className="bg-white rounded-lg border border-slate-200 p-3">
                                                                <table className="w-full text-left text-xs">
                                                                    <thead className="text-slate-500 border-b border-slate-200">
                                                                        <tr>
                                                                            <th className="py-2 px-2">SKU</th>
                                                                            <th className="py-2 px-2">Producto</th>
                                                                            <th className="py-2 px-2 text-center">Cantidad</th>
                                                                            <th className="py-2 px-2 text-right">Precio Unit.</th>
                                                                            <th className="py-2 px-2 text-right">Subtotal</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100">
                                                                        {detalles.map((det) => (
                                                                            <tr key={det.id}>
                                                                                <td className="py-2 px-2 font-mono text-slate-500">
                                                                                    {det.producto?.sku}
                                                                                </td>
                                                                                <td className="py-2 px-2 font-medium text-slate-800">
                                                                                    {det.producto?.nombre}
                                                                                </td>
                                                                                <td className="py-2 px-2 text-center font-bold">
                                                                                    {det.cantidad}
                                                                                </td>
                                                                                <td className="py-2 px-2 text-right">
                                                                                    S/ {Number(det.precio).toFixed(2)}
                                                                                </td>
                                                                                <td className="py-2 px-2 text-right font-semibold text-slate-900">
                                                                                    S/ {(Number(det.precio) * det.cantidad).toFixed(2)}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
