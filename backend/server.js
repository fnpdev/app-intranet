// backend\server.js
require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const { verifyToken } = require('./middlewares/authMiddleware');

// Middlewares
app.use(express.json());
app.use(cors({
  origin: ['127.0.0.1','http://localhost:3000', 'http://192.168.50.14:3000', 'http://intranet-dev.novapiratininga.com:3000'],
  credentials: true,
}));

// ==================== ROTAS ====================

// Rotas de autenticação (existentes)
app.use('/api',                                     require('./routes/authRoutes'));
app.use('/api/users',                 verifyToken,  require('./routes/usersRoutes'));
app.use('/api/variables',             verifyToken,  require('./routes/variablesRoutes'));
app.use('/api/modules',               verifyToken,  require('./routes/modulesRoutes'));
app.use('/api/pages',                 verifyToken,  require('./routes/pagesRoutes'));
app.use('/workflow',                  verifyToken,  require('./routes/workflowRoutes'));

// ==================== ERROR HANDLER ====================

// Erro handler centralizado (se quiser)
// app.use(require('./middlewares/errorHandler'));

// Handler para rotas não encontradas
app.use((req, res) => {

  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.path
  });
});

// Handler de erros global
app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'dev' ? err.message : undefined,
  });
});

// ==================== SERVIDOR ====================

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'dev';

const server = app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT} em modo ${NODE_ENV}`);
  console.log(`📍 Endpoints disponíveis:`);
  console.log(`   - POST   /api/login`);
  console.log(`   - GET    /api/protected`);
  console.log(`   - GET    /api/erp/produtos/:codigo`);
});

// ==================== GRACEFUL SHUTDOWN ====================

// Função para fechar conexões graciosamente
const gracefulShutdown = async (signal) => {
  console.log(`\n⚠️  ${signal} recebido, encerrando servidor...`);
  
  // Fecha o servidor HTTP
  server.close(async () => {
    console.log('🔌 Servidor HTTP encerrado');
    
    try {
      // Fecha o pool de conexões do banco de dados
      const { closePool } = require('./config/db_postgres');
      await closePool();
      console.log('✅ Conexões encerradas com sucesso');
      process.exit(0);
    } catch (error) {
      console.error('❌ Erro ao encerrar conexões:', error);
      process.exit(1);
    }
  });

  // Força o encerramento após 10 segundos
  setTimeout(() => {
    console.error('⏱️  Tempo limite excedido, forçando encerramento...');
    process.exit(1);
  }, 10000);
};

// Listeners para sinais de encerramento
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Listener para erros não tratados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Em produção, você pode querer encerrar o processo
  if (NODE_ENV === 'production') {
    gracefulShutdown('unhandledRejection');
  }
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Em produção, você pode querer encerrar o processo
  if (NODE_ENV === 'production') {
    gracefulShutdown('uncaughtException');
  }
});

module.exports = app;
