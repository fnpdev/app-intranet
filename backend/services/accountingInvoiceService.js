//backend\services\accountingInvoiceService.js
const db = require('../config/db_postgres');

module.exports = {
    // 📋 List all active invoice receivings
    async listAll() {
        const sql = `
            SELECT 
                r.*,
                u.name AS user_name,
                (
                    SELECT COUNT(*) 
                    FROM accounting_invoice_logs l 
                    WHERE l.receiving_id = r.id AND l.deleted_at IS NULL
                ) AS total_logs
            FROM accounting_invoices r
            LEFT JOIN intranet_users u ON u.id = r.user_id
            WHERE r.active = TRUE AND r.deleted_at IS NULL
            ORDER BY r.created_at DESC
        `;
        const { rows } = await db.query(sql);
        return rows;
    },

    // ➕ Create new invoice receiving
    async create({ user_id, invoice_key, current_step, message, note }) {
        // 🧠 1. Verifica se a nota já existe
        const checkSql = `
            SELECT * FROM accounting_invoices
            WHERE invoice_key = $1 AND deleted_at IS NULL
            LIMIT 1
        `;
        const { rows: existing } = await db.query(checkSql, [invoice_key]);

        // ✅ Se já existe, apenas retorna o registro
        if (existing.length > 0) {
            return existing[0];
        }

        // 🧾 2. Cria o novo registro
        const insert = `
            INSERT INTO accounting_invoices (user_id, invoice_key, current_step, message, note, status)
            VALUES ($1, $2, $3, $4, $5, 'OPEN')
            RETURNING *
        `;
        const { rows } = await db.query(insert, [user_id, invoice_key, current_step, message, note]);
        const receiving = rows[0];

        // 🪵 3. Cria log inicial (GATE)
        const logInsert = `
            INSERT INTO accounting_invoice_logs (receiving_id, user_id, to_step, message, note)
            VALUES ($1, $2, $3, $4, $5)
        `;
        await db.query(logInsert, [receiving.id, user_id, receiving.current_step, receiving.message, receiving.note]);

        return receiving;
    },

    // 🔄 Update workflow step
    async updateStep({ id, to_step, message, note, user_id }) {
        const find = `
            SELECT current_step 
            FROM accounting_invoices 
            WHERE id = $1 AND deleted_at IS NULL
        `;
        const { rows: current } = await db.query(find, [id]);
        if (current.length === 0) throw new Error('Receiving not found');

        const from_step = current[0].current_step;

        // Atualiza registro principal
        const update = `
            UPDATE accounting_invoices
            SET current_step = $1, message = $2, note = $3, updated_at = NOW()
            WHERE id = $4 AND deleted_at IS NULL
            RETURNING *
        `;
        const { rows } = await db.query(update, [to_step, message, note, id]);
        const updated = rows[0];

        // Cria log de movimentação
        const log = `
            INSERT INTO accounting_invoice_logs 
                (receiving_id, from_step, to_step, message, user_id, note)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await db.query(log, [id, from_step, to_step, message, user_id, note]);

        return updated;
    },

    // 📜 List logs for one invoice
    async listLogs(receiving_id) {
        const sql = `
            SELECT 
                l.*, 
                u.name AS user_name
            FROM accounting_invoice_logs l
            LEFT JOIN intranet_users u ON u.id = l.user_id
            WHERE l.receiving_id = $1 AND l.deleted_at IS NULL
            ORDER BY l.created_at ASC
        `;
        const { rows } = await db.query(sql, [receiving_id]);
        return rows;
    },

    // 🗑️ Soft delete invoice receiving and logs
    async softDelete(id) {
        const now = new Date();

        await db.query(
            `
            UPDATE accounting_invoice_logs 
            SET deleted_at = $1 
            WHERE receiving_id = $2 AND deleted_at IS NULL
            `,
            [now, id]
        );

        const update = `
            UPDATE accounting_invoices
            SET active = FALSE, deleted_at = $1
            WHERE id = $2 AND deleted_at IS NULL
            RETURNING *
        `;
        const { rows } = await db.query(update, [now, id]);
        return rows[0];
    },

    // 📊 Performance report (optional BI)
    async performanceReport() {
        const sql = `
            SELECT 
                curr.from_step,
                curr.to_step,
                ROUND(AVG(EXTRACT(EPOCH FROM (next.created_at - curr.created_at)) / 3600), 2) AS avg_hours
            FROM accounting_invoice_logs curr
            JOIN accounting_invoice_logs next 
                ON curr.receiving_id = next.receiving_id 
               AND next.id > curr.id
            WHERE curr.deleted_at IS NULL AND next.deleted_at IS NULL
            GROUP BY curr.from_step, curr.to_step
            ORDER BY curr.from_step, curr.to_step
        `;
        const { rows } = await db.query(sql);
        return rows;
    },

    // 🔍 List invoices by current step
    async listByStep(current_step) {
        const sql = `
        SELECT 
            r.*,
            u.name AS user_name,
            (
                SELECT COUNT(*) 
                FROM accounting_invoice_logs l 
                WHERE l.receiving_id = r.id AND l.deleted_at IS NULL
            ) AS total_logs
        FROM accounting_invoices r
        LEFT JOIN intranet_users u ON u.id = r.user_id
        WHERE r.current_step = $1
          AND r.active = TRUE
          AND r.deleted_at IS NULL
          AND r.status = 'OPEN'
        ORDER BY r.created_at DESC
    `;
        const { rows } = await db.query(sql, [current_step]);
        return rows;
    },

    // 🔒 Close invoice by ID
    async closeInvoice(id, user_id) {
        // Verifica se a invoice existe e está ativa
        const find = `
        SELECT * 
        FROM accounting_invoices 
        WHERE id = $1 
          AND deleted_at IS NULL 
          AND active = TRUE
          AND status = 'OPEN'
    `;
        const { rows } = await db.query(find, [id]);
        if (rows.length === 0) {
            throw new Error('Invoice not found or already closed.');
        }

        // Atualiza status para CLOSED
        const update = `
        UPDATE accounting_invoices
        SET status = 'CLOSED',
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
    `;
        const { rows: updated } = await db.query(update, [id]);
        const invoice = updated[0];

        // Registra log de encerramento
        const log = `
        INSERT INTO accounting_invoice_logs
            (receiving_id, from_step, to_step, message, user_id, note)
        VALUES ($1, $2, $3, $4, $5, $6)
    `;
        await db.query(log, [
            id,
            invoice.current_step,
            invoice.current_step,
            'Invoice Closed',
            user_id,
            'Invoice process finalized successfully'
        ]);

        return invoice;
    },


};
