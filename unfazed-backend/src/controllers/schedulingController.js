const Availability = require('../models/Availability');
const Session = require('../models/Session');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const Lead = require('../models/Lead');
const notificationService = require('../services/notificationService');

// Helper to format Date in "YYYY-MM-DD"
const formatDateISO = (d) => d.toISOString().split('T')[0];

// Helper to compute timezone offset in ms relative to UTC
const getTimezoneOffsetMs = (timeZone = 'Asia/Kolkata', refDate = new Date()) => {
  try {
    const tzDate = new Date(refDate.toLocaleString('en-US', { timeZone }));
    const utcDate = new Date(refDate.toLocaleString('en-US', { timeZone: 'UTC' }));
    return tzDate.getTime() - utcDate.getTime();
  } catch (e) {
    return 5.5 * 3600 * 1000; // Fallback to Asia/Kolkata (+5:30)
  }
};

// @desc    Get therapist availability settings
// @route   GET /api/scheduling/availability
const getMyAvailability = async (req, res, next) => {
  try {
    let availability = await Availability.findOne({ therapist_id: req.therapist._id });
    if (!availability) {
      availability = await Availability.create({
        therapist_id: req.therapist._id,
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
      });
    }

    res.json({ success: true, availability });
  } catch (error) {
    next(error);
  }
};

