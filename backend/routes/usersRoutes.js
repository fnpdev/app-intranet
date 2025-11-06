// routes/users.js
const express = require('express');
const router = express.Router();
const { requireLevel } = require('../middlewares/accessLevelMiddleware');
const {
  usersService,
  variablesService,
  permissionsService
} = require('../services/usersService');
const db = require('../config/db_postgres');


/**
 * GET /api/users/me
 * Retorna informações completas do usuário autenticado + variáveis + módulos acessíveis
 */
router.get('/me', requireLevel(1  ), async (req, res) => {
  try {
    if (!req.user || !req.user.username) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado ou token inválido',
      });
    }

    const username = req.user.username;
    const me = await usersService.getUserMe(username);

    res.json({ success: true, data: me });
  } catch (err) {
    console.error('❌ Erro ao buscar dados do usuário logado:', err);
    res.status(500).json({ success: false, message: 'Erro ao listar usuários.' });
  }
});


// POST /api/users/variables
router.post('/variables', async (req, res) => {
  try {
    if (!req.user?.username) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado ou token inválido',
      });
    }

    // Pega o user_id a partir do usuário autenticado
    const { rows } = await db.query(
      'SELECT id FROM intranet_users WHERE username = $1 LIMIT 1;',
      [req.user.username]
    );
    const user_id = rows[0]?.id;
    if (!user_id) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    const { variable_id, value, variables } = req.body;
    const results = [];

    // 1️⃣ Atualiza variável única
    if (variable_id && value !== undefined) {
      const updated = await variablesService.upsertUserVariable({
        user_id,
        variable_id,
        value,
      });
      results.push(updated);
    }

    // 2️⃣ Atualiza várias variáveis
    if (Array.isArray(variables)) {
      for (const v of variables) {
        if (v.variable_id && v.value !== undefined) {
          const updated = await variablesService.upsertUserVariable({
            user_id,
            variable_id: v.variable_id,
            value: v.value,
          });
          results.push(updated);
        }
      }
    }

    // 🔁 Retorna as variáveis atualizadas
    const updatedVars = await variablesService.getUserVariablesEffective(user_id);

    return res.json({
      success: true,
      message: 'Variáveis atualizadas com sucesso.',
      data: updatedVars,
    });
  } catch (err) {
    console.error('❌ Erro ao atualizar variáveis do usuário:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar variáveis do usuário.',
      error: err.message,
    });
  }
});



// =======================================================
// 🔒 Listar todos (admin)
// =======================================================
router.get('/permissions/:id', requireLevel(9), async (req, res) => {
  try {
    const permissionsUsers = await permissionsService.getUserPermissionsByUserId();
    res.json({ success: true, data: permissionsUsers });
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    res.status(500).json({ success: false, message: 'Erro ao listar usuários.' });
  }
  
});



// =======================================================
// 🔒 Listar todos (admin)
// =======================================================
router.get('/', requireLevel(9), async (req, res) => {
  try {
    const users = await usersService.findAll();
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    res.status(500).json({ success: false, message: 'Erro ao listar usuários.' });
  }
});


// 🔒 Obter usuário específico (autenticado)
router.get('/:id', requireLevel(1), async (req, res) => {
  try {
    const user = await usersService.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar usuário.' });
  }
});


// 🔒 Atualizar usuário (admin)
router.put('/:id', requireLevel(9), async (req, res) => {
  try {
    const user = await usersService.update(req.params.id, req.body);
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    res.status(500).json({ success: false, message: 'Erro ao atualizar usuário.' });
  }
});


// 🔒 Excluir usuário (admin)
router.delete('/:id', requireLevel(9), async (req, res) => {
  try {
    await usersService.softDelete(req.params.id);
    res.json({ success: true, message: 'Usuário excluído com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir usuário:', err);
    res.status(500).json({ success: false, message: 'Erro ao excluir usuário.' });
  }
});

module.exports = router;
