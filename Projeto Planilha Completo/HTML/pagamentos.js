<<<<<<< HEAD
document.addEventListener("DOMContentLoaded", async () => {
  const btnEditar = document.getElementById("btn-editar");
  const btnCancelar = document.getElementById("btn-cancelar");
  const btnConfirmar = document.getElementById("btn-confirmar");
  const pesquisa = document.getElementById("pesquisa");
  const modal = document.getElementById("modal-pagamento");

  const inputNome = document.getElementById("input-nome");
  const inputCpf = document.getElementById("input-cpf");
  const inputValor = document.getElementById("input-valor");
  const inputVencimento = document.getElementById("input-vencimento");
  const inputStatus = document.getElementById("input-status");
  const inputAtivo = document.getElementById("input-ativo");
  const inputUltimoPagamento = document.getElementById("input-ultimo-pagamento");
  const inputAtraso = document.getElementById("input-atraso");

  let cpfOriginal = null;

  async function obterPagamentoSelecionado() {
    const radioSelecionado = document.querySelector(
      'input[name="pagamentoSelecionado"]:checked'
    );

    if (!radioSelecionado) {
      return null;
    }

    const cpfSelecionado = radioSelecionado.value;
    const clientes = await obterClientes();

    return clientes.find((item) => item.cpf === cpfSelecionado) || null;
  }

  async function abrirModalEdicao() {
    const cliente = await obterPagamentoSelecionado();

    if (!cliente) {
      alert("Selecione um pagamento para editar.");
      return;
    }

    cpfOriginal = cliente.cpf;

    inputNome.value = cliente.nome || "";
    inputCpf.value = cliente.cpf || "";
    inputValor.value = formatarValorInput(cliente.valor);
    inputVencimento.value = converterDataParaInput(cliente.vencimento);
    inputStatus.value = cliente.statusPagamento || "Pendente";
    inputAtivo.value = cliente.ativo || "Ativo";
    inputUltimoPagamento.value = converterDataParaInput(cliente.ultimoPagamento);
    inputAtraso.value = calcularDiasAtraso(cliente.vencimento);

    modal.classList.remove("hidden");
  }

  function fecharModal() {
    modal.classList.add("hidden");
    cpfOriginal = null;
  }

  async function salvarEdicaoPagamento() {
    if (!cpfOriginal) return;

    const nome = inputNome.value.trim();
    const cpf = inputCpf.value.trim();
    const valor = converterValorParaNumero(inputValor.value);
    const vencimento = inputVencimento.value;
    const statusPagamento = inputStatus.value;
    const ativo = inputAtivo.value;
    const ultimoPagamento = inputUltimoPagamento.value;

    if (!nome || !cpf || valor === null || !vencimento || !statusPagamento || !ativo) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const clientes = await obterClientes();
    const clienteAtual = clientes.find((item) => item.cpf === cpfOriginal);

    if (!clienteAtual) {
      alert("Cliente não encontrado.");
      return;
    }

    const cpfDuplicado = clientes.some(
      (item) => item.cpf === cpf && item.cpf !== cpfOriginal
    );

    if (cpfDuplicado) {
      alert("Já existe outro cliente com esse CPF.");
      return;
    }

    const clienteAtualizado = {
      ...clienteAtual,
      nome,
      cpf,
      valor,
      vencimento,
      statusPagamento,
      ativo,
      ultimoPagamento
    };

    await excluirCliente(cpfOriginal);
    await adicionarClientes([clienteAtualizado]);

    await renderizarPagamentos();
    fecharModal();
  }

  btnEditar.addEventListener("click", abrirModalEdicao);
  btnCancelar.addEventListener("click", fecharModal);
  btnConfirmar.addEventListener("click", salvarEdicaoPagamento);

  inputVencimento.addEventListener("input", () => {
    inputAtraso.value = calcularDiasAtraso(inputVencimento.value);
  });

  pesquisa.addEventListener("input", async () => {
    await filtrarPagamentos();
  });

  await renderizarPagamentos();
});

