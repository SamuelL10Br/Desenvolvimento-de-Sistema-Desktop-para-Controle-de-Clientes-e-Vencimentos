let clientesOriginais = [];
let clientesFiltrados = [];
let timeoutPesquisaImportacao = null;

document.addEventListener("DOMContentLoaded", async () => {
  const campoFiltro = document.getElementById("campoFiltro");
  const btnExportarJson = document.getElementById("btnExportarJson");
  const btnExportarCsv = document.getElementById("btnExportarCsv");
  const btnExportarExcel = document.getElementById("btnExportarExcel");

  await carregarClientes();
  aplicarFiltro();

  document.querySelectorAll(".filtro-campo").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      aplicarFiltro();
    });
  });

  campoFiltro.addEventListener("input", () => {
    clearTimeout(timeoutPesquisaImportacao);
    timeoutPesquisaImportacao = setTimeout(() => {
      aplicarFiltro();
    }, 200);
  });

  campoFiltro.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      aplicarFiltro();
    }
  });

  btnExportarJson.addEventListener("click", () => exportarDados("json"));
  btnExportarCsv.addEventListener("click", () => exportarDados("csv"));
  btnExportarExcel.addEventListener("click", () => exportarDados("xlsx"));
});

async function carregarClientes() {
  try {
    const clientes = await obterClientes();
    clientesOriginais = Array.isArray(clientes) ? clientes : [];
    clientesFiltrados = [...clientesOriginais];
    renderizarTabela(clientesFiltrados);
  } catch (erro) {
    console.error("Erro ao carregar clientes:", erro);
    window.uiFeedback.error("Erro ao carregar os dados dos clientes.");
  }
}

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

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

function limparTelefone(telefone) {
  return String(telefone || "").replace(/\D/g, "").slice(0, 11);
}

