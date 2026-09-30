/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Omite los errores de TypeScript al compilar en producción
    ignoreBuildErrors: true,
  },
  eslint: {
    // Omite los avisos de ESLint durante el despliegue
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;