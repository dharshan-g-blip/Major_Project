const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const bundledPath = path.join(__dirname, '../data/data_snapshot.json');
const uploadPath = path.join(__dirname, '../../uploads/backups/data_snapshot.json');

let snapshotData = null;

const loadSnapshot = () => {
  if (snapshotData) return snapshotData;
  try {
    const targetPath = fs.existsSync(uploadPath) ? uploadPath : bundledPath;
    if (fs.existsSync(targetPath)) {
      const raw = fs.readFileSync(targetPath, 'utf8');
      const parsed = JSON.parse(raw);
      snapshotData = parsed.data || {};
      return snapshotData;
    }
  } catch (e) {
    console.error('[MockDbFallback] Error loading snapshot:', e.message);
  }
  return {
    therapists: [],
    clients: [],
    sessions: [],
    notes: [],
    payments: [],
    tiers: [],
    availabilities: [],
  };
};

const getTimezoneOffsetMs = (timeZone = 'Asia/Kolkata', refDate = new Date()) => {
  try {
    const tzDate = new Date(refDate.toLocaleString('en-US', { timeZone }));
    const utcDate = new Date(refDate.toLocaleString('en-US', { timeZone: 'UTC' }));
    return tzDate.getTime() - utcDate.getTime();
  } catch (e) {
    return 5.5 * 3600 * 1000;
  }
};

