import { useEffect, useState } from 'react'
import {
    obtenerCarrito,
    guardarCarrito,
    limpiarCarrito,
    confirmarPedido,
} from '../../service/pedidoService'
import type { ItemCarrito, ConfirmarPedidoRequest } from '../../type/pedido'
import { useNavigate } from 'react-router-dom'
import { obtenerSesion } from '../../service/usuarioService'

export default function CarritoPage() {
    const [items, setItems] = useState<ItemCarrito[]>([])
    // Generamos el UUID una sola vez al cargar el carrito para garantizar idempotencia si hay doble clic
    const [tokenIdempotencia, setTokenIdempotencia] = useState<string>(() =>
        crypto.randomUUID()
    )
    const [enviando, setEnviando] = useState<boolean>(false)
    const [mensajeExito, setMensajeExito] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const navigate = useNavigate()
    const usuarioLogueado = obtenerSesion()

    useEffect(() => {
        setItems(obtenerCarrito())
    }, [])

    const actualizarCantidad = (productoId: number, nuevaCantidad: number) => {
        // Regla de negocio: cantidades modificables (1 a 99)
        const cantidadValida = Math.max(1, Math.min(99, nuevaCantidad || 1))
        const actualizado = items.map((item) =>
            item.producto.id === productoId
                ? { ...item, cantidad: cantidadValida }
                : item
        )
        setItems(actualizado)
        guardarCarrito(actualizado)
    }

    const eliminarItem = (productoId: number) => {
        const actualizado = items.filter((item) => item.producto.id !== productoId)
        setItems(actualizado)
        guardarCarrito(actualizado)
    }

    const totalPagar = items.reduce(
        (acc, item) => acc + Number(item.producto.precio) * item.cantidad,
        0
    )

    const handleConfirmarPedido = async () => {
        if (items.length === 0 || enviando) return

        // Bloquea la compra si no hay sesión iniciada
        if (!usuarioLogueado || !usuarioLogueado.id) {
            alert('Debes iniciar sesión para confirmar tu pedido.')
            navigate('/login')
            return
        }

        setEnviando(true)
        setError(null)
        setMensajeExito(null)

        const payload: ConfirmarPedidoRequest = {
            pedido: {
                cliente: { id: usuarioLogueado.id },
                token: tokenIdempotencia,
                total: Number(totalPagar.toFixed(2)),
            },
            items: items.map((item) => ({
                producto: item.producto,
                cantidad: item.cantidad,
                precio: Number(item.producto.precio),
            })),
        }


        try {
            const pedidoCreado = await confirmarPedido(payload)
            limpiarCarrito()
            setItems([])
            // Regeneramos un nuevo token solo cuando el pedido ya fue confirmado con éxito
            setTokenIdempotencia(crypto.randomUUID())
            setMensajeExito(
                `¡Pedido #${pedidoCreado.id} confirmado! Tienes 48 horas para completar la compra.`
            )
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error inesperado'
            setError(msg)
        } finally {
            setEnviando(false)
        }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Mi Carrito de Compras</h2>

            {mensajeExito && (
                <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-4 rounded-lg">
                    {mensajeExito}
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-lg">
                    {error}
                </div>
            )}

            {items.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500">
                    Tu carrito está vacío. Ve al catálogo para agregar productos.
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-800 text-white text-sm">
                                <tr>
                                    <th className="p-4">Producto</th>
                                    <th className="p-4">Precio Unit.</th>
                                    <th className="p-4">Cantidad (1-99)</th>
                                    <th className="p-4">Subtotal</th>
                                    <th className="p-4 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {items.map(({ producto, cantidad }) => {
                                    const subtotal = Number(producto.precio) * cantidad
                                    return (
                                        <tr key={producto.id} className="hover:bg-slate-50">
                                            <td className="p-4">
                                                <p className="font-semibold text-slate-800">{producto.nombre}</p>
                                                <p className="text-xs text-slate-500 font-mono">{producto.sku}</p>
                                            </td>
                                            <td className="p-4 text-slate-700">
                                                S/ {Number(producto.precio).toFixed(2)}
                                            </td>
                                            <td className="p-4">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={99}
                                                    value={cantidad}
                                                    onChange={(e) =>
                                                        actualizarCantidad(producto.id, Number(e.target.value))
                                                    }
                                                    className="w-20 border border-slate-300 rounded-lg px-2 py-1 text-center"
                                                />
                                            </td>
                                            <td className="p-4 font-semibold text-slate-800">
                                                S/ {subtotal.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => eliminarItem(producto.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium cursor-pointer"
                                                >
                                                    Quitar
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-xs text-slate-400 font-mono">
                            Token operación: {tokenIdempotencia}
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-sm text-slate-500">Total a pagar</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    S/ {totalPagar.toFixed(2)}
                                </p>
                            </div>

                            <button
                                onClick={handleConfirmarPedido}
                                disabled={enviando}
                                className={`px-6 py-3 rounded-lg font-semibold text-white transition ${enviando
                                        ? 'bg-slate-400 cursor-not-allowed'
                                        : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                                    }`}
                            >
                                {enviando ? 'Confirmando...' : 'Confirmar Pedido'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
