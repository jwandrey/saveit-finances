const express = require('express');
const login = require('./controladores/login');
const { cadastrarUsuario, detalharUsuario, atualizarUsuario } = require('./controladores/usuarios');
const validarLogin = require('./intermediarios/autenticacao');
const { listarCategorias, listarTransacoes, obterExtrato, detalharTransacao, cadastrarTransacao, atualizarTransacao, excluirTransacao } = require('./controladores/transacoes');

const rotas = express();

rotas.post('/usuario', cadastrarUsuario); 
rotas.post('/login', login); 

rotas.use(validarLogin);

rotas.get('/usuario', detalharUsuario); 
rotas.put('/usuario', atualizarUsuario); 
rotas.get('/categoria', listarCategorias); 
rotas.get('/transacao', listarTransacoes); 
rotas.get('/transacao/extrato', obterExtrato); 
rotas.get('/transacao/:id', detalharTransacao); 
rotas.post('/transacao', cadastrarTransacao); 
rotas.put('/transacao/:id', atualizarTransacao); 
rotas.delete('/transacao/:id', excluirTransacao); 

module.exports = rotas;