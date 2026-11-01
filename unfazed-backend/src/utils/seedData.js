const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const Availability = require('../models/Availability');
const Session = require('../models/Session');
const SessionNote = require('../models/SessionNote');
const Payment = require('../models/Payment');
const Package = require('../models/Package');
const ClientPackage = require('../models/ClientPackage');
const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');
const ChatMessage = require('../models/ChatMessage');
const invoiceService = require('../services/invoiceService');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unfazed';
    await mongoose.connect(mongoUri);
    console.log(`[Seed] Connected to MongoDB: ${mongoUri}`);

    // Clean existing data for a fresh, clean slate
    await Promise.all([
      Therapist.deleteMany({}),
      Client.deleteMany({}),
      Availability.deleteMany({}),
      Session.deleteMany({}),
      SessionNote.deleteMany({}),
      Payment.deleteMany({}),
      ChatMessage.deleteMany({}),
      Package.deleteMany({}),
      ClientPackage.deleteMany({}),
      SubscriptionTierConfig.deleteMany({}),
    ]);
    console.log('[Seed] Cleared existing collections.');

    // 1. Seed Subscription Tiers
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
        description: 'Essential toolkit for starting practitioners with up to 5 active clients.',
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
        description: 'Scale without limits with advanced aggregation analytics, full DAP/SOAP templates, and priority support.',
      },
    ]);
    console.log('[Seed] Seeded Subscription Tier configurations.');

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('Password123!', salt);
    const now = new Date();

    // =========================================================================
    // 2. SEED 3 LICENSED DOCTORS / THERAPISTS
    // =========================================================================

    // DOCTOR 1: Dr. Ananya Sharma
    const drSharma = await Therapist.create({
      name: 'Dr. Ananya Sharma',
      email: 'dr.sharma@unfazed.in',
      password_hash,
      slug: 'dr-sharma',
      bio: 'Compassionate, evidence-based psychotherapy helping individuals unpack anxiety, relationship patterns, and chronic workplace burnout. Grounded in Cognitive Behavioral Therapy (CBT) and Mindfulness practices.',
      specializations: ['Anxiety & Panic', 'CBT', 'Workplace Burnout', 'Trauma Recovery', 'Interpersonal Relationships'],
      languages: ['English', 'Hindi', 'Bengali'],
      qualifications: 'Ph.D. in Clinical Psychology (NIMHANS), RCI Reg. CRR-A78912',
      experienceYears: 8,
      sessionFee: 2500,
      bufferTime: 15,
      allowedDurations: [30, 45, 60, 90],
      subscriptionTier: 'pro',
      avatarUrl: '',
      phone: '+91 98450 12345',
      clinicAddress: 'MindSpace Clinic, 12th Main Indiranagar, Bangalore & Online Telehealth',
    });

    // DOCTOR 2: Dr. Rajesh Menon
    const drMenon = await Therapist.create({
      name: 'Dr. Rajesh Menon',
      email: 'dr.menon@unfazed.in',
      password_hash,
      slug: 'dr-menon',
      bio: 'Senior clinical psychologist specializing in Acceptance & Commitment Therapy (ACT) and adult neurodivergence. Helping clients build psychological flexibility, overcome depressive inertia, and cultivate life purpose.',
      specializations: ['Depression & Mood Disorders', 'ACT', "Men's Mental Health", 'ADHD & Focus', 'Existential Therapy'],
      languages: ['English', 'Malayalam', 'Hindi', 'Tamil'],
      qualifications: 'M.Phil in Clinical Psychology (AIIMS Delhi), RCI Reg. CRR-B45219',
      experienceYears: 11,
      sessionFee: 2200,
      bufferTime: 15,
      allowedDurations: [30, 45, 60],
      subscriptionTier: 'pro',
      avatarUrl: '',
      phone: '+91 98765 11223',
      clinicAddress: 'Wellness Pavilion, MG Road, Kochi & Online Telehealth',
    });

    // DOCTOR 3: Dr. Priya Nair
    const drNair = await Therapist.create({
      name: 'Dr. Priya Nair',
      email: 'dr.nair@unfazed.in',
      password_hash,
      slug: 'dr-nair',
      bio: 'Specialist in systemic family dynamics, relational attunement, and couples therapy using Emotion-Focused Therapy (EFT). Dedicated to creating emotionally safe containers for couples and families in transition.',
      specializations: ['Couples Counseling', 'Family Therapy', 'Emotion-Focused Therapy (EFT)', 'Attachment Styles', 'Conflict Resolution'],
      languages: ['English', 'Hindi', 'Marathi'],
      qualifications: 'Psy.D. in Clinical Psychology, RCI Reg. CRR-C99321',
      experienceYears: 9,
      sessionFee: 2800,
      bufferTime: 15,
      allowedDurations: [45, 60, 90],
      subscriptionTier: 'pro',
      avatarUrl: '',
      phone: '+91 97654 99887',
      clinicAddress: 'Bandra West Healing Center, Mumbai & Online Telehealth',
    });

    console.log(`[Seed] Created 3 Licensed Doctors: Dr. Sharma, Dr. Menon, Dr. Nair.`);

    // =========================================================================
    // 3. SEED AVAILABILITY SCHEDULES FOR ALL 3 DOCTORS
    // =========================================================================
    const createSchedule = (therapistId) => ({
      therapist_id: therapistId,
      weeklySchedule: [
        {
          dayOfWeek: 1,
          dayName: 'Monday',
          isActive: true,
          slots: [
            { startTime: '10:00', endTime: '13:00' },
            { startTime: '14:30', endTime: '18:30' },
          ],
        },
        {
          dayOfWeek: 2,
          dayName: 'Tuesday',
          isActive: true,
          slots: [
            { startTime: '10:00', endTime: '13:00' },
            { startTime: '14:30', endTime: '18:30' },
          ],
        },
        {
          dayOfWeek: 3,
          dayName: 'Wednesday',
          isActive: true,
          slots: [
            { startTime: '10:00', endTime: '13:00' },
            { startTime: '14:30', endTime: '18:30' },
          ],
        },
        {
          dayOfWeek: 4,
          dayName: 'Thursday',
          isActive: true,
          slots: [
            { startTime: '10:00', endTime: '13:00' },
            { startTime: '14:30', endTime: '18:30' },
          ],
        },
        {
          dayOfWeek: 5,
          dayName: 'Friday',
          isActive: true,
          slots: [
            { startTime: '10:00', endTime: '13:00' },
            { startTime: '14:30', endTime: '17:00' },
          ],
        },
        {
          dayOfWeek: 6,
          dayName: 'Saturday',
          isActive: true,
          slots: [{ startTime: '10:30', endTime: '15:00' }],
        },
        {
          dayOfWeek: 0,
          dayName: 'Sunday',
          isActive: false,
          slots: [],
        },
      ],
      bufferTimeMinutes: 15,
      sessionDurations: [30, 45, 60, 90],
      timezone: 'Asia/Kolkata',
    });

    await Availability.create([
      createSchedule(drSharma._id),
      createSchedule(drMenon._id),
      createSchedule(drNair._id),
    ]);
    console.log('[Seed] Created weekly availability templates for all 3 doctors.');

    // =========================================================================
    // 4. SEED MULTI-SESSION PACKAGES FOR ALL 3 DOCTORS
    // =========================================================================
    const createPackagesForDoctor = (doctor) => [
      {
        therapist_id: doctor._id,
        name: 'Therapy Starter Bundle (3 Sessions)',
        sessionCount: 3,
        totalPrice: Math.round(doctor.sessionFee * 3 * 0.9), // 10% off
        perSessionRate: Math.round(doctor.sessionFee * 0.9),
        discountPercentage: 10,
        validityDays: 60,
        description: 'Targeted intervention for acute concerns, coping strategies, and structured goal-setting.',
      },
      {
        therapist_id: doctor._id,
        name: 'Comprehensive Protocol (6 Sessions)',
        sessionCount: 6,
        totalPrice: Math.round(doctor.sessionFee * 6 * 0.85), // 15% off
        perSessionRate: Math.round(doctor.sessionFee * 0.85),
        discountPercentage: 15,
        validityDays: 120,
        description: 'In-depth therapeutic work covering cognitive reframing, behavioral experiments, and symptom stabilization.',
      },
      {
        therapist_id: doctor._id,
        name: 'Complete Transformation Journey (12 Sessions)',
        sessionCount: 12,
        totalPrice: Math.round(doctor.sessionFee * 12 * 0.8), // 20% off
        perSessionRate: Math.round(doctor.sessionFee * 0.8),
        discountPercentage: 20,
        validityDays: 240,
        description: 'Long-term foundational psychotherapy addressing relational trauma, attachment styles, and deep resilience.',
      },
    ];

    const sharmaPackages = await Package.create(createPackagesForDoctor(drSharma));
    await Package.create(createPackagesForDoctor(drMenon));
    await Package.create(createPackagesForDoctor(drNair));
    console.log('[Seed] Created multi-session packages for all 3 doctors.');

    // =========================================================================
    // 5. SEED CLIENTS (2 CLIENTS PER DOCTOR = 6 CLIENTS TOTAL)
    // =========================================================================

    // Clients for Dr. Sharma
    const rohan = await Client.create({
      therapist_id: drSharma._id,
      name: 'Rohan Verma',
      email: 'rohan.verma@example.com',
      phone: '+91 99887 76655',
      status: 'active',
      tags: ['Weekly CBT', 'Workplace Anxiety', 'Tech Lead'],
      intakeForm: {
        dob: '1992-06-14',
        gender: 'Male',
        occupation: 'Staff Software Engineer at Fintech startup',
        emergencyContact: 'Neha Verma (Spouse)',
        emergencyPhone: '+91 99887 76654',
        presentingConcern: 'Persistent palpitations and dread before sprint reviews and team standups. Chronic sleep onset insomnia.',
        therapyHistory: 'Attended 4 sessions of counseling 3 years ago during career switch.',
        medicalHistory: 'Mild hypertension managed with lifestyle; no psychotropic medication.',
        goals: 'Learn tangible techniques to de-escalate anxiety and establish firm boundaries with management.',
        submittedAt: new Date(Date.now() - 60 * 24 * 3600 * 1000),
      },
      consent: { agreed: true, timestamp: new Date(Date.now() - 60 * 24 * 3600 * 1000), ipAddress: '157.48.12.91', version: '1.0' },
      totalSessions: 6,
      lastSessionDate: new Date(Date.now() - 7 * 24 * 3600 * 1000),
    });

    const pooja = await Client.create({
      therapist_id: drSharma._id,
      name: 'Pooja Iyer',
      email: 'pooja.iyer@example.com',
      phone: '+91 98221 44556',
      status: 'active',
      tags: ['Bi-Weekly', 'Trauma', 'Grief'],
      intakeForm: {
        dob: '1989-11-23',
        gender: 'Female',
        occupation: 'Architect & Interior Designer',
        emergencyContact: 'Karthik Iyer (Brother)',
        emergencyPhone: '+91 98221 44550',
        presentingConcern: 'Coping with sudden parental bereavement and difficulty sustaining creative focus.',
        therapyHistory: 'First time entering therapy.',
        medicalHistory: 'None reported.',
        goals: 'Process grief in a safe therapeutic container and regain energy for daily living.',
        submittedAt: new Date(Date.now() - 45 * 24 * 3600 * 1000),
      },
      consent: { agreed: true, timestamp: new Date(Date.now() - 45 * 24 * 3600 * 1000), ipAddress: '122.167.89.14', version: '1.0' },
      totalSessions: 4,
      lastSessionDate: new Date(Date.now() - 5 * 24 * 3600 * 1000),
    });

    // Clients for Dr. Menon
    const vikram = await Client.create({
      therapist_id: drMenon._id,
      name: 'Vikramaditya Rao',
      email: 'vikram.rao@example.com',
      phone: '+91 98765 43210',
      status: 'active',
      tags: ['Bi-Weekly ACT', 'Adult ADHD', 'Executive Burnout'],
      intakeForm: {
        dob: '1988-04-12',
        gender: 'Male',
        occupation: 'VP of Product Management',
        emergencyContact: 'Anjali Rao (Partner)',
        emergencyPhone: '+91 98765 43219',
        presentingConcern: 'Chronic procrastination followed by intense panic hyper-focus cycles. Low mood on weekends.',
        therapyHistory: 'Previously consulted psychiatrist for adult ADHD diagnosis.',
        medicalHistory: 'Prescribed Atomoxetine under psychiatric supervision.',
        goals: 'Develop psychological flexibility and realistic work-rest boundaries using ACT principles.',
        submittedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
      },
      consent: { agreed: true, timestamp: new Date(Date.now() - 30 * 24 * 3600 * 1000), ipAddress: '49.207.18.22', version: '1.0' },
      totalSessions: 5,
      lastSessionDate: new Date(Date.now() - 4 * 24 * 3600 * 1000),
    });

    const sneha = await Client.create({
      therapist_id: drMenon._id,
      name: 'Sneha Kapoor',
      email: 'sneha.kapoor@example.com',
      phone: '+91 98112 33445',
      status: 'active',
      tags: ['Depression Support', 'Mindfulness', 'Career Transition'],
      intakeForm: {
        dob: '1995-08-19',
        gender: 'Female',
        occupation: 'Brand Strategist',
        emergencyContact: 'Sunita Kapoor (Mother)',
        emergencyPhone: '+91 98112 33440',
        presentingConcern: 'Feelings of emptiness, loss of interest in passions, chronic rumination regarding future security.',
        therapyHistory: 'Self-help books and meditation retreats.',
        medicalHistory: 'None reported.',
        goals: 'Reconnect with personal values and learn cognitive defusion techniques.',
        submittedAt: new Date(Date.now() - 25 * 24 * 3600 * 1000),
      },
      consent: { agreed: true, timestamp: new Date(Date.now() - 25 * 24 * 3600 * 1000), ipAddress: '103.21.124.9', version: '1.0' },
      totalSessions: 3,
      lastSessionDate: new Date(Date.now() - 6 * 24 * 3600 * 1000),
    });

    // Clients for Dr. Nair
    const aarav = await Client.create({
      therapist_id: drNair._id,
      name: 'Aarav Malhotra',
      email: 'aarav.malhotra@example.com',
      phone: '+91 97654 32198',
      status: 'active',
      tags: ['Couples Therapy', 'Anxious Attachment', 'Communication'],
      intakeForm: {
        dob: '1991-03-08',
        gender: 'Male',
        occupation: 'Investment Banker',
        emergencyContact: 'Ritu Malhotra (Sister)',
        emergencyPhone: '+91 97654 32190',
        presentingConcern: 'Frequent defensive arguments with partner, fear of abandonment during minor disagreements.',
        therapyHistory: 'Attended joint couple workshop last year.',
        medicalHistory: 'None reported.',
        goals: 'Identify attachment protest behaviors and communicate vulnerable emotional needs clearly.',
        submittedAt: new Date(Date.now() - 20 * 24 * 3600 * 1000),
      },
      consent: { agreed: true, timestamp: new Date(Date.now() - 20 * 24 * 3600 * 1000), ipAddress: '14.139.12.80', version: '1.0' },
      totalSessions: 4,
      lastSessionDate: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    });

    const meera = await Client.create({
      therapist_id: drNair._id,
      name: 'Meera Sen',
      email: 'meera.sen@example.com',
      phone: '+91 98301 22334',
      status: 'active',
      tags: ['Family Systems', 'Enmeshment Boundaries', 'Creative Professional'],
      intakeForm: {
        dob: '1993-10-15',
        gender: 'Female',
        occupation: 'Film Editor & Writer',
        emergencyContact: 'Dev Sen (Brother)',
        emergencyPhone: '+91 98301 22330',
        presentingConcern: 'Guilt over setting healthy physical and emotional boundaries with extended family.',
        therapyHistory: 'First time seeking psychotherapy.',
        medicalHistory: 'None reported.',
        goals: 'Build internal safety and assert boundaries without falling into people-pleasing guilt.',
        submittedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000),
      },
      consent: { agreed: true, timestamp: new Date(Date.now() - 15 * 24 * 3600 * 1000), ipAddress: '115.111.45.6', version: '1.0' },
      totalSessions: 3,
      lastSessionDate: new Date(Date.now() - 4 * 24 * 3600 * 1000),
    });

    console.log('[Seed] Created 6 client profiles (2 per doctor).');

    // =========================================================================
    // 6. HELPER FUNCTION TO SEED SESSIONS, INVOICES, CHAT & CLINICAL NOTES
    // =========================================================================
    const seedClientEcosystem = async ({
      doctor,
      client,
      sessionType,
      upcomingDaysOffset,
      prevDaysOffset,
      soapNote,
      sharedHomework,
      doctorGreeting,
      clientReply,
    }) => {
      const upcomingDate = new Date(now.getTime() + upcomingDaysOffset * 24 * 3600 * 1000);
      upcomingDate.setHours(10, 0, 0, 0);

      const prevDate = new Date(now.getTime() - prevDaysOffset * 24 * 3600 * 1000);
      prevDate.setHours(10, 0, 0, 0);

      // 1. Upcoming Scheduled Session
      const upcomingSession = await Session.create({
        therapist_id: doctor._id,
        client_id: client._id,
        clientName: client.name,
        clientEmail: client.email,
        clientPhone: client.phone,
        startTime: upcomingDate,
        endTime: new Date(upcomingDate.getTime() + 50 * 60000),
        durationMinutes: 50,
        status: 'scheduled',
        sessionType,
        fee: doctor.sessionFee,
        paymentStatus: 'paid',
        timezone: 'Asia/Kolkata',
        meetingLink: `/meet/session-${client._id}-upcoming`,
      });

      // 2. Completed Previous Session
      const prevSession = await Session.create({
        therapist_id: doctor._id,
        client_id: client._id,
        clientName: client.name,
        clientEmail: client.email,
        clientPhone: client.phone,
        startTime: prevDate,
        endTime: new Date(prevDate.getTime() + 50 * 60000),
        durationMinutes: 50,
        status: 'completed',
        sessionType,
        fee: doctor.sessionFee,
        paymentStatus: 'paid',
        timezone: 'Asia/Kolkata',
        meetingLink: `/meet/session-${client._id}-prev`,
      });

      // 3. Official Payment & Invoice
      const fee = doctor.sessionFee;
      const platformFee = Math.round(fee * 0.05 * 100) / 100;
      const payment = await Payment.create({
        therapist_id: doctor._id,
        client_id: client._id,
        session_id: prevSession._id,
        order_id: `order_${client._id}_prev`,
        gateway_transaction_id: `pay_rzp_${client._id}_prev`,
        amount: fee,
        platform_fee: platformFee,
        net_amount: fee - platformFee,
        status: 'captured',
        invoice_number: invoiceService.generateInvoiceNumber(),
        payment_method: 'UPI',
        description: `${sessionType} (50m)`,
        createdAt: prevDate,
      });
      prevSession.payment_id = payment._id;
      await prevSession.save();

      // 4. Chat Messages
      const roomId = `room_${doctor._id}_${client._id}`;
      await ChatMessage.create([
        {
          roomId,
          therapist_id: doctor._id,
          client_id: client._id,
          senderId: doctor._id.toString(),
          senderName: doctor.name,
          senderType: 'therapist',
          text: doctorGreeting,
          read: true,
          createdAt: new Date(Date.now() - 3600 * 1000 * 3),
        },
        {
          roomId,
          therapist_id: doctor._id,
          client_id: client._id,
          senderId: client._id.toString(),
          senderName: client.name,
          senderType: 'client',
          text: clientReply,
          read: true,
          createdAt: new Date(Date.now() - 3600 * 1000),
        },
      ]);

      // 5. Clinical Notes (Private vs Shared Separation)
      await SessionNote.create([
        {
          therapist_id: doctor._id,
          client_id: client._id,
          title: soapNote.title,
          type: 'private', // Strictly isolated from client portal
          format: 'soap',
          soap: soapNote.soap,
          tags: soapNote.tags,
        },
        {
          therapist_id: doctor._id,
          client_id: client._id,
          title: sharedHomework.title,
          type: 'shared', // Visible to client
          format: 'freeform',
          content: sharedHomework.content,
          tags: sharedHomework.tags,
        },
      ]);
    };

    // Seed for Dr. Sharma's Clients
    await seedClientEcosystem({
      doctor: drSharma,
      client: rohan,
      sessionType: 'CBT Consultation',
      upcomingDaysOffset: 1,
      prevDaysOffset: 7,
      soapNote: {
        title: 'Session 5: Diagnostic Hypotheses & Catastrophizing Schemas',
        soap: {
          subjective: 'Client reports sudden panic surge during quarterly budget review. Heart rate 110 bpm, fear of catastrophic failure.',
          objective: 'Affect congruent with anxiety. Mild psychomotor agitation. Denies suicidal ideation. GAD-7: 14.',
          assessment: 'Perfectionistic coping schema triggering sympathetic flight-or-fight response under evaluation.',
          plan: '1. Introduce thought record diary.\n2. Physiological sigh technique for acute panic.\n3. Session 6: Behavioral delegation experiment.',
        },
        tags: ['CBT', 'Panic Disorder', 'Confidential'],
      },
      sharedHomework: {
        title: 'Weekly Reflections: Decatastrophizing & The Physiological Sigh',
        content: `<h3>Key Insights from Today's Session</h3>
<p>Remember that a spike in heart rate during a high-stakes meeting is simply your body's sympathetic nervous system gearing up for performance—it is not evidence that you are failing.</p>
<h4>Your Action Homework for the Week:</h4>
<ul>
  <li><strong>The 2-Breath Physiological Sigh:</strong> Two quick inhales through the nose followed by one long, slow sigh through the mouth whenever you notice muscle tension.</li>
  <li><strong>Thought Record Journal:</strong> When an anxious thought arises ("They will realize I don't know this"), write down:
    <ol>
      <li>What is the worst that can happen?</li>
      <li>What is the most likely outcome based on past experience?</li>
      <li>If my closest friend had this thought, what compassionate advice would I offer them?</li>
    </ol>
  </li>
</ul>
<p>Be gentle with yourself this week. You are building new neural pathways!</p>`,
        tags: ['Homework', 'Psychoeducation', 'Breathing Exercises'],
      },
      doctorGreeting: 'Welcome to your private Sanctuary, Rohan. Feel free to message here for any session queries or check-ins.',
      clientReply: 'Hi Dr. Sharma, thank you! Looking forward to our next consultation.',
    });

    await seedClientEcosystem({
      doctor: drSharma,
      client: pooja,
      sessionType: 'Grief & Bereavement Support',
      upcomingDaysOffset: 2,
      prevDaysOffset: 5,
      soapNote: {
        title: 'Session 3: Dual Process Model of Bereavement',
        soap: {
          subjective: 'Client discussed wave of guilt when laughing at a social event last weekend. Recalled feeling disloyal to deceased parent.',
          objective: 'Tearful during loss narrative. Good insight and emotional responsiveness.',
          assessment: 'Oscillation between loss-oriented and restoration-oriented coping is natural. Normalization provided noticeable relief.',
          plan: 'Continue grief narrative processing. Introduce memory ritual before bed to mitigate evening rumination.',
        },
        tags: ['Bereavement', 'Grief Counseling'],
      },
      sharedHomework: {
        title: 'Grief & Permission to Experience Joy',
        content: `<h3>Remember:</h3>
<p>Grief does not shrink over time; rather, our lives expand around it. Feeling moments of lightness, laughter, or engagement in your art is not a betrayal of your memory—it is how your spirit rests and heals.</p>
<h4>Gentle Reflection Prompt:</h4>
<p>Whenever grief feels heavy, light a small candle or take 3 deep breaths and write one thing you are grateful your parent shared with you.</p>`,
        tags: ['Shared Reflections', 'Grief Support'],
      },
      doctorGreeting: 'Hello Pooja, I have uploaded your homework worksheet in the Shared Notes tab for your review.',
      clientReply: 'Thank you Dr. Sharma, I will go through the exercises before Wednesday.',
    });

    // Seed for Dr. Menon's Clients
    await seedClientEcosystem({
      doctor: drMenon,
      client: vikram,
      sessionType: 'ACT & Executive Functioning',
      upcomingDaysOffset: 3,
      prevDaysOffset: 4,
      soapNote: {
        title: 'Session 4: Values Clarification & Defusion from Impostor Thoughts',
        soap: {
          subjective: 'Client reports exhaustion from masked ADHD symptoms at work. Feels constant pressure to over-deliver.',
          objective: 'High verbal cadence, animated affect. Insight intact. Good rapport.',
          assessment: 'Fusion with belief "If I rest, I am lazy". High cognitive avoidance of uncomfortable emotional states.',
          plan: '1. Introduce ACT "Leaves on a Stream" defusion exercise.\n2. Implement 25-minute Pomodoro pacing with mandatory screen-free breaks.',
        },
        tags: ['ACT', 'Adult ADHD', 'Executive Coaching'],
      },
      sharedHomework: {
        title: 'Cognitive Defusion: You Are Not Your Thoughts',
        content: `<h3>Mindset Shift: Cognitive Defusion</h3>
<p>Instead of saying <em>"I am inadequate at managing this team,"</em> practice saying <em>"I notice my mind is generating the thought that I am inadequate."</em> Notice the space between the observer and the thought.</p>
<h4>Weekly Action Experiment:</h4>
<ul>
  <li>Identify one task this week where "80% good enough" is sufficient, and deliberately submit it without secondary revisions.</li>
  <li>Notice what physical sensations arise, breathe into them, and do not scramble to fix.</li>
</ul>`,
        tags: ['Defusion', 'ACT', 'ADHD Pacing'],
      },
      doctorGreeting: 'Vikram, great work on the values worksheet last week. Let me know if you need clarification before our upcoming session.',
      clientReply: 'Thanks Dr. Menon, the defusion exercise helped me step back during the board meeting.',
    });

    await seedClientEcosystem({
      doctor: drMenon,
      client: sneha,
      sessionType: 'Mindfulness & Mood Stabilization',
      upcomingDaysOffset: 4,
      prevDaysOffset: 6,
      soapNote: {
        title: 'Session 2: Somatic Grounding & Sleep Hygiene',
        soap: {
          subjective: 'Client experiencing midday dips in energy and self-criticism regarding career trajectory.',
          objective: 'Calm, receptive. Expressed relief upon discussing existential questions without judgment.',
          assessment: 'Mild reactive depressive symptoms associated with career transition. Strong resilience resources.',
          plan: '1. Establish morning sunlight exposure routine.\n2. Daily 5-minute sensory grounding practice.',
        },
        tags: ['Mood Stabilization', 'Somatic Grounding'],
      },
      sharedHomework: {
        title: 'Somatic Grounding & Anchoring',
        content: `<h3>5-4-3-2-1 Sensory Reset</h3>
<p>Whenever your thoughts pull you into rumination about the future, pause and name:</p>
<ul>
  <li>5 things you can see around you</li>
  <li>4 things you can physically feel (feet on floor, clothes on shoulders)</li>
  <li>3 things you can hear</li>
  <li>2 things you can smell</li>
  <li>1 thing you can taste</li>
</ul>
<p>This anchors your nervous system back in the objective present moment.</p>`,
        tags: ['Grounding', 'Sensory Reset'],
      },
      doctorGreeting: 'Hi Sneha, looking forward to our Thursday session. Remember to practice the 5-4-3-2-1 grounding whenever rumination starts.',
      clientReply: 'Good evening Dr. Menon, will do! Have noted down a few reflections.',
    });

    // Seed for Dr. Nair's Clients
    await seedClientEcosystem({
      doctor: drNair,
      client: aarav,
      sessionType: 'Couples & Relational Attunement',
      upcomingDaysOffset: 2,
      prevDaysOffset: 3,
      soapNote: {
        title: 'Session 3: Attachment Protest Behaviors & Emotional Regulation',
        soap: {
          subjective: 'Client reported recognizing defensive withdrawal pattern during conflict over holiday planning.',
          objective: 'Demonstrated increased reflective capacity. Acknowledged underlying vulnerability.',
          assessment: 'Anxious-avoidant relational dynamic. Client reacts to perceived disconnection with immediate pursuit or protest.',
          plan: '1. Role-play expressing soft primary emotions ("I feel scared") rather than secondary anger.\n2. Agree on a mutually accepted 15-minute cool-down ritual.',
        },
        tags: ['EFT', 'Couples Therapy', 'Attachment'],
      },
      sharedHomework: {
        title: 'Identifying Primary vs Secondary Emotions',
        content: `<h3>Soft Vulnerability vs Hard Defensiveness</h3>
<p>When disagreements happen, our defensive armor (anger, blame, sarcasm) shows up first. Beneath that armor is usually a tender primary emotion: fear of rejection, sadness, or a longing for closeness.</p>
<h4>Communication Homework:</h4>
<p>Use the simple formula: <em>"When [event] happened, I felt [primary soft emotion], because I value our connection."</em></p>`,
        tags: ['EFT', 'Communication Tools'],
      },
      doctorGreeting: 'Hello Aarav, I hope the communication framework is giving you and your partner a calmer reference point this week.',
      clientReply: 'Hi Dr. Nair, it really helped defuse our discussion over the weekend.',
    });

    await seedClientEcosystem({
      doctor: drNair,
      client: meera,
      sessionType: 'Family Systems & Boundaries',
      upcomingDaysOffset: 5,
      prevDaysOffset: 4,
      soapNote: {
        title: 'Session 2: Boundary Setting Without Excessive Justification',
        soap: {
          subjective: 'Client felt intense guilt after saying "No" to hosting relatives during festival weekend.',
          objective: 'Affect brightened as session progressed. High willingness to explore self-compassion.',
          assessment: 'Family system enmeshment where boundaries were historically treated as personal rejection.',
          plan: '1. Practice concise, respectful boundary statements without over-explaining.\n2. Journal feelings of guilt as "growing pains" rather than wrongdoing.',
        },
        tags: ['Family Systems', 'Boundaries'],
      },
      sharedHomework: {
        title: 'Setting Clear & Loving Boundaries',
        content: `<h3>Healthy Boundaries Are Kindness</h3>
<p>A boundary is not a wall to push people away; it is a clear door with a lock so you can welcome others without depleting yourself.</p>
<h4>Clean Boundary Scripts:</h4>
<ul>
  <li><em>"I love you and want to spend time together, but I am unable to host this weekend."</em></li>
  <li><em>"I need downtime this evening to recharge. Let us catch up on Sunday."</em></li>
</ul>
<p>Notice that you do not need to invent excuses. A simple, gracious statement is enough.</p>`,
        tags: ['Boundaries', 'Assertiveness'],
      },
      doctorGreeting: 'Meera, remember that feeling guilt when setting a new boundary is completely normal. It means you are breaking old generational patterns.',
      clientReply: 'Thank you Dr. Nair, that perspective gives me immense peace.',
    });

    // 7. Seed Rohan's Client Package
    await ClientPackage.create({
      client_id: rohan._id,
      therapist_id: drSharma._id,
      package_id: sharmaPackages[1]._id,
      packageName: sharmaPackages[1].name,
      totalSessions: 6,
      usedSessions: 4,
      remainingSessions: 2,
      purchasedAt: new Date(Date.now() - 40 * 24 * 3600 * 1000),
      expiresAt: new Date(Date.now() + 80 * 24 * 3600 * 1000),
      status: 'active',
    });

    console.log('\n=============================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=============================================================');
    console.log('3 Doctors Seeded:');
    console.log('1. Dr. Ananya Sharma (dr.sharma@unfazed.in / Password123!) -> /dr-sharma');
    console.log('   - Clients: Rohan Verma (rohan.verma@example.com), Pooja Iyer (pooja.iyer@example.com)');
    console.log('2. Dr. Rajesh Menon (dr.menon@unfazed.in / Password123!) -> /dr-menon');
    console.log('   - Clients: Vikramaditya Rao (vikram.rao@example.com), Sneha Kapoor (sneha.kapoor@example.com)');
    console.log('3. Dr. Priya Nair (dr.nair@unfazed.in / Password123!) -> /dr-nair');
    console.log('   - Clients: Aarav Malhotra (aarav.malhotra@example.com), Meera Sen (meera.sen@example.com)');
    console.log('=============================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedData();
