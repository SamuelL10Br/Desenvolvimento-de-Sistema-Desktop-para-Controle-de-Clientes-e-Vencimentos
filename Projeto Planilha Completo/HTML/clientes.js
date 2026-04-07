document.addEventListener("DOMContentLoaded", async () => {
  const btnNovo = document.getElementById("btn-novo");
  const btnEditar = document.getElementById("btn-editar");
  const btnExcluir = document.getElementById("btn-excluir");
  const btnCancelar = document.getElementById("btn-cancelar");
  const btnConfirmar = document.getElementById("btn-confirmar");
  const modal = document.getElementById("modal-cliente");
  const modalTitulo = document.getElementById("modal-titulo");
  const pesquisa = document.getElementById("pesquisa");

  const inputNome = document.getElementById("input-nome");
  const inputCpf = document.getElementById("input-cpf");
  const inputTelefone = document.getElementById("input-telefone");
  const inputEndereco = document.getElementById("input-endereco");
  const inputEmail = document.getElementById("input-email");
  const inputValor = document.getElementById("input-valor");
  const inputVencimento = document.getElementById("input-vencimento");
  const inputStatusPagamento = document.getElementById("input-status-pagamento");
  const inputAtivo = document.getElementById("input-ativo");
  const inputUltimoPagamento = document.getElementById("input-ultimo-pagamento");

  let modoEdicao = false;
  let cpfOriginal = null;
  let timeoutPesquisa = null;

  function modalAberto() {
    return !modal.classList.contains("hidden");
  }

  function limparFormulario() {
    inputNome.value = "";
    inputCpf.value = "";
    inputTelefone.value = "";
    inputEndereco.value = "";
    inputEmail.value = "";
    inputValor.value = "";
    inputVencimento.value = "";
    inputStatusPagamento.value = "Pendente";
    inputAtivo.value = "Ativo";
    inputUltimoPagamento.value = "";
  }

  function abrirModalNovo() {
    modoEdicao = false;
    cpfOriginal = null;
    modalTitulo.textContent = "Novo Cliente";
    limparFormulario();
    document.body.classList.add("modal-aberto");
    modal.classList.remove("hidden");
    inputNome.focus();
  }

  function fecharModal() {
    document.body.classList.remove("modal-aberto");
    modal.classList.add("hidden");
    limparFormulario();
    modoEdicao = false;
    cpfOriginal = null;
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
        (_, ddd, parte1, parte2) => (parte2 ? `(${ddd}) ${parte1}-${parte2}` : `(${ddd}) ${parte1}`)
      );
    }

    return numeros.replace(
      /^(\d{2})(\d{5})(\d{0,4}).*/,
      (_, ddd, parte1, parte2) => (parte2 ? `(${ddd}) ${parte1}-${parte2}` : `(${ddd}) ${parte1}`)
    );
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

  function converterValorParaNumero(valorTexto) {
    if (valorTexto === null || valorTexto === undefined) return null;

    const textoLimpo = String(valorTexto)
      .replaceAll("R$", "")
      .replace(/\s/g, "")
      .replaceAll(".", "")
      .replace(",", ".")
      .trim();

    if (!textoLimpo) return 0;

    const numero = Number(textoLimpo);
    return Number.isNaN(numero) ? null : numero;
  }

  function formatarMoedaSemSimbolo(valor) {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return "";

    return numero.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatarMoeda(valor) {
    const numero = Number(valor) || 0;
    return numero.toLocaleString("pt-BR", {
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

  async function obterClienteSelecionado() {
    const selecionados = document.querySelectorAll('input[name="clienteSelecionado"]:checked');

    if (selecionados.length === 0) return null;

    if (selecionados.length > 1) {
      window.uiFeedback.error("Selecione apenas um cliente para editar.");
      return null;
    }

    const cpf = selecionados[0].value;
    const clientes = await obterClientes();

    return clientes.find((cliente) => limparCPF(cliente.cpf) === limparCPF(cpf)) || null;
  }

  async function abrirModalEdicao() {
    try {
      const cliente = await obterClienteSelecionado();

      if (!cliente) {
        if (document.querySelectorAll('input[name="clienteSelecionado"]:checked').length === 0) {
          window.uiFeedback.error("Selecione um cliente para editar.");
        }
        return;
      }

      modoEdicao = true;
      cpfOriginal = limparCPF(cliente.cpf);
      modalTitulo.textContent = "Editar Cliente";

      inputNome.value = cliente.nome || "";
      inputCpf.value = limparCPF(cliente.cpf || "");
      inputTelefone.value = limparTelefone(cliente.telefone || "");
      inputEndereco.value = cliente.endereco || "";
      inputEmail.value = cliente.email || "";
      inputValor.value = formatarMoedaSemSimbolo(cliente.valor);
      inputVencimento.value = converterDataParaInput(cliente.vencimento);
      inputStatusPagamento.value = cliente.statusPagamento || "Pendente";
      inputAtivo.value = cliente.ativo || "Ativo";
      inputUltimoPagamento.value = converterDataParaInput(cliente.ultimoPagamento);

      document.body.classList.add("modal-aberto");
      modal.classList.remove("hidden");
      inputNome.focus();
    } catch (erro) {
      console.error("Erro ao abrir modal de edição:", erro);
      window.uiFeedback.error("Erro ao abrir edição do cliente.");
    }
  }

  function validarCampos() {
    const nome = inputNome.value.trim();
    const cpf = limparCPF(inputCpf.value);
    const telefone = limparTelefone(inputTelefone.value);
    const endereco = inputEndereco.value.trim();
    const email = inputEmail.value.trim();
    const valor = converterValorParaNumero(inputValor.value);

    if (!nome || !cpf || !telefone || !endereco || !email) {
      window.uiFeedback.error("Preencha todos os campos obrigatórios.");
      return false;
    }

    if (cpf.length !== 11) {
      window.uiFeedback.error("CPF inválido. Digite 11 números.");
      return false;
    }

    if (telefone.length < 10 || telefone.length > 11) {
      window.uiFeedback.error("Telefone inválido.");
      return false;
    }

    if (valor === null) {
      window.uiFeedback.error("Informe um valor válido.");
      return false;
    }

    return true;
  }

  async function clienteJaExiste(cpf) {
    const clientes = await obterClientes();
    const cpfLimpo = limparCPF(cpf);

    return clientes.some((cliente) => limparCPF(cliente.cpf) === cpfLimpo);
  }

  async function salvarNovoCliente() {
    const novoCliente = {
      nome: inputNome.value.trim(),
      cpf: limparCPF(inputCpf.value),
      telefone: limparTelefone(inputTelefone.value),
      endereco: inputEndereco.value.trim(),
      email: inputEmail.value.trim(),
      valor: converterValorParaNumero(inputValor.value),
      vencimento: inputVencimento.value,
      statusPagamento: inputStatusPagamento.value,
      ativo: inputAtivo.value,
      ultimoPagamento: inputUltimoPagamento.value,
      diasAtrasoManual: ""
    };

    if (await clienteJaExiste(novoCliente.cpf)) {
      window.uiFeedback.error("Já existe um cliente com esse CPF.");
      return;
    }

    await adicionarClientes([novoCliente]);
    await renderizarClientes();
    fecharModal();
    window.uiFeedback.success("Cliente cadastrado com sucesso.");
  }

  async function salvarEdicaoCliente() {
    if (!cpfOriginal) return;

    const novoCpf = limparCPF(inputCpf.value);

    if (novoCpf !== cpfOriginal && await clienteJaExiste(novoCpf)) {
      window.uiFeedback.error("Já existe outro cliente com esse CPF.");
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
      nome: inputNome.value.trim(),
      cpf: novoCpf,
      telefone: limparTelefone(inputTelefone.value),
      endereco: inputEndereco.value.trim(),
      email: inputEmail.value.trim(),
      valor: converterValorParaNumero(inputValor.value),
      vencimento: inputVencimento.value,
      statusPagamento: inputStatusPagamento.value,
      ativo: inputAtivo.value,
      ultimoPagamento: inputUltimoPagamento.value
    };

    await excluirCliente(cpfOriginal);
    await adicionarClientes([clienteAtualizado]);
    await renderizarClientes();
    fecharModal();
    window.uiFeedback.success("Cliente atualizado com sucesso.");
  }

  async function excluirClienteSelecionado() {
    try {
      const selecionados = document.querySelectorAll('input[name="clienteSelecionado"]:checked');

      if (selecionados.length === 0) {
        window.uiFeedback.error("Selecione pelo menos um cliente para excluir.");
        return;
      }

      const confirmar = await window.uiFeedback.confirm(`Tem certeza que deseja excluir ${selecionados.length} cliente(s)?`);
      if (!confirmar) return;

      for (const item of selecionados) {
        const cpf = limparCPF(item.value);
        await excluirCliente(cpf);
      }

      await renderizarClientes();
      window.uiFeedback.success("Cliente(s) excluído(s) com sucesso.");
    } catch (erro) {
      console.error("Erro ao excluir cliente(s):", erro);
      window.uiFeedback.error("Erro ao excluir cliente(s).");
    }
  }

  async function renderizarClientes(lista = null) {
    const tabelaBody = document.getElementById("tabela-body");
    if (!tabelaBody) return;

    const clientes = lista || await obterClientes();
    const clientesOrdenados = ordenarClientesPorNome(clientes);

    tabelaBody.innerHTML = "";

    if (!clientesOrdenados.length) {
      tabelaBody.innerHTML = `
        <tr>
          <td colspan="11">Nenhum cliente cadastrado.</td>
        </tr>
      `;
      return;
    }

    clientesOrdenados.forEach((cliente) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td><input type="checkbox" name="clienteSelecionado" value="${limparCPF(cliente.cpf)}"></td>
        <td>${cliente.nome || ""}</td>
        <td>${formatarCPF(cliente.cpf || "")}</td>
        <td>${formatarTelefone(cliente.telefone || "")}</td>
        <td>${cliente.endereco || ""}</td>
        <td>${cliente.email || ""}</td>
        <td>${formatarMoeda(cliente.valor)}</td>
        <td>${formatarDataParaExibicao(cliente.vencimento)}</td>
        <td>${cliente.statusPagamento || "Pendente"}</td>
        <td>${cliente.ativo || "Ativo"}</td>
        <td>${formatarDataParaExibicao(cliente.ultimoPagamento)}</td>
      `;

      tabelaBody.appendChild(tr);
    });
  }

  async function aplicarPesquisaClientes() {
    if (modalAberto()) return;

    const termoTexto = normalizarTexto(pesquisa.value);
    const termoCpf = limparCPF(pesquisa.value);
    const clientes = await obterClientes();

    if (!termoTexto && !termoCpf) {
      await renderizarClientes(clientes);
      return;
    }

    const filtrados = clientes.filter((cliente) => {
      const nome = normalizarTexto(cliente.nome);
      const cpf = limparCPF(cliente.cpf);
      const email = normalizarTexto(cliente.email);
      const telefone = normalizarTexto(cliente.telefone);
      const endereco = normalizarTexto(cliente.endereco);

      return (
        (termoTexto && (
          nome.includes(termoTexto) ||
          email.includes(termoTexto) ||
          telefone.includes(termoTexto) ||
          endereco.includes(termoTexto)
        )) ||
        (termoCpf && cpf.includes(termoCpf))
      );
    });

    await renderizarClientes(filtrados);
  }

  btnNovo.addEventListener("click", abrirModalNovo);
  btnEditar.addEventListener("click", abrirModalEdicao);
  btnExcluir.addEventListener("click", excluirClienteSelecionado);
  btnCancelar.addEventListener("click", fecharModal);

  btnConfirmar.addEventListener("click", async () => {
    try {
      if (!validarCampos()) return;

      btnConfirmar.disabled = true;

      if (modoEdicao) {
        await salvarEdicaoCliente();
      } else {
        await salvarNovoCliente();
      }
    } catch (erro) {
      console.error("Erro ao confirmar cliente:", erro);
      window.uiFeedback.error("Erro ao salvar cliente.");
    } finally {
      btnConfirmar.disabled = false;
    }
  });

  inputCpf.addEventListener("blur", () => {
    inputCpf.value = formatarCPF(inputCpf.value);
  });

  inputTelefone.addEventListener("blur", () => {
    inputTelefone.value = formatarTelefone(inputTelefone.value);
  });

  inputValor.addEventListener("blur", () => {
    const valor = converterValorParaNumero(inputValor.value);
    inputValor.value = valor === null ? "" : formatarMoedaSemSimbolo(valor);
  });

  pesquisa.addEventListener("input", () => {
    if (modalAberto()) return;

    clearTimeout(timeoutPesquisa);
    timeoutPesquisa = setTimeout(() => {
      aplicarPesquisaClientes();
    }, 250);
  });

  await renderizarClientes();
});
