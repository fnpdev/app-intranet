const jwt = require('jsonwebtoken');
const { findOrCreateUser } = require('./usersService');

/**
 * Gera token e registra o login no banco
 */
async function loginAD({ username, name, email }) {
  // Cria ou atualiza cadastro e registra o último login
  const user = await findOrCreateUser({
    username,
    name,
    email,
    ad_account: true,
  });

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      user_level: user.user_level,
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    success: true,
    message: 'Login efetuado com sucesso.',
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      user_level: user.user_level,
      last_login: user.last_login,
    },
  };
}

module.exports = { loginAD };
