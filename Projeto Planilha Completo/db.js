const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

let db = null;

function conectarBanco(app) {
  return new Promise((resolve, reject) => {
    const pastaDados = app.getPath("userData");

    if (!fs.existsSync(pastaDados)) {
      fs.mkdirSync(pastaDados, { recursive: true });
    }

    const caminhoBanco = path.join(pastaDados, "clientes.db");

    db = new sqlite3.Database(caminhoBanco, (erro) => {
      if (erro) {
        reject(erro);
      } else {
        console.log("Banco conectado em:", caminhoBanco);
        resolve();
      }
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (erro) {
      if (erro) reject(erro);
      else resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (erro, rows) => {
      if (erro) reject(erro);
      else resolve(rows);
    });
  });
}

async function inicializarBanco(app) {
  await conectarBanco(app);

  await run(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      cpf TEXT UNIQUE,
      telefone TEXT,
      endereco TEXT,
      email TEXT,
      valor REAL,
      vencimento TEXT,
      statusPagamento TEXT,
      ativo TEXT,
      ultimoPagamento TEXT
    )
  `);
}

async function obterClientes() {
  return await all(`
    SELECT
      nome,
      cpf,
      telefone,
      endereco,
      email,
      valor,
      vencimento,
      statusPagamento,
      ativo,
      ultimoPagamento
    FROM clientes
  `);
}

async function adicionarClientes(clientes) {
  for (const c of clientes) {
    await run(
      `
      INSERT OR IGNORE INTO clientes
      (
        nome,
        cpf,
        telefone,
        endereco,
        email,
        valor,
        vencimento,
        statusPagamento,
        ativo,
        ultimoPagamento
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        c.nome || "",
        c.cpf || "",
        c.telefone || "",
        c.endereco || "",
        c.email || "",
        c.valor || 0,
        c.vencimento || "",
        c.statusPagamento || "Pendente",
        c.ativo || "Ativo",
        c.ultimoPagamento || ""
      ]
    );
  }

  return true;
}

async function excluirCliente(cpf) {
  await run(`DELETE FROM clientes WHERE cpf = ?`, [cpf]);
  return true;
}

async function atualizarCliente(cpf, dados) {
  await run(
    `
    UPDATE clientes
    SET
      nome = ?,
      cpf = ?,
      telefone = ?,
      endereco = ?,
      email = ?,
      valor = ?,
      vencimento = ?,
      statusPagamento = ?,
      ativo = ?,
      ultimoPagamento = ?
    WHERE cpf = ?
    `,
    [
      dados.nome || "",
      dados.cpf || "",
      dados.telefone || "",
      dados.endereco || "",
      dados.email || "",
      dados.valor || 0,
      dados.vencimento || "",
      dados.statusPagamento || "Pendente",
      dados.ativo || "Ativo",
      dados.ultimoPagamento || "",
      cpf
    ]
  );

  return true;
}

module.exports = {
  inicializarBanco,
  obterClientes,
  adicionarClientes,
  excluirCliente,
  atualizarCliente
};