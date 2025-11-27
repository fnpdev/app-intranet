// backend/services/approvalService.js
// Serviço principal do módulo de aprovação
// Usa db.query diretamente (padrão do projeto: db já exporta query)

const db = require('../config/db_postgres');
const approvalProtheusService = require('./approvalProtheusService');

module.exports = {

    /* =====================================================================
       CREATE FULL APPROVAL
    ===================================================================== */
    async createFullApproval(payload) {
        try {
            if (!payload || !payload.origin || !payload.origin_ref || !Array.isArray(payload.group) || payload.group.length === 0) {
                throw new Error('Invalid payload. origin, origin_ref and group[] are required.');
            }

            await db.query('BEGIN');

            const insertDocSql = `
                INSERT INTO approval_documents (origin, origin_ref, description)
                VALUES ($1, $2, $3)
                RETURNING *
            `;
            const { rows: docRows } = await db.query(insertDocSql, [
                payload.origin,
                payload.origin_ref,
                payload.description || null
            ]);

            const document = docRows[0];
            const createdGroups = [];

            for (const g of payload.group || []) {
                if (!g.approval_group) throw new Error('Each group must contain approval_group');

                const amount = Number(g.amount || 0);

                const insertGroupSql = `
                    INSERT INTO approval_document_groups (approval_id, approval_group, amount)
                    VALUES ($1, $2, $3)
                    RETURNING *
                `;
                const { rows: groupRows } = await db.query(insertGroupSql, [
                    document.id,
                    g.approval_group,
                    amount
                ]);

                const group = groupRows[0];

                const protheusRows = await approvalProtheusService.getApproversByGroup({
                    approvalGroup: g.approval_group,
                    amount
                });

                if (!protheusRows || protheusRows.length === 0)
                    throw new Error(`No approvers found in Protheus for group ${g.approval_group} and amount ${amount}`);

                const insertedApprovers = [];

                for (const ap of protheusRows) {
                    const username = String(ap.username || '').trim().toLowerCase();
                    if (!username) continue;

                    const sqlUser = `SELECT id FROM intranet_users WHERE username = $1 LIMIT 1`;
                    const { rows: userRows } = await db.query(sqlUser, [username]);

                    if (!userRows.length) {
                        console.warn(`ApprovalService: user not found -> ${username}`);
                        continue;
                    }

                    const user_id = userRows[0].id;

                    const insertApproverSql = `
                        INSERT INTO approval_group_approvers
                            (group_id, user_id, level, status)
                        VALUES ($1, $2, $3, 'pending')
                        RETURNING *
                    `;
                    const { rows: insA } = await db.query(insertApproverSql, [
                        group.id,
                        user_id,
                        Number(ap.nivel || 0)
                    ]);

                    insertedApprovers.push(insA[0]);
                }

                createdGroups.push({ group, approvers: insertedApprovers });
            }

            await db.query('COMMIT');

            return {
                document,
                groups: createdGroups
            };

        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }
    },

    /* =====================================================================
       APPROVE ACTION
    ===================================================================== */
    async approveAction({ document_id, group_id, user_id }) {

        const sqlCheck = `
            SELECT
                doc.id AS document_id,
                doc.status AS document_status,
                dg.id AS group_id,
                dg.status AS group_status,
                gu.user_id AS user_id,
                gu.status AS user_status,
                gu.id AS approver_id
            FROM approval_documents doc
            LEFT JOIN approval_document_groups dg ON dg.approval_id = doc.id
            LEFT JOIN approval_group_approvers gu ON gu.group_id = dg.id
            WHERE doc.id = $1 AND dg.id = $2 AND gu.user_id = $3
        `;

        const { rows: approverRows } = await db.query(sqlCheck, [document_id, group_id, user_id]);
        if (!approverRows.length) throw new Error('Pendencia de aprovação não localizada!');

        const approver = approverRows[0];

        if (approver.document_status !== 'pending')
            throw new Error('Documento não está pendente aprovação!');
        if (approver.group_status !== 'pending')
            throw new Error('Grupo não está pendente!');
        if (approver.user_status !== 'pending')
            throw new Error('Este usuário não está pendente para aprovação!');

        await db.query(`
            UPDATE approval_group_approvers
            SET status = 'approved', approved_at = NOW()
            WHERE id = $1
        `, [approver.approver_id]);

        await this.updateGroupStatus(group_id);
        await this.updateDocumentStatusByGroup(group_id);

        return await this.getDocumentStatusSnapshotByGroup(group_id);
    },

    /* =====================================================================
       DOCUMENT SNAPSHOT BY GROUP
    ===================================================================== */
    async getDocumentStatusSnapshotByGroup(group_id) {
        const sqlDoc = `
            SELECT approval_id
            FROM approval_document_groups
            WHERE id = $1
        `;
        const { rows: docRows } = await db.query(sqlDoc, [group_id]);
        const approval_id = docRows[0].approval_id;

        const { rows: docStatus } = await db.query(`
            SELECT id, status
            FROM approval_documents
            WHERE id = $1
        `, [approval_id]);

        const { rows: groups } = await db.query(`
            SELECT id AS group_id, status
            FROM approval_document_groups
            WHERE approval_id = $1
            ORDER BY id
        `, [approval_id]);

        const groupsWithApprovers = [];
        const pendingGroups = [];
        const pendingUsers = [];

        for (const g of groups) {
            const { rows: approvers } = await db.query(`
                SELECT aga.user_id, aga.status, u.name
                FROM approval_group_approvers aga
                LEFT JOIN intranet_users u ON u.id = aga.user_id
                WHERE aga.group_id = $1
                ORDER BY aga.level ASC
            `, [g.group_id]);

            groupsWithApprovers.push({
                group_id: g.group_id,
                status: g.status,
                approvers
            });

            if (g.status === 'pending') {
                pendingGroups.push(g.group_id);

                for (const ap of approvers) {
                    if (ap.status === 'pending')
                        pendingUsers.push({
                            group_id: g.group_id,
                            user_id: ap.user_id,
                            name: ap.name
                        });
                }
            }
        }

        return {
            document: docStatus[0],
            groups: groupsWithApprovers,
            pending: {
                groups: pendingGroups,
                users: pendingUsers
            }
        };
    },

    /* =====================================================================
       REJECT ACTION
    ===================================================================== */
    async rejectAction({ document_id, group_id, user_id }) {

        const sqlCheck = `
            SELECT
                doc.id AS document_id,
                doc.status AS document_status,
                dg.id AS group_id,
                dg.status AS group_status,
                gu.user_id,
                gu.status AS user_status,
                gu.id AS approver_id
            FROM approval_documents doc
            LEFT JOIN approval_document_groups dg ON dg.approval_id = doc.id
            LEFT JOIN approval_group_approvers gu ON gu.group_id = dg.id
            WHERE doc.id = $1 AND dg.id = $2 AND gu.user_id = $3
        `;

        const { rows: approverRows } = await db.query(sqlCheck, [
            document_id,
            group_id,
            user_id
        ]);

        if (!approverRows.length)
            throw new Error('Pendencia de aprovação não localizada!');

        const approver = approverRows[0];

        if (approver.document_status !== 'pending')
            throw new Error('Documento não está pendente!');
        if (approver.group_status !== 'pending')
            throw new Error('Grupo não está pendente!');
        if (approver.user_status !== 'pending')
            throw new Error('Usuário não está pendente!');

        await db.query(`
            UPDATE approval_group_approvers
            SET status = 'rejected', approved_at = NOW()
            WHERE id = $1
        `, [approver.approver_id]);

        await this.rejectGroup(group_id);
        await this.rejectDocumentByGroup(group_id);

        return await this.getDocumentStatusSnapshotByGroup(group_id);
    },

    /* =====================================================================
       UPDATE GROUP STATUS
    ===================================================================== */
    async updateGroupStatus(group_id) {
        const sqlPending = `
            SELECT COUNT(*) AS total
            FROM approval_group_approvers
            WHERE group_id = $1 AND status = 'pending'
        `;
        const { rows: pendRows } = await db.query(sqlPending, [group_id]);
        const pend = Number(pendRows[0].total);

        const sqlRejected = `
            SELECT COUNT(*) AS total
            FROM approval_group_approvers
            WHERE group_id = $1 AND status = 'rejected'
        `;
        const { rows: rejRows } = await db.query(sqlRejected, [group_id]);
        const rejected = Number(rejRows[0].total) > 0;

        if (rejected) {
            await db.query(`
                UPDATE approval_document_groups
                SET status = 'rejected', updated_at = NOW()
                WHERE id = $1
            `, [group_id]);
            return;
        }

        if (pend === 0) {
            await db.query(`
                UPDATE approval_document_groups
                SET status = 'approved', updated_at = NOW()
                WHERE id = $1
            `, [group_id]);
        } else {
            await db.query(`
                UPDATE approval_document_groups
                SET status = 'pending', updated_at = NOW()
                WHERE id = $1
            `, [group_id]);
        }
    },

    /* =====================================================================
       REJECT GROUP
    ===================================================================== */
    async rejectGroup(group_id) {
        await db.query(`
            UPDATE approval_document_groups
            SET status = 'rejected', updated_at = NOW()
            WHERE id = $1
        `, [group_id]);
    },

    /* =====================================================================
       UPDATE DOCUMENT BY GROUP
    ===================================================================== */
    async updateDocumentStatusByGroup(group_id) {
        const sqlGroup = `
            SELECT approval_id
            FROM approval_document_groups
            WHERE id = $1
        `;
        const { rows } = await db.query(sqlGroup, [group_id]);
        const approval_id = rows[0].approval_id;

        const sqlGroupRejected = `
            SELECT COUNT(*) AS total
            FROM approval_document_groups
            WHERE approval_id = $1 AND status = 'rejected'
        `;
        const { rows: rejRows } = await db.query(sqlGroupRejected, [approval_id]);

        if (Number(rejRows[0].total) > 0) {
            await db.query(`
                UPDATE approval_documents
                SET status = 'rejected', updated_at = NOW()
                WHERE id = $1
            `, [approval_id]);
            return;
        }

        const sqlPending = `
            SELECT COUNT(*) AS total
            FROM approval_document_groups
            WHERE approval_id = $1 AND status = 'pending'
        `;
        const { rows: pendRows } = await db.query(sqlPending, [approval_id]);

        if (Number(pendRows[0].total) === 0) {
            await db.query(`
                UPDATE approval_documents
                SET status = 'approved', updated_at = NOW()
                WHERE id = $1
            `, [approval_id]);
        } else {
            await db.query(`
                UPDATE approval_documents
                SET status = 'pending', updated_at = NOW()
                WHERE id = $1
            `, [approval_id]);
        }
    },

    /* =====================================================================
       REJECT DOCUMENT BY GROUP
    ===================================================================== */
    async rejectDocumentByGroup(group_id) {
        const sql = `
            SELECT approval_id
            FROM approval_document_groups
            WHERE id = $1
        `;
        const { rows } = await db.query(sql, [group_id]);
        const approval_id = rows[0].approval_id;

        await db.query(`
            UPDATE approval_documents
            SET status = 'rejected', updated_at = NOW()
            WHERE id = $1
        `, [approval_id]);
    },

    /* =====================================================================
       USER PENDING
    ===================================================================== */
    async getPendingByUser(user_id) {
        const sql = `
            SELECT 
                doc.id AS document_id,
                doc.origin,
                doc.origin_ref,
                doc.description,
                doc.status AS document_status,
                dg.id AS group_id,
                dg.approval_group,
                dg.amount,
                gu.user_id,
                gu.status AS approver_status
            FROM approval_documents doc
            INNER JOIN approval_document_groups dg ON dg.approval_id = doc.id
            INNER JOIN approval_group_approvers gu ON gu.group_id = dg.id
            WHERE gu.user_id = $1
              AND gu.status = 'pending'
              AND dg.status = 'pending'
              AND doc.status = 'pending'
            ORDER BY doc.created_at DESC
        `;
        const { rows } = await db.query(sql, [user_id]);
        return rows;
    },

    /* =====================================================================
       DOCUMENT FULL SNAPSHOT
    ===================================================================== */
    async getDocumentFullSnapshot(document_id) {

        const docSql = `
            SELECT id, origin, origin_ref, description, status
            FROM approval_documents
            WHERE id = $1
            LIMIT 1
        `;
        const { rows: docRows } = await db.query(docSql, [document_id]);
        if (!docRows.length) throw new Error('Document not found');

        const document = docRows[0];

        const groupsSql = `
            SELECT id AS group_id, approval_group, amount, status
            FROM approval_document_groups
            WHERE approval_id = $1
            ORDER BY id
        `;
        const { rows: groupsRows } = await db.query(groupsSql, [document_id]);

        const groups = [];
        const pendingGroups = [];
        const pendingUsers = [];

        for (const g of groupsRows) {
            const approverSql = `
                SELECT aga.user_id, aga.status, u.name
                FROM approval_group_approvers aga
                LEFT JOIN intranet_users u ON u.id = aga.user_id
                WHERE aga.group_id = $1
                ORDER BY aga.level ASC
            `;
            const { rows: approvers } = await db.query(approverSql, [g.group_id]);

            groups.push({
                group_id: g.group_id,
                approval_group: g.approval_group,
                amount: g.amount,
                status: g.status,
                approvers
            });

            if (g.status === 'pending') {
                pendingGroups.push(g.group_id);

                for (const ap of approvers) {
                    if (ap.status === 'pending')
                        pendingUsers.push({
                            group_id: g.group_id,
                            user_id: ap.user_id,
                            name: ap.name
                        });
                }
            }
        }

        return {
            document,
            groups,
            pending: {
                groups: pendingGroups,
                users: pendingUsers
            }
        };
    },

    /* =====================================================================
       getDocumentById (simple snapshot)
    ===================================================================== */
    async getDocumentById(document_id) {
        return this.getDocumentFullSnapshot(document_id);
    }

};
