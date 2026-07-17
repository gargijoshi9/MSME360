'use strict';

const Invoice = require('../models/Invoice');

// ── GET /api/finances/overview ────────────────────────────────────────────
// Summary cards: total billed, collected, pending, GST liability

const getOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    const now    = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [allTime, thisMonth, overdueCount] = await Promise.all([
      // All-time aggregation
      Invoice.aggregate([
        { $match: { userId: new (require('mongoose').Types.ObjectId)(userId), status: { $ne: 'cancelled' } } },
        { $group: {
          _id:         null,
          totalBilled: { $sum: '$grandTotal' },
          totalPaid:   { $sum: '$amountPaid' },
          totalDue:    { $sum: '$amountDue' },
          totalGST:    { $sum: '$totalGST' },
          totalDiscount: { $sum: '$discount' },
          count:       { $sum: 1 },
        }},
      ]),

      // This month
      Invoice.aggregate([
        { $match: {
          userId:    new (require('mongoose').Types.ObjectId)(userId),
          createdAt: { $gte: monthStart },
          status:    { $ne: 'cancelled' },
        }},
        { $group: {
          _id:            null,
          monthlyBilled:  { $sum: '$grandTotal' },
          monthlyPaid:    { $sum: '$amountPaid' },
          monthlyGST:     { $sum: '$totalGST' },
          monthlyDiscount: { $sum: '$discount' },
          monthlyCount:   { $sum: 1 },
        }},
      ]),

      // Overdue count
      Invoice.countDocuments({
        userId,
        status:  'overdue',
      }),
    ]);

    const all = allTime[0]  || { totalBilled: 0, totalPaid: 0, totalDue: 0, totalGST: 0, totalDiscount: 0, count: 0 };
    const mon = thisMonth[0] || { monthlyBilled: 0, monthlyPaid: 0, monthlyGST: 0, monthlyDiscount: 0, monthlyCount: 0 };

    return res.json({
      success: true,
      overview: {
        allTime: {
          totalBilled: Math.round(all.totalBilled * 100) / 100,
          totalPaid:   Math.round(all.totalPaid   * 100) / 100,
          totalDue:    Math.round(all.totalDue     * 100) / 100,
          totalGST:    Math.round(all.totalGST     * 100) / 100,
          totalDiscount: Math.round((all.totalDiscount || 0) * 100) / 100,
          invoiceCount: all.count,
        },
        thisMonth: {
          billed:  Math.round(mon.monthlyBilled * 100) / 100,
          paid:    Math.round(mon.monthlyPaid   * 100) / 100,
          gst:     Math.round(mon.monthlyGST    * 100) / 100,
          discount: Math.round((mon.monthlyDiscount || 0) * 100) / 100,
          count:   mon.monthlyCount,
        },
        overdueCount,
      },
    });
  } catch (err) {
    console.error('[FinanceController/overview]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch overview.' });
  }
};

// ── GET /api/finances/gst-summary ────────────────────────────────────────
// Monthly GST breakdown for the last 6 months

const getGstSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const data = await Invoice.aggregate([
      { $match: {
        userId:    new (require('mongoose').Types.ObjectId)(userId),
        status:    { $nin: ['cancelled', 'draft'] },
      }},
      { $group: {
        _id: {
          year:  { $year:  '$createdAt' },
          month: { $month: '$createdAt' },
        },
        totalBilled:  { $sum: '$grandTotal' },
        totalGST:     { $sum: '$totalGST' },
        totalSubtotal:{ $sum: '$subtotal' },
        invoiceCount: { $sum: 1 },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const months = data.map(d => ({
      label:        `${d._id.year}-${String(d._id.month).padStart(2, '0')}`,
      totalBilled:  Math.round(d.totalBilled   * 100) / 100,
      totalGST:     Math.round(d.totalGST      * 100) / 100,
      subtotal:     Math.round(d.totalSubtotal * 100) / 100,
      invoiceCount: d.invoiceCount,
      cgst:         Math.round(d.totalGST / 2  * 100) / 100,
      sgst:         Math.round(d.totalGST / 2  * 100) / 100,
    }));

    return res.json({ success: true, gstSummary: months });
  } catch (err) {
    console.error('[FinanceController/gst]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch GST summary.' });
  }
};

// ── GET /api/finances/cash-flow ───────────────────────────────────────────
// Monthly revenue vs collections for the last 6 months

const getCashFlow = async (req, res) => {
  try {
    const userId = req.user.id;

    const data = await Invoice.aggregate([
      { $match: {
        userId:    new (require('mongoose').Types.ObjectId)(userId),
        status:    { $ne: 'cancelled' },
      }},
      { $group: {
        _id: {
          year:  { $year:  '$createdAt' },
          month: { $month: '$createdAt' },
        },
        invoiced:  { $sum: '$grandTotal' },
        collected: { $sum: '$amountPaid' },
        pending:   { $sum: '$amountDue' },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return res.json({
      success: true,
      cashFlow: data.map(d => ({
        label:     `${d._id.year}-${String(d._id.month).padStart(2, '0')}`,
        invoiced:  Math.round(d.invoiced  * 100) / 100,
        collected: Math.round(d.collected * 100) / 100,
        pending:   Math.round(d.pending   * 100) / 100,
      })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch cash flow.' });
  }
};

// ── GET /api/finances/aging ───────────────────────────────────────────────
// Accounts receivable aging: current / 30 / 60 / 90+ days overdue

const getAging = async (req, res) => {
  try {
    const userId = req.user.id;
    const now    = Date.now();

    const unpaid = await Invoice.find({
      userId,
      status: { $in: ['sent', 'partially_paid', 'overdue'] },
    }).lean();

    const buckets = { current: 0, d30: 0, d60: 0, d90plus: 0 };

    unpaid.forEach(inv => {
      const due  = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.createdAt);
      const days = Math.floor((now - due.getTime()) / 86_400_000);
      const amt  = inv.amountDue || 0;

      if (days <= 0)       buckets.current += amt;
      else if (days <= 30) buckets.d30     += amt;
      else if (days <= 60) buckets.d60     += amt;
      else                 buckets.d90plus += amt;
    });

    return res.json({
      success: true,
      aging: {
        current:   Math.round(buckets.current  * 100) / 100,
        '1-30':    Math.round(buckets.d30      * 100) / 100,
        '31-60':   Math.round(buckets.d60      * 100) / 100,
        '90+':     Math.round(buckets.d90plus  * 100) / 100,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch aging.' });
  }
};

module.exports = { getOverview, getGstSummary, getCashFlow, getAging };
