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

  let modoEdicao = false;
  let cpfOriginal = null;

  function limparFormulario() {
    inputNome.value = "";
    inputCpf.value = "";
    inputTelefone.value = "";
    inputEndereco.value = "";
    inputEmail.value = "";
  }

  function abrirModalNovo() {
    modoEdicao = false;
    cpfOriginal = null;
    modalTitulo.textContent = "Novo Cliente";
    limparFormulario();
    modal.classList.remove("hidden");
  }

  async function obterClienteSelecionado() {
    const radioSelecionado = document.querySelector('input[name="clienteSelecionado"]:checked');

    if (!radioSelecionado) {
      return null;
    }

    const cpf = radioSelecionado.value;
    const clientes = await obterClientes();
    return clientes.find((cliente) => cliente.cpf === cpf) || null;
  }

  async function abrirModalEdicao() {
    const cliente = await obterClienteSelecionado();

    if (!cliente) {
      alert("Selecione um cliente para editar.");
      return;
    }

    modoEdicao = true;
    cpfOriginal = cliente.cpf;
    modalTitulo.textContent = "Editar Cliente";

    inputNome.value = cliente.nome || "";
    inputCpf.value = cliente.cpf || "";
    inputTelefone.value = cliente.telefone || "";
    inputEndereco.value = cliente.endereco || "";
    inputEmail.value = cliente.email || "";

    modal.classList.remove("hidden");
  }

  function fecharModal() {
    modal.classList.add("hidden");
    limparFormulario();
    modoEdicao = false;
    cpfOriginal = null;
  }

  function validarCampos() {
    if (
      !inputNome.value.trim() ||
      !inputCpf.value.trim() ||
      !inputTelefone.value.trim() ||
      !inputEndereco.value.trim() ||
      !inputEmail.value.trim()
    ) {
      alert("Preencha todos os campos.");
      return false;
    }

    return true;
  }

  async function clienteJaExiste(cpf) {
    const clientes = await obterClientes();
    return clientes.some((cliente) => cliente.cpf === cpf);
  }

  async function salvarNovoCliente() {
    const novoCliente = {
      nome: inputNome.value.trim(),
      cpf: inputCpf.value.trim(),
      telefone: inputTelefone.value.trim(),
      endereco: inputEndereco.value.trim(),
      email: inputEmail.value.trim(),
      valor: 0,
      vencimento: "",
      statusPagamento: "Pendente",
      ativo: "Ativo",
      ultimoPagamento: ""
    };

    if (await clienteJaExiste(novoCliente.cpf)) {
      alert("Já existe um cliente com esse CPF.");
      return;
    }

    await adicionarClientes([novoCliente]);
    await renderizarClientes();
    fecharModal();
  }

  async function salvarEdicaoCliente() {
    if (!cpfOriginal) return;

    const novoCpf = inputCpf.value.trim();

    if (novoCpf !== cpfOriginal && await clienteJaExiste(novoCpf)) {
      alert("Já existe outro cliente com esse CPF.");
      return;
    }

    const clientes = await obterClientes();
    const clienteAtual = clientes.find((cliente) => cliente.cpf === cpfOriginal);

    if (!clienteAtual) {
      alert("Cliente não encontrado.");
      return;
    }

    const clienteAtualizado = {
      ...clienteAtual,
      nome: inputNome.value.trim(),
      cpf: novoCpf,
      telefone: inputTelefone.value.trim(),
      endereco: inputEndereco.value.trim(),
      email: inputEmail.value.trim()
    };

    await excluirCliente(cpfOriginal);
    await adicionarClientes([clienteAtualizado]);

    await renderizarClientes();
    fecharModal();
  }

  async function excluirClienteSelecionado() {
    const radioSelecionado = document.querySelector('input[name="clienteSelecionado"]:checked');

    if (!radioSelecionado) {
      alert("Selecione um cliente para excluir.");
      return;
    }

    const cpf = radioSelecionado.value;
    const confirmar = confirm("Tem certeza que deseja excluir este cliente?");

    if (!confirmar) return;

    await excluirCliente(cpf);
    await renderizarClientes();

    alert("Cliente excluído com sucesso.");
  }

  btnNovo.addEventListener("click", abrirModalNovo);
  btnEditar.addEventListener("click", abrirModalEdicao);
  btnExcluir.addEventListener("click", excluirClienteSelecionado);
  btnCancelar.addEventListener("click", fecharModal);

  btnConfirmar.addEventListener("click", async () => {
    if (!validarCampos()) return;

    if (modoEdicao) {
      await salvarEdicaoCliente();
    } else {
      await salvarNovoCliente();
    }
  });

  pesquisa.addEventListener("input", async () => {
    await filtrarClientes();
  });

  await renderizarClientes();
});

async function renderizarClientes(lista = null) {
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
          name="clienteSelecionado"
          value="${cliente.cpf}"
        >
      </td>
      <td>${cliente.nome || ""}</td>
      <td>${cliente.cpf || ""}</td>
      <td>${cliente.telefone || ""}</td>
      <td>${cliente.endereco || ""}</td>
      <td>${cliente.email || ""}</td>
    `;

    tabelaBody.appendChild(tr);
  });
}

async function filtrarClientes() {
  const inputPesquisa = document.getElementById("pesquisa");
  if (!inputPesquisa) return;

  const termo = inputPesquisa.value.toLowerCase().trim();
  const clientes = await obterClientes();

  const filtrados = clientes.filter((cliente) =>
    (cliente.nome || "").toLowerCase().includes(termo) ||
    (cliente.cpf || "").toLowerCase().includes(termo)
  );

  await renderizarClientes(filtrados);
}