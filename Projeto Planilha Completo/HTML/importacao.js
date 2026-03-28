<<<<<<< HEAD
document.addEventListener("DOMContentLoaded", async () => {
  const btnImportar = document.getElementById("btnImportar");
  const inputImportar = document.getElementById("inputImportar");
  const btnExportar = document.getElementById("btnExportar");
  const exportarBox = document.getElementById("exportarBox");
  const btnExportarJson = document.getElementById("btnExportarJson");
  const btnExportarCsv = document.getElementById("btnExportarCsv");
  const btnExportarExcel = document.getElementById("btnExportarExcel");
  const btnAbrirFiltro = document.getElementById("btnAbrirFiltro");
  const filtroBox = document.getElementById("filtroBox");
  const btnAplicarFiltro = document.getElementById("btnAplicarFiltro");
  const pesquisaCliente = document.getElementById("pesquisaCliente");

  if (btnImportar && inputImportar) {
    btnImportar.addEventListener("click", () => inputImportar.click());
    inputImportar.addEventListener("change", importarArquivo);
  }

  if (btnExportar && exportarBox) {
    btnExportar.addEventListener("click", () => {
      const visivel = exportarBox.classList.contains("mostrar-exportar");

      if (visivel) {
        exportarBox.classList.remove("mostrar-exportar");
        exportarBox.style.display = "none";
      } else {
        exportarBox.classList.add("mostrar-exportar");
        exportarBox.style.display = "block";
      }
    });
  }

  if (btnExportarJson) {
    btnExportarJson.addEventListener("click", async () => {
      await exportarDados("json");
    });
  }

  if (btnExportarCsv) {
    btnExportarCsv.addEventListener("click", async () => {
      await exportarDados("csv");
    });
  }

  if (btnExportarExcel) {
    btnExportarExcel.addEventListener("click", async () => {
      await exportarDados("xlsx");
    });
  }

  if (pesquisaCliente) {
    pesquisaCliente.addEventListener("input", async () => {
      await aplicarPesquisa();
    });
  }

  if (btnAbrirFiltro && filtroBox) {
    btnAbrirFiltro.addEventListener("click", () => {
      const visivel = filtroBox.classList.contains("mostrar-filtro");

      if (visivel) {
        filtroBox.classList.remove("mostrar-filtro");
        filtroBox.style.display = "none";
      } else {
        filtroBox.classList.add("mostrar-filtro");
        filtroBox.style.display = "block";
      }
    });
  }

  if (btnAplicarFiltro) {
    btnAplicarFiltro.addEventListener("click", async () => {
      await aplicarPesquisa();
      aplicarFiltroColunas();

      if (filtroBox) {
        filtroBox.classList.remove("mostrar-filtro");
        filtroBox.style.display = "none";
      }
    });
  }

  document.querySelectorAll(".filtro-coluna").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      aplicarFiltroColunas();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (filtroBox) {
        filtroBox.classList.remove("mostrar-filtro");
        filtroBox.style.display = "none";
      }

      if (exportarBox) {
        exportarBox.classList.remove("mostrar-exportar");
        exportarBox.style.display = "none";
      }
    }
  });

  document.addEventListener("click", (event) => {
    if (filtroBox && btnAbrirFiltro) {
      const clicouNoBotaoFiltro = btnAbrirFiltro.contains(event.target);
      const clicouNaCaixaFiltro = filtroBox.contains(event.target);

      if (!clicouNoBotaoFiltro && !clicouNaCaixaFiltro) {
        filtroBox.classList.remove("mostrar-filtro");
        filtroBox.style.display = "none";
      }
    }

    if (exportarBox && btnExportar) {
      const clicouNoBotaoExportar = btnExportar.contains(event.target);
      const clicouNaCaixaExportar = exportarBox.contains(event.target);

      if (!clicouNoBotaoExportar && !clicouNaCaixaExportar) {
        exportarBox.classList.remove("mostrar-exportar");
        exportarBox.style.display = "none";
      }
    }
  });

  await renderizarTabela();
  aplicarFiltroColunas();
});