const mockDbFallback = (req, res, next) => {
  // If MongoDB is actively connected, allow normal Mongoose controllers to run
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  // Only intercept /api routes
  if (!req.originalUrl.startsWith('/api')) {
    return next();
  }

  const url = req.path; // e.g. /auth/login, /therapist/profile/dr-sharma
  const method = req.method.toLowerCase();
  const data = loadSnapshot();

  const ok = (payload, status = 200) => res.status(status).json(payload);
  const fail = (message, status = 400) => res.status(status).json({ success: false, message });

  // 1. Doctor Login
  if (method === 'post' && url === '/auth/login') {
    const email = (req.body?.email || '').toLowerCase().trim();
    const prefix = email.split('@')[0];

    const doctor =
      data.therapists?.find((t) => {
        const tPrefix = (t.email || '').toLowerCase().split('@')[0];
        return (t.email || '').toLowerCase() === email || tPrefix === prefix;
      }) ||
      data.therapists?.[0] || {
        _id: 'dr_default_id',
        name: 'Dr. Ananya Sharma',
        email: 'dr.sharma@serenova.care',
        slug: 'dr-sharma',
        subscriptionTier: 'pro',
        sessionFee: 2500,
      };

    return ok({
      success: true,
      token: 'demo_token_' + doctor._id,
      therapist: doctor,
      entitlements: {
        tier: doctor.subscriptionTier || 'pro',
        displayName: 'Clinical Pro',
        caps: { activeClients: 999999, monthlySessions: 999999 },
        features: {
          noteTemplates: ['freeform', 'soap', 'dap'],
          analyticsDepth: 'advanced_aggregation',
          canSellPackages: true,
          automatedWhatsApp: true,
          customBranding: true,
          prioritySupport: true,
        },
      },
    });
  }

  // 2. Doctor Registration
  if (method === 'post' && url === '/auth/register') {
    const newDoc = {
      _id: 'dr_' + Date.now(),
      name: req.body?.name || 'New Practitioner',
      email: (req.body?.email || '').toLowerCase().trim(),
      slug: (req.body?.name || 'practitioner').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      subscriptionTier: 'pro',
      sessionFee: req.body?.sessionFee || 2000,
      bio: req.body?.bio || 'Clinical psychologist providing holistic psychotherapy.',
    };
    if (data.therapists) data.therapists.push(newDoc);
    return ok({
      success: true,
      token: 'demo_token_' + newDoc._id,
      therapist: newDoc,
      entitlements: {
        tier: 'pro',
        displayName: 'Clinical Pro',
        caps: { activeClients: 999999, monthlySessions: 999999 },
        features: {
          noteTemplates: ['freeform', 'soap', 'dap'],
          analyticsDepth: 'advanced_aggregation',
          canSellPackages: true,
          automatedWhatsApp: true,
          customBranding: true,
          prioritySupport: true,
        },
      },
    });
  }

  // 3. Client Login
  if (
    method === 'post' &&
    (url === '/auth/client/login' || url === '/auth/client-login' || url === '/auth/client/register')
  ) {
    const email = (req.body?.email || '').toLowerCase().trim();
    let client = data.clients?.find((c) => (c.email || '').toLowerCase() === email);

    if (!client) {
      client = {
        _id: 'client_' + Date.now(),
        name: req.body?.name || email.split('@')[0].replace('.', ' ') || 'Guest Client',
        email,
        phone: req.body?.phone || '+91 99887 76655',
        status: 'active',
      };
      if (data.clients) data.clients.push(client);
    }

    return ok({
      success: true,
      client,
      role: 'client',
      message: 'Client authenticated successfully',
    });
  }

  // 4. Current Doctor Session
  if (method === 'get' && url === '/auth/me') {
    const doctor = data.therapists?.[0] || {
      _id: 'dr_default_id',
      name: 'Dr. Ananya Sharma',
      email: 'dr.sharma@serenova.care',
      slug: 'dr-sharma',
      subscriptionTier: 'pro',
      sessionFee: 2500,
    };
    return ok({
      success: true,
      therapist: doctor,
      entitlements: {
        tier: doctor.subscriptionTier || 'pro',
        displayName: 'Clinical Pro',
        caps: { activeClients: 999999, monthlySessions: 999999 },
        features: {
          noteTemplates: ['freeform', 'soap', 'dap'],
          analyticsDepth: 'advanced_aggregation',
          canSellPackages: true,
          automatedWhatsApp: true,
          customBranding: true,
          prioritySupport: true,
        },
      },
    });
  }

  // 5. Upgrade Tier
  if (method === 'post' && url === '/therapist/upgrade-tier') {
    const targetTier = req.body?.targetTier || 'pro';
    if (data.therapists?.[0]) {
      data.therapists[0].subscriptionTier = targetTier;
    }
    return ok({
      success: true,
      tier: targetTier,
      entitlements: {
        tier: targetTier,
        displayName: targetTier.toUpperCase(),
        caps: { activeClients: 999999, monthlySessions: 999999 },
        features: {
          noteTemplates: ['freeform', 'soap', 'dap'],
          analyticsDepth: 'advanced_aggregation',
          canSellPackages: true,
          automatedWhatsApp: true,
          customBranding: true,
          prioritySupport: true,
        },
      },
    });
  }

  // 6. Directory & Doctor Profile
  if (method === 'get' && url === '/therapist/all') {
    return ok({ success: true, therapists: data.therapists || [] });
  }

  if (method === 'put' && url === '/therapist/profile') {
    if (data.therapists?.[0]) {
      Object.assign(data.therapists[0], req.body);
    }
    return ok({
      success: true,
      therapist: data.therapists?.[0],
      message: 'Profile updated successfully',
    });
  }

  if (method === 'get' && url.startsWith('/therapist/profile/')) {
    const slug = url.split('/')[3] || 'dr-sharma';
    const doctor =
      data.therapists?.find((t) => t.slug === slug) ||
      data.therapists?.[0] || {
        _id: 'dr_default_id',
        name: 'Dr. Ananya Sharma',
        email: 'dr.sharma@serenova.care',
        slug: 'dr-sharma',
        sessionFee: 2500,
      };

    const packages = [
      {
        _id: 'pkg_3_' + doctor._id,
        therapist_id: doctor._id,
        name: 'Therapy Starter Bundle (3 Sessions)',
        sessionCount: 3,
        totalPrice: Math.round(doctor.sessionFee * 3 * 0.9),
        perSessionRate: Math.round(doctor.sessionFee * 0.9),
        discountPercentage: 10,
        validityDays: 60,
        description: 'Targeted intervention for acute concerns and structured goal-setting.',
      },
      {
        _id: 'pkg_6_' + doctor._id,
        therapist_id: doctor._id,
        name: 'Transformational Journey (6 Sessions)',
        sessionCount: 6,
        totalPrice: Math.round(doctor.sessionFee * 6 * 0.85),
        perSessionRate: Math.round(doctor.sessionFee * 0.85),
        discountPercentage: 15,
        validityDays: 120,
        description: 'Comprehensive CBT/ACT therapeutic roadmap addressing root cognitive distortions.',
      },
    ];

    return ok({
      success: true,
      therapist: doctor,
      packages,
      openGraph: {
        title: `${doctor.name} | Licensed Clinical Psychologist`,
        description: doctor.bio || 'Book private and confidential psychotherapy sessions.',
      },
    });
  }

  // 7. Client Portal Data
  if (method === 'get' && (url === '/clients/portal/me' || url === '/client/portal/me')) {
    const email = (req.query?.email || '').toLowerCase().trim();
    const client =
      data.clients?.find((c) => (c.email || '').toLowerCase() === email) || data.clients?.[0];
    const therapistSlug = req.query?.therapist || 'dr-sharma';
    const therapist =
      data.therapists?.find((t) => t.slug === therapistSlug) || data.therapists?.[0];

    const clientEmail = (client?.email || '').toLowerCase();
    const clientId = client?._id;

    // Filter confirmed/paid sessions for this client
    const sessions = (data.sessions || []).filter(
      (s) =>
        (s.clientEmail && s.clientEmail.toLowerCase() === clientEmail) ||
        (s.client_id && s.client_id === clientId) ||
        (s.client && (s.client.email || '').toLowerCase() === clientEmail)
    );

    const sharedNotes = (data.notes || []).filter((n) => n.type === 'shared');
    const payments = (data.payments || []).filter(
      (p) =>
        (p.clientEmail && p.clientEmail.toLowerCase() === clientEmail) ||
        (p.client_id && p.client_id === clientId)
    );

    return ok({
      success: true,
      client,
      therapist,
      sessions,
      sharedNotes,
      payments,
      packages: [],
    });
  }

  // 8. Clients List and CRUD
  if (method === 'get' && url === '/clients') {
    let list = data.clients || [];
    if (req.query?.status) {
      list = list.filter((c) => c.status === req.query.status);
    }
    return ok({ success: true, clients: list, count: list.length });
  }

  if (method === 'get' && url.startsWith('/clients/')) {
    const id = url.split('/')[2];
    const client = data.clients?.find((c) => c._id === id) || data.clients?.[0];
    return ok({ success: true, client });
  }

  if (method === 'post' && url === '/clients') {
    const newClient = {
      _id: 'client_' + Date.now(),
      name: req.body?.name || 'New Client',
      email: req.body?.email || '',
      phone: req.body?.phone || '',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    if (data.clients) data.clients.push(newClient);
    return ok({ success: true, client: newClient });
  }

  // 9. Scheduling Open Slots
  if (method === 'get' && url.startsWith('/scheduling/open-slots/')) {
    const date = req.query?.date || new Date().toISOString().split('T')[0];
    const duration = parseInt(req.query?.durationMinutes || 50, 10);
    const tz = req.query?.timezone || 'Asia/Kolkata';

    const [year, month, day] = date.split('-').map(Number);
    const ranges = [
      { startTime: '10:00', endTime: '13:00' },
      { startTime: '14:30', endTime: '18:30' },
    ];
    const generatedSlots = [];

    // Booked sessions for this date
    const bookedSessions = (data.sessions || []).filter(
      (s) => s.status !== 'cancelled' && s.paymentStatus !== 'failed'
    );

    for (const range of ranges) {
      const [startHour, startMin] = range.startTime.split(':').map(Number);
      const [endHour, endMin] = range.endTime.split(':').map(Number);

      const nominalStart = new Date(Date.UTC(year, month - 1, day, startHour, startMin));
      const offsetMs = getTimezoneOffsetMs(tz, nominalStart);
      let slotStart = new Date(nominalStart.getTime() - offsetMs);

      const nominalEnd = new Date(Date.UTC(year, month - 1, day, endHour, endMin));
      const rangeEnd = new Date(nominalEnd.getTime() - offsetMs);

      while (slotStart.getTime() + duration * 60000 <= rangeEnd.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);
        const startIso = slotStart.toISOString();

        // Check if conflict
        const isConflict = bookedSessions.some((s) => {
          if (!s.startTime) return false;
          const sStart = new Date(s.startTime).getTime();
          const sEnd = s.endTime ? new Date(s.endTime).getTime() : sStart + 50 * 60000;
          return slotStart.getTime() < sEnd && slotEnd.getTime() > sStart;
        });

        if (!isConflict) {
          generatedSlots.push({
            startTime: startIso,
            endTime: slotEnd.toISOString(),
            formattedTime: slotStart.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: tz,
              hour12: true,
            }),
            durationMinutes: duration,
          });
        }
        slotStart = new Date(slotEnd.getTime() + 15 * 60000);
      }
    }

    return ok({
      success: true,
      date,
      timezone: tz,
      slots: generatedSlots,
      slotsCount: generatedSlots.length,
    });
  }

  // 10. Sessions List and Filtering
  if (method === 'get' && url === '/scheduling/sessions') {
    let list = data.sessions || [];
    if (req.query?._id) {
      list = list.filter((s) => s._id === req.query._id);
    }
    if (req.query?.status) {
      if (req.query.status === 'scheduled') {
        list = list.filter((s) => s.status === 'scheduled' || s.status === 'confirmed');
      } else {
        list = list.filter((s) => s.status === req.query.status);
      }
    }
    return ok({ success: true, count: list.length, sessions: list });
  }

  // 11. Availability
  if (method === 'get' && url === '/scheduling/availability') {
    return ok({ success: true, availability: data.availabilities?.[0] });
  }

  if (method === 'put' && url === '/scheduling/availability') {
    if (data.availabilities?.[0]) {
      Object.assign(data.availabilities[0], req.body);
    }
    return ok({ success: true, availability: data.availabilities?.[0] });
  }

  // 12. Book Session
  if (method === 'post' && url === '/scheduling/book') {
    const doctor = data.therapists?.[0] || { sessionFee: 2500 };
    const duration = req.body?.durationMinutes || 50;
    const reqStart = new Date(req.body?.startTime).getTime();

    // Check if conflicting booked session
    const conflict = (data.sessions || []).find((s) => {
      if (s.status === 'cancelled') return false;
      if (!s.startTime) return false;
      const sStart = new Date(s.startTime).getTime();
      return Math.abs(sStart - reqStart) < 30 * 60000;
    });

    if (conflict && (conflict.status === 'confirmed' || conflict.paymentStatus === 'paid')) {
      return fail('This slot was just booked by another client. Please select another time.', 409);
    }

    const newSession = {
      _id: 'sess_' + Date.now(),
      therapist_id: doctor._id,
      clientName: req.body?.clientName,
      clientEmail: req.body?.clientEmail,
      clientPhone: req.body?.clientPhone,
      startTime: req.body?.startTime,
      endTime: new Date(new Date(req.body?.startTime).getTime() + duration * 60000).toISOString(),
      durationMinutes: duration,
      status: 'scheduled',
      paymentStatus: 'pending',
      fee: req.body?.fee || doctor.sessionFee || 2500,
      sessionType: req.body?.sessionType || 'Individual Therapy',
      createdAt: new Date().toISOString(),
    };
    if (data.sessions) data.sessions.push(newSession);

    return ok({
      success: true,
      session: newSession,
      client: { name: req.body?.clientName, email: req.body?.clientEmail },
    });
  }

  // 13. Cancel Session
  if (method === 'post' && url === '/scheduling/cancel') {
    const id = req.body?.sessionId;
    const session = data.sessions?.find((s) => s._id === id);
    if (session) {
      session.status = 'cancelled';
    }
    return ok({ success: true, message: 'Session cancelled successfully' });
  }

  // 14. Patch Session Status
  if (method === 'patch' && url.startsWith('/scheduling/sessions/')) {
    const id = url.split('/')[3];
    const session = data.sessions?.find((s) => s._id === id);
    if (session) {
      if (req.body?.status) session.status = req.body.status;
    }
    return ok({ success: true, session });
  }

  // 15. Waitlist
  if (method === 'post' && url === '/scheduling/waitlist') {
    return ok({
      success: true,
      message: 'You have been placed on priority waitlist. We will notify you if a slot opens.',
    });
  }

  // 16. Notes
  if (method === 'get' && url === '/notes') {
    let list = data.notes || [];
    if (req.query?.clientId) {
      list = list.filter((n) => n.client_id === req.query.clientId);
    }
    return ok({ success: true, notes: list });
  }

  if (method === 'post' && url === '/notes') {
    const newNote = {
      _id: 'note_' + Date.now(),
      client_id: req.body?.clientId || data.clients?.[0]?._id,
      therapist_id: data.therapists?.[0]?._id,
      session_id: req.body?.sessionId,
      type: req.body?.type || 'clinical',
      title: req.body?.title || 'Session Note',
      content: req.body?.content || '',
      soap: req.body?.soap || {},
      dap: req.body?.dap || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (data.notes) data.notes.push(newNote);
    return ok({ success: true, note: newNote });
  }

  if (method === 'delete' && url.startsWith('/notes/')) {
    const id = url.split('/')[2];
    if (data.notes) {
      data.notes = data.notes.filter((n) => n._id !== id);
    }
    return ok({ success: true, message: 'Note deleted successfully' });
  }

  // 17. Analytics
  if (method === 'get' && url === '/analytics') {
    const payments = data.payments || [];
    const sessions = data.sessions || [];
    const clients = data.clients || [];

    const grossRev = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 128000;
    const netRev = Math.round(grossRev * 0.95);
    const scheduledUpcoming = sessions.filter((s) => ['scheduled', 'confirmed'].includes(s.status)).length || 10;
    const completedSessions = sessions.filter((s) => s.status === 'completed').length || 12;
    const noShowSessions = sessions.filter((s) => s.status === 'no_show').length || 1;
    const totalFinished = completedSessions + noShowSessions;
    const noShowRate = totalFinished > 0 ? Math.round((noShowSessions / totalFinished) * 100 * 10) / 10 : 5.6;

    const summary = {
      totalNetRevenue: netRev,
      totalGrossRevenue: grossRev,
      activeClients: clients.length || 7,
      totalClients: clients.length || 7,
      noShowRate: noShowRate || 5.6,
      completedSessions: completedSessions || 12,
      scheduledUpcoming: scheduledUpcoming || 10,
    };

    const kpis = {
      totalRevenue: grossRev,
      activeClientsCount: clients.length || 7,
      monthlySessionsCount: sessions.length || 19,
      completedSessionsCount: completedSessions || 12,
      noShowRatePct: noShowRate || 5.6,
    };

    const charts = {
      revenueTrend: [
        { month: '2026-06', grossRevenue: 18000, netRevenue: 17100, platformFeeTotal: 900, transactionCount: 8 },
        { month: '2026-07', grossRevenue: 24500, netRevenue: 23275, platformFeeTotal: 1225, transactionCount: 11 },
        { month: '2026-08', grossRevenue: 27000, netRevenue: 25650, platformFeeTotal: 1350, transactionCount: 12 },
        { month: '2026-09', grossRevenue: 31500, netRevenue: 29925, platformFeeTotal: 1575, transactionCount: 14 },
        { month: '2026-10', grossRevenue: 35000, netRevenue: 33250, platformFeeTotal: 1750, transactionCount: 15 },
        { month: '2026-11', grossRevenue: grossRev, netRevenue: netRev, platformFeeTotal: Math.round(grossRev * 0.05), transactionCount: payments.length || 15 },
      ],
      sessionBreakdown: [
        { name: 'Completed', value: completedSessions, color: '#10B981' },
        { name: 'Scheduled', value: scheduledUpcoming, color: '#3B82F6' },
        { name: 'Cancelled', value: sessions.filter((s) => s.status === 'cancelled').length || 1, color: '#F59E0B' },
        { name: 'No Show', value: noShowSessions, color: '#EF4444' },
      ],
      sessionTypes: [
        { sessionType: 'Individual Therapy', count: 10, revenue: 25000 },
        { sessionType: 'CBT Consultation', count: 5, revenue: 12500 },
        { sessionType: 'Couples Counseling', count: 4, revenue: 10000 },
      ],
      clientStatus: [
        { _id: 'active', count: clients.length || 7 },
      ],
    };

    return ok({
      success: true,
      summary,
      kpis,
      charts,
      monthlyRevenue: charts.revenueTrend.map((r) => ({ month: r.month, revenue: r.grossRevenue, sessions: r.transactionCount })),
      attendanceBreakdown: charts.sessionBreakdown.map((b) => ({ status: b.name, count: b.value, percentage: Math.round((b.value / (sessions.length || 1)) * 100) })),
    });
  }

  // 18. Notifications Logs
  if (method === 'get' && url === '/notifications/logs') {
    return ok({
      success: true,
      logs: [
        {
          id: '1',
          channel: 'WHATSAPP_STUB',
          template: 'booking_confirmed',
          recipient: '+91 99887 76655',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '2',
          channel: 'EMAIL',
          template: 'payment_confirmed',
          recipient: 'rohan.verma@example.com',
          timestamp: new Date(Date.now() - 3550000).toISOString(),
        },
      ],
    });
  }

  // 19. Payments
  if (method === 'post' && url === '/payments/create-order') {
    return ok({
      success: true,
      order: {
        id: 'order_test_' + Date.now(),
        amount: Math.round(Number(req.body?.amount || 2500) * 100),
        currency: 'INR',
      },
    });
  }

  if (method === 'post' && url === '/payments/verify-coupon') {
    const code = (req.body?.code || '').toUpperCase().trim();
    if (code === 'WELCOME10' || code === 'SERENOVA10') {
      return ok({ success: true, valid: true, discountPercentage: 10, code });
    }
    if (code === 'SERENOVA20') {
      return ok({ success: true, valid: true, discountPercentage: 20, code });
    }
    return ok({ success: true, valid: true, discountPercentage: 10, code });
  }

  if (method === 'post' && url === '/payments/verify') {
    const invNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPayment = {
      _id: 'pay_' + Date.now(),
      amount: req.body?.amount || 2500,
      status: 'completed',
      invoiceNumber: invNum,
      sacCode: '999312',
      createdAt: new Date().toISOString(),
    };
    if (data.payments) data.payments.push(newPayment);

    // If session ID passed, update session status to confirmed
    if (req.body?.sessionId && data.sessions) {
      const sess = data.sessions.find((s) => s._id === req.body.sessionId);
      if (sess) {
        sess.status = 'confirmed';
        sess.paymentStatus = 'paid';
      }
    }

    return ok({
      success: true,
      payment: newPayment,
      message: 'Payment verified successfully',
    });
  }

  // 20. Backup status & trigger
  if (method === 'get' && url === '/backup/status') {
    return ok({
      success: true,
      backup: {
        exists: true,
        healthy: true,
        counts: {
          therapists: data.therapists?.length || 0,
          clients: data.clients?.length || 0,
          sessions: data.sessions?.length || 0,
          payments: data.payments?.length || 0,
          notes: data.notes?.length || 0,
        },
      },
    });
  }

  // 21. Safe Catch-All for unknown /api requests:
  // NEVER pass unknown /api requests to next() when disconnected, as that buffers Mongoose and throws 500!
  return ok({
    success: true,
    message: 'Pre-loaded mock snapshot endpoint acknowledged',
    simulated: true,
  });
};

module.exports = mockDbFallback;
