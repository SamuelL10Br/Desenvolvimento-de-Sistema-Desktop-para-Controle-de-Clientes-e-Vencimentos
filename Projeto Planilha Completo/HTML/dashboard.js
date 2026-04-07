document.addEventListener("DOMContentLoaded", async () => {
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

  function calcularDiasParaVencer(data) {
    const dataConvertida = converterDataParaInput(data);

    if (!dataConvertida) return "-";

    const hoje = new Date();
    const vencimento = new Date(`${dataConvertida}T00:00:00`);

    if (Number.isNaN(vencimento.getTime())) return "-";

    hoje.setHours(0, 0, 0, 0);

    const diferenca = vencimento - hoje;
    return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
  }

  function obterProximoVencimento(clientes) {
    const clientesComVencimento = clientes
      .filter((cliente) => converterDataParaInput(cliente.vencimento))
      .sort((a, b) => {
        const dataA = new Date(`${converterDataParaInput(a.vencimento)}T00:00:00`);
        const dataB = new Date(`${converterDataParaInput(b.vencimento)}T00:00:00`);
        return dataA - dataB;
      });

    if (clientesComVencimento.length === 0) {
      return "-";
    }

    return formatarDataParaExibicao(clientesComVencimento[0].vencimento);
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
      const status = normalizarTexto(cliente.statusPagamento);
      return status === "pago" || status === "em dia";
    }).length;

    const inadimplentes = clientes.filter((cliente) => {
      const status = normalizarTexto(cliente.statusPagamento);
      return status === "pendente" || status === "atrasado";
    }).length;

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

      tr.innerHTML = `
        <td>${cliente.nome || ""}</td>
        <td>${formatarCPF(cliente.cpf || "")}</td>
        <td>${formatarDataParaExibicao(cliente.vencimento)}</td>
        <td>${cliente.statusPagamento || "-"}</td>
        <td>${calcularDiasParaVencer(cliente.vencimento)}</td>
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
    } catch (erro) {
      console.error("Erro ao renderizar dashboard:", erro);
    }
  }

  await renderizarDashboard();
});