// @desc    Update therapist availability settings
// @route   PUT /api/scheduling/availability
const updateAvailability = async (req, res, next) => {
  try {
    const { weeklySchedule, bufferTimeMinutes, sessionDurations, overrides, blockedSlots } = req.body;

    let availability = await Availability.findOne({ therapist_id: req.therapist._id });
    if (!availability) {
      availability = new Availability({ therapist_id: req.therapist._id });
    }

    if (weeklySchedule) availability.weeklySchedule = weeklySchedule;
    if (bufferTimeMinutes !== undefined) availability.bufferTimeMinutes = bufferTimeMinutes;
    if (sessionDurations) availability.sessionDurations = sessionDurations;
    if (overrides) availability.overrides = overrides;
    if (blockedSlots) availability.blockedSlots = blockedSlots;

    await availability.save();
    res.json({ success: true, availability, message: 'Availability updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get open available slots for a date & therapist (Client facing)
// @route   GET /api/scheduling/open-slots/:slug
const getOpenSlots = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { date, durationMinutes = 50, timezone = 'Asia/Kolkata' } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Please provide query param: date (YYYY-MM-DD)' });
    }

    const therapist = await Therapist.findOne({ slug: slug.toLowerCase() });
    if (!therapist) {
      return res.status(404).json({ success: false, message: 'Therapist not found' });
    }

    const availability = await Availability.findOne({ therapist_id: therapist._id });
    if (!availability) {
      return res.json({ success: true, slots: [] });
    }

    const targetDate = new Date(`${date}T00:00:00.000Z`);
    const dayOfWeek = targetDate.getUTCDay(); // 0 is Sunday

    // 1. Check for one-time overrides
    const override = availability.overrides?.find((o) => o.date === date);
    let activeRanges = [];

    if (override) {
      if (override.isAvailable) {
        activeRanges = override.slots;
      } else {
        // Therapist explicitly marked this date as unavailable/holiday
        return res.json({ success: true, slots: [], note: 'Therapist is off on this date' });
      }
    } else {
      // Use recurring template
      const dayConfig = availability.weeklySchedule.find((d) => d.dayOfWeek === dayOfWeek);
      if (dayConfig && dayConfig.isActive) {
        activeRanges = dayConfig.slots;
      }
    }

    if (!activeRanges || activeRanges.length === 0) {
      return res.json({ success: true, slots: [] });
    }

    // 2. Fetch existing booked sessions on this date window to prevent double-booking
    const baseDate = new Date(date);
    const startWindow = new Date(baseDate.getTime() - 86400000);
    const endWindow = new Date(baseDate.getTime() + 86400000 * 2);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const existingSessions = await Session.find({
      therapist_id: therapist._id,
      startTime: { $gte: startWindow, $lte: endWindow },
      $or: [
        { status: { $in: ['scheduled', 'completed'] } },
        { status: 'pending', createdAt: { $gte: tenMinutesAgo } },
      ],
    });

    // 3. Generate discretely sliced slots with buffer time
    const duration = parseInt(durationMinutes, 10);
    const buffer = availability.bufferTimeMinutes || 15;
    const generatedSlots = [];
    const [year, month, day] = date.split('-').map(Number);
    const activeTz = timezone || 'Asia/Kolkata';

    for (const range of activeRanges) {
      const [startHour, startMin] = range.startTime.split(':').map(Number);
      const [endHour, endMin] = range.endTime.split(':').map(Number);

      const nominalStartUtc = new Date(Date.UTC(year, month - 1, day, startHour, startMin));
      const offsetMs = getTimezoneOffsetMs(activeTz, nominalStartUtc);
      let slotStart = new Date(nominalStartUtc.getTime() - offsetMs);

      const nominalEndUtc = new Date(Date.UTC(year, month - 1, day, endHour, endMin));
      const rangeEnd = new Date(nominalEndUtc.getTime() - offsetMs);

      while (slotStart.getTime() + duration * 60000 <= rangeEnd.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);

        // Check if slot overlaps with any existing booked session or blocked slot
        const isOverlapping = existingSessions.some((session) => {
          const bookedStart = new Date(session.startTime).getTime();
          const bookedEnd = new Date(session.endTime).getTime();
          return slotStart.getTime() < bookedEnd && slotEnd.getTime() > bookedStart;
        });

        // Check blocked slots
        const isBlocked = availability.blockedSlots?.some((b) => {
          if (b.date !== date) return false;
          const [bSH, bSM] = b.startTime.split(':').map(Number);
          const [bEH, bEM] = b.endTime.split(':').map(Number);
          const bNominalStart = new Date(Date.UTC(year, month - 1, day, bSH, bSM));
          const bStart = bNominalStart.getTime() - offsetMs;
          const bNominalEnd = new Date(Date.UTC(year, month - 1, day, bEH, bEM));
          const bEnd = bNominalEnd.getTime() - offsetMs;
          return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
        });

        if (!isOverlapping && !isBlocked) {
          generatedSlots.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            formattedTime: slotStart.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: activeTz,
              hour12: true,
            }),
            durationMinutes: duration,
          });
        }

        // Advance by duration + buffer
        slotStart = new Date(slotEnd.getTime() + buffer * 60000);
      }
    }

    res.json({
      success: true,
      date,
      timezone,
      durationMinutes: duration,
      slotsCount: generatedSlots.length,
      slots: generatedSlots,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Book a slot (with instant double-booking prevention lock)
// @route   POST /api/scheduling/book
const bookSlot = async (req, res, next) => {
  try {
    const {
      therapistId,
      slug,
      clientName,
      clientEmail,
      clientPhone,
      startTime,
      durationMinutes = 50,
      sessionType = 'Individual Therapy',
      fee,
      timezone = 'Asia/Kolkata',
      intakeData,
      consentAgreed,
    } = req.body;

    let targetTherapist = null;
    if (therapistId) {
      targetTherapist = await Therapist.findById(therapistId);
    } else if (slug) {
      targetTherapist = await Therapist.findOne({ slug: slug.toLowerCase() });
    }

    if (!targetTherapist) {
      return res.status(404).json({ success: false, message: 'Therapist not found' });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMinutes * 60000);

    // Double Booking Prevention Lock: Check overlapping existing session
    const normalizedEmail = clientEmail.toLowerCase().trim();
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const conflict = await Session.findOne({
      therapist_id: targetTherapist._id,
      status: { $ne: 'cancelled' },
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } },
      ],
    });

    if (conflict) {
      // Case 1: Same user re-submitting or returning to complete their own pending booking
      if (conflict.status === 'pending' && conflict.clientEmail === normalizedEmail) {
        conflict.durationMinutes = durationMinutes;
        conflict.fee = fee || targetTherapist.sessionFee || 2000;
        conflict.sessionType = sessionType;
        conflict.timezone = timezone;
        conflict.clientName = clientName;
        conflict.clientPhone = clientPhone || conflict.clientPhone;
        await conflict.save();

        let clientDoc = await Client.findById(conflict.client_id);
        if (!clientDoc) {
          clientDoc = await Client.findOne({ therapist_id: targetTherapist._id, email: normalizedEmail });
        }

        return res.status(200).json({
          success: true,
          message: 'Proceed to payment',
          session: conflict,
          client: clientDoc,
        });
      }

      // Case 2: Abandoned pending reservation (>10 mins old) by another visitor -> auto-cancel & release
      if (conflict.status === 'pending' && conflict.createdAt < tenMinutesAgo) {
        conflict.status = 'cancelled';
        conflict.cancellationReason = 'Expired reservation timeout';
        await conflict.save();
      } else {
        // Case 3: Confirmed booking or active pending reservation by someone else
        return res.status(409).json({
          success: false,
          message: 'This slot was just booked by another client. Please select another time or join the waitlist.',
          isSlotTaken: true,
        });
      }
    }

    // Find or create Client
    let client = await Client.findOne({
      therapist_id: targetTherapist._id,
      email: normalizedEmail,
    });

    if (!client) {
      client = await Client.create({
        therapist_id: targetTherapist._id,
        name: clientName,
        email: normalizedEmail,
        phone: clientPhone || '',
        status: 'active',
        tags: ['New Client'],
        intakeForm: intakeData ? { ...intakeData, submittedAt: new Date() } : {},
        consent: {
          agreed: Boolean(consentAgreed),
          timestamp: new Date(),
          ipAddress: req.ip || '127.0.0.1',
          version: '1.0',
        },
      });
    } else {
      // Update intake & consent if provided
      if (intakeData) {
        client.intakeForm = { ...client.intakeForm, ...intakeData, submittedAt: new Date() };
      }
      if (consentAgreed) {
        client.consent = { agreed: true, timestamp: new Date(), ipAddress: req.ip || '127.0.0.1', version: '1.0' };
      }
      client.lastSessionDate = start;
      client.totalSessions = (client.totalSessions || 0) + 1;
      await client.save();
    }

    // Create session record in PENDING state (becomes confirmed ONLY after payment is captured)
    const sessionFee = fee || targetTherapist.sessionFee || 2000;
    const session = new Session({
      therapist_id: targetTherapist._id,
      client_id: client._id,
      clientName: client.name,
      clientEmail: normalizedEmail,
      clientPhone: client.phone,
      startTime: start,
      endTime: end,
      durationMinutes,
      sessionType,
      fee: sessionFee,
      status: 'pending',
      paymentStatus: 'pending',
      timezone,
    });
    session.meetingLink = `/meet/${session._id}`;
    await session.save();

    res.status(201).json({
      success: true,
      message: 'Slot reserved. Please complete advance payment to confirm.',
      session,
      client,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join waitlist for a booked slot or date (Stretch goal)
// @route   POST /api/scheduling/waitlist
const joinWaitlist = async (req, res, next) => {
  try {
    const { sessionId, slug, therapistId, name, email, phone, preferredTimes, date } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required to join waitlist' });
    }

    if (sessionId) {
      const session = await Session.findById(sessionId);
      if (session) {
        session.waitlist.push({ name, email, phone, requestedAt: new Date() });
        await session.save();
      }
    }

    let tId = therapistId;
    if (!tId && slug) {
      const targetTherapist = await Therapist.findOne({ slug: slug.toLowerCase() });
      if (targetTherapist) tId = targetTherapist._id;
    }

    if (tId) {
      await Lead.create({
        therapist_id: tId,
        name: name || 'Prospective Client',
        email: email.toLowerCase().trim(),
        phone: phone || '',
        source: 'waitlist',
        message: `Waitlist requested for date: ${date || 'upcoming days'}`,
        preferredTimes: preferredTimes || 'Flexible',
      });
    }

    res.json({
      success: true,
      message: 'You have been added to the priority waitlist. You will be notified via WhatsApp/Email when a slot opens up!',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get therapist's sessions (for calendar view)
// @route   GET /api/scheduling/sessions
const getTherapistSessions = async (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;
    const query = { therapist_id: req.therapist._id };

    if (status) {
      if (status === 'scheduled') {
        query.status = { $in: ['scheduled', 'confirmed'] };
      } else {
        query.status = status;
      }
    } else {
      query.status = { $ne: 'pending' };
    }
    if (startDate && endDate) {
      query.startTime = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const rawSessions = await Session.find(query).sort({ startTime: 1 });
    const sessions = rawSessions.map((s) => {
      const sObj = s.toObject();
      if (!sObj.meetingLink || sObj.meetingLink.startsWith('http')) {
        sObj.meetingLink = `/meet/${sObj._id}`;
      }
      return sObj;
    });
    res.json({ success: true, count: sessions.length, sessions });
  } catch (error) {
    next(error);
  }
};

// @desc    Update session status (completed, cancelled, no-show)
// @route   PATCH /api/scheduling/sessions/:id
const updateSessionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, cancellationReason } = req.body;

    const session = await Session.findOne({ _id: id, therapist_id: req.therapist._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (status) session.status = status;
    if (cancellationReason) session.cancellationReason = cancellationReason;

    await session.save();
    res.json({ success: true, session, message: 'Session updated' });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel/release a session booking by client or guest
// @route   POST /api/scheduling/cancel
const cancelBooking = async (req, res, next) => {
  try {
    const { sessionId, cancellationReason } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required to cancel' });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session record not found' });
    }

    session.status = 'cancelled';
    session.cancellationReason = cancellationReason || 'Cancelled by client';
    await session.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully. Slot has been released.',
      session,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyAvailability,
  updateAvailability,
  getOpenSlots,
  bookSlot,
  joinWaitlist,
  getTherapistSessions,
  updateSessionStatus,
  cancelBooking,
};
