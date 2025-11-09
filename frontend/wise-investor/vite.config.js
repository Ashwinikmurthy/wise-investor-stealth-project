import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'ec2-3-80-216-214.compute-1.amazonaws.com',
      '.compute-1.amazonaws.com',
      'localhost'
    ]
  }
})
