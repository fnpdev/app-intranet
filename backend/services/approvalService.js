// backend/services/approvalService.js
// Approval service — modular, clear helper functions
// Uses db.query directly (project style)

const db = require('../config/db_postgres');
const approvalProtheusService = require('./approvalProtheusService');

module.exports = {
  /* =====================================================================
     CREATE FULL APPROVAL
     - create approval_document
     - create approval_document_groups
     - insert approvers for each group based on Protheus return
     - set initial statuses:
         * all approvers with the smallest level in the group -> 'pending'
         * all higher levels -> 'waiting_previous_level'
  ===================================================================== */
  async createFullApproval(payload) {
    if (!payload || !payload.origin || !payload.origin_ref || !Array.isArray(payload.group) || payload.group.length === 0) {
      throw new Error('Invalid payload. origin, origin_ref and group[] are required.');
    }

    try {
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
          INSERT INTO approval_document_groups (approval_id, approval_group, amount, status)
          VALUES ($1, $2, $3, 'pending')
          RETURNING *
        `;
        const { rows: groupRows } = await db.query(insertGroupSql, [
          document.id,
          g.approval_group,
          amount
        ]);
        const group = groupRows[0];

        // fetch approvers from Protheus
        const protheusRows = await approvalProtheusService.getApproversByGroup({
          approvalGroup: g.approval_group,
          amount
        });

        if (!protheusRows || protheusRows.length === 0) {
          throw new Error(`No approvers found in Protheus for group ${g.approval_group} and amount ${amount}`);
        }

        const insertedApprovers = [];

        // Insert each approver (initially set status to pending, adjust below)
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

        // After inserting all approvers for this group, compute smallest level
        if (insertedApprovers.length > 0) {
          const levels = insertedApprovers.map(a => Number(a.level));
          const minLevel = Math.min(...levels);

          // Set statuses:
          // - those with level == minLevel -> pending (already pending by insert)
          // - those with level > minLevel -> waiting_previous_level
          await db.query(`
            UPDATE approval_group_approvers
            SET status = 'waiting_previous_level'
            WHERE group_id = $1
              AND level > $2
          `, [group.id, minLevel]);

          // ensure those with level == minLevel are 'pending' (in case insert changed)
          await db.query(`
            UPDATE approval_group_approvers
            SET status = 'pending'
            WHERE group_id = $1
              AND level = $2
          `, [group.id, minLevel]);
        }

        createdGroups.push({ group, approvers: insertedApprovers });
      } // end groups

      await db.query('COMMIT');

      return {
        document,
        groups: createdGroups
      };
    } catch (err) {
      try { await db.query('ROLLBACK'); } catch (e) { console.error('Rollback failed', e); }
      throw err;
    }
  },

  /* =====================================================================
     APPROVE ACTION
     Rules implemented:
      - If approver.level is the current smallest pending level
          -> mark them approved
          -> mark their same-level peers (pending) as approved_by_higher_level
          -> unlock next higher level (set their approvers 'pending')
      - If approver.level is higher than current smallest pending level
          -> mark all lower-level approvers that are still pending/waiting as approved_by_higher_level
          -> then proceed to mark current approver as approved and unlock next level
  ===================================================================== */
  async approveAction({ document_id, group_id, user_id }) {
    // Validate approver exists for this doc/group
    const sqlCheck = `
      SELECT
        doc.id AS document_id,
        doc.status AS document_status,
        dg.id AS group_id,
        dg.status AS group_status,
        gu.user_id AS user_id,
        gu.status AS user_status,
        gu.id AS approver_id,
        gu.level AS user_level
      FROM approval_documents doc
      LEFT JOIN approval_document_groups dg ON dg.approval_id = doc.id
      LEFT JOIN approval_group_approvers gu ON gu.group_id = dg.id
      WHERE doc.id = $1 AND dg.id = $2 AND gu.user_id = $3
      LIMIT 1
    `;
    const { rows: approverRows } = await db.query(sqlCheck, [document_id, group_id, user_id]);
    if (!approverRows.length) throw new Error('Pendencia de aprovação não localizada!');
    const approver = approverRows[0];

    if (approver.document_status !== 'pending') throw new Error('Documento não está pendente aprovação!');
    if (approver.group_status !== 'pending') throw new Error('Grupo não está pendente!');
    if (!['pending', 'waiting_previous_level'].includes(approver.user_status)) {
      throw new Error('Este usuário não está pendente para aprovação!');
    }

    // Begin a transaction to keep consistent
    try {
      await db.query('BEGIN');

      // find the smallest pending level for this group
      const minLevelRow = await db.query(`
        SELECT MIN(level) AS min_level
        FROM approval_group_approvers
        WHERE group_id = $1
          AND status IN ('pending', 'waiting_previous_level')
      `, [group_id]);

      const minLevel = minLevelRow.rows[0] && minLevelRow.rows[0].min_level !== null
        ? Number(minLevelRow.rows[0].min_level)
        : null;

      // If no pending levels found, it's probably already finished - return snapshot
      if (minLevel === null) {
        // nothing pending: return snapshot (but still mark this as approved safely if needed)
        await db.query('COMMIT');
        return await this.getDocumentStatusSnapshotByGroup(group_id);
      }

      // If approver is higher than minLevel -> they are a superior approving before lower levels
      if (Number(approver.user_level) > minLevel) {
        // mark all lower-level approvers that are still pending or waiting -> approved_by_higher_level
        await db.query(`
          UPDATE approval_group_approvers
          SET status = 'approved_by_higher_level', approved_at = NOW()
          WHERE group_id = $1
            AND level < $2
            AND status IN ('pending', 'waiting_previous_level')
        `, [group_id, approver.user_level]);
      }

      // Approve same-level peers logic:
      // If the approver belongs to the current minLevel, then other peers in same level
      // that are still pending should become approved_by_higher_level automatically
      // (rule: when one in a level approves, the other same-level users don't need to approve)
      if (Number(approver.user_level) === minLevel) {
        // other same-level peers -> approved_by_higher_level
        await db.query(`
          UPDATE approval_group_approvers
          SET status = 'approved_by_higher_level', approved_at = NOW()
          WHERE group_id = $1
            AND level = $2
            AND user_id <> $3
            AND status = 'pending'
        `, [group_id, approver.user_level, user_id]);
      }

      // Approve the current user
      await db.query(`
        UPDATE approval_group_approvers
        SET status = 'approved', approved_at = NOW()
        WHERE id = $1
      `, [approver.approver_id]);

      // Unlock next higher level: find next level > current and set to pending
      await this._unlockNextLevel(group_id, Number(approver.user_level));

      // Update group and document statuses
      await this.updateGroupStatus(group_id);
      await this.updateDocumentStatusByGroup(group_id);

      await db.query('COMMIT');

      // return fresh snapshot
      return await this.getDocumentStatusSnapshotByGroup(group_id);

    } catch (err) {
      try { await db.query('ROLLBACK'); } catch (e) { console.error('Rollback fail', e); }
      throw err;
    }
  },

  /* =====================================================================
     REJECT ACTION
     - mark approver rejected
     - group/document become rejected immediately
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
      LIMIT 1
    `;
    const { rows: approverRows } = await db.query(sqlCheck, [document_id, group_id, user_id]);
    if (!approverRows.length) throw new Error('Pendencia de aprovação não localizada!');
    const approver = approverRows[0];

    if (approver.document_status !== 'pending') throw new Error('Documento não está pendente!');
    if (approver.group_status !== 'pending') throw new Error('Grupo não está pendente!');
    if (approver.user_status !== 'pending') throw new Error('Usuário não está pendente!');

    try {
      await db.query('BEGIN');

      await db.query(`
        UPDATE approval_group_approvers
        SET status = 'rejected', approved_at = NOW()
        WHERE id = $1
      `, [approver.approver_id]);

      // group and document become rejected immediately
      await this.rejectGroup(group_id);
      await this.rejectDocumentByGroup(group_id);

      await db.query('COMMIT');
      return await this.getDocumentStatusSnapshotByGroup(group_id);
    } catch (err) {
      try { await db.query('ROLLBACK'); } catch (e) { console.error('Rollback fail', e); }
      throw err;
    }
  },

  /* =====================================================================
     UPDATE GROUP STATUS
     - a group is rejected if any approver rejected
     - a group is approved when there are no pending or waiting_previous_level approvers
       (approved_by_higher_level counts as approved)
  ===================================================================== */
  async updateGroupStatus(group_id) {
    // count pending-like statuses
    const sqlPending = `
      SELECT COUNT(*) AS total
      FROM approval_group_approvers
      WHERE group_id = $1
        AND status IN ('pending', 'waiting_previous_level')
    `;
    const { rows: pendRows } = await db.query(sqlPending, [group_id]);
    const pend = Number(pendRows[0].total);

    // count rejected
    const sqlRejected = `
      SELECT COUNT(*) AS total
      FROM approval_group_approvers
      WHERE group_id = $1
        AND status = 'rejected'
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
      // all approvers are either 'approved' or 'approved_by_higher_level' (or rejected handled above)
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
     UPDATE DOCUMENT STATUS BY GROUP
     - if any group rejected -> document rejected
     - if no pending groups -> document approved
     - pending groups exist -> document pending
  ===================================================================== */
  async updateDocumentStatusByGroup(group_id) {
    const sqlGroup = `
      SELECT approval_id
      FROM approval_document_groups
      WHERE id = $1
      LIMIT 1
    `;
    const { rows } = await db.query(sqlGroup, [group_id]);
    if (!rows.length) return;
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
      LIMIT 1
    `;
    const { rows } = await db.query(sql, [group_id]);
    if (!rows.length) return;
    const approval_id = rows[0].approval_id;

    await db.query(`
      UPDATE approval_documents
      SET status = 'rejected', updated_at = NOW()
      WHERE id = $1
    `, [approval_id]);
  },

  /* =====================================================================
     USER PENDING LIST
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
        SELECT aga.user_id, aga.status, aga.level, u.name
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
          if (ap.status === 'pending') {
            pendingUsers.push({
              group_id: g.group_id,
              user_id: ap.user_id,
              level: ap.level,
              name: ap.name
            });
          }
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

  async getDocumentById(document_id) {
    return this.getDocumentFullSnapshot(document_id);
  },

  /* =====================================================================
     PRIVATE HELPERS (prefixed with _)
     - _unlockNextLevel(group_id, currentLevel)
         Finds the next higher level present and sets its approvers status to 'pending'
     - _getNextHigherLevel(group_id, currentLevel) -> returns next level number or null
  ===================================================================== */
  async _getNextHigherLevel(group_id, currentLevel) {
    const res = await db.query(`
      SELECT DISTINCT level
      FROM approval_group_approvers
      WHERE group_id = $1
        AND level > $2
      ORDER BY level ASC
      LIMIT 1
    `, [group_id, currentLevel]);

    if (!res.rows.length) return null;
    return Number(res.rows[0].level);
  },

  async _unlockNextLevel(group_id, currentLevel) {
    const nextLevel = await this._getNextHigherLevel(group_id, currentLevel);
    if (nextLevel === null) return;

    // Set next level approvers (that are waiting_previous_level) to pending
    await db.query(`
      UPDATE approval_group_approvers
      SET status = 'pending'
      WHERE group_id = $1
        AND level = $2
        AND status = 'waiting_previous_level'
    `, [group_id, nextLevel]);
  }

};
