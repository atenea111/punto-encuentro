export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-center">
      <h1 className="text-4xl font-extrabold text-primary mb-2">404</h1>
      <p className="text-gray-600 mb-6">Página no encontrada</p>
      <a href="/" className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/95 transition-all">
        Volver al inicio
      </a>
    </div>
  )
}