async function importarArquivo(event) {
  const arquivo = event.target.files[0];
  if (!arquivo) return;

  try {
    const extensao = obterExtensaoArquivo(arquivo.name);
    let dadosBrutos = [];

    if (extensao === "json") {
      const texto = await arquivo.text();
      const json = JSON.parse(texto);

      if (!Array.isArray(json)) {
        alert("O arquivo JSON precisa conter uma lista de registros.");
        limparInputArquivo();
        return;
      }

      dadosBrutos = json;
    } else if (extensao === "csv" || extensao === "txt") {
      const texto = await arquivo.text();
      dadosBrutos = converterTextoTabularParaObjetos(texto);
    } else if (extensao === "xls" || extensao === "xlsx") {
      dadosBrutos = await lerArquivoExcel(arquivo);
    } else {
      alert("Formato não suportado. Use JSON, CSV, TXT, XLS ou XLSX.");
      limparInputArquivo();
      return;
    }

    if (!Array.isArray(dadosBrutos) || dadosBrutos.length === 0) {
      alert("Nenhum dado válido foi encontrado no arquivo.");
      limparInputArquivo();
      return;
    }

    const clientes = dadosBrutos
      .map(normalizarClienteImportado)
      .filter((cliente) => cliente.nome || cliente.cpf);

    if (clientes.length === 0) {
      alert("Nenhum cliente válido foi encontrado no arquivo.");
      limparInputArquivo();
      return;
    }

    await adicionarClientes(clientes);

    alert("Importação realizada com sucesso!");

    await aplicarPesquisa();
    await atualizarTelas();
  } catch (erro) {
    console.error("Erro ao importar arquivo:", erro);
    alert("Erro ao importar arquivo.");
  } finally {
    limparInputArquivo();
  }
}

async function exportarDados(formato = "json") {
  const clientesFiltrados = await obterClientesFiltrados();
  const colunasMarcadas = Array.from(
    document.querySelectorAll(".filtro-coluna:checked")
  ).map((item) => item.value);

  let dadosExportacao = [];

  if (colunasMarcadas.length === 0) {
    dadosExportacao = clientesFiltrados;
  } else {
    dadosExportacao = clientesFiltrados.map((cliente) => {
      const novoCliente = {};

      colunasMarcadas.forEach((coluna) => {
        if (coluna in cliente) {
          novoCliente[coluna] = cliente[coluna];
        }
      });

      return novoCliente;
    });
  }

  if (dadosExportacao.length === 0) {
    alert("Nenhum dado para exportar.");
    return;
  }

  if (formato === "json") {
    exportarComoJson(dadosExportacao);
    return;
  }

  if (formato === "csv") {
    exportarComoCsv(dadosExportacao);
    return;
  }

  if (formato === "xlsx") {
    exportarComoExcel(dadosExportacao);
  }
}

function exportarComoJson(dados) {
  const blob = new Blob([JSON.stringify(dados, null, 2)], {
    type: "application/json"
  });

  baixarArquivo(blob, "clientesPEX_exportado.json");
}

function exportarComoCsv(dados) {
  const csv = converterObjetosParaCsv(dados);
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  baixarArquivo(blob, "clientesPEX_exportado.csv");
}

function exportarComoExcel(dados) {
  const worksheet = XLSX.utils.json_to_sheet(dados);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
  XLSX.writeFile(workbook, "clientesPEX_exportado.xlsx");
}

function baixarArquivo(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = nomeArquivo;
  link.click();

  URL.revokeObjectURL(url);
}

function converterObjetosParaCsv(dados) {
  if (!dados.length) return "";

  const cabecalhos = Object.keys(dados[0]);

  const linhas = dados.map((objeto) =>
    cabecalhos
      .map((cabecalho) => escaparValorCsv(objeto[cabecalho]))
      .join(";")
  );

  return [cabecalhos.join(";"), ...linhas].join("\n");
}

function escaparValorCsv(valor) {
  const texto = String(valor ?? "");

  if (texto.includes(";") || texto.includes('"') || texto.includes("\n")) {
    return `"${texto.replaceAll('"', '""')}"`;
  }

  return texto;
}

