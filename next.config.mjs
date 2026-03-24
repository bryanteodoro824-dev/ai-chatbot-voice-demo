/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/get-demo.html' },
      ],
    }
  },
}

export default nextConfig
