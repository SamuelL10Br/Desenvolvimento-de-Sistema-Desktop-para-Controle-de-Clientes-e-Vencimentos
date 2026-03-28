document.addEventListener("DOMContentLoaded", async () => {
  const btnEditar = document.getElementById("btn-editar");
  const modal = document.getElementById("modal-editar");
  const btnConfirmar = document.getElementById("btn-confirmar");
  const btnCancelar = document.getElementById("btn-cancelar");

  const inputNome = document.getElementById("edit-nome");
  const inputCpf = document.getElementById("edit-cpf");
  const inputVencimento = document.getElementById("edit-vencimento");
  const inputStatus = document.getElementById("edit-status");

  let cpfOriginal = null;

  async function abrirModalEdicao() {
    const radioSelecionado = document.querySelector('input[name="selecionado"]:checked');

    if (!radioSelecionado) {
      alert("Selecione um cliente para editar.");
      return;
    }

    const cpfSelecionado = radioSelecionado.value;
    const clientes = await obterClientes();
    const cliente = clientes.find((item) => item.cpf === cpfSelecionado);

    if (!cliente) {
      alert("Cliente não encontrado.");
      return;
    }

    cpfOriginal = cliente.cpf;
    inputNome.value = cliente.nome || "";
    inputCpf.value = cliente.cpf || "";
    inputVencimento.value = converterDataParaInput(cliente.vencimento);
    inputStatus.value = cliente.statusPagamento || "Pendente";

    modal.classList.remove("hidden");
  }

  function fecharModal() {
    modal.classList.add("hidden");
    cpfOriginal = null;
  }

  async function salvarEdicao() {
    if (!cpfOriginal) return;

    const nome = inputNome.value.trim();
    const cpf = inputCpf.value.trim();
    const vencimento = inputVencimento.value;
    const status = inputStatus.value;

    if (!nome || !cpf || !vencimento || !status) {
      alert("Preencha todos os campos.");
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
      nome: nome,
      cpf: cpf,
      vencimento: vencimento,
      statusPagamento: status
    };

    await excluirCliente(cpfOriginal);
    await adicionarClientes([clienteAtualizado]);

    await renderizarDashboard();
    fecharModal();
  }

  btnEditar.addEventListener("click", abrirModalEdicao);
  btnCancelar.addEventListener("click", fecharModal);
  btnConfirmar.addEventListener("click", salvarEdicao);

  await renderizarDashboard();
});

async function renderizarDashboard() {
  const clientes = await obterClientes();

  atualizarCards(clientes);
  renderizarTabelaDashboard(clientes);
}

function atualizarCards(clientes) {
  const total = clientes.length;
  const ativos = clientes.filter(
    (cliente) => String(cliente.ativo || "").trim().toLowerCase() === "ativo"
  ).length;

  const inativos = clientes.filter(
    (cliente) => String(cliente.ativo || "").trim().toLowerCase() === "inativo"
  ).length;

  const adimplentes = clientes.filter(
    (cliente) => String(cliente.statusPagamento || "").trim().toLowerCase() === "pago"
  ).length;

  const inadimplentes = clientes.filter(
    (cliente) => String(cliente.statusPagamento || "").trim().toLowerCase() !== "pago"
  ).length;

  document.getElementById("totalClientes").textContent = total;
  document.getElementById("ativos").textContent = ativos;
  document.getElementById("inativos").textContent = inativos;
  document.getElementById("adimplentes").textContent = adimplentes;
  document.getElementById("inadimplentes").textContent = inadimplentes;
  document.getElementById("vencimento").textContent = obterProximoVencimento(clientes);
}

function renderizarTabelaDashboard(clientes) {
  const tabelaBody = document.getElementById("tabela-body");

  if (!tabelaBody) return;

  tabelaBody.innerHTML = "";

  clientes.forEach((cliente) => {
    const tr = document.createElement("tr");
    const diasParaVencer = calcularDiasParaVencer(cliente.vencimento);

    tr.innerHTML = `
      <td>
        <input
          type="radio"
          name="selecionado"
          value="${cliente.cpf}"
        >
      </td>
      <td>${cliente.nome || ""}</td>
      <td>${cliente.cpf || ""}</td>
      <td>${formatarDataParaExibicao(cliente.vencimento)}</td>
      <td>${cliente.statusPagamento || ""}</td>
      <td>${diasParaVencer}</td>
    `;

    tabelaBody.appendChild(tr);
  });
}

function calcularDiasParaVencer(dataISO) {
  if (!dataISO) return "-";

  const hoje = new Date();
  const vencimento = new Date(dataISO + "T00:00:00");

  hoje.setHours(0, 0, 0, 0);

  const diferenca = vencimento - hoje;
  return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
}

function obterProximoVencimento(clientes) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const clientesComVencimento = clientes
    .filter((cliente) => cliente.vencimento)
    .filter((cliente) => {
      const data = new Date(cliente.vencimento + "T00:00:00");
      return !Number.isNaN(data.getTime());
    })
    .sort(
      (a, b) =>
        new Date(a.vencimento + "T00:00:00") -
        new Date(b.vencimento + "T00:00:00")
    );

  if (clientesComVencimento.length === 0) {
    return "-";
  }

  return formatarDataParaExibicao(clientesComVencimento[0].vencimento);
}

function formatarDataParaExibicao(dataISO) {
  if (!dataISO) return "-";

  const partes = dataISO.split("-");
  if (partes.length !== 3) return dataISO;

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

  return data;
}