async function obterClientesFiltrados() {
  const termo = (document.getElementById("pesquisaCliente")?.value || "")
    .toLowerCase()
    .trim();

  const clientes = await obterClientes();

  if (!termo) {
    return clientes;
  }

  return clientes.filter((cliente) =>
    [
      cliente.nome,
      cliente.cpf,
      cliente.telefone,
      cliente.endereco,
      cliente.email,
      cliente.valor,
      cliente.vencimento,
      cliente.statusPagamento,
      cliente.ativo,
      cliente.ultimoPagamento
    ].some((valor) => String(valor ?? "").toLowerCase().includes(termo))
  );
}

async function renderizarTabela(lista = null) {
  const tabelaFinanceira = document.getElementById("corpoTabelaImportacao");
  const tabelaDados = document.getElementById("corpoTabelaDadosPessoais");

  if (!tabelaFinanceira || !tabelaDados) return;

  const clientes = lista || await obterClientes();

  tabelaFinanceira.innerHTML = "";
  tabelaDados.innerHTML = "";

  clientes.forEach((cliente) => {
    const trFinanceiro = document.createElement("tr");
    trFinanceiro.innerHTML = `
      <td>${escaparHtml(cliente.nome)}</td>
      <td>${escaparHtml(cliente.cpf)}</td>
      <td>${formatarMoeda(cliente.valor)}</td>
      <td>${formatarDataParaExibicao(cliente.vencimento)}</td>
      <td>${escaparHtml(cliente.statusPagamento)}</td>
      <td>${escaparHtml(cliente.ativo)}</td>
      <td>${formatarDataParaExibicao(cliente.ultimoPagamento)}</td>
      <td>${calcularDiasAtraso(cliente.vencimento)}</td>
    `;
    tabelaFinanceira.appendChild(trFinanceiro);

    const trDados = document.createElement("tr");
    trDados.innerHTML = `
      <td>${escaparHtml(cliente.nome)}</td>
      <td>${escaparHtml(cliente.cpf)}</td>
      <td>${escaparHtml(cliente.telefone)}</td>
      <td>${escaparHtml(cliente.endereco)}</td>
      <td>${escaparHtml(cliente.email)}</td>
    `;
    tabelaDados.appendChild(trDados);
  });
}

async function aplicarPesquisa() {
  const termo = (document.getElementById("pesquisaCliente")?.value || "")
    .toLowerCase()
    .trim();

  const clientes = await obterClientes();

  if (!termo) {
    await renderizarTabela(clientes);
    aplicarFiltroColunas();
    return;
  }

  const filtrados = clientes.filter((cliente) =>
    [
      cliente.nome,
      cliente.cpf,
      cliente.telefone,
      cliente.endereco,
      cliente.email,
      cliente.valor,
      cliente.vencimento,
      cliente.statusPagamento,
      cliente.ativo,
      cliente.ultimoPagamento
    ].some((valor) => String(valor ?? "").toLowerCase().includes(termo))
  );

  await renderizarTabela(filtrados);
  aplicarFiltroColunas();
}

function aplicarFiltroColunas() {
  const colunasMarcadas = Array.from(
    document.querySelectorAll(".filtro-coluna:checked")
  ).map((item) => item.value);

  const mapaPrimeiraTabela = {
    nome: 0,
    cpf: 1,
    valor: 2,
    vencimento: 3,
    statusPagamento: 4,
    ativo: 5,
    ultimoPagamento: 6
  };

  const mapaSegundaTabela = {
    nome: 0,
    cpf: 1,
    telefone: 2,
    endereco: 3,
    email: 4
  };

  const colunasPrimeiraMarcadas = colunasMarcadas.filter(
    (campo) => campo in mapaPrimeiraTabela
  );

  const colunasSegundaMarcadas = colunasMarcadas.filter(
    (campo) => campo in mapaSegundaTabela
  );

  aplicarVisibilidadeTabela(
    "tabelaFinanceira",
    mapaPrimeiraTabela,
    colunasPrimeiraMarcadas
  );

  aplicarVisibilidadeTabela(
    "tabelaDadosPessoais",
    mapaSegundaTabela,
    colunasSegundaMarcadas
  );
}

