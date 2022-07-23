const express = require("express");
const { cadastrarConta, listarContas, deletarConta, atualizarConta, depositar, sacar, transferencia, saldo, extrato } = require("../controladores");
const roteador = express();

roteador.get("/contas", listarContas);
roteador.post("/contas", cadastrarConta);
roteador.put("/contas/:numeroConta/usuario", atualizarConta);
roteador.delete("/contas/:numeroConta", deletarConta);
roteador.post("/transacoes/depositar", depositar);
roteador.post("/transacoes/sacar", sacar);
roteador.post("/transacoes/transferir", transferencia);
roteador.get("/contas/saldo", saldo);
roteador.get("/contas/extrato", extrato);

module.exports = roteador;
