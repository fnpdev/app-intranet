const db = require('../config/db_postgres');
const db_saam = require('../config/db_postgres_saam');
const dbSQL = require('./DBSQLServerService');


function parseErpItens(erpArray) {
    return erpArray.map(erp => {
        let itensConvertidos = [];

        try {
            // se itens for string e começar com [, é JSON válido
            if (typeof erp.itens === "string" && erp.itens.trim().startsWith("[")) {
                itensConvertidos = JSON.parse(erp.itens);
            }
        } catch (e) {
            console.error("Erro ao converter itens:", e);
            itensConvertidos = [];
        }

        return {
            ...erp,
            itens: itensConvertidos
        };
    });
}
module.exports = {
    // ============================
    // INVOICES - FUNÇÕES EXISTENTES
    // ============================

    // 📋 List all active invoice receivings
    async listAll() {
        const sql = `
            SELECT 
                r.*,
                u.name AS user_name,
                (
                    SELECT COUNT(*) 
                    FROM accounting_invoice_steps l 
                    WHERE l.invoice_id = r.id AND l.deleted_at IS NULL
                ) AS total_logs
            FROM accounting_invoices r
            LEFT JOIN intranet_users u ON u.id = r.user_id
            WHERE r.active = TRUE AND r.deleted_at IS NULL
            ORDER BY r.created_at DESC
        `;
        const { rows } = await db.query(sql);
        return rows;
    },
    async getInvoiceById(id) {
        const sql = `
        SELECT 
            r.*,
            u.name AS user_name
        FROM accounting_invoices r
        LEFT JOIN intranet_users u ON u.id = r.user_id
        WHERE r.id = $1
          AND r.deleted_at IS NULL
        LIMIT 1
    `;
        const { rows } = await db.query(sql, [id]);
        if (!rows.length) throw new Error("Invoice not found");
        return rows[0];
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

        // 🪵 3. Cria log inicial
        const logInsert = `
            INSERT INTO accounting_invoice_steps (invoice_id, user_id, to_step, message, note, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
        `;
        await db.query(logInsert, [receiving.id, user_id, receiving.current_step, receiving.message, receiving.note]);

        return receiving;
    },

    // 🔄 Update workflow step (agora com to_user_id)
    async updateStep({ id, to_step, message, note, user_id, to_user_id = null }) {
        // 🔍 Busca etapa atual
        const find = `
            SELECT current_step 
            FROM accounting_invoices 
            WHERE id = $1 AND deleted_at IS NULL
        `;
        const { rows: current } = await db.query(find, [id]);
        if (current.length === 0) throw new Error('Receiving not found');

        const from_step = current[0].current_step;

        // 🔧 Atualiza registro principal
        const update = `
            UPDATE accounting_invoices
            SET current_step = $1, message = $2, note = $3, updated_at = NOW()
            WHERE id = $4 AND deleted_at IS NULL
            RETURNING *
        `;
        const { rows } = await db.query(update, [to_step, message, note, id]);
        const updated = rows[0];

        // 🪵 Cria log da movimentação
        const log = `
            INSERT INTO accounting_invoice_steps 
                (invoice_id, from_step, to_step, to_user_id, message, user_id, note, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `;
        await db.query(log, [id, from_step, to_step, to_user_id, message, user_id, note]);

        const sqlSelect = `     
            SELECT  
                inv.id, 
                inv.user_id, 
                inv.invoice_key, 
                inv.current_step, 
                inv.message,
                inv.note, 
                inv.active, 
                inv.deleted_at, 
                inv.created_at, 
                inv.updated_at, 
                inv.status, 
                inv.to_user_id, 
                inv.last_count_step_id,
                
                json_agg(
                    json_build_object(
                        'id', step.id,
                        'invoice_id', step.invoice_id, 
                        'from_step', step.from_step, 
                        'to_step', step.to_step,
                        'message', step.message,
                        'user_id', step.user_id,
                        'note', step.note,
                        'created_at', step.created_at
                        )
                ) AS step
            FROM accounting_invoices inv
            Left Join accounting_invoice_steps step 
             on step.invoice_id = inv.id 
            AND step.deleted_at IS null
            AND step.id = (SELECT MAX(id) AS last_step
                            FROM accounting_invoice_steps
                            WHERE invoice_id = inv.id
                              AND deleted_at IS null)
            WHERE inv.id = $1
            group by 
                inv.id, 
                inv.user_id, 
                inv.invoice_key, 
                inv.current_step, 
                inv.message,
                inv.note, 
                inv.active, 
                inv.deleted_at, 
                inv.created_at, 
                inv.updated_at, 
                inv.status, 
                inv.to_user_id, 
                inv.last_count_step_id
        `

        const { rows: resultInvoice } = await db.query(sqlSelect, [id]);


        return resultInvoice[0];
    },

    // 📜 List logs for one invoice
    async listLogs(invoice_id) {
        const sql = `
            SELECT 
                l.*, 
                u.name AS user_name,
                u2.name AS to_user_name
            FROM accounting_invoice_steps l
            LEFT JOIN intranet_users u ON u.id = l.user_id
            LEFT JOIN intranet_users u2 ON u2.id = l.to_user_id
            WHERE l.invoice_id = $1 AND l.deleted_at IS NULL
            ORDER BY l.created_at ASC
        `;
        const { rows } = await db.query(sql, [invoice_id]);
        return rows;
    },

    // 🗑️ Soft delete invoice receiving and logs
    async softDelete(id) {
        const now = new Date();

        await db.query(
            `
            UPDATE accounting_invoice_steps 
            SET deleted_at = $1 
            WHERE invoice_id = $2 AND deleted_at IS NULL
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
            FROM accounting_invoice_steps curr
            JOIN accounting_invoice_steps next 
                ON curr.invoice_id = next.invoice_id 
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
                    FROM accounting_invoice_steps l 
                    WHERE l.invoice_id = r.id AND l.deleted_at IS NULL
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

    // 🔍 Get NF data from SAAM by key
    async getInfoNDByKey(invoice_key) {
        const sql = `
            SELECT 
                nf.cnpj_emitente,
                nf.nome_emitente,
                nf.numero_nota,
                nf.data_emissao,
                nf.natureza_operacao,
                nf.observacao,
                nf.status
            FROM tab_gerenciamento_nfe_nota_11_3_2 nf
            WHERE nf.chave_nota = $1
        `;
        const { rows } = await db_saam.query(sql, [invoice_key]);



        let rowsSAAM = {
            success: false
        }
        let rowsERP = {
            success: false
        }


        if (rows.length) {
            rowsSAAM = {
                success: true,
                nf: rows[0]
            }
            // garantir que é string 
            // 14429683000101
            let cnpjFornecedor = String(rows[0].cnpj_emitente).padStart(14, "0");
            let erpFornecedorCod = cnpjFornecedor.slice(0, 8).padStart(9, "0");
            let erpFornecedorLoja = cnpjFornecedor.slice(8, 12);
            let erpNumeroNota = String(rows[0].numero_nota).padStart(9, "0");
            const resultSQL = await this.getNFERP(erpFornecedorCod, erpFornecedorLoja, erpNumeroNota)

            if (resultSQL.success) {
                rowsERP = {
                    success: true,
                    nf: parseErpItens(resultSQL.data)[0]
                }
                delete rowsERP.nf.itens

            }
        }


        return { success: rowsERP.true && rowsERP.success ? true : false, saam: rowsSAAM, erp: rowsERP };
    },

    // 🔍 Get NF data from SAAM by key
    async getNFByKey(invoice_key) {

        const sqlInvoice = `
            select * 
              from accounting_invoices 
             where invoice_key = $1
               and active IS true
               and deleted_at IS null
        `
        const { rows: rowsInvoice } = await db.query(sqlInvoice, [invoice_key]);


        const sql = `
            SELECT 
                nf.cnpj_emitente,
                nf.nome_emitente,
                nf.numero_nota,
                nf.data_emissao,
                nf.natureza_operacao,
                nf.observacao,
                nf.status,
                json_agg(
                    json_build_object(
                        'item', nf_itens.numero_item,
                        'descricao', nf_itens.descricao_produto,
                        'ncm', nf_itens.ncm,
                        'cfop', nf_itens.cfop,
                        'unidade', nf_itens.unidade,
                        'qtde', nf_itens.quantidade,
                        'valor_unit', nf_itens.valor_unitario,
                        'total', nf_itens.valor_total
                    )
                ) AS itens
            FROM tab_gerenciamento_nfe_nota_11_3_2 nf
            INNER JOIN tab_gerenciamento_nfe_item_11_3_2 nf_itens ON nf_itens.fk_chave  = nf.chave_nota
            WHERE nf.chave_nota = $1
            group by 
                nf.cnpj_emitente,
                nf,nome_emitente,
                nf.numero_nota,
                nf.data_emissao,
                nf.natureza_operacao,
                nf.observacao,
                nf.status
        `;
        const { rows } = await db_saam.query(sql, [invoice_key]);



        let rowsSAAM = {
            success: false
        }
        let rowsERP = {
            success: false
        }
        let rowsCount = {
            success: false
        }


        if (rows.length) {
            rowsSAAM = {
                success: true,
                nf: rows[0]
            }
            // garantir que é string 
            // 14429683000101
            let cnpjFornecedor = String(rows[0].cnpj_emitente).padStart(14, "0");
            let erpFornecedorCod = cnpjFornecedor.slice(0, 8).padStart(9, "0");
            let erpFornecedorLoja = cnpjFornecedor.slice(8, 12);
            let erpNumeroNota = String(rows[0].numero_nota).padStart(9, "0");
            const resultSQL = await this.getNFERP(erpFornecedorCod, erpFornecedorLoja, erpNumeroNota)

            if (resultSQL.success) {
                rowsERP = {
                    success: true,
                    nf: parseErpItens(resultSQL.data)[0]
                }
            }

            if (rowsInvoice[0].last_count_step_id > 0) {

                rowsCount = {
                    success: true,
                    count: await this.getCountByStepId(rowsInvoice[0].last_count_step_id)
                }
            }

        }


        return { success: rowsERP.true && rowsERP.success ? true : false, saam: rowsSAAM, erp: rowsERP, count: rowsCount };
    },

    async getNFERP(erpFornecedorCod, erpFornecedorLoja, erpNumeroNota) {
        const sql = `
           SELECT DISTINCT
                SF1.F1_FILIAL                                as filial,
                SF1.F1_DOC                                   as numero,
                SF1.F1_FORNECE                               as fornecedor,
                SF1.F1_LOJA                                   as loja,
                RIGHT(CONCAT('000', TRIM(SF1.F1_SERIE)), 3)  as serie,
                SF1.F1_EMISSAO                                as data_emissao,
                SF1.F1_STATUS                                 as situacao,
                SF1.F1_STATUS                                 as status_nf,
                CONCAT('/contabil/constula-nf-chave/',trim(SF1.F1_CHVNFE)) as link_chave,

                (
                    SELECT
                        TRIM(SD1.D1_ITEM)         AS item,
                        TRIM(SD1.D1_COD)          AS produto,
                        TRIM(SB1.B1_DESC)         AS produto_desc,
                        TRIM(SD1.D1_UM)           AS unide_medida,
                        SD1.D1_QUANT              AS qtde,
                        SD1.D1_VUNIT              AS valor,
                        SD1.D1_TOTAL              AS total
                    FROM SD1010 SD1
                    LEFT JOIN SB1010 SB1 
                        ON SB1.B1_FILIAL = LEFT(SD1.D1_FILIAL, 2)
                        AND SB1.B1_COD = SD1.D1_COD
                    WHERE SD1.D1_FORNECE = SF1.F1_FORNECE
                    AND SD1.D1_LOJA = SF1.F1_LOJA
                    AND SD1.D1_SERIE = SF1.F1_SERIE
                    AND SD1.D1_DOC = SF1.F1_DOC
                    FOR JSON PATH
                ) AS itens

            FROM SF1010 SF1
            WHERE SF1.D_E_L_E_T_ <> '*'
            AND SF1.F1_FORNECE = '${erpFornecedorCod}'
            AND SF1.F1_LOJA = '${erpFornecedorLoja}'
            AND SF1.F1_DOC = '${erpNumeroNota}'
        `;

        const result = await dbSQL.executeQuery(sql);
        return result

    },
    // 🔒 Close invoice by ID
    async closeInvoice(id, user_id) {
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

        const invoice = rows[0];

        // ✅ Atualiza status
        const update = `
            UPDATE accounting_invoices
            SET status = 'CLOSED', updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;
        const { rows: updated } = await db.query(update, [id]);

        // 🪵 Registra log de encerramento
        const log = `
            INSERT INTO accounting_invoice_steps
                (invoice_id, from_step, to_step, message, user_id, note, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `;
        await db.query(log, [
            id,
            invoice.current_step,
            invoice.current_step,
            'Invoice Closed',
            user_id,
            'Invoice process finalized successfully',
        ]);

        return updated[0];
    },



    // ===================================================
    // 🆕 CONTAGEM – PARTE NOVA (revisada para fluxo step-based)
    // ===================================================

    /**
    * getCurrentCount
    * Regra:
    *  - invoice deve estar ativa e aberta
    *  - last_count_step_id deve existir
    *  - last_count_step_id deve ser o último step do invoice
    *  - contagem associada NÃO pode estar finalizada
    */
    async getCountByStepId(id) {

        // --------- Buscar dados da contagem -----------
        const count = await db.query(`
        SELECT *
        FROM accounting_invoice_counts
        WHERE step_id = $1
        ORDER BY id DESC
        LIMIT 1
    `, [id]);

        if (!count.rows.length)
            return { count: null, items: [] };

        const count_id = count.rows[0].id;

        const items = await db.query(`
        SELECT 
            id,
            count_id,
            item_number,
            description,
            ncm,
            codigo,
            unidade,
            qty_counted,
            CASE 
                WHEN  (qty_nf <> qty_counted OR qty_counted IS NULL) THEN FALSE
                ELSE TRUE
            END AS is_matched,
            created_at,
            updated_at
        FROM accounting_invoice_count_items
        WHERE count_id = $1
        ORDER BY item_number ASC
    `, [count_id]);
        
        return { ...count.rows[0], itens: items.rows  }

    },

    async getCurrentCount(invoice_id) {

        const inv = await db.query(`
        SELECT  
            inv.id 		as invoice_id,
            step.id 	as step_id,
            inv.status	as invoice_status, 
            inv.active	as invoice_active, 
            inv.last_count_step_id,
            cnt.status 	AS last_count_status,
            cnt.step_id,
            (SELECT MAX(id) AS last_step
                                    FROM accounting_invoice_steps
                                    WHERE invoice_id = inv.id
                                    AND deleted_at IS null) as step_active
        FROM accounting_invoice_counts cnt 
        inner join accounting_invoice_steps step 
        on step.id = cnt.step_id 
        inner join accounting_invoices inv 
        on inv.id = step.invoice_id 
        WHERE inv.id = $1
          and step.id = (SELECT MAX(id) AS last_step
                                    FROM accounting_invoice_steps
                                    WHERE invoice_id = inv.id
                                    AND deleted_at IS null)
    `, [invoice_id]);

        if (!inv.rows.length)
            throw new Error("Invoice not found");

        const row = inv.rows[0];

        // --------- Validations -----------

        if (!row.invoice_active || row.invoice_status === 'CLOSED')
            throw new Error("Invoice Fechada!");

        // contagem não iniciada
        if (row.last_count_step_id && !row.last_count_step_id == row.step_active)
            throw new Error("A etapa da contagem foi finalizada!. Inicie nova contagem pela tela de steps.");

        // se a contagem já estiver finalizada, bloquear abertura
        if (row.last_count_status === 'FINISHED')
            throw new Error("Contagem finalizada! Inicie nova contagem pela tela de steps.");

        // --------- Buscar dados da contagem -----------
        const count = await this.getCountByStepId(row.step_active)


        let infoNF = await this.getInfoNDByKey(row.invoice_key)
        return { ...count, nf: infoNF };
    },

    /**
    * startCount
    * Só pode ser executado pela página de steps
    * Gera um novo step fiscal→estoque e uma nova contagem
    */
    async startCount(invoice_id, user_id) {

        const invRes = await db.query(`
        SELECT 
            inv.id,
            inv.status, 
            inv.active, 
            inv.last_count_step_id,
            steps.last_step,
            inv.current_step,
            cnt.status AS last_count_status,
            inv.invoice_key as invoice_key
        FROM accounting_invoices inv
        LEFT JOIN (
            SELECT invoice_id, MAX(id) AS last_step
            FROM accounting_invoice_steps
            WHERE deleted_at IS NULL
            GROUP BY invoice_id
        ) steps ON steps.invoice_id = inv.id
        LEFT JOIN accounting_invoice_counts cnt
            ON cnt.step_id = inv.last_count_step_id
        WHERE inv.id = $1
    `, [invoice_id]);

        if (!invRes.rows.length) throw new Error("Invoice not found");

        const inv = invRes.rows[0];

        // --- validações ---
        if (!inv.active || inv.status === 'CLOSED')
            throw new Error("Invoice fechada.");

        // step atual só pode iniciar contagem
        if (inv.current_step.toUpperCase() !== 'ESTOQUE')
            throw new Error("Para iniciar contagem, a NF deve estar no step ESTOQUE.");

        // se houver contagem anterior, ela deve estar finalizada
        const lastCountStatus = await db.query(`
            SELECT status, id, step_id FROM accounting_invoice_counts
            WHERE step_id = $1
            ORDER BY id DESC
            LIMIT 1
        `, [inv.last_step]);

        if (lastCountStatus.rows.length &&
            lastCountStatus.rows[0].status !== 'FINISHED') {
            return { count_id: lastCountStatus.rows[0].id, step_id: lastCountStatus.rows[0].step_id };
        }

        // --- cria novo step (estoque → estoque) ---

        const updateStep = await this.updateStep({
            id: invoice_id,
            to_step: 'estoque',
            message: 'Contagem iniciada',
            note: null,
            user_id,
            to_user_id: user_id
        })

        /*
                const stepRes = await db.query(`
                INSERT INTO accounting_invoice_steps
                  (invoice_id, from_step, to_step, user_id, message, created_at)
                VALUES ($1, 'estoque', 'estoque', $2, 'Contagem iniciada', NOW())
                RETURNING id
            `, [invoice_id, user_id]);
        */
        const step_id = updateStep.step[0].id;

        // --- cria contagem ---
        const countRes = await db.query(`
        INSERT INTO accounting_invoice_counts (step_id, user_id, status)
        VALUES ($1, $2, 'OPEN')
        RETURNING id
    `, [step_id, user_id]);

        const count_id = countRes.rows[0].id;

        // --- SE RECONTAGEM: copiar divergentes ---
        if (inv.last_count_step_id) {

            const lastCountRes = await db.query(`
            SELECT id FROM accounting_invoice_counts
            WHERE step_id = $1
            ORDER BY id DESC
            LIMIT 1
        `, [inv.last_count_step_id]);

            const prev_count_id = lastCountRes.rows?.[0]?.id;

            if (prev_count_id) {
                await db.query(`
                INSERT INTO accounting_invoice_count_items
                  (count_id, item_number, description, ncm, codigo, unidade, qty_nf, qty_counted)
                SELECT
                  $1,
                  item_number,
                  description,
                  ncm,
                  codigo,
                  unidade,
                  qty_nf,
                  CASE 
        			WHEN  (qty_nf <> qty_counted OR qty_counted IS NULL) THEN NULL
        			ELSE qty_nf
    			 END AS qty_counted
                FROM accounting_invoice_count_items
                WHERE count_id = $2
            `, [count_id, prev_count_id]);
            }
        }
        else {
            // --- 1ª contagem: importar itens do SAAM ---
            const nf = await this.getNFByKey(inv.invoice_key);
            if (!nf.saam.success) throw new Error("NF não encontrada no SAAM");

            if (!nf.erp.success) throw new Error("NF não encontrada no ERP");


            for (const it of nf.erp.nf.itens) {
                await db.query(`
                INSERT INTO accounting_invoice_count_items
                  (count_id, item_number, description, ncm, codigo, unidade, qty_nf)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                    count_id,
                    it.item,
                    it.produto_desc,
                    '',
                    it.produto,
                    it.unide_medida,
                    it.qtde
                ]);
            }
        }

        /*
        // --- Atualiza invoice ---
        await db.query(`
        UPDATE accounting_invoices
        SET last_count_step_id = $1,
            current_step = 'estoque',
            updated_at = NOW()
        WHERE id = $2
    `, [step_id, invoice_id]);
        */

        return { count_id, step_id };
    },


    /**
     * updateCountItem
     * Atualiza qty_counted de um item específico
     */
    async updateCountItem(item_id, qty_counted) {
        const sql = `
            UPDATE accounting_invoice_count_items
            SET qty_counted = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `;
        const { rows } = await db.query(sql, [qty_counted, item_id]);
        return rows[0];
    },

    /**
     * finalizeCount
     * Calcula divergência, marca matched, finaliza contagem e insere um step de retorno (estoque->fiscal)
     */
    async finalizeCount(count_id, user_id) {

        // pegar itens
        const itemsRes = await db.query(`
        SELECT  c.id		as id,
      		    step.id 	as step_id,
      		    inv.id		as invoice_id,
      		    json_agg(
                    json_build_object(
                    'id', ci.id,
                    'qty_nf', ci.qty_nf, 
                    'qty_counted', ci.qty_counted)
                ) AS itens
        FROM accounting_invoice_count_items ci
        left join accounting_invoice_counts c
          on c.id = ci.count_id  
        inner join accounting_invoice_steps step 
           on step.id = c.step_id 
        inner join accounting_invoices inv 
           on inv.id = step.invoice_id 
        WHERE c.id = $1
        group by  c.id, step.id, inv.id
        
    `, [count_id]);

        const count = itemsRes.rows[0]
        let matched = true;
        for (const it of count.itens) {
            if (it.qty_counted === null || Number(it.qty_nf) !== Number(it.qty_counted)) {
                matched = false;
            }
        }


        // atualizar contagem
        const update = await db.query(`
        UPDATE accounting_invoice_counts
        SET status = 'FINISHED', matched = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
        `, [matched, count_id]);

        // atualizar invoice para voltar para fiscal
        await db.query(`
        UPDATE accounting_invoices
        SET last_count_step_id = $2
        WHERE id = $1
        `, [count.invoice_id, count.step_id]);

        let messageStep = matched ? 'Contagem OK' : 'Contagem Divergente'
        const updateStep = await this.updateStep({
            id: count.invoice_id,
            to_step: 'fiscal',
            message: messageStep,
            note: null,
            user_id,
            to_user_id: user_id
        })

        return updateStep;
    },

};
