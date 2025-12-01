/** @type {import('next').NextConfig} */
const nextConfig = {
  // Solo usar export estático cuando se hace build para producción
  // En desarrollo (next dev), no usar output: 'export' para evitar errores
  ...(process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-development-server' && { output: 'export' }),
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
