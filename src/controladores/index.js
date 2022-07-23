const { banco } = require("../bancodedados");
const { format, utcToZonedTime } = require("date-fns-tz");
const bancoDeDados = require("../bancodedados");
let { contas, depositos, saques, transferencias } = bancoDeDados;
let { numero } = banco;
numero = Number(numero);
const data = new Date();
const fusoPais = "America/Sao_Paulo";
const zonaFormatada = utcToZonedTime(data, fusoPais);
const padrao = "d.MM.yyy HH:mm:ss 'GMT' XXX (z)";
const dataFormatada = format(zonaFormatada, padrao, { fuso: "America/Sao_Paulo" });
const verificacaoObrigatoria = (res, cpf, email, nome, data_nascimento, telefone, senha) => {
  if (!nome) res.status(400).json({ mensagem: "Nome não informado" });
  if (!data_nascimento) res.status(400).json({ mensagem: "Data de nascimento não informado" });
  if (!telefone) res.status(400).json({ mensagem: "Telefone não informado" });
  if (!cpf) res.status(400).json({ mensagem: "Cpf não informado" });
  if (!email) res.status(400).json({ mensagem: "Email não informado" });
  if (!senha) res.status(400).json({ mensagem: "Senha não informada" });
};

const listarContas = (req, res) => {
  try {
    const { senha_banco } = req.query;
    if (senha_banco !== "Cubos123Bank")
      return res.status(403).json({
        mensagem: "A senha do banco informada é inválida!",
      });
    res.send(contas);
  } catch (erro) {
    res.send(erro.messege);
  }
};

const cadastrarConta = (req, res) => {
  try {
    const { cpf, email, nome, data_nascimento, telefone, senha } = req.body;

    verificacaoObrigatoria(res, cpf, email, nome, data_nascimento, telefone, senha);

    const verificacao = contas.find((elemento) => elemento.cpf === Number(cpf) || elemento.email === email);

    if (verificacao) return res.status(400).json({ mensagem: "Já existe uma conta com o cpf ou e-mail informado!" });

    const usuario = {
      numero: numero++,
      saldo: 0,
      nome: nome,
      cpf: cpf,
      data_nascimento: data_nascimento,
      telefone: telefone,
      email: email,
      senha: senha,
    };

    contas.push(usuario);
    return res.status(201).json({ mensagem: "Usuário cadastrado com sucesso" });
  } catch (erro) {
    res.send(erro.messege);
  }
};
const atualizarConta = (req, res) => {
  const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;
  const { numeroConta } = req.params;
  verificacaoObrigatoria(res, cpf, email, nome, data_nascimento, telefone, senha);

  const usuario = contas.find((elemento) => elemento.numero === Number(numeroConta));

  if (!usuario) return res.status(404).json({ mensagem: "Número de conta inválido" });
  if (usuario.cpf !== cpf) return res.status(400).json({ mensagem: "Cpf não corresponde ao cadastrado" });

  usuario.nome = nome;
  usuario.telefone = telefone;
  usuario.email = email;
  usuario.senha = senha;
  res.status(204).send();
};

const deletarConta = (req, res) => {
  const { numeroConta } = req.params;
  const usuario = contas.find((elemento) => elemento.numero === Number(numeroConta));
  const { saldo } = usuario;

  if (!usuario) res.status(404).json({ mensagem: "Número de conta inválido" });
  if (saldo > 0) return res.status(401).json({ mensagem: "Não é possível excluir conta com saldo" });

  contas = contas.filter((elemento) => elemento.numero !== Number(numeroConta));
  res.status(204).send();
};

const depositar = (req, res) => {
  const { numero_conta, valor } = req.body;
  let usuario = contas.find((elemento) => elemento.numero === Number(numero_conta));
  if (!usuario) res.status(404).json({ mensagem: "Número da conta invalido" });
  if (!valor) res.status(404).json({ mensagem: "Digite um valor para que a transferência possa ser realizada" });

  if (valor <= 0) return res.status(400).json({ mensagem: "Não é possível realizar este tipo de transação" });

  usuario.saldo += valor;
  const infoDeposito = {
    data: dataFormatada,
    numero_conta,
    valor,
  };
  depositos.push(infoDeposito);
  return res.status(200).json(infoDeposito);
};
const sacar = (req, res) => {
  const { numero_conta, valor, senha } = req.body;
  let usuario = contas.find((elemento) => elemento.numero === Number(numero_conta));
  let { saldo } = usuario;

  if (!usuario) return res.status(404).json({ mensagem: "Número de conta inválido" });
  if (usuario.senha !== senha) return res.status(401).json({ mensagem: "Senha inválida" });

  if (saldo < valor) return res.status(403).json({ mensagem: "Saldo insuficiente" });
  if (valor < 0) return res.status(403).json({ mensagem: "Não é possível realizar este tipo de transação" });
  usuario.saldo -= valor;
  const infoSaque = {
    data: dataFormatada,
    numero_conta,
    valor,
  };
  saques.push(infoSaque);
  return res.status(200).json(infoSaque);
};

