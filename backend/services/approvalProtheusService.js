// backend/services/approvalProtheusService.js
const dbSQL = require('./DBSQLServerService');

/**
 * getApproversByGroup
 * Consulta o Protheus filtrando pelo grupo (DBL.DBL_GRUPO / SAL.AL_COD)
 * e pelo amount entre DHL.DHL_LIMMIN e DHL.DHL_LIMMAX.
 *
 * Retorna array de linhas com: user_name, nivel, grupo, limite_minimo, limite_maximo
 */
module.exports = {
  async getApproversByGroup({ approvalGroup, amount }) {
    const sql = `
      SELECT DISTINCT
        TRIM(SAK.AK_LOGIN)    as username,
        TRIM(SAL.AL_NIVEL)    as nivel,
        TRIM(DBL.DBL_GRUPO)   as grupo,
        DHL.DHL_LIMMIN  as limite_minimo,
        DHL.DHL_LIMMAX  as limite_maximo
      FROM SAL010 SAL
      LEFT JOIN protheus_prd.dbo.SAK010 SAK
        ON SAK.AK_FILIAL = SAL.AL_FILIAL
       AND SAK.AK_COD = SAL.AL_APROV
      LEFT JOIN DBL010 DBL
        ON DBL.DBL_FILIAL = SAL.AL_FILIAL
       AND DBL.DBL_GRUPO = SAL.AL_COD
       AND DBL.D_E_L_E_T_ <> '*'
      LEFT JOIN DHL010 DHL
        ON DHL.DHL_FILIAL = SAL.AL_FILIAL
       AND DHL.DHL_COD = SAL.AL_PERFIL
       AND DHL.D_E_L_E_T_ <> '*'
      WHERE SAL.D_E_L_E_T_ <> '*'
        AND SAL.AL_FILIAL = '0101'
        AND DBL.DBL_GRUPO = '${approvalGroup}'
        AND ${amount} BETWEEN DHL.DHL_LIMMIN AND DHL.DHL_LIMMAX
    `;

    const result = await dbSQL.executeQuery(sql);
    return result.success ? result.data : [];
  }
};
