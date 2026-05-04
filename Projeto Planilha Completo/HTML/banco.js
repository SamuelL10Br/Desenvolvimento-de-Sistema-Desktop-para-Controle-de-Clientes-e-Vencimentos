const CHAVE_CLIENTES = "pex_clientes";
const CHAVE_PROXIMO_VENCIMENTO_DASHBOARD = "pex_dashboard_proximo_vencimento";

let filaOperacoes = Promise.resolve();

function temApiElectron() {
  return typeof window !== "undefined" && !!window.api;
}

function enfileirarOperacao(fn) {
  filaOperacoes = filaOperacoes.then(fn, fn);
  return filaOperacoes;
}

function limparCPF(cpf) {
  return String(cpf || "").replace(/\D/g, "").slice(0, 11);
}

function limparTelefone(telefone) {
  return String(telefone || "").replace(/\D/g, "").slice(0, 11);
}

function normalizarValor(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return 0;
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  const texto = String(valor)
    .trim()
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
}

function normalizarData(data) {
  if (!data) return "";

  const texto = String(data).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return texto;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    const [dia, mes, ano] = texto.split("/");
    return `${ano}-${mes}-${dia}`;
  }

  return "";
}

function normalizarInicio(inicio) {
  if (!inicio) return "";

  const texto = String(inicio).trim();

  if (/^\d{4}-\d{2}$/.test(texto)) {
    return texto;
  }

  if (/^\d{2}\/\d{4}$/.test(texto)) {
    const [mes, ano] = texto.split("/");
    return `${ano}-${mes}`;
  }

  return "";
}

function normalizarCliente(cliente = {}) {
  return {
    nome: String(cliente.nome || "").trim(),
    cpf: limparCPF(cliente.cpf),
    telefone: limparTelefone(cliente.telefone),
    endereco: String(cliente.endereco || "").trim(),
    email: String(cliente.email || "").trim(),
    valor: normalizarValor(cliente.valor),
    inicio: normalizarInicio(cliente.inicio),
    vencimento: normalizarData(cliente.vencimento),
    statusPagamento: String(cliente.statusPagamento || "Pendente").trim(),
    ativo: String(cliente.ativo || "Ativo").trim(),
    ultimoPagamento: normalizarData(cliente.ultimoPagamento),
    diasAtrasoManual:
      cliente.diasAtrasoManual === "" ||
      cliente.diasAtrasoManual === null ||
      cliente.diasAtrasoManual === undefined
        ? ""
        : Number(cliente.diasAtrasoManual) || 0
  };
}

async function obterClientes() {
  if (temApiElectron() && typeof window.api.obterClientes === "function") {
    const clientes = await window.api.obterClientes();
    return Array.isArray(clientes) ? clientes.map(normalizarCliente) : [];
  }

  const dados = localStorage.getItem(CHAVE_CLIENTES);

  if (!dados) {
    return [];
  }

  try {
    const clientes = JSON.parse(dados);
    return Array.isArray(clientes) ? clientes.map(normalizarCliente) : [];
  } catch (erro) {
    console.error("Erro ao ler clientes do localStorage:", erro);
    return [];
  }
}

async function salvarClientesDireto(clientes) {
  if (!Array.isArray(clientes)) {
    throw new Error("A lista de clientes precisa ser um array.");
  }

  const clientesNormalizados = clientes.map((cliente) =>
    normalizarCliente(cliente)
  );

  if (temApiElectron() && typeof window.api.salvarClientes === "function") {
    await window.api.salvarClientes(clientesNormalizados);
    return true;
  }

  localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(clientesNormalizados));
  return true;
}

async function salvarClientes(clientes) {
  return enfileirarOperacao(async () => {
    return await salvarClientesDireto(clientes);
  });
}

async function adicionarClientes(novosClientes) {
  return enfileirarOperacao(async () => {
    if (!Array.isArray(novosClientes)) {
      throw new Error("Os novos clientes precisam estar em um array.");
    }

    const clientesAtuais = await obterClientes();
    const mapa = new Map();

    clientesAtuais.forEach((cliente) => {
      const clienteNormalizado = normalizarCliente(cliente);
      const cpf = limparCPF(clienteNormalizado.cpf);

      if (cpf) {
        mapa.set(cpf, clienteNormalizado);
      }
    });

    novosClientes.forEach((cliente) => {
      const clienteNormalizado = normalizarCliente(cliente);
      const cpf = limparCPF(clienteNormalizado.cpf);

      if (cpf) {
        mapa.set(cpf, clienteNormalizado);
      }
    });

    const clientesFinal = Array.from(mapa.values());
    await salvarClientesDireto(clientesFinal);
    return true;
  });
}

async function excluirCliente(cpf) {
  return enfileirarOperacao(async () => {
    const cpfLimpo = limparCPF(cpf);

    if (!cpfLimpo) {
      return false;
    }

    const clientes = await obterClientes();

    const filtrados = clientes.filter((cliente) => {
      return limparCPF(cliente.cpf) !== cpfLimpo;
    });

    await salvarClientesDireto(filtrados);
    return true;
  });
}

async function atualizarCliente(cpf, dadosAtualizados) {
  return enfileirarOperacao(async () => {
    const cpfLimpo = limparCPF(cpf);

    if (!cpfLimpo) {
      return false;
    }

    const clientes = await obterClientes();

    const atualizados = clientes.map((cliente) => {
      if (limparCPF(cliente.cpf) !== cpfLimpo) {
        return normalizarCliente(cliente);
      }

      return normalizarCliente({
        ...cliente,
        ...dadosAtualizados
      });
    });

    await salvarClientesDireto(atualizados);
    return true;
  });
}

async function obterProximoVencimentoDashboard() {
  return enfileirarOperacao(async () => {
    if (temApiElectron() && typeof window.api.storageGet === "function") {
      const valor = await window.api.storageGet(CHAVE_PROXIMO_VENCIMENTO_DASHBOARD);
      return typeof valor === "string" ? valor : "";
    }

    return localStorage.getItem(CHAVE_PROXIMO_VENCIMENTO_DASHBOARD) || "";
  });
}

async function salvarProximoVencimentoDashboard(data) {
  return enfileirarOperacao(async () => {
    const dataNormalizada = normalizarData(data);

    if (temApiElectron() && typeof window.api.storageSet === "function") {
      await window.api.storageSet(CHAVE_PROXIMO_VENCIMENTO_DASHBOARD, dataNormalizada);
      return true;
    }

    localStorage.setItem(CHAVE_PROXIMO_VENCIMENTO_DASHBOARD, dataNormalizada);
    return true;
  });
}