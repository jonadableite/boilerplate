import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { AppRouter } from './src/igniter.router'
import { createIgniterAppContext } from './src/igniter.context'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

// Prepare the Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXTAUTH_URL 
        : 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io/'
  })

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id)

    // Join conversation room
    socket.on('join_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`)
        console.log(`Socket ${socket.id} joined conversation:${conversationId}`)
      }
    })

    // Leave conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`)
        console.log(`Socket ${socket.id} left conversation:${conversationId}`)
      }
    })

    // Join organization inbox
    socket.on('join_inbox', ({ organizationId }) => {
      if (organizationId) {
        socket.join(`inbox:${organizationId}`)
        console.log(`Socket ${socket.id} joined inbox:${organizationId}`)
      }
    })

    // Leave organization inbox
    socket.on('leave_inbox', ({ organizationId }) => {
      if (organizationId) {
        socket.leave(`inbox:${organizationId}`)
        console.log(`Socket ${socket.id} left inbox:${organizationId}`)
      }
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id)
    })
  })

  // Make Socket.IO instance available globally
  global.io = io

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> Socket.IO server running on port ${port}`)
  })
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err)
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
  process.exit(1)
})