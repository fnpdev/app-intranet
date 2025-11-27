// controllers/costReallocationController.js

const service = require('../services/costReallocationService');

module.exports = {

    async create(req, res) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ success: false, error: "Usuário não autenticado." });
            }

            const header = await service.createHeader({
                ...req.body.header,
                user_id: userId
            });

            return res.json({ success: true, data: header });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    async update(req, res) {
        try {
            const id = req.params.id;
            const header = await service.updateHeader(id, req.body);
            return res.json({ success: true, data: header });
        } catch (error) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async delete(req, res) {
        try {
            const id = req.params.id;
            const deleted = await service.softDeleteHeader(id);
            return res.json({ success: true, data: deleted });
        } catch (error) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async find(req, res) {
        try {
            const data = await service.findHeader(req.params.id);
            return res.json({ success: true, data });
        } catch (error) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async list(req, res) {
        try {
            const data = await service.findAllHeaders(req.query);
            return res.json({ success: true, data });
        } catch (error) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async createItems(req, res) {
        try {
            const { id } = req.params;
            await service.softDeleteItems(id);
            const result = await service.createItems(id, req.body.items);
            return res.json({ success: true, data: result });
        } catch (error) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async getItems(req, res) {
        try {
            const { id } = req.params;
            const result = await service.findItems(id);
            return res.json({ success: true, data: result });
        } catch (error) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async validate(req, res) {
        try {
            const { id } = req.params;
            const result = await service.validateReallocation(id);
            return res.json({ success: true, data: result });
        } catch (error) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async cancel(req, res) {
        try {
            const result = await service.cancelReallocation(req.params.id);
            return res.json({ success: true, data: result });
        } catch (error) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async submit(req, res) {
        try {
            const { id } = req.params;
            const result = await service.submit(id);
            return res.json({ success: true, data: result });
        } catch (error) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async approve(req, res) {
        try {
            const result = await service.approve(req.params.id);
            return res.json({ success: true, data: result });
        } catch (error) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async reject(req, res) {
        try {
            const result = await service.reject(req.params.id);
            return res.json({ success: true, data: result });
        } catch (error) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async finish(req, res) {
        try {
            const result = await service.finish(req.params.id);
            return res.json({ success: true, data: result });
        } catch (error) {
            return res.status(400).json({ success: false, error: error.message });
        }
    }

};