async function renderizarPagamentos(lista = null) {
  const tabelaBody = document.getElementById("tabela-body");
  if (!tabelaBody) return;

  const clientes = lista || await obterClientes();

  tabelaBody.innerHTML = "";

  clientes.forEach((cliente) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <input
          type="radio"
          name="pagamentoSelecionado"
          value="${cliente.cpf}"
        >
      </td>
      <td>${cliente.nome || ""}</td>
      <td>${cliente.cpf || ""}</td>
      <td>${formatarMoeda(cliente.valor)}</td>
      <td>${formatarDataParaExibicao(cliente.vencimento)}</td>
      <td>${cliente.statusPagamento || ""}</td>
      <td>${cliente.ativo || ""}</td>
      <td>${formatarDataParaExibicao(cliente.ultimoPagamento)}</td>
      <td>${calcularDiasAtraso(cliente.vencimento)}</td>
    `;

    tabelaBody.appendChild(tr);
  });
}

async function filtrarPagamentos() {
  const inputPesquisa = document.getElementById("pesquisa");
  if (!inputPesquisa) return;

  const termo = inputPesquisa.value.toLowerCase().trim();
  const clientes = await obterClientes();

  const filtrados = clientes.filter((cliente) =>
    (cliente.nome || "").toLowerCase().includes(termo) ||
    (cliente.cpf || "").toLowerCase().includes(termo)
  );

  await renderizarPagamentos(filtrados);
}

function calcularDiasAtraso(data) {
  if (!data) return 0;

  const hoje = new Date();
  const vencimento = new Date(converterDataParaInput(data) + "T00:00:00");

  hoje.setHours(0, 0, 0, 0);

  const diferenca = hoje - vencimento;
  const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));

  return dias > 0 ? dias : 0;
}

function formatarMoeda(valor) {
  const numero = Number(valor) || 0;
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarValorInput(valor) {
  const numero = Number(valor) || 0;
  return numero.toFixed(2).replace(".", ",");
}

function converterValorParaNumero(valorTexto) {
  if (!valorTexto) return null;

  const textoLimpo = valorTexto
    .replaceAll("R$", "")
    .replaceAll(".", "")
    .replace(",", ".")
    .trim();

  const numero = Number(textoLimpo);

  return Number.isNaN(numero) ? null : numero;
}

function formatarDataParaExibicao(data) {
  if (!data) return "-";

  const dataPadrao = converterDataParaInput(data);
  if (!dataPadrao) return "-";

  const partes = dataPadrao.split("-");
  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function converterDataParaInput(data) {
  if (!data) return "";

  if (data.includes("-")) {
    return data;
  }

  if (data.includes("/")) {
    const partes = data.split("/");
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
  }

  return "";
=======
document.addEventListener("DOMContentLoaded", async () => {
  const btnEditar = document.getElementById("btn-editar");
  const btnCancelar = document.getElementById("btn-cancelar");
  const btnConfirmar = document.getElementById("btn-confirmar");
  const pesquisa = document.getElementById("pesquisa");
  const modal = document.getElementById("modal-pagamento");

  const inputNome = document.getElementById("input-nome");
  const inputCpf = document.getElementById("input-cpf");
  const inputValor = document.getElementById("input-valor");
  const inputVencimento = document.getElementById("input-vencimento");
  const inputStatus = document.getElementById("input-status");
  const inputAtivo = document.getElementById("input-ativo");
  const inputUltimoPagamento = document.getElementById("input-ultimo-pagamento");
  const inputAtraso = document.getElementById("input-atraso");

  let cpfOriginal = null;

  async function obterPagamentoSelecionado() {
    const radioSelecionado = document.querySelector(
      'input[name="pagamentoSelecionado"]:checked'
    );

    if (!radioSelecionado) {
      return null;
    }

    const cpfSelecionado = radioSelecionado.value;
    const clientes = await obterClientes();

    return clientes.find((item) => item.cpf === cpfSelecionado) || null;
  }

  async function abrirModalEdicao() {
    const cliente = await obterPagamentoSelecionado();

    if (!cliente) {
      alert("Selecione um pagamento para editar.");
      return;
    }

    cpfOriginal = cliente.cpf;

    inputNome.value = cliente.nome || "";
    inputCpf.value = cliente.cpf || "";
    inputValor.value = formatarValorInput(cliente.valor);
    inputVencimento.value = converterDataParaInput(cliente.vencimento);
    inputStatus.value = cliente.statusPagamento || "Pendente";
    inputAtivo.value = cliente.ativo || "Ativo";
    inputUltimoPagamento.value = converterDataParaInput(cliente.ultimoPagamento);
    inputAtraso.value = calcularDiasAtraso(cliente.vencimento);

    modal.classList.remove("hidden");
  }

  function fecharModal() {
    modal.classList.add("hidden");
    cpfOriginal = null;
  }

  async function salvarEdicaoPagamento() {
    if (!cpfOriginal) return;

    const nome = inputNome.value.trim();
    const cpf = inputCpf.value.trim();
    const valor = converterValorParaNumero(inputValor.value);
    const vencimento = inputVencimento.value;
    const statusPagamento = inputStatus.value;
    const ativo = inputAtivo.value;
    const ultimoPagamento = inputUltimoPagamento.value;

    if (!nome || !cpf || valor === null || !vencimento || !statusPagamento || !ativo) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const clientes = await obterClientes();
    const clienteAtual = clientes.find((item) => item.cpf === cpfOriginal);

    if (!clienteAtual) {
      alert("Cliente não encontrado.");
      return;
    }

    const cpfDuplicado = clientes.some(
      (item) => item.cpf === cpf && item.cpf !== cpfOriginal
    );

    if (cpfDuplicado) {
      alert("Já existe outro cliente com esse CPF.");
      return;
    }

    const clienteAtualizado = {
      ...clienteAtual,
      nome,
      cpf,
      valor,
      vencimento,
      statusPagamento,
      ativo,
      ultimoPagamento
    };

    await excluirCliente(cpfOriginal);
    await adicionarClientes([clienteAtualizado]);

    await renderizarPagamentos();
    fecharModal();
  }

  btnEditar.addEventListener("click", abrirModalEdicao);
  btnCancelar.addEventListener("click", fecharModal);
  btnConfirmar.addEventListener("click", salvarEdicaoPagamento);

  inputVencimento.addEventListener("input", () => {
    inputAtraso.value = calcularDiasAtraso(inputVencimento.value);
  });

  pesquisa.addEventListener("input", async () => {
    await filtrarPagamentos();
  });

  await renderizarPagamentos();
});

async function renderizarPagamentos(lista = null) {
  const tabelaBody = document.getElementById("tabela-body");
  if (!tabelaBody) return;

  const clientes = lista || await obterClientes();

  tabelaBody.innerHTML = "";

  clientes.forEach((cliente) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <input
          type="radio"
          name="pagamentoSelecionado"
          value="${cliente.cpf}"
        >
      </td>
      <td>${cliente.nome || ""}</td>
      <td>${cliente.cpf || ""}</td>
      <td>${formatarMoeda(cliente.valor)}</td>
      <td>${formatarDataParaExibicao(cliente.vencimento)}</td>
      <td>${cliente.statusPagamento || ""}</td>
      <td>${cliente.ativo || ""}</td>
      <td>${formatarDataParaExibicao(cliente.ultimoPagamento)}</td>
      <td>${calcularDiasAtraso(cliente.vencimento)}</td>
    `;

    tabelaBody.appendChild(tr);
  });
}

