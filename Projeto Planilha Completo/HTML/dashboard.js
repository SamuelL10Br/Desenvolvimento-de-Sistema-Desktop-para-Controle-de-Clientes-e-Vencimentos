document.addEventListener("DOMContentLoaded", async () => {
  const btnEditarVencimento = document.getElementById("btn-editar-vencimento");
  const btnConfirmarVencimento = document.getElementById("btn-confirmar-vencimento");
  const btnCancelarVencimento = document.getElementById("btn-cancelar-vencimento");
  const modal = document.getElementById("modal-vencimento");
  const inputVencimentoDashboard = document.getElementById("input-vencimento-dashboard");
  const campoCardVencimento = document.getElementById("vencimento");

  function limparCPF(cpf) {
    return String(cpf || "").replace(/\D/g, "").slice(0, 11);
  }

  function formatarCPF(cpf) {
    const numeros = limparCPF(cpf);

    if (!numeros) return "";

    return numeros
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  function normalizarTexto(valor) {
    return String(valor || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function ordenarClientesPorNome(lista) {
    return [...lista].sort((a, b) =>
      String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", {
        sensitivity: "base"
      })
    );
  }

  function converterDataParaInput(data) {
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

  function formatarDataParaExibicao(data) {
    const dataConvertida = converterDataParaInput(data);

    if (!dataConvertida) return "-";

    const [ano, mes, dia] = dataConvertida.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function criarDataLocal(data) {
    const dataConvertida = converterDataParaInput(data);

    if (!dataConvertida) return null;

    const dataLocal = new Date(`${dataConvertida}T00:00:00`);
    return Number.isNaN(dataLocal.getTime()) ? null : dataLocal;
  }

  function obterStatusAutomatico(vencimento, ultimoPagamento = "") {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataVencimento = criarDataLocal(vencimento);
    const dataPagamento = criarDataLocal(ultimoPagamento);

    if (!dataVencimento) {
      return "Pendente";
    }

    if (dataPagamento && dataPagamento.getTime() >= dataVencimento.getTime()) {
      return "Pago";
    }

    if (hoje.getTime() > dataVencimento.getTime()) {
      return "Atrasado";
    }

    return "Pendente";
  }

  function obterDiasResumo(cliente) {
    const ativo = normalizarTexto(cliente.ativo);
    if (ativo === "inativo") return "-";

    const status = obterStatusAutomatico(cliente.vencimento, cliente.ultimoPagamento);

    if (status === "Pago") {
      return "Pago";
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vencimento = criarDataLocal(cliente.vencimento);
    if (!vencimento) return "-";

    const diferenca = vencimento.getTime() - hoje.getTime();
    const dias = Math.abs(Math.floor(diferenca / (1000 * 60 * 60 * 24)));

    if (status === "Atrasado") {
      return `${dias} em atraso`;
    }

    return `${dias} para vencer`;
  }

  function abrirModal() {
    document.body.classList.add("modal-aberto");
    modal.classList.remove("hidden");
  }

  function fecharModal() {
    document.body.classList.remove("modal-aberto");
    modal.classList.add("hidden");
    inputVencimentoDashboard.value = "";
  }

  async function carregarValorDoBloco() {
    try {
      const valorSalvo = await obterProximoVencimentoDashboard();

      campoCardVencimento.textContent = valorSalvo
        ? formatarDataParaExibicao(valorSalvo)
        : "-";
    } catch (erro) {
      console.error("Erro ao carregar o bloco de próximo vencimento:", erro);
      campoCardVencimento.textContent = "-";
    }
  }

  async function abrirModalEdicaoVencimento() {
    try {
      const valorSalvo = await obterProximoVencimentoDashboard();
      inputVencimentoDashboard.value = converterDataParaInput(valorSalvo);
      abrirModal();
    } catch (erro) {
      console.error("Erro ao abrir modal do bloco:", erro);
      window.uiFeedback?.error?.("Erro ao abrir edição do bloco.");
    }
  }

  async function salvarEdicaoDoBloco() {
    try {
      const novaData = inputVencimentoDashboard.value;

      if (!novaData) {
        window.uiFeedback?.error?.("Informe uma data válida.");
        return;
      }

      await salvarProximoVencimentoDashboard(novaData);
      await carregarValorDoBloco();
      fecharModal();

      window.uiFeedback?.success?.("Próximo vencimento atualizado com sucesso.");
    } catch (erro) {
      console.error("Erro ao salvar o bloco de próximo vencimento:", erro);
      window.uiFeedback?.error?.("Erro ao salvar o próximo vencimento.");
    }
  }

  function atualizarCards(clientes) {
    const total = clientes.length;

    const ativos = clientes.filter(
      (cliente) => normalizarTexto(cliente.ativo) === "ativo"
    ).length;

    const inativos = clientes.filter(
      (cliente) => normalizarTexto(cliente.ativo) === "inativo"
    ).length;

    const adimplentes = clientes.filter((cliente) => {
      return obterStatusAutomatico(cliente.vencimento, cliente.ultimoPagamento) === "Pago";
    }).length;

    const inadimplentes = clientes.filter((cliente) => {
      const status = obterStatusAutomatico(cliente.vencimento, cliente.ultimoPagamento);
      return status === "Pendente" || status === "Atrasado";
    }).length;

    document.getElementById("totalClientes").textContent = total;
    document.getElementById("ativos").textContent = ativos;
    document.getElementById("inativos").textContent = inativos;
    document.getElementById("adimplentes").textContent = adimplentes;
    document.getElementById("inadimplentes").textContent = inadimplentes;
  }

  function renderizarTabelaDashboard(clientes) {
    const tabelaBody = document.getElementById("tabela-body");
    if (!tabelaBody) return;

    tabelaBody.innerHTML = "";

    if (!clientes.length) {
      tabelaBody.innerHTML = `
        <tr>
          <td colspan="6">Nenhum cliente cadastrado.</td>
        </tr>
      `;
      return;
    }

    clientes.forEach((cliente) => {
      const tr = document.createElement("tr");
      const statusCalculado = obterStatusAutomatico(cliente.vencimento, cliente.ultimoPagamento);

      tr.innerHTML = `
        <td>
          <input
            type="radio"
            name="clienteDashboardSelecionado"
            value="${limparCPF(cliente.cpf || "")}"
          >
        </td>
        <td>${cliente.nome || ""}</td>
        <td>${formatarCPF(cliente.cpf || "")}</td>
        <td>${formatarDataParaExibicao(cliente.vencimento)}</td>
        <td>${statusCalculado}</td>
        <td>${obterDiasResumo(cliente)}</td>
      `;

      tabelaBody.appendChild(tr);
    });
  }

  async function renderizarDashboard() {
    try {
      const clientes = await obterClientes();
      const clientesOrdenados = ordenarClientesPorNome(clientes);

      atualizarCards(clientesOrdenados);
      renderizarTabelaDashboard(clientesOrdenados);
      await carregarValorDoBloco();
    } catch (erro) {
      console.error("Erro ao renderizar dashboard:", erro);
      window.uiFeedback?.error?.("Erro ao carregar dashboard.");
    }
  }

  btnEditarVencimento?.addEventListener("click", abrirModalEdicaoVencimento);
  btnConfirmarVencimento?.addEventListener("click", salvarEdicaoDoBloco);
  btnCancelarVencimento?.addEventListener("click", fecharModal);

  await renderizarDashboard();
});