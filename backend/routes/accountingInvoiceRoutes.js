const express = require('express');
const router = express.Router();
const service = require('../services/accountingInvoiceService');
const { requireLevel } = require('../middlewares/accessLevelMiddleware');

// =========================
// INVOICES BÁSICO
// =========================

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

// GET single invoice by ID
router.get('/:id', requireLevel(1), async (req, res) => {
  try {
    const data = await service.getInvoiceById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// GET invoices by step
router.get('/step/:step', requireLevel(1), async (req, res) => {
  try {
    const data = await service.listByStep(req.params.step, req.user.id);
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
      ...req.body,
      user_id: req.user.id
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET logs/steps
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

// CLOSE invoice
router.put('/close/:id', requireLevel(1), async (req, res) => {
  try {
    const data = await service.closeInvoice(req.params.id, req.user.id);
    res.json({ success: true, message: 'Invoice closed successfully', data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// SAAM lookup
router.get('/saam/:id', requireLevel(1), async (req, res) => {
  try {
    const data = await service.getNFByKey(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
//   CONTAGEM (NEW FEATURE)
// =========================

// GET current count info (uses invoice.last_count_step_id)
router.get('/:id/contagem', requireLevel(1), async (req, res) => {
  try {
    const data = await service.getCurrentCount(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST start new count OR re-count
router.post('/:id/contagem', requireLevel(1), async (req, res) => {
  try {
    const data = await service.startCount(req.params.id, req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// PUT update count item qty
router.get('/contagem/:id', requireLevel(1), async (req, res) => {
  try {
    const data = await service.getCountByStepId(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// PUT update count item qty
router.put('/contagem/item/:item_id', requireLevel(1), async (req, res) => {
  try {
    const data = await service.updateCountItem(req.params.item_id, req.body.qty_counted);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT finalize count
router.put('/contagem/:count_id/finalize', requireLevel(1), async (req, res) => {
  try {
    const data = await service.finalizeCount(req.params.count_id, req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
