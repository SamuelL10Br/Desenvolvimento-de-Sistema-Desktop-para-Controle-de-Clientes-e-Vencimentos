document.addEventListener("DOMContentLoaded", function () {
  const btnEditar = document.getElementById("btnEditarPagamento");
  const pesquisa = document.getElementById("campoFiltro");
  const modal = document.getElementById("modal-pagamento");

  let clientesCache = [];
  let cpfEditando = "";

  function mostrarErro(msg) {
    if (window.uiFeedback?.error) window.uiFeedback.error(msg);
    else alert(msg);
  }

  function mostrarSucesso(msg) {
    if (window.uiFeedback?.success) window.uiFeedback.success(msg);
    else alert(msg);
  }

  function limparCPF(cpf) {
    return String(cpf || "").replace(/\D/g, "").slice(0, 11);
  }

  function normalizarTexto(valor) {
    return String(valor || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function formatarCPF(cpf) {
    const n = limparCPF(cpf);
    if (n.length !== 11) return n;
    return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9, 11)}`;
  }

  function converterValorParaNumero(valor) {
    const texto = String(valor || "")
      .replace("R$", "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim();

    if (!texto) return 0;

    const numero = Number(texto);
    return Number.isNaN(numero) ? null : numero;
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

    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;

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
    if (Number.isNaN(dataLocal.getTime())) return null;

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

  function clienteCombinaComPesquisa(cliente, termo) {
    const termoTexto = normalizarTexto(termo);
    const termoCpf = limparCPF(termo);
    const inicio = normalizarTexto(formatarInicio(cliente.inicio));

    const nome = normalizarTexto(cliente.nome);
    const cpf = limparCPF(cliente.cpf);

    return (
      nome.includes(termoTexto) ||
      inicio.includes(termoTexto) ||
      (termoCpf.length > 0 && cpf.includes(termoCpf))
    );
  }

  function obterSelecionado() {
    const selecionado = document.querySelector(
      'input[name="pagamentoSelecionado"]:checked'
    );

    return selecionado ? limparCPF(selecionado.value) : "";
  }

  function renderizarPagamentos(clientes) {
    const tabelaBody = document.getElementById("tabela-body");
    const lista = ordenarClientesPorNome(clientes);

    tabelaBody.innerHTML = "";

    if (lista.length === 0) {
      tabelaBody.innerHTML = `
        <tr>
          <td colspan="8" class="mensagem-vazia">
            Nenhum pagamento cadastrado.
          </td>
        </tr>
      `;
      return;
    }

    lista.forEach(function (cliente) {
      const linha = document.createElement("tr");

      linha.innerHTML = `
        <td>
          <input
            class="checkbox-cliente"
            type="radio"
            name="pagamentoSelecionado"
            value="${limparCPF(cliente.cpf)}"
          >
        </td>
        <td>${cliente.nome || ""}</td>
        <td>${formatarCPF(cliente.cpf)}</td>
        <td>${formatarMoeda(cliente.valor)}</td>
        <td>${formatarInicio(cliente.inicio)}</td>
        <td>${formatarData(cliente.vencimento)}</td>
        <td>${obterStatusAutomatico(cliente)}</td>
        <td>${exibirDias(cliente)}</td>
      `;

      tabelaBody.appendChild(linha);
    });
  }

  function aplicarPesquisa() {
    const termo = pesquisa.value.trim();

    if (!termo) {
      renderizarPagamentos(clientesCache);
      return;
    }

    const filtrados = clientesCache.filter(function (cliente) {
      return clienteCombinaComPesquisa(cliente, termo);
    });

    renderizarPagamentos(filtrados);
  }

  async function carregarPagamentos() {
    const clientes = await obterClientes();
    clientesCache = Array.isArray(clientes) ? clientes : [];
    aplicarPesquisa();
  }

  function abrirModalEdicaoPagamento() {
    const cpfSelecionado = obterSelecionado();

    if (!cpfSelecionado) {
      mostrarErro("Selecione um pagamento.");
      return;
    }

    const cliente = clientesCache.find(function (item) {
      return limparCPF(item.cpf) === cpfSelecionado;
    });

    if (!cliente) {
      mostrarErro("Cliente não encontrado.");
      return;
    }

    cpfEditando = cpfSelecionado;

    document.getElementById("pagamento-nome").value = cliente.nome || "";
    document.getElementById("pagamento-valor").value = cliente.valor || "";
    document.getElementById("pagamento-vencimento").value =
      converterDataParaInput(cliente.vencimento);
    document.getElementById("pagamento-ultimo").value =
      converterDataParaInput(cliente.ultimoPagamento);

    document.getElementById("pagamento-status").value =
      String(cliente.statusPagamento || "").trim() === "Pago"
        ? "Pago"
        : "Automatico";

    document.body.classList.add("modal-aberto");
    modal.classList.remove("hidden");
  }

  function fecharModalPagamento() {
    document.body.classList.remove("modal-aberto");
    modal.classList.add("hidden");
    cpfEditando = "";
  }

  async function salvarPagamentoEditado() {
    const valor = converterValorParaNumero(
      document.getElementById("pagamento-valor").value
    );

    const vencimento = document.getElementById("pagamento-vencimento").value;
    const ultimoPagamento = document.getElementById("pagamento-ultimo").value;
    const statusSelecionado = document.getElementById("pagamento-status").value;

    if (valor === null) {
      mostrarErro("Informe um valor válido.");
      return;
    }

    if (!vencimento) {
      mostrarErro("Informe a data de vencimento.");
      return;
    }

    clientesCache = clientesCache.map(function (cliente) {
      if (limparCPF(cliente.cpf) !== cpfEditando) {
        return cliente;
      }

      return {
        ...cliente,
        valor: valor,
        vencimento: vencimento,
        ultimoPagamento: ultimoPagamento || "",
        statusPagamento: statusSelecionado === "Pago" ? "Pago" : "",
        diasAtrasoManual: ""
      };
    });

    await salvarClientes(clientesCache);

    fecharModalPagamento();
    mostrarSucesso("Pagamento atualizado.");

    await carregarPagamentos();
  }

  pesquisa.addEventListener("input", aplicarPesquisa);
  btnEditar.addEventListener("click", abrirModalEdicaoPagamento);

  document
    .getElementById("btnCancelarPagamento")
    .addEventListener("click", fecharModalPagamento);

  document
    .getElementById("btnSalvarPagamento")
    .addEventListener("click", salvarPagamentoEditado);

  carregarPagamentos();
});