function aplicarVisibilidadeTabela(idTabela, mapaColunas, colunasMarcadas) {
  const tabela = document.getElementById(idTabela);
  if (!tabela) return;

  const linhas = tabela.querySelectorAll("tr");
  const mostrarTodas = colunasMarcadas.length === 0;

  linhas.forEach((linha) => {
    Array.from(linha.children).forEach((celula, indice) => {
      const campo = Object.keys(mapaColunas).find(
        (chave) => mapaColunas[chave] === indice
      );

      if (mostrarTodas || colunasMarcadas.includes(campo)) {
        celula.style.display = "";
      } else {
        celula.style.display = "none";
      }
    });
  });
}

function obterExtensaoArquivo(nomeArquivo) {
  return nomeArquivo.split(".").pop().toLowerCase();
}

function limparInputArquivo() {
  const inputImportar = document.getElementById("inputImportar");
  if (inputImportar) {
    inputImportar.value = "";
  }
}

async function atualizarTelas() {
  await renderizarTabela();
  aplicarFiltroColunas();
}

function converterTextoTabularParaObjetos(texto) {
  const linhas = texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean);

  if (linhas.length < 2) return [];

  const separador = detectarSeparador(linhas[0]);
  const cabecalhos = linhas[0]
    .split(separador)
    .map((item) => item.trim());

  return linhas.slice(1).map((linha) => {
    const valores = linha.split(separador).map((item) => item.trim());
    const objeto = {};

    cabecalhos.forEach((cabecalho, indice) => {
      objeto[cabecalho] = valores[indice] ?? "";
    });

    return objeto;
  });
}

function detectarSeparador(linha) {
  if (linha.includes(";")) return ";";
  if (linha.includes(",")) return ",";
  if (linha.includes("\t")) return "\t";
  return ";";
}

async function lerArquivoExcel(arquivo) {
  const arrayBuffer = await arquivo.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const primeiraAba = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[primeiraAba];
  return XLSX.utils.sheet_to_json(worksheet, { defval: "" });
}

function normalizarClienteImportado(item) {
  return {
    nome: obterCampo(item, ["nome", "Nome", "cliente", "Cliente"]),
    cpf: obterCampo(item, ["cpf", "CPF"]),
    telefone: obterCampo(item, ["telefone", "Telefone", "whatsapp", "Whatsapp"]),
    endereco: obterCampo(item, ["endereco", "Endereço", "logradouro"]),
    email: obterCampo(item, ["email", "Email", "e-mail", "E-mail"]),
    valor: normalizarValor(obterCampo(item, ["valor", "Valor"])),
    vencimento: normalizarData(
      obterCampo(item, ["vencimento", "Vencimento"])
    ),
    statusPagamento: obterCampo(item, ["statusPagamento", "status", "Status"]) || "Pendente",
    ativo: obterCampo(item, ["ativo", "Ativo"]) || "Ativo",
    ultimoPagamento: normalizarData(
      obterCampo(item, ["ultimoPagamento", "Último Pagamento", "ultimo_pagamento"])
    )
  };
}

function obterCampo(objeto, chaves) {
  for (const chave of chaves) {
    if (objeto[chave] !== undefined && objeto[chave] !== null) {
      return String(objeto[chave]).trim();
    }
  }
  return "";
}

