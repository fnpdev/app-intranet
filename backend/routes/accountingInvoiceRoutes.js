//backend\routes\accountingInvoiceRoutes.js
const express = require('express');
const router = express.Router();
const service = require('../services/accountingInvoiceService');
const { requireLevel } = require('../middlewares/accessLevelMiddleware');

// GET all active invoices
router.get('/', requireLevel(1), async (req, res) => {
  try {
    const data = await service.listAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create invoice
router.post('/', requireLevel(1), async (req, res) => {
  try {
    const data = await service.create(req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET invoices by step
router.get('/step/:step', requireLevel(1), async (req, res) => {
  try {
    const data = await service.listByStep(req.params.step);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// PUT update step
router.put('/:id/step', requireLevel(1), async (req, res) => {
  try {
    const data = await service.updateStep({
      id: req.params.id,
      ...req.body
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET logs
router.get('/:id/logs', requireLevel(1), async (req, res) => {
  try {
    const data = await service.listLogs(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE soft delete
router.delete('/:id', requireLevel(9), async (req, res) => {
  try {
    const data = await service.softDelete(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🔒 Close invoice by ID
router.put('/close/:id', requireLevel(1), async (req, res) => {
  try {
    const data = await service.closeInvoice(req.params.id, req.user.id);
    res.json({ success: true, message: 'Invoice closed successfully', data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET performance report
router.get('/report/performance', requireLevel(9), async (req, res) => {
  try {
    const data = await service.performanceReport();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
