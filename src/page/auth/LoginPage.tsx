import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  loginUsuario,
  guardarSesion,
} from '../../service/usuarioService'

export default function LoginPage() {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [cargando, setCargando] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cargando) return

    setCargando(true)
    setError(null)

    try {
      const usuario = await loginUsuario(correo.trim(), password)
      guardarSesion(usuario)

      // Redirección inteligente según el rol del usuario
      const rolNombre = usuario.rol?.nombre?.toUpperCase()
      if (rolNombre === 'ADMINISTRADOR') {
        navigate('/producto')
      } else if (rolNombre === 'VENDEDOR') {
        navigate('/mostrador')
      } else {
        navigate('/catalogo')
      }

      // Recargamos para que la barra de navegación actualice el nombre/rol del usuario
      window.location.reload()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Credenciales inválidas'
      setError(msg)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-slate-800">Iniciar Sesión</h2>
          <p className="text-sm text-slate-500">
            Ingresa a tu cuenta de <strong>CompuAccesorios</strong>
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Correo Electrónico *
            </label>
            <input
              type="email"
              required
              placeholder="ejemplo@correo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contraseña *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className={`w-full py-2.5 rounded-lg font-semibold text-white transition cursor-pointer ${
              cargando
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {cargando ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600">
          ¿No tienes cuenta?{' '}
          <Link
            to="/registro"
            className="text-blue-600 hover:underline font-semibold"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  )
}