function normalizarValor(valor) {
  if (valor === null || valor === undefined || valor === "") return 0;

  const texto = String(valor)
    .replaceAll("R$", "")
    .replaceAll(".", "")
    .replace(",", ".")
    .trim();

  const numero = Number(texto);
  return Number.isNaN(numero) ? 0 : numero;
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

function formatarMoeda(valor) {
  const numero = Number(valor) || 0;
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarDataParaExibicao(data) {
  if (!data) return "-";

  if (data.includes("-")) {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  return data;
}

function calcularDiasAtraso(data) {
  if (!data) return 0;

  const hoje = new Date();
  const vencimento = new Date(data + "T00:00:00");

  hoje.setHours(0, 0, 0, 0);

  const diferenca = hoje - vencimento;
  const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));

  return dias > 0 ? dias : 0;
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
=======
document.addEventListener("DOMContentLoaded", async () => {
  const btnImportar = document.getElementById("btnImportar");
  const inputImportar = document.getElementById("inputImportar");
  const btnExportar = document.getElementById("btnExportar");
  const exportarBox = document.getElementById("exportarBox");
  const btnExportarJson = document.getElementById("btnExportarJson");
  const btnExportarCsv = document.getElementById("btnExportarCsv");
  const btnExportarExcel = document.getElementById("btnExportarExcel");
  const btnAbrirFiltro = document.getElementById("btnAbrirFiltro");
  const filtroBox = document.getElementById("filtroBox");
  const btnAplicarFiltro = document.getElementById("btnAplicarFiltro");
  const pesquisaCliente = document.getElementById("pesquisaCliente");

  if (btnImportar && inputImportar) {
    btnImportar.addEventListener("click", () => inputImportar.click());
    inputImportar.addEventListener("change", importarArquivo);
  }

  if (btnExportar && exportarBox) {
    btnExportar.addEventListener("click", () => {
      const visivel = exportarBox.classList.contains("mostrar-exportar");

      if (visivel) {
        exportarBox.classList.remove("mostrar-exportar");
        exportarBox.style.display = "none";
      } else {
        exportarBox.classList.add("mostrar-exportar");
        exportarBox.style.display = "block";
      }
    });
  }

  if (btnExportarJson) {
    btnExportarJson.addEventListener("click", async () => {
      await exportarDados("json");
    });
  }

  if (btnExportarCsv) {
    btnExportarCsv.addEventListener("click", async () => {
      await exportarDados("csv");
    });
  }

  if (btnExportarExcel) {
    btnExportarExcel.addEventListener("click", async () => {
      await exportarDados("xlsx");
    });
  }

  if (pesquisaCliente) {
    pesquisaCliente.addEventListener("input", async () => {
      await aplicarPesquisa();
    });
  }

  if (btnAbrirFiltro && filtroBox) {
    btnAbrirFiltro.addEventListener("click", () => {
      const visivel = filtroBox.classList.contains("mostrar-filtro");

      if (visivel) {
        filtroBox.classList.remove("mostrar-filtro");
        filtroBox.style.display = "none";
      } else {
        filtroBox.classList.add("mostrar-filtro");
        filtroBox.style.display = "block";
      }
    });
  }

  if (btnAplicarFiltro) {
    btnAplicarFiltro.addEventListener("click", async () => {
      await aplicarPesquisa();
      aplicarFiltroColunas();

      if (filtroBox) {
        filtroBox.classList.remove("mostrar-filtro");
        filtroBox.style.display = "none";
      }
    });
  }

  document.querySelectorAll(".filtro-coluna").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      aplicarFiltroColunas();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (filtroBox) {
        filtroBox.classList.remove("mostrar-filtro");
        filtroBox.style.display = "none";
      }

      if (exportarBox) {
        exportarBox.classList.remove("mostrar-exportar");
        exportarBox.style.display = "none";
      }
    }
  });

  document.addEventListener("click", (event) => {
    if (filtroBox && btnAbrirFiltro) {
      const clicouNoBotaoFiltro = btnAbrirFiltro.contains(event.target);
      const clicouNaCaixaFiltro = filtroBox.contains(event.target);

      if (!clicouNoBotaoFiltro && !clicouNaCaixaFiltro) {
        filtroBox.classList.remove("mostrar-filtro");
        filtroBox.style.display = "none";
      }
    }

    if (exportarBox && btnExportar) {
      const clicouNoBotaoExportar = btnExportar.contains(event.target);
      const clicouNaCaixaExportar = exportarBox.contains(event.target);

      if (!clicouNoBotaoExportar && !clicouNaCaixaExportar) {
        exportarBox.classList.remove("mostrar-exportar");
        exportarBox.style.display = "none";
      }
    }
  });

  await renderizarTabela();
  aplicarFiltroColunas();
});

