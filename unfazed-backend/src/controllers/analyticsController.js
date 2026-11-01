const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Session = require('../models/Session');
const Client = require('../models/Client');
const entitlementService = require('../services/entitlementService');

// @desc    Get Analytics Metrics using MongoDB Aggregation Pipelines
// @route   GET /api/analytics
const getAnalytics = async (req, res, next) => {
  try {
    const therapistId = new mongoose.Types.ObjectId(req.therapist._id);
    const { depth = 'standard_trends' } = req.query;

    // Check entitlement depth
    const access = await entitlementService.canAccess(req.therapist._id, 'analytics_depth', { depth });

    // 1. Revenue Trend Aggregation (Monthly)
    const revenueAggregation = await Payment.aggregate([
      {
        $match: {
          therapist_id: therapistId,
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
      {
        $project: {
          month: '$_id',
          grossRevenue: 1,
          netRevenue: 1,
          platformFeeTotal: 1,
          transactionCount: 1,
          _id: 0,
        },
      },
    ]);

    // 2. Session Status Breakdown & No-Show Rate Aggregation
    const sessionStatusAggregation = await Session.aggregate([
      {
        $match: { therapist_id: therapistId },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalHours: { $sum: { $divide: ['$durationMinutes', 60] } },
        },
      },
    ]);

    const statusCounts = {
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
    };
    let totalCompletedOrNoShow = 0;

    sessionStatusAggregation.forEach((item) => {
      if (statusCounts[item._id] !== undefined) {
        statusCounts[item._id] = item.count;
      }
      if (['completed', 'no_show', 'cancelled'].includes(item._id)) {
        totalCompletedOrNoShow += item.count;
      }
    });

    const noShowRate = totalCompletedOrNoShow > 0
      ? Math.round((statusCounts.no_show / totalCompletedOrNoShow) * 100 * 10) / 10
      : 0;

    // 3. Client Retention & Active vs Inactive
    const clientStatusAggregation = await Client.aggregate([
      {
        $match: { therapist_id: therapistId },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // 4. Session Type Distribution
    const sessionTypesAggregation = await Session.aggregate([
      {
        $match: { therapist_id: therapistId },
      },
      {
        $group: {
          _id: '$sessionType',
          count: { $sum: 1 },
          revenue: { $sum: '$fee' },
        },
      },
      {
        $project: {
          sessionType: '$_id',
          count: 1,
          revenue: 1,
          _id: 0,
        },
      },
    ]);

    // 5. Overall Totals
    const totalEarnings = revenueAggregation.reduce((acc, curr) => acc + curr.netRevenue, 0);
    const totalGross = revenueAggregation.reduce((acc, curr) => acc + curr.grossRevenue, 0);
    const activeClients = await Client.countDocuments({ therapist_id: therapistId, status: 'active' });
    const totalClients = await Client.countDocuments({ therapist_id: therapistId });

    res.json({
      success: true,
      entitlement: access,
      summary: {
        totalNetRevenue: totalEarnings,
        totalGrossRevenue: totalGross,
        activeClients,
        totalClients,
        noShowRate,
        completedSessions: statusCounts.completed,
        scheduledUpcoming: statusCounts.scheduled,
      },
      charts: {
        revenueTrend: revenueAggregation,
        sessionBreakdown: [
          { name: 'Completed', value: statusCounts.completed, color: '#10B981' },
          { name: 'Scheduled', value: statusCounts.scheduled, color: '#3B82F6' },
          { name: 'Cancelled', value: statusCounts.cancelled, color: '#F59E0B' },
          { name: 'No Show', value: statusCounts.no_show, color: '#EF4444' },
        ],
        sessionTypes: sessionTypesAggregation,
        clientStatus: clientStatusAggregation,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics,
};
