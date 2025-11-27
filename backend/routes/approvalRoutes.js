const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');

const controller = require('../controllers/approvalController');

// CREATE FULL DOCUMENT
router.post('/create', verifyToken, controller.create);

// APPROVE GROUP
router.post('/approve', verifyToken, controller.approve);

// REJECT GROUP
router.post('/reject', verifyToken, controller.reject);

// PENDING ITEMS FOR USER
router.get('/my-pending', verifyToken, controller.myPending);

// LIST (somente se você implementar listDocuments)
router.get('/list', verifyToken, controller.list);

// GET DOCUMENT BY ID
router.get("/document/:id", verifyToken, controller.getDocument);

module.exports = router;
