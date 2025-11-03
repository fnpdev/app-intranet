// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar token JWT
 */
const verifyToken = (req, res, next) => {
  try {
    // Pega o token do header Authorization
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    // O token vem no formato: "Bearer TOKEN_AQUI"
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido',
      });
    }

    // Verifica e decodifica o token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Erro ao verificar token:', err.message);

        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token expirado',
            expired: true,
          });
        }

        return res.status(403).json({
          success: false,
          message: 'Token inválido',
        });
      }

      // Adiciona os dados do usuário decodificados na requisição
      req.user = decoded;

      // Continua para a próxima função/rota
      next();
    });
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar autenticação',
    });
  }
};

/**
 * Middleware para verificar permissões específicas
 * @param {Array<string>} requiredPermissions - Permissões necessárias
 */
const checkPermissions = (requiredPermissions = []) => {
  return (req, res, next) => {
    try {
      // Verifica se o usuário está autenticado
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
        });
      }

      // Se não há permissões requeridas, permite acesso
      if (requiredPermissions.length === 0) {
        return next();
      }

      // Verifica se o usuário tem as permissões necessárias
      const userPermissions = req.user.permissions || [];

      const hasPermission = requiredPermissions.some(permission =>
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para acessar este recurso',
          requiredPermissions,
        });
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissões',
      });
    }
  };
};

/**
 * Middleware opcional - não bloqueia se não houver token
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        req.user = null;
      } else {
        req.user = decoded;
      }
      next();
    });
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  verifyToken,
  checkPermissions,
  optionalAuth,
};
