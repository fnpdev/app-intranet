require('dotenv').config();
const jwt = require('jsonwebtoken');
const ldap = require('ldapjs');
const { logEvent } = require('../services/logService');
const { usersService, permissionsService, variablesService } = require('../services/usersService');

// =====================================================
// 🔧 Variáveis de ambiente
// =====================================================
const {
  LDAP_URL,
  BASE_DN,
  LDAP_BIND_DN,
  LDAP_BIND_PASSWORD,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  NODE_ENV
} = process.env;

// =====================================================
// 🔍 Busca DN real do usuário
// =====================================================
function findUserDN(username) {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({ url: LDAP_URL });

    client.bind(LDAP_BIND_DN, LDAP_BIND_PASSWORD, (err) => {
      if (err) {
        client.unbind();
        return reject('Falha ao autenticar conta técnica LDAP: ' + err);
      }

      const opts = {
        filter: `(sAMAccountName=${username})`,
        scope: 'sub',
        attributes: ['distinguishedName'],
      };

      client.search(BASE_DN, opts, (err, res) => {
        if (err) {
          client.unbind();
          return reject('Erro na busca LDAP: ' + err);
        }

        let userDN = null;
        res.on('searchEntry', (entry) => {
          userDN = entry.object.distinguishedName;
        });

        res.on('end', () => {
          client.unbind();
          if (userDN) resolve(userDN);
          else reject('Usuário não encontrado');
        });
      });
    });
  });
}

// =====================================================
// 🧩 Autentica usuário no AD
// =====================================================
async function authenticateAD(username, password) {
  try {
    const userDN = await findUserDN(username);
    return new Promise((resolve, reject) => {
      const client = ldap.createClient({ url: LDAP_URL });
      client.bind(userDN, password, (err) => {
        client.unbind();
        if (err) reject('Credenciais inválidas');
        else resolve();
      });
    });
  } catch (err) {
    throw err;
  }
}

// =====================================================
// 🔐 Controller: LOGIN
// =====================================================
async function authController(req, res) {
  const { username, password } = req.body;

  await logEvent({
    username,
    ip_address: req.hostname,
    success: true,
    message: 'Tentativa de login'
  });

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Usuário ou senha ausentes' });
  }

  try {
    let user = null;

    // =====================================================
    // 🧩 Autentica no AD (Produção)
    // =====================================================
    await authenticateAD(username, password);

    // 🔹 Cria ou atualiza usuário no banco
    user = await usersService.findOrCreateUser({
      username,
      name: username,
      email: `${username}@empresa.com`,
      ad_account: true,
    });


    // =====================================================
    // ⏱️ Atualiza data do último login
    // =====================================================
    await usersService.updateLastLogin(user.id);

    // =====================================================
    // 🔐 Carrega permissões do banco
    // =====================================================
    const dbPermissions = await permissionsService.getUserPermissionsByUserId(user.id);

    // =====================================================
    // 🔧 Gera Token JWT
    // =====================================================
    const token = jwt.sign(
      {
        id: user.id,
        user_level: user.user_level,
        username: user.username,
        permissions: dbPermissions,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await logEvent({
      username,
      ip_address: req.hostname,
      success: true,
      message: 'Login bem-sucedido'
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        user_level: user.user_level,
        permissions: dbPermissions,
      },
      environment: NODE_ENV,
    });

  } catch (err) {
    console.error('❌ Erro no login:', err.message || err);

    await logEvent({
      username,
      ip_address: req.hostname,
      success: false,
      message: `Falha no login: ${err.message || err}`,
    });

    return res.status(401).json({
      success: false,
      error: err.message || 'Falha na autenticação',
    });
  }
}

// =====================================================
// 👤 Controller: /api/me
// =====================================================
async function controllerMe(req, res) {
  try {
    const username = req.user.username;

    // 🔹 Busca variáveis do usuário
    const variables = await variablesService.getUserVariablesEffective(username);
    const variablesObject = {};
    variables.forEach(v => {
      variablesObject[v.key] = {
        value: v.value,
        description: v.description,
      };
    });

    // 🔹 Recarrega permissões do banco
    const dbPermissions = await permissionsService.getUserPermissionsByUsername(username);

    return res.json({
      success: true,
      data: {
        username,
        user_level: req.user.user_level,
        permissions: dbPermissions,
        variables,
        variablesObject,
      },
    });
  } catch (err) {
    console.error('❌ Erro em /api/me:', err);
    return res.status(500).json({ success: false, error: 'Erro ao buscar dados do usuário' });
  }
}

module.exports = { authController, controllerMe };
