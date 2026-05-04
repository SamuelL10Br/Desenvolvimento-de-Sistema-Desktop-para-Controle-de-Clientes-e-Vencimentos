let clientesCacheDashboard = [];

function limparCPF(cpf) {
  return String(cpf || "").replace(/\D/g, "").slice(0, 11);
}

function formatarCPF(cpf) {
  const n = limparCPF(cpf);

  if (n.length !== 11) {
    return n;
  }

  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9, 11)}`;
}

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function converterDataParaInput(data) {
  if (!data) return "";

  const texto = String(data).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return texto;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    const partes = texto.split("/");
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }

  return "";
}

function formatarData(data) {
  const d = converterDataParaInput(data);

  if (!d) return "-";

  return `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
}

function formatarInicio(inicio) {
  if (!inicio) return "-";

  const texto = String(inicio).trim();

  if (/^\d{4}-\d{2}$/.test(texto)) {
    return `${texto.slice(5, 7)}/${texto.slice(0, 4)}`;
  }

  if (/^\d{2}\/\d{4}$/.test(texto)) {
    return texto;
  }

  return "-";
}

function criarDataLocal(data) {
  const d = converterDataParaInput(data);

  if (!d) return null;

  const dataLocal = new Date(d + "T00:00:00");

  if (Number.isNaN(dataLocal.getTime())) {
    return null;
  }

  return dataLocal;
}

function obterStatusAutomatico(cliente) {
  const statusManual = String(cliente.statusPagamento || "").trim();

  if (statusManual === "Pago") {
    return "Pago";
  }

  const vencimento = criarDataLocal(cliente.vencimento);
  const ultimoPagamento = criarDataLocal(cliente.ultimoPagamento);

  if (!vencimento) {
    return "Pendente";
  }

  if (ultimoPagamento) {
    if (ultimoPagamento.getTime() >= vencimento.getTime()) {
      return "Pago";
    }

    const diasEntrePagamentoEVencimento = Math.floor(
      (vencimento.getTime() - ultimoPagamento.getTime()) / 86400000
    );

    if (diasEntrePagamentoEVencimento > 31) {
      return "Atrasado";
    }

    return "Pendente";
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (hoje.getTime() > vencimento.getTime()) {
    return "Atrasado";
  }

  return "Pendente";
}

function exibirDias(cliente) {
  const status = obterStatusAutomatico(cliente);
  const vencimento = criarDataLocal(cliente.vencimento);
  const ultimoPagamento = criarDataLocal(cliente.ultimoPagamento);

  if (status === "Pago") {
    return "Pago";
  }

  if (!vencimento) {
    return "-";
  }

  if (ultimoPagamento && ultimoPagamento.getTime() < vencimento.getTime()) {
    const diasEntrePagamentoEVencimento = Math.floor(
      (vencimento.getTime() - ultimoPagamento.getTime()) / 86400000
    );

    if (diasEntrePagamentoEVencimento > 31) {
      return `${diasEntrePagamentoEVencimento} dias em atraso`;
    }

    return `${diasEntrePagamentoEVencimento} dias`;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diasPeloVencimento = Math.floor(
    (vencimento.getTime() - hoje.getTime()) / 86400000
  );

  if (status === "Atrasado") {
    return `${Math.abs(diasPeloVencimento)} dias em atraso`;
  }

  return `${diasPeloVencimento} dias`;
}

function ordenarClientesPorNome(clientes) {
  return clientes.slice().sort(function (a, b) {
    return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
  });
}

function atualizarCards(clientes) {
  const total = clientes.length;

  const ativos = clientes.filter(function (cliente) {
    return normalizarTexto(cliente.ativo) === "ativo";
  }).length;

  const inativos = clientes.filter(function (cliente) {
    return normalizarTexto(cliente.ativo) === "inativo";
  }).length;

  const adimplentes = clientes.filter(function (cliente) {
    return obterStatusAutomatico(cliente) === "Pago";
  }).length;

  const inadimplentes = clientes.filter(function (cliente) {
    const status = obterStatusAutomatico(cliente);
    return status === "Pendente" || status === "Atrasado";
  }).length;

  document.getElementById("totalClientes").textContent = total;
  document.getElementById("ativos").textContent = ativos;
  document.getElementById("adimplentes").textContent = adimplentes;
  document.getElementById("inadimplentes").textContent = inadimplentes;
  document.getElementById("inativos").textContent = inativos;
}

function renderizarTabelaDashboard(clientes) {
  const tabelaBody = document.getElementById("tabela-body");

  tabelaBody.innerHTML = "";

  if (clientes.length === 0) {
    tabelaBody.innerHTML = `
      <tr>
        <td colspan="6">Nenhum cliente cadastrado.</td>
      </tr>
    `;
    return;
  }

  clientes.forEach(function (cliente) {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${cliente.nome || ""}</td>
      <td>${formatarCPF(cliente.cpf || "")}</td>
      <td>${formatarInicio(cliente.inicio)}</td>
      <td>${formatarData(cliente.vencimento)}</td>
      <td>${obterStatusAutomatico(cliente)}</td>
      <td>${exibirDias(cliente)}</td>
    `;

    tabelaBody.appendChild(linha);
  });
}

function clienteCombinaComPesquisaDashboard(cliente, termo) {
  const termoTexto = normalizarTexto(termo);
  const termoCpf = limparCPF(termo);

  const nome = normalizarTexto(cliente.nome);
  const cpf = limparCPF(cliente.cpf);
  const inicio = normalizarTexto(formatarInicio(cliente.inicio));

  return (
    nome.includes(termoTexto) ||
    inicio.includes(termoTexto) ||
    (termoCpf.length > 0 && cpf.includes(termoCpf))
  );
}

function aplicarPesquisaDashboard() {
  const campo = document.getElementById("campoFiltroDashboard");

  if (!campo) {
    atualizarCards(clientesCacheDashboard);
    renderizarTabelaDashboard(clientesCacheDashboard);
    return;
  }

  const termo = campo.value.trim();

  if (!termo) {
    atualizarCards(clientesCacheDashboard);
    renderizarTabelaDashboard(clientesCacheDashboard);
    return;
  }

  const filtrados = clientesCacheDashboard.filter(function (cliente) {
    return clienteCombinaComPesquisaDashboard(cliente, termo);
  });

  atualizarCards(filtrados);
  renderizarTabelaDashboard(filtrados);
}

async function renderizarDashboard() {
  try {
    const clientes = await obterClientes();

    clientesCacheDashboard = ordenarClientesPorNome(
      Array.isArray(clientes) ? clientes : []
    );

    aplicarPesquisaDashboard();
  } catch (erro) {
    console.error("Erro ao carregar dashboard:", erro);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const campoFiltroDashboard = document.getElementById("campoFiltroDashboard");

  if (campoFiltroDashboard) {
    campoFiltroDashboard.addEventListener("input", aplicarPesquisaDashboard);
  }

  renderizarDashboard();
});