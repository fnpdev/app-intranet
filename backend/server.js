require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');


app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.50.14:3000'],
  credentials: true,
}));
app.use('/api', require('./routes/authRoutes'));

// erro handler centralizado se quiser
// app.use(require('./middlewares/errorHandler'));

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'dev';
app.listen(PORT, () => console.log(`API rodando na porta ${PORT} em ${NODE_ENV}` ));
