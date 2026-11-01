const Lead = require('../models/Lead');
const Client = require('../models/Client');
const notificationService = require('./notificationService');

class LeadDistributionService {
  async captureLead({ therapistId, name, email, phone, source, message, preferredTimes }) {
    const lead = await Lead.create({
      therapist_id: therapistId,
      name,
      email,
      phone,
      source: source || 'branded_link',
      message: message || '',
      preferredTimes: preferredTimes || '',
    });

    // Notify therapist of a new inbound prospective client
    console.log(`[Lead captured] Therapist ${therapistId} received lead from ${name} (${email})`);
    return lead;
  }

  async convertLeadToClient(leadId) {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new Error('Lead not found');

    let client = await Client.findOne({
      therapist_id: lead.therapist_id,
      email: lead.email.toLowerCase(),
    });

    if (!client) {
      client = await Client.create({
        therapist_id: lead.therapist_id,
        name: lead.name,
        email: lead.email.toLowerCase(),
        phone: lead.phone,
        status: 'active',
        tags: ['New Lead', 'Inquiry Converted'],
      });
    }

    lead.status = 'converted';
    await lead.save();

    return { lead, client };
  }
}

module.exports = new LeadDistributionService();