const transferencia = (req, res) => {
  const { numero_conta_origem, numero_conta_destino, valor, senha } = req.body;

  if (!numero_conta_origem) return res.status(400).send("Número de conta não informado");
  if (!numero_conta_destino) return res.status(400).send("Número da conta de destino não informado");
  if (!valor) return res.status(400).json({ mensagem: "Valor não informado" });
  if (!senha) return res.status(400).json({ mensagem: "Senha não informada" });

  let usuarioOrigem = contas.find((elemento) => elemento.numero === numero_conta_origem);
  if (!usuarioOrigem) return res.status(404).json({ mensagem: "Usuário não encontrado" });

  let usuarioDestino = contas.find((elemento) => elemento.numero === numero_conta_destino);

  if (!usuarioDestino) return res.status(404).json({ mensagem: "Usuário não encontrado" });
  if (usuarioOrigem.senha !== senha) return res.status(401).json({ mensagem: "Senha inválida" });
  if (usuarioOrigem.saldo < valor) return res.status(403).json({ mensagem: "Saldo insuficiente" });
  usuarioOrigem.saldo -= valor;
  usuarioDestino.saldo += valor;
  const infoTransferenciaEnviada = {
    data: dataFormatada,
    numero_conta_origem,
    numero_conta_destino,
    valor,
  };

  transferencias.push(infoTransferenciaEnviada);
  return res.status(204).send();
};
const saldo = (req, res) => {
  const { numero_conta, senha } = req.query;
  if (!numero_conta) return res.status(400).json({ mensgem: "Número de conta não informado" });
  if (!senha) return res.status(400).json({ mensagem: "Senha não informada" });

  const conta = contas.find((elemento) => elemento.numero === Number(numero_conta));
  if (!conta) return res.status(404).json({ mensagem: "Conta bancária não encontrada!" });
  if (conta.senha !== senha) return res.status(401).json({ mensagem: "Senha inválida" });
  res.status(200).json({ Saldo: `${conta.saldo}` });
};
const extrato = (req, res) => {
  const { numero_conta, senha } = req.query;
  if (!numero_conta) return res.status(400).json({ mensagem: "Número de conta não informado" });
  if (!senha) return res.status(400).json({ mensgem: "Senha não  informada" });

  const conta = contas.find((elemento) => elemento.numero === Number(numero_conta));
  if (!conta) return res.status(404).json({ mensagem: "Conta bancária não encontrada!" });
  if (conta.senha !== senha) return res.status(401).json({ mensagem: "Senha inválida" });

  const depositosExtrato = [];
  const saquesExtrato = [];
  const transferenciasEnviada = [];
  const transferenciasRecebidas = [];

  depositos.forEach((elemento) => {
    if (elemento.numero_conta === Number(numero_conta)) {
      depositosExtrato.push(elemento);
    }
  });
  transferencias.forEach((elemento) => {
    if (elemento.numero_conta_origem === Number(numero_conta)) {
      transferenciasEnviada.push(elemento);
    }
  });
  transferencias.forEach((elemento) => {
    if (elemento.numero_conta_destino === Number(numero_conta)) {
      transferenciasRecebidas.push(elemento);
    }
  });
  saques.forEach((elemento) => {
    if (elemento.numero_conta === Number(numero_conta)) {
      return saquesExtrato.push(elemento);
    }
  });
  const infoExtrato = {
    depositos: depositosExtrato,
    saques: saquesExtrato,
    transferenciasEnviada,
    transferenciasRecebidas,
  };
  return res.status(200).json(infoExtrato);
};

module.exports = {
  cadastrarConta,
  listarContas,
  atualizarConta,
  deletarConta,
  depositar,
  sacar,
  transferencia,
  extrato,
  saldo,
};
