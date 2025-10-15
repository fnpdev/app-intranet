require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const ldap = require('ldapjs');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const LDAP_URL = process.env.LDAP_URL;
const BASE_DN = process.env.BASE_DN;
const JWT_SECRET = process.env.JWT_SECRET;
const LDAP_BIND_DN = process.env.LDAP_BIND_DN;
const LDAP_BIND_PASSWORD = process.env.LDAP_BIND_PASSWORD;

const MODULE_GROUPS = {
  intranet: process.env.INTRANET_GROUP,
  suprimentos: process.env.SUPRIMENTOS_GROUP,
  rh: process.env.RH_GROUP,
};

// Busca o DN real do usuário usando conta técnica
function findUserDN(username) {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({ url: LDAP_URL });
    client.bind(LDAP_BIND_DN, LDAP_BIND_PASSWORD, (err) => {
      if (err) {
        client.unbind();
        return reject('Falha ao autenticar usuário técnico do LDAP: ' + err);
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
        res.on('searchEntry', entry => {
          userDN = entry.object.distinguishedName;
        });
        res.on('end', () => {
          client.unbind();
          if (userDN) resolve(userDN);
          else reject('Usuário não encontrado');
        });
        res.on('error', err => {
          client.unbind();
          reject('Erro durante busca LDAP: ' + err);
        });
      });
    });
  });
}

// Busca todos os grupos AD que o usuário pertence
function getUserGroups(username) {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({ url: LDAP_URL });
    client.bind(LDAP_BIND_DN, LDAP_BIND_PASSWORD, (err) => {
      if (err) {
        client.unbind();
        return reject('Falha ao autenticar usuário técnico do LDAP: ' + err);
      }
      const opts = {
        filter: `(sAMAccountName=${username})`,
        scope: 'sub',
        attributes: ['memberOf'],
      };
      client.search(BASE_DN, opts, (err, res) => {
        if (err) {
          client.unbind();
          return reject('Erro na busca LDAP: ' + err);
        }
        let groups = [];
        res.on('searchEntry', entry => {
          const memberOf = entry.object.memberOf;
          if (Array.isArray(memberOf)) {
            groups = memberOf;
          } else if (typeof memberOf === 'string') {
            groups = [memberOf];
          }
        });
        res.on('end', () => {
          client.unbind();
          resolve(groups);
        });
        res.on('error', err => {
          client.unbind();
          reject('Erro durante busca LDAP: ' + err);
        });
      });
    });
  });
}

// Faz bind usando o DN real do usuário e a senha digitada
async function authenticateAD(username, password) {
  try {
    const userDN = await findUserDN(username);
    return new Promise((resolve, reject) => {
      const client = ldap.createClient({ url: LDAP_URL });
      client.bind(userDN, password, err => {
        client.unbind();
        if (err) reject('Credenciais inválidas');
        else resolve();
      });
    });
  } catch (err) {
    throw err;
  }
}

// Rota de login aprimorada para retornar grupos!
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }
  try {
    await authenticateAD(username, password);
    const adGroups = await getUserGroups(username);

    // Validação: Carrega permissões a partir dos grupos .env
    const permissions = {};
    Object.entries(MODULE_GROUPS).forEach(([module, groupName]) => {
      // Verifica se o usuário é membro do grupo do módulo
      permissions[module] = adGroups.some(groupDn =>
        groupDn.includes(groupName)
      );
    });

    const token = jwt.sign({ username, permissions, adGroups }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, permissions }); // Você pode retornar só permissions se não quiser retornar todos os grupos
  } catch (err) {
    res.status(401).json({ error: err });
  }
});

// Exemplo de uso na rota protegida
app.get('/api/protected', (req, res) => {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });

    // Use user.permissions pra checar acesso aos módulos
    res.json({ message: 'Acesso liberado!', user });
  });
});

app.listen(4000, () => console.log('Backend na porta 4000'));