function formatarTelefone(telefone) {
  const numeros = limparTelefone(telefone);
  if (!numeros) return "";

  if (numeros.length <= 10) {
    return numeros.replace(
      /^(\d{2})(\d{4})(\d{0,4}).*/,
      (_, ddd, parte1, parte2) => parte2 ? `(${ddd}) ${parte1}-${parte2}` : `(${ddd}) ${parte1}`
    );
  }

  return numeros.replace(
    /^(\d{2})(\d{5})(\d{0,4}).*/,
    (_, ddd, parte1, parte2) => parte2 ? `(${ddd}) ${parte1}-${parte2}` : `(${ddd}) ${parte1}`
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

  if (!dataConvertida) {
    return data ? String(data) : "";
  }

  const [ano, mes, dia] = dataConvertida.split("-");
  return `${dia}/${mes}/${ano}`;
}

function obterDiaVencimento(data) {
  const dataConvertida = converterDataParaInput(data);
  if (!dataConvertida) return "";

  const [, , dia] = dataConvertida.split("-");
  return dia;
}

function converterValorParaNumero(valorTexto) {
  if (valorTexto === null || valorTexto === undefined) return null;

  const textoLimpo = String(valorTexto)
    .replaceAll("R$", "")
    .replace(/\s/g, "")
    .replaceAll(".", "")
    .replace(",", ".")
    .trim();

  if (!textoLimpo) return null;

  const numero = Number(textoLimpo);
  return Number.isNaN(numero) ? null : numero;
}

function formatarMoeda(valor) {
  const numero = converterValorParaNumero(valor);

  if (numero === null) {
    return valor ? String(valor) : "";
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function obterValorCampo(cliente, chaves) {
  for (const chave of chaves) {
    if (
      Object.prototype.hasOwnProperty.call(cliente, chave) &&
      cliente[chave] !== undefined &&
      cliente[chave] !== null &&
      String(cliente[chave]).trim() !== ""
    ) {
      return cliente[chave];
    }
  }
  return "";
}

function obterCamposSelecionados() {
  const checkboxes = document.querySelectorAll(".filtro-campo:checked");
  return Array.from(checkboxes).map((item) => item.value);
}

function aplicarVisibilidadeColunas() {
  const camposSelecionados = obterCamposSelecionados();

  document.querySelectorAll("[data-coluna]").forEach((elemento) => {
    const coluna = elemento.getAttribute("data-coluna");

    if (camposSelecionados.includes(coluna)) {
      elemento.classList.remove("coluna-oculta");
    } else {
      elemento.classList.add("coluna-oculta");
    }
  });
}

function aplicarFiltro() {
  const campoTexto = document.getElementById("campoFiltro");
  const termoOriginal = campoTexto.value.trim();
  const termoTexto = normalizarTexto(termoOriginal);
  const termoCpf = limparCPF(termoOriginal);
  const camposSelecionados = obterCamposSelecionados();

  if (!camposSelecionados.length) {
    clientesFiltrados = [];
    renderizarTabela(clientesFiltrados);
    aplicarVisibilidadeColunas();
    return;
  }

  if (!termoOriginal) {
    clientesFiltrados = [...clientesOriginais];
    renderizarTabela(clientesFiltrados);
    aplicarVisibilidadeColunas();
    return;
  }

  clientesFiltrados = clientesOriginais.filter((cliente) => {
    const dadosCliente = {
      nome: normalizarTexto(obterValorCampo(cliente, ["nome"])),
      cpf: limparCPF(obterValorCampo(cliente, ["cpf"])),
      email: normalizarTexto(obterValorCampo(cliente, ["email"])),
      telefone: normalizarTexto(obterValorCampo(cliente, ["telefone", "telefoneWhatsapp"])),
      endereco: normalizarTexto(obterValorCampo(cliente, ["endereco"])),
      valor: normalizarTexto(formatarMoeda(obterValorCampo(cliente, ["valor"]))),
      vencimento: normalizarTexto(formatarDataParaExibicao(obterValorCampo(cliente, ["vencimento"]))),
      diaVenc: normalizarTexto(obterDiaVencimento(obterValorCampo(cliente, ["vencimento"]))),
      status: normalizarTexto(obterValorCampo(cliente, ["statusPagamento", "status"])),
      ativo: normalizarTexto(obterValorCampo(cliente, ["ativo", "situacao"])),
      ultimoPagamento: normalizarTexto(
        formatarDataParaExibicao(obterValorCampo(cliente, ["ultimoPagamento", "ultimo_pagamento"]))
      )
    };

    return camposSelecionados.some((campo) => {
      if (campo === "cpf") {
        return termoCpf ? dadosCliente.cpf.includes(termoCpf) : false;
      }

      return termoTexto
        ? String(dadosCliente[campo] || "").includes(termoTexto)
        : false;
    });
  });

  renderizarTabela(clientesFiltrados);
  aplicarVisibilidadeColunas();
}

function renderizarTabela(clientes) {
  const corpoTabela = document.getElementById("corpoTabelaClientes");
  corpoTabela.innerHTML = "";

  if (!clientes.length) {
    corpoTabela.innerHTML = `
      <tr>
        <td colspan="11" class="mensagem-vazia">Nenhum cliente encontrado.</td>
      </tr>
    `;
    return;
  }

  const clientesOrdenados = [...clientes].sort((a, b) =>
    String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", {
      sensitivity: "base"
    })
  );

  clientesOrdenados.forEach((cliente) => {
    const nome = obterValorCampo(cliente, ["nome"]);
    const cpf = obterValorCampo(cliente, ["cpf"]);
    const email = obterValorCampo(cliente, ["email"]);
    const telefone = obterValorCampo(cliente, ["telefone", "telefoneWhatsapp"]);
    const endereco = obterValorCampo(cliente, ["endereco"]);
    const valor = obterValorCampo(cliente, ["valor"]);
    const vencimento = obterValorCampo(cliente, ["vencimento"]);
    const status = obterValorCampo(cliente, ["statusPagamento", "status"]);
    const ativo = obterValorCampo(cliente, ["ativo", "situacao"]);
    const ultimoPagamento = obterValorCampo(cliente, ["ultimoPagamento", "ultimo_pagamento"]);

    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-coluna="nome">${nome || ""}</td>
      <td data-coluna="cpf">${formatarCPF(cpf || "")}</td>
      <td data-coluna="email">${email || ""}</td>
      <td data-coluna="telefone">${formatarTelefone(telefone || "")}</td>
      <td data-coluna="endereco">${endereco || ""}</td>
      <td data-coluna="valor">${formatarMoeda(valor || "")}</td>
      <td data-coluna="vencimento">${formatarDataParaExibicao(vencimento || "")}</td>
      <td data-coluna="diaVenc">${obterDiaVencimento(vencimento || "")}</td>
      <td data-coluna="status">${status || ""}</td>
      <td data-coluna="ativo">${ativo || ""}</td>
      <td data-coluna="ultimoPagamento">${formatarDataParaExibicao(ultimoPagamento || "")}</td>
    `;

    corpoTabela.appendChild(linha);
  });
}

function prepararDadosExportacao(clientes) {
  const camposSelecionados = obterCamposSelecionados();

  return clientes.map((cliente) => {
    const registro = {
      nome: obterValorCampo(cliente, ["nome"]) || "",
      cpf: formatarCPF(obterValorCampo(cliente, ["cpf"]) || ""),
      email: obterValorCampo(cliente, ["email"]) || "",
      telefone: formatarTelefone(obterValorCampo(cliente, ["telefone", "telefoneWhatsapp"]) || ""),
      endereco: obterValorCampo(cliente, ["endereco"]) || "",
      valor: formatarMoeda(obterValorCampo(cliente, ["valor"]) || ""),
      vencimento: formatarDataParaExibicao(obterValorCampo(cliente, ["vencimento"]) || ""),
      diaVenc: obterDiaVencimento(obterValorCampo(cliente, ["vencimento"]) || ""),
      status: obterValorCampo(cliente, ["statusPagamento", "status"]) || "",
      ativo: obterValorCampo(cliente, ["ativo", "situacao"]) || "",
      ultimoPagamento: formatarDataParaExibicao(
        obterValorCampo(cliente, ["ultimoPagamento", "ultimo_pagamento"]) || ""
      )
    };

    const resultado = {};

    camposSelecionados.forEach((campo) => {
      resultado[campo] = registro[campo];
    });

    return resultado;
  });
}

function obterRotulosCampos() {
  return {
    nome: "Nome",
    cpf: "CPF",
    email: "E-mail",
    telefone: "Telefone/Whatsapp",
    endereco: "Endereço",
    valor: "Valor",
    vencimento: "Vencimento",
    diaVenc: "Dia/Venc",
    status: "Status",
    ativo: "Ativo/Inativo",
    ultimoPagamento: "Último Pagamento"
  };
}

function exportarDados(tipo) {
  const camposSelecionados = obterCamposSelecionados();

  if (!camposSelecionados.length) {
    window.uiFeedback.error("Selecione pelo menos um campo para exportar.");
    return;
  }

  if (!clientesFiltrados.length) {
    window.uiFeedback.error("Nenhum cliente para exportar.");
    return;
  }

  if (tipo === "json") {
    exportarJSON(clientesFiltrados);
    return;
  }

  if (tipo === "csv") {
    exportarCSV(clientesFiltrados);
    return;
  }

  if (tipo === "xlsx") {
    exportarExcel(clientesFiltrados);
  }
}

function exportarJSON(clientes) {
  const dados = prepararDadosExportacao(clientes);
  const blob = new Blob([JSON.stringify(dados, null, 2)], {
    type: "application/json"
  });
  baixarArquivo(blob, "clientes.json");
  window.uiFeedback.success("Arquivo JSON exportado com sucesso.");
}

function exportarCSV(clientes) {
  const dados = prepararDadosExportacao(clientes);
  const camposSelecionados = obterCamposSelecionados();
  const rotulos = obterRotulosCampos();

  const cabecalho = camposSelecionados.map((campo) => rotulos[campo]);

  const linhas = dados.map((registro) =>
    camposSelecionados.map((campo) => registro[campo] || "")
  );

  const csv = [
    cabecalho.join(";"),
    ...linhas.map((linha) =>
      linha.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(";")
    )
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;"
  });

  baixarArquivo(blob, "clientes.csv");
  window.uiFeedback.success("Arquivo CSV exportado com sucesso.");
}

function exportarExcel(clientes) {
  const dados = prepararDadosExportacao(clientes);
  const camposSelecionados = obterCamposSelecionados();
  const rotulos = obterRotulosCampos();

  const dadosFormatados = dados.map((registro) => {
    const linha = {};

    camposSelecionados.forEach((campo) => {
      linha[rotulos[campo]] = registro[campo] || "";
    });

    return linha;
  });

  const planilha = XLSX.utils.json_to_sheet(dadosFormatados);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, planilha, "Clientes");
  XLSX.writeFile(workbook, "clientes.xlsx");
  window.uiFeedback.success("Arquivo Excel exportado com sucesso.");
}

function baixarArquivo(blob, nome) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = nome;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
