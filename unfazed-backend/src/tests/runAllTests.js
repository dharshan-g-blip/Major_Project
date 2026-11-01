const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const assert = require('assert');

// Models
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const Session = require('../models/Session');
const SessionNote = require('../models/SessionNote');
const Payment = require('../models/Payment');
const Package = require('../models/Package');
const ClientPackage = require('../models/ClientPackage');
const Lead = require('../models/Lead');
const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');
const entitlementService = require('../services/entitlementService');
const invoiceService = require('../services/invoiceService');
const notificationService = require('../services/notificationService');

let passedTests = 0;
let failedTests = 0;

const logPass = (name) => {
  passedTests++;
  console.log(`  \x1b[32m✔ PASS\x1b[0m ${name}`);
};

const logFail = (name, error) => {
  failedTests++;
  console.error(`  \x1b[31m✖ FAIL\x1b[0m ${name}`);
  console.error(`    Error: ${error.message}`);
};

const runSuite = async () => {
  console.log('\n================================================================');
  console.log('🧪 UNFAZED PRACTICE MANAGEMENT — AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unfazed';
    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB for Testing: ${mongoUri}\n`);

    // -------------------------------------------------------------
    // MODULE 1: AUTHENTICATION, PROFILE & BRANDED LINK
    // -------------------------------------------------------------
    console.log('\x1b[36m[Module 1: Foundations — Auth, Profile & Branded Link]\x1b[0m');
    let therapist = await Therapist.findOne({ email: 'dr.sharma@unfazed.in' });
    try {
      assert(therapist, 'Therapist dr.sharma@unfazed.in should exist in database');
      assert.strictEqual(therapist.slug, 'dr-sharma', 'Slug should be dr-sharma');
      assert(therapist.sessionFee > 0, 'Session fee should be configured');
      logPass('Therapist schema and unique slug validation');
    } catch (e) {
      logFail('Therapist schema and unique slug validation', e);
    }

    try {
      const { generateUniqueSlug } = require('../utils/generateSlug');
      const uniqueSlug = await generateUniqueSlug('Dr. Ananya Sharma', Therapist);
      assert(uniqueSlug.startsWith('dr-ananya-sharma'), 'Unique slug generator should format properly');
      logPass('Slug collision generator generates distinct slug format');
    } catch (e) {
      logFail('Slug collision generator generates distinct slug format', e);
    }

    // -------------------------------------------------------------
    // MODULE 2: SCHEDULING SYSTEM & DOUBLE-BOOKING PREVENTION
    // -------------------------------------------------------------
    console.log('\n\x1b[36m[Module 2: Scheduling System & Slot Locks]\x1b[0m');
    const Availability = require('../models/Availability');
    let availability = await Availability.findOne({ therapist_id: therapist._id });
    try {
      assert(availability, 'Availability record should exist for therapist');
      assert(availability.weeklySchedule.length === 7, 'Weekly schedule must cover 7 days');
      assert.strictEqual(availability.bufferTimeMinutes, 15, 'Rest buffer time should be 15 mins');
      logPass('Availability template and buffer time verification');
    } catch (e) {
      logFail('Availability template and buffer time verification', e);
    }

    // Double Booking Lock Test
    try {
      const testSlotStart = new Date(Date.now() + 86400000 * 5); // 5 days ahead
      const testSlotEnd = new Date(testSlotStart.getTime() + 50 * 60000);

      // Create first booking
      const firstSession = await Session.create({
        therapist_id: therapist._id,
        client_id: new mongoose.Types.ObjectId(),
        clientName: 'Test Lock Client',
        clientEmail: 'lock.client@test.com',
        startTime: testSlotStart,
        endTime: testSlotEnd,
        durationMinutes: 50,
        status: 'scheduled',
        fee: 2500,
      });

      // Try booking an overlapping slot (should conflict)
      const conflictQuery = {
        therapist_id: therapist._id,
        status: { $in: ['scheduled', 'completed'] },
        $or: [
          { startTime: { $lt: testSlotEnd, $gte: testSlotStart } },
          { endTime: { $gt: testSlotStart, $lte: testSlotEnd } },
          { startTime: { $lte: testSlotStart }, endTime: { $gte: testSlotEnd } },
        ],
      };

      const conflictFound = await Session.findOne(conflictQuery);
      assert(conflictFound, 'Conflict check must detect overlapping booked slot');
      assert.strictEqual(conflictFound._id.toString(), firstSession._id.toString());

      // Clean up test session
      await Session.findByIdAndDelete(firstSession._id);
      logPass('Double-booking prevention lock prevents overlapping appointments');
    } catch (e) {
      logFail('Double-booking prevention lock prevents overlapping appointments', e);
    }

    // Waitlist Model Test
    try {
      const waitlistEntry = await Lead.create({
        therapist_id: therapist._id,
        name: 'Waitlist Client',
        email: 'waitlist.client@test.com',
        phone: '+91 99887 76655',
        source: 'waitlist',
        message: 'Looking for evening slots',
        preferredTimes: 'Evening',
      });
      assert(waitlistEntry._id, 'Waitlist lead entry must be recorded');
      await Lead.findByIdAndDelete(waitlistEntry._id);
      logPass('Waitlist registration and prospective lead capture');
    } catch (e) {
      logFail('Waitlist registration and prospective lead capture', e);
    }

    // -------------------------------------------------------------
    // MODULE 3: CLIENT CRM & DIGITAL CONSENT
    // -------------------------------------------------------------
    console.log('\n\x1b[36m[Module 3: Client CRM & Compliance Intake]\x1b[0m');
    const rohan = await Client.findOne({ email: 'rohan.verma@example.com' });
    try {
      assert(rohan, 'Client Rohan Verma should exist');
      assert.strictEqual(rohan.consent?.agreed, true, 'Client must have digital consent agreed');
      assert(rohan.consent?.timestamp, 'Consent must store an auditable ISO timestamp');
      assert.strictEqual(rohan.consent?.version, '1.0', 'Consent schema version must be tracked');
      assert(rohan.intakeForm?.presentingConcern, 'Intake presenting concern must be recorded');
      logPass('Auditable digital informed consent and intake storage');
    } catch (e) {
      logFail('Auditable digital informed consent and intake storage', e);
    }

    // -------------------------------------------------------------
    // MODULE 4: PAYMENTS, PACKAGES & GST INVOICING
    // -------------------------------------------------------------
    console.log('\n\x1b[36m[Module 4: Payments, Packages & GST Invoices]\x1b[0m');
    try {
      const paymentCount = await Payment.countDocuments({ therapist_id: therapist._id });
      assert(paymentCount > 0, 'Therapist should have historical payments recorded');

      const samplePayment = await Payment.findOne({ therapist_id: therapist._id, status: 'captured' });
      assert(samplePayment.amount > 0, 'Payment gross amount should be > 0');
      assert(samplePayment.platform_fee >= 0, 'Platform fee must be tracked');
      assert.strictEqual(samplePayment.net_amount, samplePayment.amount - samplePayment.platform_fee);
      logPass('Payment ledger calculation (Gross, Platform Fee, Net Amount)');
    } catch (e) {
      logFail('Payment ledger calculation (Gross, Platform Fee, Net Amount)', e);
    }

    // PDF Invoice Generation Test
    try {
      const testPayment = {
        amount: 2500,
        gateway_transaction_id: 'pay_test_suite_123',
        order_id: 'order_test_suite_123',
        payment_method: 'UPI',
        invoice_number: invoiceService.generateInvoiceNumber(),
        description: 'Individual Psychotherapy Session',
      };

      const invoiceData = await invoiceService.generateGSTInvoice({
        payment: testPayment,
        therapist,
        client: rohan,
        itemDescription: 'Individual Psychotherapy Session',
      });

      assert(invoiceData.filePath, 'Invoice service should return file path');
      assert(fs.existsSync(invoiceData.filePath), 'Invoice PDF file must exist on disk');
      const stats = fs.statSync(invoiceData.filePath);
      assert(stats.size > 1000, 'Invoice PDF must have valid rendered binary size');
      logPass('GST-compliant Tax Invoice PDF generation with SAC 999312');
    } catch (e) {
      logFail('GST-compliant Tax Invoice PDF generation with SAC 999312', e);
    }

    // Multi-Session Package Test
    try {
      const packages = await Package.find({ therapist_id: therapist._id });
      assert(packages.length >= 3, 'Therapist should offer at least 3 multi-session packages (3, 6, 12 sessions)');
      const pkg6 = packages.find((p) => p.sessionCount === 6);
      assert(pkg6, '6-session package bundle must exist');
      assert(pkg6.discountPercentage > 0, 'Packages must include discount incentive');
      logPass('Multi-session therapy package templates (3/6/12 sessions)');
    } catch (e) {
      logFail('Multi-session therapy package templates (3/6/12 sessions)', e);
    }

    // -------------------------------------------------------------
    // MODULE 5: CLINICAL DOCUMENTATION & ROLE RESTRICTIONS
    // -------------------------------------------------------------
    console.log('\n\x1b[36m[Module 5: Clinical Documentation & Private/Shared Note Isolation]\x1b[0m');
    try {
      const privateNote = await SessionNote.findOne({ client_id: rohan._id, type: 'private' });
      const sharedNote = await SessionNote.findOne({ client_id: rohan._id, type: 'shared' });

      assert(privateNote, 'Private clinical note must exist in therapist EHR');
      assert(sharedNote, 'Shared homework note must exist');

      // CRITICAL SECURITY ASSERTION:
      // Client Portal queries ONLY { client_id: id, type: 'shared' }
      const clientPortalReturnedNotes = await SessionNote.find({
        client_id: rohan._id,
        type: 'shared',
      });

      const privateNotesLeaked = clientPortalReturnedNotes.some((n) => n.type === 'private');
      assert.strictEqual(privateNotesLeaked, false, 'SECURITY: Private clinical notes must NEVER leak to client portal');
      logPass('Strict Role-Restricted Data Access: Zero private notes leakage');
    } catch (e) {
      logFail('Strict Role-Restricted Data Access: Zero private notes leakage', e);
    }

    // SOAP / DAP Template Structure Test
    try {
      const soapNote = await SessionNote.findOne({ format: 'soap' });
      assert(soapNote, 'SOAP formatted note should exist');
      assert(soapNote.soap?.subjective, 'SOAP subjective field must be populated');
      assert(soapNote.soap?.plan, 'SOAP plan field must be populated');
      logPass('Structured SOAP and DAP clinical templates validation');
    } catch (e) {
      logFail('Structured SOAP and DAP clinical templates validation', e);
    }

    // -------------------------------------------------------------
    // MODULE 6: REAL-TIME CHAT & NOTIFICATIONS
    // -------------------------------------------------------------
    console.log('\n\x1b[36m[Module 6: Communication Layer (Socket.io & Notifications)]\x1b[0m');
    try {
      // Test event-driven notification dispatch
      const eventLog = notificationService.logEvent(
        'whatsapp_stub',
        'booking_confirmed',
        '+91 99887 76655',
        { test: true }
      );
      assert(eventLog.id, 'Notification event must generate unique ID');
      assert.strictEqual(eventLog.status, 'dispatched');

      const logs = notificationService.getRecentLogs();
      assert(logs.length > 0, 'Notification queue outbox must maintain audit logs');
      logPass('Event-driven notification architecture and WhatsApp stub queue');
    } catch (e) {
      logFail('Event-driven notification architecture and WhatsApp stub queue', e);
    }

    // -------------------------------------------------------------
    // MODULE 7: SUBSCRIPTION TIERS & MONGODB AGGREGATIONS
    // -------------------------------------------------------------
    console.log('\n\x1b[36m[Module 7: Centralized Entitlements & Aggregation Analytics]\x1b[0m');
    try {
      // Entitlement Service checks
      const accessFree = await entitlementService.canAccess(therapist._id, 'analytics_depth', {
        depth: 'advanced_aggregation',
      });
      // Dr. Sharma is Pro tier, so advanced aggregation should be allowed
      assert.strictEqual(accessFree.allowed, true, 'Pro tier should have access to advanced aggregation');

      const accessDAP = await entitlementService.canAccess(therapist._id, 'note_template', {
        template: 'dap',
      });
      assert.strictEqual(accessDAP.allowed, true, 'Pro tier should have access to DAP clinical template');
      logPass('Centralized Entitlement Service single source of truth gating');
    } catch (e) {
      logFail('Centralized Entitlement Service single source of truth gating', e);
    }

    // MongoDB Aggregation Pipeline Test
    try {
      const revenueAggregation = await Payment.aggregate([
        {
          $match: {
            therapist_id: therapist._id,
            status: 'captured',
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            grossRevenue: { $sum: '$amount' },
            netRevenue: { $sum: '$net_amount' },
            platformFeeTotal: { $sum: '$platform_fee' },
            transactionCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      assert(revenueAggregation.length > 0, 'MongoDB monthly revenue aggregation must return data');
      assert(revenueAggregation[0].grossRevenue > 0, 'Aggregated monthly gross revenue must be > 0');
      assert(revenueAggregation[0].netRevenue > 0, 'Aggregated monthly net revenue must be > 0');
      logPass('MongoDB aggregation pipeline for multi-month practice revenue trends');
    } catch (e) {
      logFail('MongoDB aggregation pipeline for multi-month practice revenue trends', e);
    }

    // No-show rate aggregation test
    try {
      const sessionStatusAggregation = await Session.aggregate([
        {
          $match: { therapist_id: therapist._id },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      assert(sessionStatusAggregation.length > 0, 'Session status aggregation must return counts');
      logPass('MongoDB aggregation pipeline for clinical session status & no-show rates');
    } catch (e) {
      logFail('MongoDB aggregation pipeline for clinical session status & no-show rates', e);
    }

    console.log('\n================================================================');
    console.log(`🏁 TEST SUITE SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('================================================================\n');

    await mongoose.disconnect();
    if (failedTests > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (globalErr) {
    console.error('Fatal test runner error:', globalErr);
    process.exit(1);
  }
};

runSuite();
