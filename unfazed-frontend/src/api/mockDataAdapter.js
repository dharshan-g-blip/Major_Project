import initialData from './mockData.json';

// Local storage key for persistent demo state
const STORAGE_KEY = 'unfazed_demo_db_v1';

// Helper to get or initialize persistent demo database
const getDB = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('[MockDB] Error reading from localStorage:', e);
  }

  // Clone initial data
  const db = JSON.parse(JSON.stringify(initialData));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {}
  return db;
};

// Helper to save database back to localStorage
const saveDB = (db) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn('[MockDB] Error saving to localStorage:', e);
  }
};

// Compute timezone offset helper
const getTimezoneOffsetMs = (timeZone = 'Asia/Kolkata', refDate = new Date()) => {
  try {
    const tzDate = new Date(refDate.toLocaleString('en-US', { timeZone }));
    const utcDate = new Date(refDate.toLocaleString('en-US', { timeZone: 'UTC' }));
    return tzDate.getTime() - utcDate.getTime();
  } catch (e) {
    return 5.5 * 3600 * 1000;
  }
};

/**
 * Handle incoming Axios request with resilient client-side data
 * @param {object} config - Axios request config
 * @returns {object|null} Axios-like response object { data, status, statusText, headers, config }
 */
export const handleMockRequest = (config) => {
  const method = (config.method || 'get').toLowerCase();
  let url = config.url || '';

  // Strip baseUrl if prepended
  if (url.startsWith('/api')) {
    url = url.substring(4);
  }

  const [path, queryString] = url.split('?');
  const queryParams = { ...config.params };

  if (queryString) {
    const searchParams = new URLSearchParams(queryString);
    for (const [key, val] of searchParams.entries()) {
      queryParams[key] = val;
    }
  }

  let body = {};
  if (config.data) {
    try {
      body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    } catch (e) {
      body = config.data;
    }
  }

  const db = getDB();

  // Helper response builder
  const ok = (data, status = 200) => ({
    data,
    status,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    config,
  });

  // -------------------------------------------------------------
  // 1. AUTHENTICATION ROUTES
  // -------------------------------------------------------------

  // POST /auth/login (Doctor Login)
  if (method === 'post' && path === '/auth/login') {
    const email = (body.email || '').toLowerCase().trim();
    const prefix = email.split('@')[0];

    let doctor = db.therapists.find((t) => {
      const tPrefix = t.email.toLowerCase().split('@')[0];
      return t.email.toLowerCase() === email || tPrefix === prefix || t.slug === prefix.replace('dr.', 'dr-');
    });

    if (!doctor) {
      // Default to Dr. Sharma if not matched
      doctor = db.therapists[0];
    }

    const entitlements = {
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
    };

    return ok({
      success: true,
      token: 'demo_jwt_token_' + doctor._id,
      therapist: doctor,
      entitlements,
    });
  }

  // POST /auth/client/login or /auth/client-login (Client Login)
  if (method === 'post' && (path === '/auth/client/login' || path === '/auth/client-login' || path === '/auth/client/register')) {
    const email = (body.email || '').toLowerCase().trim();
    let client = db.clients.find((c) => c.email.toLowerCase() === email);

    if (!client) {
      // Create new demo client on the fly
      client = {
        _id: 'client_' + Date.now(),
        name: body.name || email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        email,
        phone: body.phone || '+91 98888 77777',
        status: 'active',
        therapist_id: db.therapists[0]._id,
        createdAt: new Date().toISOString(),
      };
      db.clients.push(client);
      saveDB(db);
    }

    return ok({
      success: true,
      client,
      role: 'client',
      message: 'Client authenticated successfully',
    });
  }

  // POST /auth/register (Doctor Register)
  if (method === 'post' && path === '/auth/register') {
    const newDoc = {
      _id: 'doc_' + Date.now(),
      name: body.name || 'Dr. Practitioner',
      email: body.email,
      slug: (body.name || 'dr-demo').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      subscriptionTier: 'starter',
      specializations: ['Cognitive Behavioral Therapy (CBT)'],
      languages: ['English', 'Hindi'],
      sessionFee: body.sessionFee || 2500,
      qualifications: 'Licensed Clinical Psychologist',
    };
    db.therapists.push(newDoc);
    saveDB(db);

    return ok({
      success: true,
      token: 'demo_jwt_token_' + newDoc._id,
      therapist: newDoc,
      entitlements: {
        tier: 'starter',
        displayName: 'Solo Practitioner',
        caps: { activeClients: 25, monthlySessions: 100 },
        features: {
          noteTemplates: ['freeform', 'soap'],
          analyticsDepth: 'standard_trends',
          canSellPackages: true,
          automatedWhatsApp: true,
          customBranding: true,
          prioritySupport: false,
        },
      },
    });
  }

  // GET /auth/me
  if (method === 'get' && path === '/auth/me') {
    const doctor = db.therapists[0];
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

  // -------------------------------------------------------------
  // 2. THERAPIST DIRECTORY & PROFILE ROUTES
  // -------------------------------------------------------------

  // GET /therapist/all
  if (method === 'get' && path === '/therapist/all') {
    return ok({ success: true, therapists: db.therapists });
  }

  // GET /therapist/profile/:slug
  if (method === 'get' && path.startsWith('/therapist/profile/')) {
    const slug = path.split('/')[3] || 'dr-sharma';
    const doctor = db.therapists.find((t) => t.slug === slug) || db.therapists[0];

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
        description: 'Targeted intervention for acute concerns, coping strategies, and structured goal-setting.',
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
        description: 'Comprehensive CBT/ACT therapeutic roadmap addressing root cognitive distortions and long-term habits.',
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

  // PUT /therapist/profile
  if (method === 'put' && path === '/therapist/profile') {
    const doctor = db.therapists[0];
    Object.assign(doctor, body);
    saveDB(db);
    return ok({ success: true, therapist: doctor, message: 'Profile updated successfully' });
  }

  // POST /therapist/upgrade-tier
  if (method === 'post' && path === '/therapist/upgrade-tier') {
    const targetTier = body.targetTier || 'pro';
    const doctor = db.therapists[0];
    doctor.subscriptionTier = targetTier;
    saveDB(db);
    return ok({
      success: true,
      message: `Upgraded to ${targetTier} plan successfully`,
      entitlements: {
        tier: targetTier,
        displayName: targetTier === 'pro' ? 'Clinical Pro' : 'Solo Practitioner',
        caps: targetTier === 'pro' ? { activeClients: 999999, monthlySessions: 999999 } : { activeClients: 25, monthlySessions: 100 },
        features: {
          noteTemplates: targetTier === 'pro' ? ['freeform', 'soap', 'dap'] : ['freeform', 'soap'],
          analyticsDepth: targetTier === 'pro' ? 'advanced_aggregation' : 'standard_trends',
          canSellPackages: true,
          automatedWhatsApp: true,
          customBranding: true,
          prioritySupport: targetTier === 'pro',
        },
      },
    });
  }

  // -------------------------------------------------------------
  // 3. CLIENT CRM & PORTAL ROUTES
  // -------------------------------------------------------------

  // GET /clients
  if (method === 'get' && (path === '/clients' || path === '/clients/')) {
    return ok({ success: true, clients: db.clients, count: db.clients.length });
  }

  // GET /clients/:id
  if (method === 'get' && path.startsWith('/clients/') && !path.includes('/portal/')) {
    const id = path.split('/')[2];
    const client = db.clients.find((c) => c._id === id) || db.clients[0];
    const sessions = db.sessions.filter((s) => s.client_id === client._id);
    return ok({ success: true, client, sessions });
  }

  // POST /clients
  if (method === 'post' && (path === '/clients' || path === '/clients/')) {
    const newClient = {
      _id: 'client_' + Date.now(),
      therapist_id: db.therapists[0]._id,
      name: body.name,
      email: body.email,
      phone: body.phone,
      status: body.status || 'active',
      tags: body.tags ? body.tags.split(',').map((t) => t.trim()) : ['Individual Therapy'],
      createdAt: new Date().toISOString(),
    };
    db.clients.unshift(newClient);
    saveDB(db);
    return ok({ success: true, client: newClient, message: 'Client created successfully' });
  }

  // GET /clients/portal/me (Client Sanctuary Portal Data)
  if (method === 'get' && (path === '/clients/portal/me' || path === '/client/portal/me')) {
    const email = (queryParams.email || '').toLowerCase().trim();
    let client = db.clients.find((c) => c.email.toLowerCase() === email) || db.clients[0];

    const therapistSlug = queryParams.therapist || 'dr-sharma';
    const therapist = db.therapists.find((t) => t.slug === therapistSlug) || db.therapists[0];

    const sessions = db.sessions.filter((s) => s.clientEmail?.toLowerCase() === client.email.toLowerCase() || s.client_id === client._id);
    const sharedNotes = db.notes.filter((n) => n.type === 'shared');
    const payments = db.payments.filter((p) => p.clientEmail?.toLowerCase() === client.email.toLowerCase() || p.client_id === client._id);

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

  // -------------------------------------------------------------
  // 4. SCHEDULING, SLOTS & BOOKING ROUTES
  // -------------------------------------------------------------

  // GET /scheduling/open-slots/:slug
  if (method === 'get' && path.startsWith('/scheduling/open-slots/')) {
    const slug = path.split('/')[3] || 'dr-sharma';
    const date = queryParams.date || new Date().toISOString().split('T')[0];
    const duration = parseInt(queryParams.durationMinutes || 50, 10);
    const tz = queryParams.timezone || 'Asia/Kolkata';

    const [year, month, day] = date.split('-').map(Number);
    const activeRanges = [
      { startTime: '10:00', endTime: '13:00' },
      { startTime: '14:30', endTime: '18:30' },
    ];

    const generatedSlots = [];
    const buffer = 15;

    for (const range of activeRanges) {
      const [startHour, startMin] = range.startTime.split(':').map(Number);
      const [endHour, endMin] = range.endTime.split(':').map(Number);

      const nominalStart = new Date(Date.UTC(year, month - 1, day, startHour, startMin));
      const offsetMs = getTimezoneOffsetMs(tz, nominalStart);
      let slotStart = new Date(nominalStart.getTime() - offsetMs);

      const nominalEnd = new Date(Date.UTC(year, month - 1, day, endHour, endMin));
      const rangeEnd = new Date(nominalEnd.getTime() - offsetMs);

      while (slotStart.getTime() + duration * 60000 <= rangeEnd.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);

        // Check against existing sessions
        const isConflict = db.sessions.some((s) => {
          if (s.status === 'cancelled') return false;
          const bStart = new Date(s.startTime).getTime();
          const bEnd = new Date(s.endTime).getTime();
          return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
        });

        if (!isConflict) {
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
        }

        slotStart = new Date(slotEnd.getTime() + buffer * 60000);
      }
    }

    return ok({
      success: true,
      date,
      timezone: tz,
      slotsCount: generatedSlots.length,
      slots: generatedSlots,
    });
  }

  // GET /scheduling/availability
  if (method === 'get' && path === '/scheduling/availability') {
    const avail = db.availabilities[0] || {
      weeklySchedule: [
        { dayOfWeek: 1, dayName: 'Monday', isActive: true, slots: [{ startTime: '10:00', endTime: '18:00' }] },
        { dayOfWeek: 2, dayName: 'Tuesday', isActive: true, slots: [{ startTime: '10:00', endTime: '18:00' }] },
        { dayOfWeek: 3, dayName: 'Wednesday', isActive: true, slots: [{ startTime: '10:00', endTime: '18:00' }] },
        { dayOfWeek: 4, dayName: 'Thursday', isActive: true, slots: [{ startTime: '10:00', endTime: '18:00' }] },
        { dayOfWeek: 5, dayName: 'Friday', isActive: true, slots: [{ startTime: '10:00', endTime: '17:00' }] },
        { dayOfWeek: 6, dayName: 'Saturday', isActive: true, slots: [{ startTime: '10:00', endTime: '14:00' }] },
        { dayOfWeek: 0, dayName: 'Sunday', isActive: false, slots: [] },
      ],
      bufferTimeMinutes: 15,
      sessionDurations: [30, 45, 60, 90],
    };
    return ok({ success: true, availability: avail });
  }

  // PUT /scheduling/availability
  if (method === 'put' && path === '/scheduling/availability') {
    db.availabilities[0] = { ...db.availabilities[0], ...body };
    saveDB(db);
    return ok({ success: true, availability: db.availabilities[0], message: 'Availability updated' });
  }

  // GET /scheduling/sessions
  if (method === 'get' && (path === '/scheduling/sessions' || path === '/scheduling/sessions/')) {
    let list = [...db.sessions];
    if (queryParams.status) {
      list = list.filter((s) => s.status === queryParams.status);
    }
    if (queryParams._id) {
      list = list.filter((s) => s._id === queryParams._id);
    }
    return ok({ success: true, sessions: list });
  }

  // POST /scheduling/book
  if (method === 'post' && path === '/scheduling/book') {
    const slug = body.slug || 'dr-sharma';
    const doctor = db.therapists.find((t) => t.slug === slug) || db.therapists[0];

    let client = db.clients.find((c) => c.email.toLowerCase() === (body.clientEmail || '').toLowerCase());
    if (!client) {
      client = {
        _id: 'client_' + Date.now(),
        name: body.clientName,
        email: body.clientEmail,
        phone: body.clientPhone,
        status: 'active',
        therapist_id: doctor._id,
      };
      db.clients.push(client);
    }

    const duration = body.durationMinutes || 50;
    const startTime = body.startTime;
    const endTime = new Date(new Date(startTime).getTime() + duration * 60000).toISOString();

    const newSession = {
      _id: 'sess_' + Date.now(),
      therapist_id: doctor._id,
      client_id: client._id,
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      clientPhone: body.clientPhone,
      startTime,
      endTime,
      durationMinutes: duration,
      status: 'pending',
      paymentStatus: 'pending',
      sessionType: 'Individual Therapy',
      fee: body.fee || doctor.sessionFee || 2500,
      timezone: body.timezone || 'Asia/Kolkata',
      createdAt: new Date().toISOString(),
    };

    db.sessions.push(newSession);
    saveDB(db);

    return ok({
      success: true,
      message: 'Slot reserved successfully',
      session: newSession,
      client,
    });
  }

  // POST /scheduling/cancel
  if (method === 'post' && path === '/scheduling/cancel') {
    const { sessionId, cancellationReason } = body;
    const session = db.sessions.find((s) => s._id === sessionId);
    if (session) {
      session.status = 'cancelled';
      session.cancellationReason = cancellationReason || 'Cancelled by client';
      saveDB(db);
    }
    return ok({ success: true, message: 'Session cancelled and slot released successfully' });
  }

  // POST /scheduling/waitlist
  if (method === 'post' && path === '/scheduling/waitlist') {
    return ok({ success: true, message: 'Added to priority waitlist successfully!' });
  }

  // -------------------------------------------------------------
  // 5. CLINICAL NOTES ROUTES
  // -------------------------------------------------------------

  // GET /notes
  if (method === 'get' && (path === '/notes' || path === '/notes/')) {
    let list = [...db.notes];
    if (queryParams.clientId) {
      list = list.filter((n) => n.client_id === queryParams.clientId);
    }
    return ok({ success: true, notes: list });
  }

  // POST /notes
  if (method === 'post' && path === '/notes') {
    if (body._id) {
      const idx = db.notes.findIndex((n) => n._id === body._id);
      if (idx !== -1) {
        db.notes[idx] = { ...db.notes[idx], ...body, updatedAt: new Date().toISOString() };
        saveDB(db);
        return ok({ success: true, note: db.notes[idx], message: 'Note updated' });
      }
    }

    const newNote = {
      _id: 'note_' + Date.now(),
      therapist_id: db.therapists[0]._id,
      client_id: body.clientId || db.clients[0]._id,
      type: body.type || 'private',
      templateType: body.templateType || 'freeform',
      title: body.title || 'Clinical Consultation Record',
      content: body.content || '',
      soapData: body.soapData || {},
      dapData: body.dapData || {},
      tags: body.tags || ['Consultation'],
      isSharedWithClient: body.type === 'shared',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.notes.unshift(newNote);
    saveDB(db);

    return ok({ success: true, note: newNote, message: 'Note saved' });
  }

  // DELETE /notes/:id
  if (method === 'delete' && path.startsWith('/notes/')) {
    const id = path.split('/')[2];
    db.notes = db.notes.filter((n) => n._id !== id);
    saveDB(db);
    return ok({ success: true, message: 'Note deleted successfully' });
  }

  // -------------------------------------------------------------
  // 6. PAYMENTS & GST INVOICES ROUTES
  // -------------------------------------------------------------

  // POST /payments/verify-coupon
  if (method === 'post' && path === '/payments/verify-coupon') {
    const code = (body.code || '').toUpperCase().trim();
    const coupons = {
      WELCOME10: 10,
      HEAL15: 15,
      STUDENT20: 20,
    };
    if (coupons[code]) {
      return ok({
        success: true,
        coupon: { code, discountPercentage: coupons[code], description: `${coupons[code]}% Promotional Healthcare Credit` },
      });
    }
    return ok({ success: false, message: 'Invalid or expired promotional code' }, 400);
  }

  // POST /payments/create-order
  if (method === 'post' && path === '/payments/create-order') {
    return ok({
      success: true,
      order: {
        id: 'order_rzp_' + Date.now(),
        amount: Math.round(body.amount * 100),
        currency: 'INR',
        receipt: body.receipt || `rcpt_${Date.now()}`,
      },
    });
  }

  // POST /payments/verify
  if (method === 'post' && path === '/payments/verify') {
    const amount = Number(body.amount) || 2500;
    const session = db.sessions.find((s) => s._id === body.sessionId);
    if (session) {
      session.status = 'scheduled';
      session.paymentStatus = 'paid';
    }

    const payment = {
      _id: 'pay_' + Date.now(),
      therapist_id: body.therapistId || db.therapists[0]._id,
      client_id: body.clientId || db.clients[0]._id,
      clientEmail: body.clientEmail || 'rohan.verma@example.com',
      session_id: body.sessionId,
      amount,
      platformFee: Math.round(amount * 0.05),
      netPayoutAmount: Math.round(amount * 0.95),
      status: 'completed',
      paymentMethod: body.paymentMethod || 'UPI',
      razorpay_payment_id: body.razorpay_payment_id || `pay_${Date.now()}_test`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      sacCode: '999312',
      createdAt: new Date().toISOString(),
    };

    db.payments.unshift(payment);
    saveDB(db);

    return ok({
      success: true,
      payment,
      session,
      message: 'Payment verified and appointment scheduled successfully',
    });
  }

  // -------------------------------------------------------------
  // 7. ANALYTICS & NOTIFICATIONS
  // -------------------------------------------------------------

  // GET /analytics
  if (method === 'get' && (path === '/analytics' || path === '/analytics/')) {
    return ok({
      success: true,
      kpis: {
        totalRevenue: 128000,
        activeClientsCount: db.clients.length,
        monthlySessionsCount: db.sessions.length,
        completedSessionsCount: db.sessions.filter((s) => s.status === 'completed').length,
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

  // GET /notifications/logs
  if (method === 'get' && path === '/notifications/logs') {
    return ok({
      success: true,
      logs: [
        { id: '1', channel: 'WHATSAPP_STUB', template: 'booking_confirmed', recipient: '+91 99887 76655', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', channel: 'EMAIL', template: 'payment_confirmed', recipient: 'rohan.verma@example.com', timestamp: new Date(Date.now() - 3550000).toISOString() },
        { id: '3', channel: 'WHATSAPP_STUB', template: 'reminder_24h', recipient: '+91 98443 66778', timestamp: new Date(Date.now() - 7200000).toISOString() },
      ],
    });
  }

  // Unknown route fallback
  return null;
};
