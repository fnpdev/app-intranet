// services/costReallocationService.js

const db = require('../config/db_postgres');
const approvalService = require('../services/approvalService');

module.exports = {

    // ============================================
    // CREATE (user_id added)
    // ============================================
    async createHeader(data) {
        const query = `
            INSERT INTO cost_reallocation
                (branch, issue_date, justification, type, spreadsheet, status, user_id)
            VALUES ($1,$2,$3,$4,$5,'open',$6)
            RETURNING *;
        `;

        const values = [
            data.branch,
            data.issue_date,
            data.justification,
            data.type,
            data.spreadsheet,
            data.user_id
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    },

    // ============================================
    // UPDATE (does NOT update user_id)
    // ============================================
    async updateHeader(id, data) {
        const query = `
            UPDATE cost_reallocation
            SET 
                branch = $1,
                issue_date = $2,
                justification = $3,
                type = $4,
                spreadsheet = $5,
                updated_at = NOW()
            WHERE id = $6
              AND status = 'open'
              AND deleted_at IS NULL
            RETURNING *;
        `;

        const values = [
            data.branch,
            data.issue_date,
            data.justification,
            data.type,
            data.spreadsheet,
            id
        ];

        const result = await db.query(query, values);

        if (!result.rows.length) {
            throw new Error("Realocação não pode ser editada.");
        }

        return result.rows[0];
    },

    async softDeleteHeader(id) {
        const result = await db.query(
            `UPDATE cost_reallocation
             SET deleted_at = NOW()
             WHERE id = $1 AND deleted_at IS NULL
             RETURNING *;`,
            [id]
        );

        if (!result.rows.length) {
            throw new Error("Registro não encontrado ou já excluído.");
        }

        return result.rows[0];
    },

    async findHeader(id) {
        const result = await db.query(
            `SELECT *
             FROM cost_reallocation
             WHERE id = $1 AND deleted_at IS NULL`,
            [id]
        );
        return result.rows[0];
    },

    async findAllHeaders(filters = {}) {
        let sql = `SELECT * FROM cost_reallocation WHERE deleted_at IS NULL`;
        const params = [];
        let i = 1;

        if (filters.type) {
            sql += ` AND type = $${i++}`;
            params.push(filters.type);
        }
        if (filters.status) {
            sql += ` AND status = $${i++}`;
            params.push(filters.status);
        }
        if (filters.branch) {
            sql += ` AND branch = $${i++}`;
            params.push(filters.branch);
        }

        sql += ` ORDER BY id DESC`;

        const result = await db.query(sql, params);
        return result.rows;
    },

    // ITEMS
    async createItems(id, items) {
        const inserted = [];

        for (const item of items) {
            const query = `
                INSERT INTO cost_reallocation_items
                    (reallocation_id, item_date, balance_type, entry_type,
                     cost_center, account, class, operation, accounting_item, value)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                RETURNING *;
            `;

            const values = [
                id,
                item.item_date,
                item.balance_type,
                item.entry_type,
                item.cost_center,
                item.account,
                item.class,
                item.operation,
                item.accounting_item,
                item.value
            ];

            const res = await db.query(query, values);
            inserted.push(res.rows[0]);
        }

        return inserted;
    },

    async softDeleteItems(id) {
        await db.query(
            `UPDATE cost_reallocation_items
             SET deleted_at = NOW()
             WHERE reallocation_id = $1 AND deleted_at IS NULL`,
            [id]
        );
    },

    async findItems(id) {
        const result = await db.query(
            `SELECT *
             FROM cost_reallocation_items
             WHERE reallocation_id = $1 AND deleted_at IS NULL`,
            [id]
        );
        return result.rows;
    },

    // VALIDATION
    async validateReallocation(id) {
        const items = await this.findItems(id);

        if (items.length === 0) {
            throw new Error("Nenhum item encontrado para validação.");
        }

        return { valid: true, total_items: items.length };
    },

    // CANCEL
    async cancelReallocation(id) {
        const result = await db.query(
            `UPDATE cost_reallocation
             SET status = 'cancelled', updated_at = NOW()
             WHERE id = $1
               AND status = 'open'
               AND deleted_at IS NULL
             RETURNING *;`,
            [id]
        );

        if (!result.rows.length) {
            throw new Error("Somente realocações abertas podem ser canceladas.");
        }

        return result.rows[0];
    },

    // SUBMIT → inicia fluxo de aprovação
    async submit(id) {
        const approval = await approvalService.createFullApproval({
            module: "reallocation",
            reference_id: id
        });

        const result = await db.query(
            `UPDATE cost_reallocation
             SET status = 'pending_approval',
                 approval_document_id = $2,
                 updated_at = NOW()
             WHERE id = $1 AND deleted_at IS NULL
             RETURNING *;`,
            [id, approval.id]
        );

        return result.rows[0];
    },

    async approve(id) {
        const result = await db.query(
            `UPDATE cost_reallocation
             SET status = 'approved', updated_at = NOW()
             WHERE id = $1 AND deleted_at IS NULL
             RETURNING *;`,
            [id]
        );
        return result.rows[0];
    },

    async reject(id) {
        const result = await db.query(
            `UPDATE cost_reallocation
             SET status = 'rejected', updated_at = NOW()
             WHERE id = $1 AND deleted_at IS NULL
             RETURNING *;`,
            [id]
        );
        return result.rows[0];
    },

    async finish(id) {
        const result = await db.query(
            `UPDATE cost_reallocation
             SET status = 'finished', updated_at = NOW()
             WHERE id = $1 AND deleted_at IS NULL
             RETURNING *;`,
            [id]
        );
        return result.rows[0];
    }

};
