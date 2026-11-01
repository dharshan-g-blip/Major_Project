const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = require('./src/app');
const connectDB = require('./src/config/db');
const initChatSocket = require('./src/sockets/chatSocket');
const SubscriptionTierConfig = require('./src/models/SubscriptionTierConfig');
const backupService = require('./src/services/backupService');

const PORT = process.env.PORT || 5000;

// Seed default subscription tiers if collection is empty
const seedDefaultTiers = async () => {
  try {
    const count = await SubscriptionTierConfig.countDocuments();
    if (count === 0) {
      console.log('[Bootstrap] Seeding initial subscription tier configurations...');
      await SubscriptionTierConfig.create([
        {
          tier: 'free',
          displayName: 'Free Starter',
          pricePerMonthINR: 0,
          caps: { activeClients: 5, monthlySessions: 15 },
          features: {
            noteTemplates: ['freeform'],
            analyticsDepth: 'basic_counts',
            canSellPackages: false,
            automatedWhatsApp: false,
            customBranding: false,
            prioritySupport: false,
          },
          description: 'Essential toolkit for starting out with up to 5 active clients.',
        },
        {
          tier: 'starter',
          displayName: 'Solo Practitioner',
          pricePerMonthINR: 1499,
          caps: { activeClients: 25, monthlySessions: 100 },
          features: {
            noteTemplates: ['freeform', 'soap'],
            analyticsDepth: 'standard_trends',
            canSellPackages: true,
            automatedWhatsApp: true,
            customBranding: true,
            prioritySupport: false,
          },
          description: 'Full practice autonomy with SOAP clinical notes, packages, and WhatsApp reminders.',
        },
        {
          tier: 'pro',
          displayName: 'Clinical Pro',
          pricePerMonthINR: 3499,
          caps: { activeClients: 999999, monthlySessions: 999999 },
          features: {
            noteTemplates: ['freeform', 'soap', 'dap'],
            analyticsDepth: 'advanced_aggregation',
            canSellPackages: true,
            automatedWhatsApp: true,
            customBranding: true,
            prioritySupport: true,
          },
          description: 'Unlimited practice scaling with advanced analytics and full DAP/SOAP clinical templates.',
        },
      ]);
      console.log('[Bootstrap] Tier configurations initialized.');
    }
  } catch (err) {
    console.error('[Bootstrap Error]', err.message);
  }
};

const startServer = async () => {
  // 1. Connect MongoDB
  await connectDB();

  // 2. If MongoDB is connected, ensure tier configs & database seeding
  if (mongoose.connection.readyState === 1) {
    await seedDefaultTiers();
    await backupService.restoreIfEmpty();
    await backupService.exportSnapshot();
  } else {
    console.warn('[Database] Running in resilient offline mode with pre-loaded snapshot data.');
  }

  // 3. Create HTTP Server
  const server = http.createServer(app);

  // 4. Attach Socket.io on the exact same HTTP port
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // 5. Initialize Chat Handlers
  initChatSocket(io);

  // 6. Start Unified Single-Port Listener
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Unfazed Unified Server running on Single Port: ${PORT}`);
    console.log(`   ➜ API Endpoint:   http://localhost:${PORT}/api`);
    console.log(`   ➜ Web App / UI:   http://localhost:${PORT}`);
    console.log(`   ➜ Socket.io Chat: ws://localhost:${PORT}`);
    console.log(`====================================================`);
  });
};

startServer();
