import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { obtenerSesion, cerrarSesion } from '../service/usuarioService'
import type { UsuarioDto } from '../type/usuario'

import RolPage from '../page/admin/RolPage'
import CatalogoPage from '../page/cliente/CatalogoPage'
import CarritoPage from '../page/cliente/CarritoPage'
import MisPedidosPage from '../page/cliente/MisPedidosPage'
import MostradorPage from '../page/vendedor/MostradorPage'
import GestionPedidosPage from '../page/vendedor/GestionPedidoPage'
import InventarioPage from '../page/admin/InventarioPage'
import ProductoPage from '../page/admin/ProductoPage'
import CategoriaMarcaPage from '../page/admin/CategoriaMarcaPage'
import ReporteVentasPage from '../page/admin/ReporteVentaPage'
import LoginPage from '../page/auth/LoginPage'
import RegistroPage from '../page/auth/RegistroPage'
import UsuarioPage from '../page/admin/UsuarioPage'
import { listarPedidosPorCliente, obtenerCarrito, obtenerTodosLosPedidos } from '../service/pedidoService'

function RutaProtegida({
    rolesPermitidos,
    children,
}: {
    rolesPermitidos: string[]
    children: React.ReactNode
}) {
    const usuario = obtenerSesion()
    const rolActual = usuario?.rol?.nombre?.toUpperCase()

    if (!usuario || !rolActual) {
        return <Navigate to="/login" replace />
    }

    if (!rolesPermitidos.includes(rolActual)) {
        return <Navigate to="/catalogo" replace />
    }

    return <>{children}</>
}

