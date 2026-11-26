import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, NavLink } from 'react-router-dom'
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

    const claseEnlace = ({ isActive }: { isActive: boolean }) =>
        `px-3 py-1.5 rounded-lg text-sm font-medium transition ${isActive
            ? 'bg-slate-800 text-blue-400 ring-1 ring-slate-700'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`

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
                <NavLink to="/catalogo" className={claseEnlace}>
                    CompuAccesorios
                </NavLink>

                <div className="flex flex-wrap items-center gap-5 text-sm">
                    {/* Opciones públicas / Cliente */}
                    {(!rol || rol === 'CLIENTE') && (
                        <>
                            <NavLink to="/catalogo" className={claseEnlace}>
                                Catalogo
                            </NavLink>
                            <NavLink to="/carrito" className={claseEnlace}>
                                <span>Carrito</span>
                                {cantidadCarrito > 0 && (
                                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {cantidadCarrito}
                                    </span>
                                )}
                            </NavLink>

                            {rol === 'CLIENTE' && (
                                <NavLink to="/mi-pedido" className={claseEnlace}>
                                    <span>Mi Pedido</span>
                                    {misPedidosPendientes > 0 && (
                                        <span className="bg-amber-500 text-slate-950 text-xs font-bold px-2 py-0.5 rounded-full">
                                            {misPedidosPendientes}
                                        </span>
                                    )}
                                </NavLink>
                            )}
                        </>
                    )}

                    {/* Opciones de Vendedor (y Administrador) */}
                    {(rol === 'VENDEDOR' || rol === 'ADMINISTRADOR') && (
                        <>
                            <NavLink to="/mostrador" className={claseEnlace}>
                                Mostrador
                            </NavLink>
                            <NavLink to="/gestion-pedido" className={claseEnlace}>
                                <span>Gestión Pedido</span>
                                {pedidosPendientes > 0 && (
                                    <span className="bg-amber-500 text-slate-950 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {pedidosPendientes}
                                    </span>
                                )}
                            </NavLink>

                        </>
                    )}

                    {/* Opciones exclusivas de Administrador */}
                    {rol === 'ADMINISTRADOR' && (
                        <>
                            <NavLink to="/inventario" className={claseEnlace}>
                                Inventario
                            </NavLink>
                            <NavLink to="/producto" className={claseEnlace}>
                                Producto
                            </NavLink>
                            <NavLink to="/categoria-marca" className={claseEnlace}>
                                Categoria / Marca
                            </NavLink>
                            <NavLink to="/reporte-venta" className={claseEnlace}>
                                Reporte Venta
                            </NavLink>
                            <NavLink to="/usuario" className={claseEnlace}>
                                Usuario
                            </NavLink>
                            <NavLink to="/rol" className={claseEnlace}>
                                Rol
                            </NavLink>
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
                            <NavLink to="/login" className={claseEnlace}>
                                Login
                            </NavLink>
                            <NavLink to="/registro" className={claseEnlace}>
                                Registro
                            </NavLink>
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
