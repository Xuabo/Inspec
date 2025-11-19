import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente baseadas no modo atual (ex: .env, .env.production)
  // O terceiro argumento '' carrega todas as variáveis, não apenas as prefixadas com VITE_
  // FIX: Cast process to any to avoid TS error about cwd() missing on Process type
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Substitui process.env.API_KEY pelo valor da variável de ambiente durante o build
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})