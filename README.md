Crear el proyecto: npm create vite@latest compu-accesorios -- --template react-ts

# CompuAccesorios - Frontend Web

Aplicación web SPA desarrollada con **React, TypeScript y Tailwind CSS** para la gestión comercial de **CompuAccesorios**, conectada a la API REST de Spring Boot.

## Tecnologías Utilizadas
* **React 18** & **TypeScript**
* **Vite** (Entorno de desarrollo y empaquetado)
* **React Router DOM** (Navegación y protección de rutas por rol)
* **Tailwind CSS** (Diseño responsivo)

## Requisitos Previos
1. Tener instalado **Node.js 18+** y **npm**.
2. Tener el **Backend (`CompuAccesoriosBackEnd`)** ejecutándose en `http://localhost:8080` con los datos iniciales cargados.

## Instalación y Ejecución

### 1. Clonar el repositorio
```bash
git clone https://github.com
cd CompuAccesoriosFrontEnd
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar servidor de desarrollo
```bash
npm run dev
```
Abre tu navegador en **`http://localhost:5173`**.

## Credenciales de Prueba y Roles
* **Administrador:** `admin@compuaccesorios.com` / `123456`
  * Acceso a Inventario (alertas de stock bajo y entradas), Mantenimiento de Productos, Categorías/Marcas, Reporte de Ventas por fechas y Gestión de Usuarios.
* **Vendedor:** *(Creado desde el módulo de Usuarios por el Administrador)*
  * Acceso a Punto de Venta en Mostrador (cálculo de vuelto) y Gestión/Despacho de Pedidos Online.
* **Cliente:** *(Puede registrarse directamente desde la pantalla `/registro`)*
  * Acceso al Catálogo con filtros en tiempo real, Carrito persistente en `localStorage`, confirmación de pedidos e historial con opción de cancelación.
