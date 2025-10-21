// controllers/authController.js

require('dotenv').config();
const jwt = require('jsonwebtoken');
const ldap = require('ldapjs');
const { logEvent } = require('../services/logService');


// Constants from env
const LDAP_URL = process.env.LDAP_URL;
const BASE_DN = process.env.BASE_DN;
const LDAP_BIND_DN = process.env.LDAP_BIND_DN;
const LDAP_BIND_PASSWORD = process.env.LDAP_BIND_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const environment = process.env.NODE_ENV;

const MODULE_GROUPS = {
  intranet: process.env.INTRANET_GROUP,
  suprimentos: process.env.SUPRIMENTOS_GROUP,
  rh: process.env.RH_GROUP,
};

// Função: Busca o DN real do usuário usando conta técnica
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

// Função: Busca todos os grupos AD que o usuário pertence
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
          if (Array.isArray(memberOf)) groups = memberOf;
          else if (typeof memberOf === 'string') groups = [memberOf];
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

// Função: Faz bind (autentica) usando o DN real do usuário e a senha informada
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

// ------------ CONTROLLER PRINCIPAL -------------
async function controllerLogin(req, res) {
  // Retorno estático em desenvolvimento

    await logEvent({
      username: req.body.username,
      ip_address: req.hostname,
      success: true,
      message: 'tentativa de login'
    });


  if (environment === 'development') {
    return res.json({
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Imdlb3ZhbmUucHJlc3RlcyIsInBlcm1pc3Npb25zIjp7ImludHJhbmV0Ijp0cnVlLCJzdXByaW1lbnRvcyI6dHJ1ZSwicmgiOmZhbHNlfSwiYWRHcm91cHMiOlsiQ049R19JTlRSQU5FVF9BQ0VTU08sT1U9R3J1cG9zLE9VPU5vdmFfUGlyYXRpbmluZ2EsREM9Tm92YVBpcmF0aW5pbmdhLERDPWxvY2FsIiwiQ049R19JTlRSQU5FVF9TVVBSSU1FTlRPUyxPVT1HcnVwb3MsT1U9Tm92YV9QaXJhdGluaW5nYSxEQz1Ob3ZhUGlyYXRpbmluZ2EsREM9bG9jYWwiLCJDTj1HX1ZQTixPVT1WUE4sT1U9U2V0b3JlcyxPVT1Ob3ZhX1BpcmF0aW5pbmdhLERDPU5vdmFQaXJhdGluaW5nYSxEQz1sb2NhbCIsIkNOPVFsaWtfU2Vuc2VfVXNlcnMsQ049VXNlcnMsREM9Tm92YVBpcmF0aW5pbmdhLERDPWxvY2FsIiwiQ049QWNlc3NvcyBUUyxDTj1Vc2VycyxEQz1Ob3ZhUGlyYXRpbmluZ2EsREM9bG9jYWwiLCJDTj1BZG1pbmlzdHJhdG9ycyxDTj1CdWlsdGluLERDPU5vdmFQaXJhdGluaW5nYSxEQz1sb2NhbCJdLCJpYXQiOjE3NjAxODg2MTIsImV4cCI6MTc2MDE5MjIxMn0.FVdBnrKx_32KSvKQyLLRh112aQJ7Ba_qM8LyyRb4j2A",
      permissions: {
        intranet: true,
        suprimentos: true,
        rh: true
      },
      environment
      
    });
  }

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

    const token = jwt.sign({ username, permissions, adGroups }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ token, permissions, environment }); // Você pode retornar só permissions se não quiser retornar todos os grupos
  } catch (err) {
    console.log(error)
    res.status(401).json({ error: err });
  }
}

module.exports = { controllerLogin };