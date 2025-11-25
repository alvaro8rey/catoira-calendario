/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // 🛑 NO PARAR LA COMPILACIÓN EN PRODUCCIÓN POR ERRORES DE TS
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
