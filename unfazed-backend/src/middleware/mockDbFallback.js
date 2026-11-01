const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const snapshotPath = path.join(__dirname, '../../uploads/backups/data_snapshot.json');
let snapshotData = null;

const loadSnapshot = () => {
  if (snapshotData) return snapshotData;
  try {
    if (fs.existsSync(snapshotPath)) {
      const raw = fs.readFileSync(snapshotPath, 'utf8');
      const parsed = JSON.parse(raw);
      snapshotData = parsed.data || {};
      return snapshotData;
    }
  } catch (e) {
    console.error('[MockDbFallback] Error loading snapshot:', e.message);
  }
  return { therapists: [], clients: [], sessions: [], notes: [], payments: [] };
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

  // Helper response
  const ok = (payload, status = 200) => res.status(status).json(payload);

  // 1. Doctor Login
  if (method === 'post' && url === '/auth/login') {
    const email = (req.body.email || '').toLowerCase().trim();
    const prefix = email.split('@')[0];

    const doctor = data.therapists?.find((t) => {
      const tPrefix = t.email.toLowerCase().split('@')[0];
      return t.email.toLowerCase() === email || tPrefix === prefix;
    }) || data.therapists?.[0] || {
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

  // 2. Client Login
  if (method === 'post' && (url === '/auth/client/login' || url === '/auth/client-login' || url === '/auth/client/register')) {
    const email = (req.body.email || '').toLowerCase().trim();
    let client = data.clients?.find((c) => c.email.toLowerCase() === email);

    if (!client) {
      client = {
        _id: 'client_' + Date.now(),
        name: req.body.name || email.split('@')[0].replace('.', ' '),
        email,
        phone: req.body.phone || '+91 99887 76655',
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

  // 3. Current Doctor Session
  if (method === 'get' && url === '/auth/me') {
    const doctor = data.therapists?.[0];
    return ok({
      success: true,
      therapist: doctor,
      entitlements: {
        tier: doctor?.subscriptionTier || 'pro',
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

  // 4. Directory & Doctor Profile
  if (method === 'get' && url === '/therapist/all') {
    return ok({ success: true, therapists: data.therapists || [] });
  }

  if (method === 'get' && url.startsWith('/therapist/profile/')) {
    const slug = url.split('/')[3] || 'dr-sharma';
    const doctor = data.therapists?.find((t) => t.slug === slug) || data.therapists?.[0];
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

  // 5. Client Portal Data
  if (method === 'get' && (url === '/clients/portal/me' || url === '/client/portal/me')) {
    const email = (req.query.email || '').toLowerCase().trim();
    const client = data.clients?.find((c) => c.email.toLowerCase() === email) || data.clients?.[0];
    const therapistSlug = req.query.therapist || 'dr-sharma';
    const therapist = data.therapists?.find((t) => t.slug === therapistSlug) || data.therapists?.[0];

    const sessions = (data.sessions || []).filter(
      (s) => s.clientEmail?.toLowerCase() === client.email.toLowerCase() || s.client_id === client._id
    );
    const sharedNotes = (data.notes || []).filter((n) => n.type === 'shared');
    const payments = (data.payments || []).filter(
      (p) => p.clientEmail?.toLowerCase() === client.email.toLowerCase() || p.client_id === client._id
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

  // 6. Clients List
  if (method === 'get' && url === '/clients') {
    return ok({ success: true, clients: data.clients || [], count: data.clients?.length || 0 });
  }

  // 7. Scheduling Slots
  if (method === 'get' && url.startsWith('/scheduling/open-slots/')) {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const duration = parseInt(req.query.durationMinutes || 50, 10);
    const tz = req.query.timezone || 'Asia/Kolkata';

    const [year, month, day] = date.split('-').map(Number);
    const ranges = [
      { startTime: '10:00', endTime: '13:00' },
      { startTime: '14:30', endTime: '18:30' },
    ];
    const generatedSlots = [];

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
        generatedSlots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          formattedTime: slotStart.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: tz,
            hour12: true,
          }),
          durationMinutes: duration,
        });
        slotStart = new Date(slotEnd.getTime() + 15 * 60000);
      }
    }

    return ok({ success: true, date, timezone: tz, slots: generatedSlots, slotsCount: generatedSlots.length });
  }

  // 8. Sessions List
  if (method === 'get' && url === '/scheduling/sessions') {
    let list = data.sessions || [];
    if (req.query.status) list = list.filter((s) => s.status === req.query.status);
    return ok({ success: true, sessions: list });
  }

  // 9. Availability
  if (method === 'get' && url === '/scheduling/availability') {
    return ok({ success: true, availability: data.availabilities?.[0] });
  }

  // 10. Book Session
  if (method === 'post' && url === '/scheduling/book') {
    const doctor = data.therapists?.[0];
    const duration = req.body.durationMinutes || 50;
    const newSession = {
      _id: 'sess_' + Date.now(),
      therapist_id: doctor._id,
      clientName: req.body.clientName,
      clientEmail: req.body.clientEmail,
      clientPhone: req.body.clientPhone,
      startTime: req.body.startTime,
      endTime: new Date(new Date(req.body.startTime).getTime() + duration * 60000).toISOString(),
      durationMinutes: duration,
      status: 'pending',
      paymentStatus: 'pending',
      fee: req.body.fee || doctor.sessionFee || 2500,
      sessionType: 'Individual Therapy',
      createdAt: new Date().toISOString(),
    };
    if (data.sessions) data.sessions.push(newSession);
    return ok({ success: true, session: newSession, client: { name: req.body.clientName, email: req.body.clientEmail } });
  }

  // 11. Notes
  if (method === 'get' && url === '/notes') {
    let list = data.notes || [];
    if (req.query.clientId) list = list.filter((n) => n.client_id === req.query.clientId);
    return ok({ success: true, notes: list });
  }

  // 12. Analytics
  if (method === 'get' && url === '/analytics') {
    return ok({
      success: true,
      kpis: {
        totalRevenue: 128000,
        activeClientsCount: data.clients?.length || 7,
        monthlySessionsCount: data.sessions?.length || 18,
        completedSessionsCount: 12,
        noShowRatePct: 5.6,
      },
      monthlyRevenue: [
        { month: '2026-06', revenue: 18000, sessions: 8 },
        { month: '2026-07', revenue: 24500, sessions: 11 },
        { month: '2026-08', revenue: 27000, sessions: 12 },
        { month: '2026-09', revenue: 31500, sessions: 14 },
        { month: '2026-10', revenue: 35000, sessions: 15 },
      ],
      attendanceBreakdown: [
        { status: 'Completed', count: 12, percentage: 67 },
        { status: 'Scheduled', count: 5, percentage: 28 },
        { status: 'No-Show', count: 1, percentage: 5 },
      ],
    });
  }

  // 13. Notifications Logs
  if (method === 'get' && url === '/notifications/logs') {
    return ok({
      success: true,
      logs: [
        { id: '1', channel: 'WHATSAPP_STUB', template: 'booking_confirmed', recipient: '+91 99887 76655', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', channel: 'EMAIL', template: 'payment_confirmed', recipient: 'rohan.verma@example.com', timestamp: new Date(Date.now() - 3550000).toISOString() },
      ],
    });
  }

  // 14. Payments
  if (method === 'post' && url === '/payments/create-order') {
    return ok({
      success: true,
      order: {
        id: 'order_test_' + Date.now(),
        amount: Math.round(Number(req.body.amount) * 100),
        currency: 'INR',
      },
    });
  }

  if (method === 'post' && url === '/payments/verify') {
    return ok({
      success: true,
      payment: {
        _id: 'pay_' + Date.now(),
        amount: req.body.amount,
        status: 'completed',
        invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        sacCode: '999312',
        createdAt: new Date().toISOString(),
      },
      message: 'Payment verified successfully',
    });
  }

  return next();
};

module.exports = mockDbFallback;
