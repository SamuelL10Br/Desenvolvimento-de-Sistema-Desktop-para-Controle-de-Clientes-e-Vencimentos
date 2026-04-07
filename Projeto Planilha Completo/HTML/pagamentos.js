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
  let timeoutPesquisa = null;

  function modalAberto() {
    return !modal.classList.contains("hidden");
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

  function normalizarTexto(valor) {
    return String(valor || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function ordenarClientesPorNome(clientes) {
    return [...clientes].sort((a, b) =>
      String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", {
        sensitivity: "base"
      })
    );
  }

  function abrirModal() {
    document.body.classList.add("modal-aberto");
    modal.classList.remove("hidden");
    inputNome.focus();
  }

  function fecharModal() {
    document.body.classList.remove("modal-aberto");
    modal.classList.add("hidden");
    cpfOriginal = null;
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
    const dataInput = converterDataParaInput(data);
    if (!dataInput) return "-";

    const [ano, mes, dia] = dataInput.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function calcularDiasAtrasoAutomatico(data) {
    const dataConvertida = converterDataParaInput(data);

    if (!dataConvertida) return 0;

    const hoje = new Date();
    const vencimento = new Date(`${dataConvertida}T00:00:00`);

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

  function formatarMoedaSemSimbolo(valor) {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return "";

    return numero.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
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

  async function obterPagamentoSelecionado() {
    const selecionado = document.querySelector('input[name="pagamentoSelecionado"]:checked');
    if (!selecionado) return null;

    const cpfSelecionado = limparCPF(selecionado.value);
    const clientes = await obterClientes();

    return clientes.find((item) => limparCPF(item.cpf) === cpfSelecionado) || null;
  }

  async function abrirModalEdicao() {
    try {
      const cliente = await obterPagamentoSelecionado();

      if (!cliente) {
        window.uiFeedback.error("Selecione um pagamento para editar.");
        return;
      }

      cpfOriginal = limparCPF(cliente.cpf);

      inputNome.value = cliente.nome || "";
      inputCpf.value = limparCPF(cliente.cpf || "");
      inputValor.value = formatarMoedaSemSimbolo(cliente.valor);
      inputVencimento.value = converterDataParaInput(cliente.vencimento);
      inputStatus.value = cliente.statusPagamento || "Pendente";
      inputAtivo.value = cliente.ativo || "Ativo";
      inputUltimoPagamento.value = converterDataParaInput(cliente.ultimoPagamento);

      if (
        cliente.diasAtrasoManual !== undefined &&
        cliente.diasAtrasoManual !== null &&
        cliente.diasAtrasoManual !== ""
      ) {
        inputAtraso.value = cliente.diasAtrasoManual;
      } else {
        inputAtraso.value = calcularDiasAtrasoAutomatico(cliente.vencimento);
      }

      abrirModal();
    } catch (erro) {
      console.error("Erro ao abrir edição de pagamento:", erro);
      window.uiFeedback.error("Erro ao abrir edição.");
    }
  }

  async function salvarEdicaoPagamento() {
    try {
      if (!cpfOriginal) return;

      const nome = inputNome.value.trim();
      const cpf = limparCPF(inputCpf.value);
      const valor = converterValorParaNumero(inputValor.value);
      const vencimento = inputVencimento.value;
      const statusPagamento = inputStatus.value;
      const ativo = inputAtivo.value;
      const ultimoPagamento = inputUltimoPagamento.value;
      const diasAtrasoManual = inputAtraso.value === "" ? "" : Number(inputAtraso.value);

      if (!nome || !cpf || cpf.length !== 11) {
        window.uiFeedback.error("Nome e CPF válidos são obrigatórios.");
        return;
      }

      if (valor === null) {
        window.uiFeedback.error("Informe um valor válido.");
        return;
      }

      const clientes = await obterClientes();
      const clienteAtual = clientes.find((cliente) => limparCPF(cliente.cpf) === cpfOriginal);

      if (!clienteAtual) {
        window.uiFeedback.error("Cliente não encontrado.");
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
        ultimoPagamento,
        diasAtrasoManual
      };

      await excluirCliente(cpfOriginal);
      await adicionarClientes([clienteAtualizado]);
      await renderizarPagamentos();
      fecharModal();
      window.uiFeedback.success("Pagamento atualizado com sucesso.");
    } catch (erro) {
      console.error("Erro ao salvar pagamento:", erro);
      window.uiFeedback.error("Erro ao salvar pagamento.");
    }
  }

  async function renderizarPagamentos(lista = null) {
    const tabelaBody = document.getElementById("tabela-body");
    if (!tabelaBody) return;

    const clientes = lista || await obterClientes();
    const clientesOrdenados = ordenarClientesPorNome(clientes);

    tabelaBody.innerHTML = "";

    if (!clientesOrdenados.length) {
      tabelaBody.innerHTML = `
        <tr>
          <td colspan="9">Nenhum pagamento cadastrado.</td>
        </tr>
      `;
      return;
    }

    clientesOrdenados.forEach((cliente) => {
      const tr = document.createElement("tr");

      const atrasoExibido =
        cliente.diasAtrasoManual !== undefined &&
        cliente.diasAtrasoManual !== null &&
        cliente.diasAtrasoManual !== ""
          ? cliente.diasAtrasoManual
          : calcularDiasAtrasoAutomatico(cliente.vencimento);

      tr.innerHTML = `
        <td><input type="radio" name="pagamentoSelecionado" value="${limparCPF(cliente.cpf)}"></td>
        <td>${cliente.nome || ""}</td>
        <td>${formatarCPF(cliente.cpf || "")}</td>
        <td>${formatarMoeda(cliente.valor)}</td>
        <td>${formatarDataParaExibicao(cliente.vencimento)}</td>
        <td>${cliente.statusPagamento || "Pendente"}</td>
        <td>${cliente.ativo || "Ativo"}</td>
        <td>${formatarDataParaExibicao(cliente.ultimoPagamento)}</td>
        <td>${atrasoExibido}</td>
      `;

      tabelaBody.appendChild(tr);
    });
  }

  async function aplicarPesquisaPagamentos() {
    if (modalAberto()) return;

    const termoTexto = normalizarTexto(pesquisa.value);
    const termoCpf = limparCPF(pesquisa.value);
    const clientes = await obterClientes();

    if (!termoTexto && !termoCpf) {
      await renderizarPagamentos(clientes);
      return;
    }

    const filtrados = clientes.filter((cliente) => {
      const nome = normalizarTexto(cliente.nome);
      const cpf = limparCPF(cliente.cpf);

      const buscaPorNome = termoTexto ? nome.includes(termoTexto) : false;
      const buscaPorCpf = termoCpf ? cpf.includes(termoCpf) : false;

      return buscaPorNome || buscaPorCpf;
    });

    await renderizarPagamentos(filtrados);
  }

  btnEditar.addEventListener("click", abrirModalEdicao);
  btnCancelar.addEventListener("click", fecharModal);

  btnConfirmar.addEventListener("click", async () => {
    btnConfirmar.disabled = true;
    try {
      await salvarEdicaoPagamento();
    } finally {
      btnConfirmar.disabled = false;
    }
  });

  inputCpf.addEventListener("blur", () => {
    inputCpf.value = formatarCPF(inputCpf.value);
  });

  inputValor.addEventListener("blur", () => {
    const valor = converterValorParaNumero(inputValor.value);
    inputValor.value = valor === null ? "" : formatarMoedaSemSimbolo(valor);
  });

  pesquisa.addEventListener("input", () => {
    if (modalAberto()) return;

    clearTimeout(timeoutPesquisa);
    timeoutPesquisa = setTimeout(() => {
      aplicarPesquisaPagamentos();
    }, 250);
  });

  await renderizarPagamentos();
});