async function importarArquivo(event) {
  const arquivo = event.target.files[0];
  if (!arquivo) return;

  try {
    const extensao = obterExtensaoArquivo(arquivo.name);
    let dadosBrutos = [];

    if (extensao === "json") {
      const texto = await arquivo.text();
      const json = JSON.parse(texto);

      if (!Array.isArray(json)) {
        alert("O arquivo JSON precisa conter uma lista de registros.");
        limparInputArquivo();
        return;
      }

      dadosBrutos = json;
    } else if (extensao === "csv" || extensao === "txt") {
      const texto = await arquivo.text();
      dadosBrutos = converterTextoTabularParaObjetos(texto);
    } else if (extensao === "xls" || extensao === "xlsx") {
      dadosBrutos = await lerArquivoExcel(arquivo);
    } else {
      alert("Formato não suportado. Use JSON, CSV, TXT, XLS ou XLSX.");
      limparInputArquivo();
      return;
    }

    if (!Array.isArray(dadosBrutos) || dadosBrutos.length === 0) {
      alert("Nenhum dado válido foi encontrado no arquivo.");
      limparInputArquivo();
      return;
    }

    const clientes = dadosBrutos
      .map(normalizarClienteImportado)
      .filter((cliente) => cliente.nome || cliente.cpf);

    if (clientes.length === 0) {
      alert("Nenhum cliente válido foi encontrado no arquivo.");
      limparInputArquivo();
      return;
    }

    await adicionarClientes(clientes);

    alert("Importação realizada com sucesso!");

    await aplicarPesquisa();
    await atualizarTelas();
  } catch (erro) {
    console.error("Erro ao importar arquivo:", erro);
    alert("Erro ao importar arquivo.");
  } finally {
    limparInputArquivo();
  }
}

async function exportarDados(formato = "json") {
  const clientesFiltrados = await obterClientesFiltrados();
  const colunasMarcadas = Array.from(
    document.querySelectorAll(".filtro-coluna:checked")
  ).map((item) => item.value);

  let dadosExportacao = [];

  if (colunasMarcadas.length === 0) {
    dadosExportacao = clientesFiltrados;
  } else {
    dadosExportacao = clientesFiltrados.map((cliente) => {
      const novoCliente = {};

      colunasMarcadas.forEach((coluna) => {
        if (coluna in cliente) {
          novoCliente[coluna] = cliente[coluna];
        }
      });

      return novoCliente;
    });
  }

  if (dadosExportacao.length === 0) {
    alert("Nenhum dado para exportar.");
    return;
  }

  if (formato === "json") {
    exportarComoJson(dadosExportacao);
    return;
  }

  if (formato === "csv") {
    exportarComoCsv(dadosExportacao);
    return;
  }

  if (formato === "xlsx") {
    exportarComoExcel(dadosExportacao);
  }
}

function exportarComoJson(dados) {
  const blob = new Blob([JSON.stringify(dados, null, 2)], {
    type: "application/json"
  });

  baixarArquivo(blob, "clientesPEX_exportado.json");
}

function exportarComoCsv(dados) {
  const csv = converterObjetosParaCsv(dados);
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  baixarArquivo(blob, "clientesPEX_exportado.csv");
}

function exportarComoExcel(dados) {
  const worksheet = XLSX.utils.json_to_sheet(dados);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
  XLSX.writeFile(workbook, "clientesPEX_exportado.xlsx");
}

function baixarArquivo(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = nomeArquivo;
  link.click();

  URL.revokeObjectURL(url);
}

function converterObjetosParaCsv(dados) {
  if (!dados.length) return "";

  const cabecalhos = Object.keys(dados[0]);

  const linhas = dados.map((objeto) =>
    cabecalhos
      .map((cabecalho) => escaparValorCsv(objeto[cabecalho]))
      .join(";")
  );

  return [cabecalhos.join(";"), ...linhas].join("\n");
}

function escaparValorCsv(valor) {
  const texto = String(valor ?? "");

  if (texto.includes(";") || texto.includes('"') || texto.includes("\n")) {
    return `"${texto.replaceAll('"', '""')}"`;
  }

  return texto;
}

