document.addEventListener("DOMContentLoaded", function () {
  const campoFiltro = document.getElementById("campoFiltro");
  const tabelaBody = document.getElementById("tabela-body");
  const checkboxes = document.querySelectorAll(".filtro-campo");
  const btnAplicarFiltro = document.getElementById("btnAplicarFiltro");
  const btnExportarExcel = document.getElementById("btnExportarExcel");
  const btnExportarJson = document.getElementById("btnExportarJson");
  const btnExportarCsv = document.getElementById("btnExportarCsv");

  let clientesCache = [];
  let clientesFiltradosAtuais = [];

  const mapaColunas = {
    nome: "Nome",
    cpf: "CPF",
    valor: "Valor",
    vencimento: "Vencimento",
    status: "Status",
    ativo: "Ativo/Inativo",
    ultimoPagamento: "Último Pagamento",
    diasAtraso: "Dias",
    telefone: "Telefone/Whatsapp",
    endereco: "Endereço",
    email: "E-mail"
  };

  function limparCPF(cpf) {
    return String(cpf || "").replace(/\D/g, "").slice(0, 11);
  }

  function limparTelefone(telefone) {
    return String(telefone || "").replace(/\D/g, "");
  }

  function formatarCPF(cpf) {
    const n = limparCPF(cpf);

    if (n.length !== 11) {
      return n;
    }

    return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9, 11)}`;
  }

  function formatarTelefone(telefone) {
    const numero = limparTelefone(telefone);

    if (numero.length === 11) {
      return `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7, 11)}`;
    }

    if (numero.length === 10) {
      return `(${numero.slice(0, 2)}) ${numero.slice(2, 6)}-${numero.slice(6, 10)}`;
    }

    return telefone || "";
  }

  function normalizarTexto(valor) {
    return String(valor || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
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

  function obterColunasSelecionadas() {
    const selecionadas = Array.from(checkboxes)
      .filter(function (checkbox) {
        return checkbox.checked;
      })
      .map(function (checkbox) {
        return checkbox.value;
      });

    if (selecionadas.length > 0) {
      return selecionadas;
    }

    return Object.keys(mapaColunas);
  }

  function clienteCombinaComPesquisa(cliente, termo) {
    const termoTexto = normalizarTexto(termo);
    const termoNumero = String(termo || "").replace(/\D/g, "");

    const nome = normalizarTexto(cliente.nome);
    const cpf = limparCPF(cliente.cpf);
    const telefone = limparTelefone(cliente.telefone);
    const email = normalizarTexto(cliente.email);

    return (
      nome.includes(termoTexto) ||
      email.includes(termoTexto) ||
      (termoNumero.length > 0 && cpf.includes(termoNumero)) ||
      (termoNumero.length > 0 && telefone.includes(termoNumero))
    );
  }

  function montarObjetoCliente(cliente) {
    return {
      nome: cliente.nome || "",
      cpf: formatarCPF(cliente.cpf),
      valor: formatarMoeda(cliente.valor),
      vencimento: formatarData(cliente.vencimento),
      status: obterStatusAutomatico(cliente),
      ativo: cliente.ativo || "Ativo",
      ultimoPagamento: formatarData(cliente.ultimoPagamento),
      diasAtraso: exibirDias(cliente),
      telefone: formatarTelefone(cliente.telefone),
      endereco: cliente.endereco || "",
      email: cliente.email || ""
    };
  }

  function aplicarFiltroColunas() {
    const colunasSelecionadas = obterColunasSelecionadas();

    document.querySelectorAll("[data-coluna]").forEach(function (celula) {
      const coluna = celula.getAttribute("data-coluna");

      if (colunasSelecionadas.includes(coluna)) {
        celula.classList.remove("coluna-oculta");
      } else {
        celula.classList.add("coluna-oculta");
      }
    });
  }

  function renderizarTabela(lista) {
    clientesFiltradosAtuais = lista.slice();

    tabelaBody.innerHTML = "";

    if (lista.length === 0) {
      tabelaBody.innerHTML = `
        <tr>
          <td colspan="11" class="mensagem-vazia">Nenhum cliente encontrado.</td>
        </tr>
      `;
      return;
    }

    lista.forEach(function (cliente) {
      const dados = montarObjetoCliente(cliente);
      const linha = document.createElement("tr");

      linha.innerHTML = `
        <td data-coluna="nome">${dados.nome}</td>
        <td data-coluna="cpf">${dados.cpf}</td>
        <td data-coluna="valor">${dados.valor}</td>
        <td data-coluna="vencimento">${dados.vencimento}</td>
        <td data-coluna="status">${dados.status}</td>
        <td data-coluna="ativo">${dados.ativo}</td>
        <td data-coluna="ultimoPagamento">${dados.ultimoPagamento}</td>
        <td data-coluna="diasAtraso">${dados.diasAtraso}</td>
        <td data-coluna="telefone">${dados.telefone}</td>
        <td data-coluna="endereco">${dados.endereco}</td>
        <td data-coluna="email">${dados.email}</td>
      `;

      tabelaBody.appendChild(linha);
    });

    aplicarFiltroColunas();
  }

  function aplicarPesquisa() {
    const termo = campoFiltro.value.trim();

    if (!termo) {
      renderizarTabela(clientesCache);
      return;
    }

    const filtrados = clientesCache.filter(function (cliente) {
      return clienteCombinaComPesquisa(cliente, termo);
    });

    renderizarTabela(filtrados);
  }

  async function carregarClientes() {
    const clientes = await obterClientes();

    clientesCache = Array.isArray(clientes) ? clientes : [];

    aplicarPesquisa();
  }

  function obterDadosExportacao() {
    const colunasSelecionadas = obterColunasSelecionadas();

    return clientesFiltradosAtuais.map(function (cliente) {
      const dadosCompletos = montarObjetoCliente(cliente);
      const dadosFiltrados = {};

      colunasSelecionadas.forEach(function (coluna) {
        dadosFiltrados[mapaColunas[coluna]] = dadosCompletos[coluna];
      });

      return dadosFiltrados;
    });
  }

  function baixarArquivo(nomeArquivo, conteudo, tipo) {
    const blob = new Blob([conteudo], { type: tipo });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  function exportarJson() {
    const dados = obterDadosExportacao();

    baixarArquivo(
      "clientes.json",
      JSON.stringify(dados, null, 2),
      "application/json;charset=utf-8"
    );
  }

  function exportarCsv() {
    const dados = obterDadosExportacao();

    if (dados.length === 0) {
      baixarArquivo(
        "clientes.csv",
        "Nenhum dado encontrado.",
        "text/csv;charset=utf-8"
      );
      return;
    }

    const colunas = Object.keys(dados[0]);

    const linhas = dados.map(function (linha) {
      return colunas
        .map(function (coluna) {
          return '"' + String(linha[coluna] || "").replace(/"/g, '""') + '"';
        })
        .join(";");
    });

    baixarArquivo(
      "clientes.csv",
      colunas.join(";") + "\n" + linhas.join("\n"),
      "text/csv;charset=utf-8"
    );
  }

  function exportarExcel() {
    exportarCsv();
  }

  campoFiltro.addEventListener("input", aplicarPesquisa);

  if (btnAplicarFiltro) {
    btnAplicarFiltro.addEventListener("click", aplicarFiltroColunas);
  }

  if (btnExportarJson) {
    btnExportarJson.addEventListener("click", exportarJson);
  }

  if (btnExportarCsv) {
    btnExportarCsv.addEventListener("click", exportarCsv);
  }

  if (btnExportarExcel) {
    btnExportarExcel.addEventListener("click", exportarExcel);
  }

  carregarClientes();
});