export default function AppRouter() {
    const [usuario, setUsuario] = useState<UsuarioDto | null>(() => obtenerSesion())

    useEffect(() => {
        const sincronizarSesion = () => {
            setUsuario(obtenerSesion())
        }
        window.addEventListener('pageshow', sincronizarSesion)
        window.addEventListener('popstate', sincronizarSesion)
        return () => {
            window.removeEventListener('pageshow', sincronizarSesion)
            window.removeEventListener('popstate', sincronizarSesion)
        }
    }, [])

    const rol = usuario?.rol?.nombre?.toUpperCase()

    const handleCerrarSesion = () => {
        cerrarSesion()
        setUsuario(null)
        window.location.replace('/login')
    }

    const [cantidadCarrito, setCantidadCarrito] = useState<number>(0)

    const actualizarContadorCarrito = () => {
        setCantidadCarrito(obtenerCarrito().length)
    }

    useEffect(() => {
        actualizarContadorCarrito()
        window.addEventListener('carritoActualizado', actualizarContadorCarrito)
        return () => window.removeEventListener('carritoActualizado', actualizarContadorCarrito)
    }, [])

    const [pedidosPendientes, setPedidosPendientes] = useState<number>(0)

    const actualizarContadorPedidos = async () => {       
        if (rol !== 'VENDEDOR' && rol !== 'ADMINISTRADOR') return

        try {
            const lista = await obtenerTodosLosPedidos()            
            const activos = lista.filter(
                (p) => p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO'
            ).length
            setPedidosPendientes(activos)
        } catch {
            setPedidosPendientes(0)
        }
    }

    useEffect(() => {
        actualizarContadorPedidos()
        window.addEventListener('pedidosActualizados', actualizarContadorPedidos)
        return () => window.removeEventListener('pedidosActualizados', actualizarContadorPedidos)
    }, [rol])

    const [misPedidosPendientes, setMisPedidosPendientes] = useState<number>(0)

    const actualizarContadorMisPedidos = async () => {
        if (rol !== 'CLIENTE' || !usuario?.id) return

        try {
            const lista = await listarPedidosPorCliente(usuario.id)
            const activos = lista.filter(
                (p) => p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO'
            ).length
            setMisPedidosPendientes(activos)
        } catch {
            setMisPedidosPendientes(0)
        }
    }

    useEffect(() => {
        actualizarContadorMisPedidos()
        window.addEventListener('misPedidosActualizados', actualizarContadorMisPedidos)
        return () => window.removeEventListener('misPedidosActualizados', actualizarContadorMisPedidos)
    }, [rol, usuario?.id])


    return (
        <BrowserRouter>
            {/* Menú superior dinámico según el rol */}
            <nav className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                <Link to="/catalogo" className="text-xl font-bold text-blue-400">
                    CompuAccesorios
                </Link>

                <div className="flex flex-wrap items-center gap-5 text-sm">
                    {/* Opciones públicas / Cliente */}
                    {(!rol || rol === 'CLIENTE') && (
                        <>
                            <Link to="/catalogo" className="hover:text-blue-400 transition">
                                Catalogo
                            </Link>
                            <Link to="/carrito" className="hover:text-blue-400 transition flex items-center gap-1.5">
                                <span>Carrito</span>
                                {cantidadCarrito > 0 && (
                                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {cantidadCarrito}
                                    </span>
                                )}
                            </Link>

                            {rol === 'CLIENTE' && (
                                <Link to="/mi-pedido" className="hover:text-blue-400 transition flex items-center gap-1.5">
                                    <span>Mi Pedido</span>
                                    {misPedidosPendientes > 0 && (
                                        <span className="bg-amber-500 text-slate-950 text-xs font-bold px-2 py-0.5 rounded-full">
                                            {misPedidosPendientes}
                                        </span>
                                    )}
                                </Link>
                            )}
                        </>
                    )}

                    {/* Opciones de Vendedor (y Administrador) */}
                    {(rol === 'VENDEDOR' || rol === 'ADMINISTRADOR') && (
                        <>
                            <Link to="/mostrador" className="hover:text-blue-400 transition">
                                Mostrador
                            </Link>
                            <Link to="/gestion-pedido" className="hover:text-blue-400 transition flex items-center gap-1.5">
                                <span>Gestión Pedido</span>
                                {pedidosPendientes > 0 && (
                                    <span className="bg-amber-500 text-slate-950 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {pedidosPendientes}
                                    </span>
                                )}
                            </Link>

                        </>
                    )}

                    {/* Opciones exclusivas de Administrador */}
                    {rol === 'ADMINISTRADOR' && (
                        <>
                            <Link to="/inventario" className="hover:text-blue-400 transition">
                                Inventario
                            </Link>
                            <Link to="/producto" className="hover:text-blue-400 transition">
                                Producto
                            </Link>
                            <Link to="/categoria-marca" className="hover:text-blue-400 transition">
                                Categoria / Marca
                            </Link>
                            <Link to="/reporte-venta" className="hover:text-blue-400 transition">
                                Reporte Venta
                            </Link>
                            <Link to="/usuario" className="hover:text-blue-400 transition">
                                Usuario
                            </Link>
                            <Link to="/rol" className="hover:text-blue-400 transition">
                                Rol
                            </Link>
                        </>
                    )}

                    {/* Estado de Sesión */}
                    {usuario ? (
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
                            <span className="text-xs text-slate-300">
                                Hola, <strong>{usuario.nombre}</strong> ({rol})
                            </span>
                            <button
                                onClick={handleCerrarSesion}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs font-semibold cursor-pointer"
                            >
                                Salir
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
                            <Link to="/login" className="hover:text-blue-400 transition font-semibold">
                                Login
                            </Link>
                            <Link
                                to="/registro"
                                className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded font-semibold"
                            >
                                Registro
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* Área donde cambian las páginas */}
            <main className="p-6 max-w-6xl mx-auto">
                <Routes>
                    {/* Públicas */}
                    <Route path="/" element={<Navigate to="/catalogo" replace />} />
                    <Route path="/catalogo" element={<CatalogoPage />} />
                    <Route path="/carrito" element={<CarritoPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/registro" element={<RegistroPage />} />

                    {/* Solo CLIENTE */}
                    <Route
                        path="/mi-pedido"
                        element={
                            <RutaProtegida rolesPermitidos={['CLIENTE']}>
                                <MisPedidosPage />
                            </RutaProtegida>
                        }
                    />

                    {/* VENDEDOR y ADMINISTRADOR */}
                    <Route
                        path="/mostrador"
                        element={
                            <RutaProtegida rolesPermitidos={['VENDEDOR', 'ADMINISTRADOR']}>
                                <MostradorPage />
                            </RutaProtegida>
                        }
                    />
                    <Route
                        path="/gestion-pedido"
                        element={
                            <RutaProtegida rolesPermitidos={['VENDEDOR', 'ADMINISTRADOR']}>
                                <GestionPedidosPage />
                            </RutaProtegida>
                        }
                    />

                    {/* Solo ADMINISTRADOR */}
                    <Route
                        path="/inventario"
                        element={
                            <RutaProtegida rolesPermitidos={['ADMINISTRADOR']}>
                                <InventarioPage />
                            </RutaProtegida>
                        }
                    />
                    <Route
                        path="/producto"
                        element={
                            <RutaProtegida rolesPermitidos={['ADMINISTRADOR']}>
                                <ProductoPage />
                            </RutaProtegida>
                        }
                    />
                    <Route
                        path="/categoria-marca"
                        element={
                            <RutaProtegida rolesPermitidos={['ADMINISTRADOR']}>
                                <CategoriaMarcaPage />
                            </RutaProtegida>
                        }
                    />
                    <Route
                        path="/reporte-venta"
                        element={
                            <RutaProtegida rolesPermitidos={['ADMINISTRADOR']}>
                                <ReporteVentasPage />
                            </RutaProtegida>
                        }
                    />
                    <Route
                        path="/usuario"
                        element={
                            <RutaProtegida rolesPermitidos={['ADMINISTRADOR']}>
                                <UsuarioPage />
                            </RutaProtegida>
                        }
                    />
                    <Route
                        path="/rol"
                        element={
                            <RutaProtegida rolesPermitidos={['ADMINISTRADOR']}>
                                <RolPage />
                            </RutaProtegida>
                        }
                    />
                </Routes>
            </main>
        </BrowserRouter>
    )
}