async function obterClientesFiltrados() {
  const termo = (document.getElementById("pesquisaCliente")?.value || "")
    .toLowerCase()
    .trim();

  const clientes = await obterClientes();

  if (!termo) {
    return clientes;
  }

  return clientes.filter((cliente) =>
    [
      cliente.nome,
      cliente.cpf,
      cliente.telefone,
      cliente.endereco,
      cliente.email,
      cliente.valor,
      cliente.vencimento,
      cliente.statusPagamento,
      cliente.ativo,
      cliente.ultimoPagamento
    ].some((valor) => String(valor ?? "").toLowerCase().includes(termo))
  );
}

async function renderizarTabela(lista = null) {
  const tabelaFinanceira = document.getElementById("corpoTabelaImportacao");
  const tabelaDados = document.getElementById("corpoTabelaDadosPessoais");

  if (!tabelaFinanceira || !tabelaDados) return;

  const clientes = lista || await obterClientes();

  tabelaFinanceira.innerHTML = "";
  tabelaDados.innerHTML = "";

  clientes.forEach((cliente) => {
    const trFinanceiro = document.createElement("tr");
    trFinanceiro.innerHTML = `
      <td>${escaparHtml(cliente.nome)}</td>
      <td>${escaparHtml(cliente.cpf)}</td>
      <td>${formatarMoeda(cliente.valor)}</td>
      <td>${formatarDataParaExibicao(cliente.vencimento)}</td>
      <td>${escaparHtml(cliente.statusPagamento)}</td>
      <td>${escaparHtml(cliente.ativo)}</td>
      <td>${formatarDataParaExibicao(cliente.ultimoPagamento)}</td>
      <td>${calcularDiasAtraso(cliente.vencimento)}</td>
    `;
    tabelaFinanceira.appendChild(trFinanceiro);

    const trDados = document.createElement("tr");
    trDados.innerHTML = `
      <td>${escaparHtml(cliente.nome)}</td>
      <td>${escaparHtml(cliente.cpf)}</td>
      <td>${escaparHtml(cliente.telefone)}</td>
      <td>${escaparHtml(cliente.endereco)}</td>
      <td>${escaparHtml(cliente.email)}</td>
    `;
    tabelaDados.appendChild(trDados);
  });
}

async function aplicarPesquisa() {
  const termo = (document.getElementById("pesquisaCliente")?.value || "")
    .toLowerCase()
    .trim();

  const clientes = await obterClientes();

  if (!termo) {
    await renderizarTabela(clientes);
    aplicarFiltroColunas();
    return;
  }

  const filtrados = clientes.filter((cliente) =>
    [
      cliente.nome,
      cliente.cpf,
      cliente.telefone,
      cliente.endereco,
      cliente.email,
      cliente.valor,
      cliente.vencimento,
      cliente.statusPagamento,
      cliente.ativo,
      cliente.ultimoPagamento
    ].some((valor) => String(valor ?? "").toLowerCase().includes(termo))
  );

  await renderizarTabela(filtrados);
  aplicarFiltroColunas();
}

function aplicarFiltroColunas() {
  const colunasMarcadas = Array.from(
    document.querySelectorAll(".filtro-coluna:checked")
  ).map((item) => item.value);

  const mapaPrimeiraTabela = {
    nome: 0,
    cpf: 1,
    valor: 2,
    vencimento: 3,
    statusPagamento: 4,
    ativo: 5,
    ultimoPagamento: 6
  };

  const mapaSegundaTabela = {
    nome: 0,
    cpf: 1,
    telefone: 2,
    endereco: 3,
    email: 4
  };

  const colunasPrimeiraMarcadas = colunasMarcadas.filter(
    (campo) => campo in mapaPrimeiraTabela
  );

  const colunasSegundaMarcadas = colunasMarcadas.filter(
    (campo) => campo in mapaSegundaTabela
  );

  aplicarVisibilidadeTabela(
    "tabelaFinanceira",
    mapaPrimeiraTabela,
    colunasPrimeiraMarcadas
  );

  aplicarVisibilidadeTabela(
    "tabelaDadosPessoais",
    mapaSegundaTabela,
    colunasSegundaMarcadas
  );
}

