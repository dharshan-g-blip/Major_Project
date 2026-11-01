const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    this.outboxLogs = []; // In-memory queue log for UI inspection & audit
    this.transporter = null;
    this.initTransporter();
  }

  async initTransporter() {
    try {
      // Create a test account or ethereal fallback
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('[NotificationService] Nodemailer test transport initialized');
    } catch (err) {
      console.warn('[NotificationService] Using simulated mail transporter:', err.message);
    }
  }

  /**
   * Log notification event into outbox audit trail
   */
  logEvent(channel, type, recipient, payload) {
    const entry = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      channel, // 'whatsapp_stub' | 'email' | 'in_app'
      type, // 'booking_confirmed' | 'reminder_24h' | 'post_session_followup' | 'payment_confirmed'
      recipient,
      payload,
      status: 'dispatched',
      timestamp: new Date().toISOString(),
    };
    this.outboxLogs.unshift(entry);
    if (this.outboxLogs.length > 100) this.outboxLogs.pop();
    console.log(`[Notification Dispatched] [${channel.toUpperCase()}] ${type} to ${recipient}`);
    return entry;
  }

  /**
   * WhatsApp Stub Layer (event-driven architecture compliant with Indian practice standards)
   */
  async sendWhatsAppStub(type, recipientPhone, payload) {
    const messageTemplate = this.getWhatsAppTemplate(type, payload);
    return this.logEvent('whatsapp_stub', type, recipientPhone, {
      template: messageTemplate,
      metaData: payload,
    });
  }

  /**
   * Email Dispatcher
   */
  async sendEmail(type, recipientEmail, payload) {
    const subject = this.getEmailSubject(type, payload);
    const text = this.getEmailBody(type, payload);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: '"Unfazed Therapy Practice" <notifications@unfazed.in>',
          to: recipientEmail,
          subject,
          text,
        });
      } catch (e) {
        // Handled silently
      }
    }

    return this.logEvent('email', type, recipientEmail, { subject, text, payload });
  }

  /**
   * Domain Event: Booking Confirmed
   */
  async notifyBookingConfirmed({ session, therapist, client }) {
    const dateFormatted = new Date(session.startTime).toLocaleString('en-IN', {
      timeZone: session.timezone || 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const payload = {
      clientName: client.name,
      therapistName: therapist.name,
      dateTime: dateFormatted,
      meetingLink: session.meetingLink,
      duration: session.durationMinutes,
      fee: session.fee,
    };

    // Trigger WhatsApp stub
    if (client.phone) {
      await this.sendWhatsAppStub('booking_confirmed', client.phone, payload);
    }

    // Trigger Email
    if (client.email) {
      await this.sendEmail('booking_confirmed', client.email, payload);
    }
  }

  /**
   * Domain Event: 24h Session Reminder
   */
  async notify24hReminder({ session, therapist, client }) {
    const dateFormatted = new Date(session.startTime).toLocaleString('en-IN', {
      timeZone: session.timezone || 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const payload = {
      clientName: client.name,
      therapistName: therapist.name,
      dateTime: dateFormatted,
      meetingLink: session.meetingLink,
    };

    if (client.phone) {
      await this.sendWhatsAppStub('reminder_24h', client.phone, payload);
    }
    if (client.email) {
      await this.sendEmail('reminder_24h', client.email, payload);
    }
  }

  /**
   * Domain Event: Post-Session Follow-up & Homework
   */
  async notifyPostSessionFollowup({ session, therapist, client, sharedNoteSummary }) {
    const payload = {
      clientName: client.name,
      therapistName: therapist.name,
      portalLink: `${process.env.CLIENT_URL || 'http://localhost:5000'}/portal?email=${encodeURIComponent(client.email)}`,
      summary: sharedNoteSummary || 'Your session notes and follow-up homework are now updated in your portal.',
    };

    if (client.phone) {
      await this.sendWhatsAppStub('post_session_followup', client.phone, payload);
    }
    if (client.email) {
      await this.sendEmail('post_session_followup', client.email, payload);
    }
  }

  /**
   * Domain Event: Payment Received & Invoice Ready
   */
  async notifyPaymentConfirmed({ payment, therapist, client }) {
    const payload = {
      clientName: client.name,
      therapistName: therapist.name,
      amount: payment.amount,
      invoiceNumber: payment.invoice_number,
      transactionId: payment.gateway_transaction_id,
    };

    if (client.phone) {
      await this.sendWhatsAppStub('payment_confirmed', client.phone, payload);
    }
    if (client.email) {
      await this.sendEmail('payment_confirmed', client.email, payload);
    }
  }

  getWhatsAppTemplate(type, payload) {
    switch (type) {
      case 'booking_confirmed':
        return `Namaste ${payload.clientName}, your therapy session with ${payload.therapistName} is confirmed for ${payload.dateTime} IST. Join securely via: ${payload.meetingLink}`;
      case 'reminder_24h':
        return `Reminder: Your therapy session with ${payload.therapistName} is scheduled in 24 hours (${payload.dateTime}). If you need to reschedule, please notify in advance.`;
      case 'post_session_followup':
        return `Hi ${payload.clientName}, thank you for your session with ${payload.therapistName}. Your shared notes & reflections are ready: ${payload.portalLink}`;
      case 'payment_confirmed':
        return `Payment of ₹${payload.amount} confirmed for ${payload.therapistName}. Invoice #${payload.invoiceNumber} has been issued.`;
      default:
        return `Update from ${payload.therapistName} regarding your session.`;
    }
  }

  getEmailSubject(type, payload) {
    switch (type) {
      case 'booking_confirmed':
        return `Confirmed: Your therapy session with ${payload.therapistName}`;
      case 'reminder_24h':
        return `Upcoming Session Reminder: ${payload.therapistName}`;
      case 'post_session_followup':
        return `Shared Notes & Reflections from ${payload.therapistName}`;
      case 'payment_confirmed':
        return `Receipt & Invoice #${payload.invoiceNumber} - Unfazed`;
      default:
        return `Update from Unfazed`;
    }
  }

  getEmailBody(type, payload) {
    return JSON.stringify(payload, null, 2);
  }

  getRecentLogs() {
    return this.outboxLogs;
  }
}

module.exports = new NotificationService();
