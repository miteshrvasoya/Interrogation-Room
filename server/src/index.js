const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const { PORT, CLIENT_ORIGIN } = require('./config/constants');
const Storage = require('./db/storage');
const CaseLoader = require('./engine/CaseLoader');
const SessionManager = require('./engine/SessionManager');
const setupSocketServer = require('./socket');

const casesRoutes = require('./routes/cases');
const sessionsRoutes = require('./routes/sessions');
const agentApiRoutes = require('./routes/agentApi');
const gamificationRoutes = require('./routes/gamification');
const lobbyRoutes = require('./routes/lobby');
const adminRoutes = require('./routes/admin');

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Cross-origin and JSON body parsing
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }));
  app.use(express.json({ limit: '10mb' }));

  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Initialize DB and Case Loader
  await Storage.init();
  const caseLoader = new CaseLoader();
  const sessionManager = new SessionManager(caseLoader, io);

  // Setup Socket Server
  setupSocketServer(io, sessionManager);

  // Seed sample sessions
  await sessionManager.seedDemoSessions();

  // Wire API routes
  app.use('/api/cases', casesRoutes(caseLoader, sessionManager));
  app.use('/api/sessions', sessionsRoutes(sessionManager));
  app.use('/api/agent/v1', agentApiRoutes(sessionManager));
  app.use('/api/gamification', gamificationRoutes());
  app.use('/api/lobby', lobbyRoutes(sessionManager, io));
  app.use('/api/admin', adminRoutes(sessionManager));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      service: 'Interrogation Room Game Engine',
      activeSessions: sessionManager.getAllSessions().length,
      casesLoaded: caseLoader.getAllCases().length,
      timestamp: new Date().toISOString()
    });
  });

  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  🕵️ INTERROGATION ROOM SERVER RUNNING ON PORT ${PORT}`);
    console.log(`  API: http://localhost:${PORT}/api/health`);
    console.log(`  Client Expected Origin: ${CLIENT_ORIGIN}`);
    console.log(`=======================================================`);
  });

  return { app, server, sessionManager };
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('Fatal Server Startup Error:', err);
    process.exit(1);
  });
}

module.exports = startServer;