function aplicarVisibilidadeTabela(idTabela, mapaColunas, colunasMarcadas) {
  const tabela = document.getElementById(idTabela);
  if (!tabela) return;

  const linhas = tabela.querySelectorAll("tr");
  const mostrarTodas = colunasMarcadas.length === 0;

  linhas.forEach((linha) => {
    Array.from(linha.children).forEach((celula, indice) => {
      const campo = Object.keys(mapaColunas).find(
        (chave) => mapaColunas[chave] === indice
      );

      if (mostrarTodas || colunasMarcadas.includes(campo)) {
        celula.style.display = "";
      } else {
        celula.style.display = "none";
      }
    });
  });
}

function obterExtensaoArquivo(nomeArquivo) {
  return nomeArquivo.split(".").pop().toLowerCase();
}

function limparInputArquivo() {
  const inputImportar = document.getElementById("inputImportar");
  if (inputImportar) {
    inputImportar.value = "";
  }
}

async function atualizarTelas() {
  await renderizarTabela();
  aplicarFiltroColunas();
}

function converterTextoTabularParaObjetos(texto) {
  const linhas = texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean);

  if (linhas.length < 2) return [];

  const separador = detectarSeparador(linhas[0]);
  const cabecalhos = linhas[0]
    .split(separador)
    .map((item) => item.trim());

  return linhas.slice(1).map((linha) => {
    const valores = linha.split(separador).map((item) => item.trim());
    const objeto = {};

    cabecalhos.forEach((cabecalho, indice) => {
      objeto[cabecalho] = valores[indice] ?? "";
    });

    return objeto;
  });
}

function detectarSeparador(linha) {
  if (linha.includes(";")) return ";";
  if (linha.includes(",")) return ",";
  if (linha.includes("\t")) return "\t";
  return ";";
}

async function lerArquivoExcel(arquivo) {
  const arrayBuffer = await arquivo.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const primeiraAba = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[primeiraAba];
  return XLSX.utils.sheet_to_json(worksheet, { defval: "" });
}

function normalizarClienteImportado(item) {
  return {
    nome: obterCampo(item, ["nome", "Nome", "cliente", "Cliente"]),
    cpf: obterCampo(item, ["cpf", "CPF"]),
    telefone: obterCampo(item, ["telefone", "Telefone", "whatsapp", "Whatsapp"]),
    endereco: obterCampo(item, ["endereco", "Endereço", "logradouro"]),
    email: obterCampo(item, ["email", "Email", "e-mail", "E-mail"]),
    valor: normalizarValor(obterCampo(item, ["valor", "Valor"])),
    vencimento: normalizarData(
      obterCampo(item, ["vencimento", "Vencimento"])
    ),
    statusPagamento: obterCampo(item, ["statusPagamento", "status", "Status"]) || "Pendente",
    ativo: obterCampo(item, ["ativo", "Ativo"]) || "Ativo",
    ultimoPagamento: normalizarData(
      obterCampo(item, ["ultimoPagamento", "Último Pagamento", "ultimo_pagamento"])
    )
  };
}

function obterCampo(objeto, chaves) {
  for (const chave of chaves) {
    if (objeto[chave] !== undefined && objeto[chave] !== null) {
      return String(objeto[chave]).trim();
    }
  }
  return "";
}

function normalizarValor(valor) {
  if (valor === null || valor === undefined || valor === "") return 0;

  const texto = String(valor)
    .replaceAll("R$", "")
    .replaceAll(".", "")
    .replace(",", ".")
    .trim();

  const numero = Number(texto);
  return Number.isNaN(numero) ? 0 : numero;
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

function formatarMoeda(valor) {
  const numero = Number(valor) || 0;
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarDataParaExibicao(data) {
  if (!data) return "-";

  if (data.includes("-")) {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  return data;
}

function calcularDiasAtraso(data) {
  if (!data) return 0;

  const hoje = new Date();
  const vencimento = new Date(data + "T00:00:00");

  hoje.setHours(0, 0, 0, 0);

  const diferenca = hoje - vencimento;
  const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));

  return dias > 0 ? dias : 0;
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
>>>>>>> 58a941ec0587124e61e141c1caab830110137ff8
}