const fs = require('fs');
const path = require('path');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const Session = require('../models/Session');
const Payment = require('../models/Payment');
const SessionNote = require('../models/SessionNote');
const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');
const Availability = require('../models/Availability');

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../uploads/backups');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    this.latestBackupPath = path.join(this.backupDir, 'data_snapshot.json');
  }

  /**
   * Export all collections to a safety snapshot JSON file
   */
  async exportSnapshot() {
    try {
      const [therapists, clients, sessions, payments, notes, tiers, availabilities] = await Promise.all([
        Therapist.find({}).lean(),
        Client.find({}).lean(),
        Session.find({}).lean(),
        Payment.find({}).lean(),
        SessionNote.find({}).lean(),
        SubscriptionTierConfig.find({}).lean(),
        Availability.find({}).lean(),
      ]);

      const snapshot = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        counts: {
          therapists: therapists.length,
          clients: clients.length,
          sessions: sessions.length,
          payments: payments.length,
          notes: notes.length,
          tiers: tiers.length,
          availabilities: availabilities.length,
        },
        data: {
          therapists,
          clients,
          sessions,
          payments,
          notes,
          tiers,
          availabilities,
        },
      };

      fs.writeFileSync(this.latestBackupPath, JSON.stringify(snapshot, null, 2), 'utf8');
      console.log(`[BackupService] Safety snapshot created (${new Date().toLocaleTimeString('en-IN')}) with ${therapists.length} doctors, ${clients.length} clients, ${sessions.length} sessions.`);
      return snapshot;
    } catch (err) {
      console.error('[BackupService Export Error]', err.message);
      return null;
    }
  }

  /**
   * Restore snapshot from disk if database collections are empty
   */
  async restoreIfEmpty() {
    try {
      const therapistCount = await Therapist.countDocuments();
      if (therapistCount > 0) {
        return { restored: false, reason: 'Database already contains data' };
      }

      if (!fs.existsSync(this.latestBackupPath)) {
        return { restored: false, reason: 'No snapshot file found' };
      }

      const raw = fs.readFileSync(this.latestBackupPath, 'utf8');
      const snapshot = JSON.parse(raw);
      const data = snapshot.data || {};

      if (data.therapists?.length) await Therapist.insertMany(data.therapists);
      if (data.clients?.length) await Client.insertMany(data.clients);
      if (data.sessions?.length) await Session.insertMany(data.sessions);
      if (data.payments?.length) await Payment.insertMany(data.payments);
      if (data.notes?.length) await SessionNote.insertMany(data.notes);
      if (data.tiers?.length) await SubscriptionTierConfig.insertMany(data.tiers);
      if (data.availabilities?.length) await Availability.insertMany(data.availabilities);

      console.log(`[BackupService] Database restored successfully from safety snapshot created at ${snapshot.timestamp}`);
      return { restored: true, timestamp: snapshot.timestamp, counts: snapshot.counts };
    } catch (err) {
      console.error('[BackupService Restore Error]', err.message);
      return { restored: false, error: err.message };
    }
  }

  getBackupStatus() {
    const exists = fs.existsSync(this.latestBackupPath);
    if (!exists) {
      return { exists: false, healthy: false, message: 'No backup file generated yet' };
    }
    const stats = fs.statSync(this.latestBackupPath);
    let counts = null;
    try {
      const raw = fs.readFileSync(this.latestBackupPath, 'utf8');
      const parsed = JSON.parse(raw);
      counts = parsed.counts;
    } catch (e) {}

    return {
      exists: true,
      healthy: true,
      counts,
      lastModified: stats.mtime,
      sizeBytes: stats.size,
      filePath: this.latestBackupPath,
    };
  }
}

module.exports = new BackupService();
