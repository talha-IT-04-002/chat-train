/* eslint-disable @typescript-eslint/no-explicit-any */
declare const process: any
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { Connect } from 'vite'

// Simple mock API plugin to run frontend without backend
const mockApiPlugin = () => ({
  name: 'mock-api',
  configureServer(server: any) {
    const sendJson = (res: any, body: any, status = 200) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(body))
    }

    server.middlewares.use('/api', (req: any, res: any, next: Connect.NextFunction) => {
      const method = (req.method || 'GET').toUpperCase()
      const url = req.url || '/'

      // Auth
      if (method === 'POST' && url.startsWith('/auth/login')) {
        return sendJson(res, {
          success: true,
          data: {
            user: {
              id: 'user_1',
              email: 'demo@example.com',
              firstName: 'Demo',
              lastName: 'User',
              role: 'owner',
              status: 'active',
              emailVerified: true,
              preferences: {},
              profile: {},
            },
            organizations: [
              {
                id: 'org_1',
                name: 'Demo Org',
                role: 'owner',
                permissions: ['*'],
              },
            ],
            token: 'mock-token',
          },
        })
      }

      if (method === 'GET' && url.startsWith('/auth/me')) {
        return sendJson(res, {
          success: true,
          data: {
            user: {
              id: 'user_1',
              email: 'demo@example.com',
              firstName: 'Demo',
              lastName: 'User',
              role: 'owner',
              status: 'active',
              emailVerified: true,
              preferences: {},
              profile: {},
            },
            organizations: [
              {
                id: 'org_1',
                name: 'Demo Org',
                role: 'owner',
                permissions: ['*'],
              },
            ],
          },
        })
      }

      // Trainers
      if (method === 'GET' && url === '/trainers') {
        return sendJson(res, { success: true, data: [] })
      }

      if (method === 'POST' && url === '/trainers') {
        return sendJson(res, {
          success: true,
          data: {
            id: 'trainer_1',
            name: 'New Trainer',
            type: 'custom',
            status: 'draft',
            organizationId: 'org_1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
              totalInteractions: 0,
              completionRate: 0,
              avgSessionTime: 0,
              totalSessions: 0,
              estimatedDuration: 10,
            },
          },
        })
      }

      if (method === 'GET' && url.startsWith('/api-keys')) {
        return sendJson(res, { success: true, data: [] })
      }

      if (method === 'GET' && url.startsWith('/sessions')) {
        return sendJson(res, { success: true, data: [] })
      }

      if (method === 'GET' && url.startsWith('/analytics')) {
        return sendJson(res, { success: true, data: { charts: [], stats: {} } })
      }

      if (method === 'GET' && url === '/health') {
        return sendJson(res, { success: true, data: { status: 'ok' } })
      }

      if (url === '/' || url === '') return next()
      return sendJson(res, { success: true, message: 'Mocked OK' })
    })
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const useMocks = (env.VITE_USE_MOCKS ?? 'true') === 'true'

  return {
    server: {
      allowedHosts: ['481b84bc4d35.ngrok-free.app'],
      port: 3000,
      ...(useMocks
        ? {}
        : {
            proxy: {
              '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
              },
            },
          }),
    },
    plugins: [
      react(),
      tailwindcss(),
      ...(useMocks ? [mockApiPlugin()] : []),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
    preview: {
      port: 4173,
      host: true,
    },
    define: {
      'process.env': {},
    },
  }
})