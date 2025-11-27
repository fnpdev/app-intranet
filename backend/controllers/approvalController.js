// backend/controllers/approvalController.js
const approvalService = require('../services/approvalService');

module.exports = {

    // ============================================================
    // CREATE FULL APPROVAL DOCUMENT
    // ============================================================
    async create(req, res) {
        try {
            const payload = req.body;
            const result = await approvalService.createFullApproval(payload);
            return res.json({ success: true, data: result });
        } catch (e) {
            console.error('approvalController.create error:', e);
            return res.status(400).json({ error: e.message || 'Unexpected error' });
        }
    },

    // ============================================================
    // APPROVE ACTION
    // ============================================================
    async approve(req, res) {
        try {
            const { document_id, group_id } = req.body;
            const user_id = req.user.id;     // PEGANDO DO TOKEN

            if (!document_id || !group_id) {
                return res.status(400).json({ error: 'document_id and group_id are required.' });
            }

            const result = await approvalService.approveAction({
                document_id,
                group_id,
                user_id
            });

            return res.json({ success: true, data: result });

        } catch (e) {
            console.error("approvalController.approve error:", e);
            return res.status(400).json({ error: e.message });
        }
    },

    // ============================================================
    // REJECT ACTION
    // ============================================================
    async reject(req, res) {
        try {
            const { document_id, group_id } = req.body;
            const user_id = req.user.id;     // DO TOKEN

            if (!document_id || !group_id) {
                return res.status(400).json({ error: 'document_id and group_id are required.' });
            }

            const result = await approvalService.rejectAction({
                document_id,
                group_id,
                user_id
            });

            return res.json({ success: true, data: result });

        } catch (e) {
            console.error("approvalController.reject error:", e);
            return res.status(400).json({ error: e.message });
        }
    },

    // ============================================================
    // GET DOCUMENT BY ID
    // ============================================================
    async getDocument(req, res) {
        try {
            const id = req.params.id;
            const doc = await approvalService.getDocumentById(id);
            return res.json({ success: true, data: doc });

        } catch (e) {
            console.error("approvalController.getDocument error:", e);
            return res.status(400).json({ error: e.message });
        }
    },

    // ============================================================
    // LIST DOCUMENTS (APENAS SE LISTDocuments EXISTIR)
    // ============================================================
    async list(req, res) {
        try {
            if (!approvalService.listDocuments) {
                return res.status(400).json({ 
                    error: 'listDocuments() not implemented in approvalService' 
                });
            }

            const docs = await approvalService.listDocuments();
            return res.json({ success: true, data: docs });

        } catch (e) {
            console.error("approvalController.list error:", e);
            return res.status(400).json({ error: e.message });
        }
    },

    // ============================================================
    // MY PENDING
    // ============================================================
    async myPending(req, res) {
        try {
            const user_id = req.user.id;

            const rows = await approvalService.getPendingByUser(user_id);
            res.json({ success: true, data: rows });

        } catch (e) {
            res.status(400).json({ error: e.message });
        }
    },

};
