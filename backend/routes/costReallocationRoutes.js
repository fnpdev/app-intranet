const express = require('express');
const router = express.Router();

const controller = require('../controllers/costReallocationController');

// HEADER
router.post('/', controller.create);
router.get('/', controller.list);
router.get('/:id', controller.find);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

// ITEMS
router.post('/:id/items', controller.createItems);
router.get('/:id/items', controller.getItems);

// WORKFLOW
router.post('/:id/validate', controller.validate);
router.post('/:id/cancel', controller.cancel);
router.post('/:id/submit', controller.submit);
router.post('/:id/approve', controller.approve);
router.post('/:id/reject', controller.reject);
router.post('/:id/finish', controller.finish);

module.exports = router;
