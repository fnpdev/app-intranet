// services/database/queries/index.js

const produtosQueries = require('./produtosQueries');
const scQueries = require('./scQueries');
const saQueries = require('./saQueries');
const pcQueries = require('./pcQueries');

module.exports = {
  produto: produtosQueries,
  sc: scQueries,
  sa: saQueries,
  pc: pcQueries
};
