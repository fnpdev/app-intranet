const jwt = require('jsonwebtoken');

/**
 * Middleware para controle de acesso baseado em nível
 * 
 * @param {number} requiredLevel - nível mínimo exigido (0 = público, 1 = autenticado, 9 = admin)
 */
function requireLevel(requiredLevel = 1) {
  return (req, res, next) => {
    try {
      // 🔓 Nível 0 = público → segue sem validação
      if (requiredLevel === 0) return next();

      // 🔒 Requer token
      const authHeader = req.headers['authorization'];
      if (!authHeader)
        return res.status(401).json({ success: false, message: 'Token ausente' });

      const token = authHeader.split(' ')[1];
      if (!token)
        return res.status(401).json({ success: false, message: 'Token inválido' });

      // 🔑 Decodifica o token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      const userLevel = decoded.user_level || 1;

      // 🚫 Bloqueia se o nível do usuário for menor que o exigido
      if (userLevel < requiredLevel) {
        return res.status(403).json({
          success: false,
          message: `Acesso negado — nível ${userLevel} insuficiente para esta operação (nível mínimo: ${requiredLevel}).`,
          decoded
        });
      }

      next();
    } catch (err) {
      console.error('❌ Erro no controle de acesso:', err.message);
      return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }
  };
}

module.exports = { requireLevel };