async function filtrarPagamentos() {
  const inputPesquisa = document.getElementById("pesquisa");
  if (!inputPesquisa) return;

  const termo = inputPesquisa.value.toLowerCase().trim();
  const clientes = await obterClientes();

  const filtrados = clientes.filter((cliente) =>
    (cliente.nome || "").toLowerCase().includes(termo) ||
    (cliente.cpf || "").toLowerCase().includes(termo)
  );

  await renderizarPagamentos(filtrados);
}

function calcularDiasAtraso(data) {
  if (!data) return 0;

  const hoje = new Date();
  const vencimento = new Date(converterDataParaInput(data) + "T00:00:00");

  hoje.setHours(0, 0, 0, 0);

  const diferenca = hoje - vencimento;
  const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));

  return dias > 0 ? dias : 0;
}

function formatarMoeda(valor) {
  const numero = Number(valor) || 0;
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarValorInput(valor) {
  const numero = Number(valor) || 0;
  return numero.toFixed(2).replace(".", ",");
}

function converterValorParaNumero(valorTexto) {
  if (!valorTexto) return null;

  const textoLimpo = valorTexto
    .replaceAll("R$", "")
    .replaceAll(".", "")
    .replace(",", ".")
    .trim();

  const numero = Number(textoLimpo);

  return Number.isNaN(numero) ? null : numero;
}

function formatarDataParaExibicao(data) {
  if (!data) return "-";

  const dataPadrao = converterDataParaInput(data);
  if (!dataPadrao) return "-";

  const partes = dataPadrao.split("-");
  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function converterDataParaInput(data) {
  if (!data) return "";

  if (data.includes("-")) {
    return data;
  }

  if (data.includes("/")) {
    const partes = data.split("/");
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
  }

  return "";
>>>>>>> 58a941ec0587124e61e141c1caab830110137ff8
}