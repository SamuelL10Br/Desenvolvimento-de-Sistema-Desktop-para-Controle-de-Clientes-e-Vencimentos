let modoEdicao = false;
let cpfOriginal = "";
let clientesCache = [];

function garantirToastContainer() {
  let container = document.getElementById("toast-container");

  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  return container;
}

function mostrarToast(mensagem, tipo) {
  const container = garantirToastContainer();
  const toast = document.createElement("div");

  toast.className = "toast toast-" + tipo;
  toast.textContent = mensagem;

  container.appendChild(toast);

  setTimeout(function () {
    toast.classList.add("toast-show");
  }, 20);

  setTimeout(function () {
    toast.classList.remove("toast-show");

    setTimeout(function () {
      toast.remove();
    }, 250);
  }, 2600);
}

function mostrarErro(mensagem) {
  mostrarToast(mensagem, "error");
}

function mostrarSucesso(mensagem) {
  mostrarToast(mensagem, "success");
}

function confirmarComDesign(mensagem) {
  return new Promise(function (resolve) {
    let overlay = document.getElementById("confirm-overlay");

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "confirm-overlay";
      overlay.innerHTML = `
        <div class="confirm-box">
          <h3>Confirmação</h3>
          <p id="confirm-message"></p>
          <div class="confirm-actions">
            <button id="confirm-no" type="button">Cancelar</button>
            <button id="confirm-yes" type="button">Confirmar</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    const mensagemElemento = overlay.querySelector("#confirm-message");
    const btnCancelar = overlay.querySelector("#confirm-no");
    const btnConfirmar = overlay.querySelector("#confirm-yes");

    mensagemElemento.textContent = mensagem;
    overlay.classList.add("confirm-open");
    document.body.classList.add("modal-aberto");

    function fechar(resultado) {
      overlay.classList.remove("confirm-open");
      document.body.classList.remove("modal-aberto");

      btnCancelar.removeEventListener("click", cancelar);
      btnConfirmar.removeEventListener("click", confirmar);
      overlay.removeEventListener("click", clicarFora);

      resolve(resultado);
    }

    function cancelar() {
      fechar(false);
    }

    function confirmar() {
      fechar(true);
    }

    function clicarFora(evento) {
      if (evento.target === overlay) {
        fechar(false);
      }
    }

    btnCancelar.addEventListener("click", cancelar);
    btnConfirmar.addEventListener("click", confirmar);
    overlay.addEventListener("click", clicarFora);
  });
}

function limparCPF(cpf) {
  return String(cpf || "").replace(/[^0-9]/g, "").slice(0, 11);
}

function limparTelefone(telefone) {
  return String(telefone || "").replace(/[^0-9]/g, "").slice(0, 11);
}

function formatarCPF(cpf) {
  const numeros = limparCPF(cpf);

  if (numeros.length !== 11) {
    return numeros;
  }

  return (
    numeros.slice(0, 3) +
    "." +
    numeros.slice(3, 6) +
    "." +
    numeros.slice(6, 9) +
    "-" +
    numeros.slice(9, 11)
  );
}

function formatarTelefone(telefone) {
  const numeros = limparTelefone(telefone);

  if (numeros.length === 10) {
    return "(" + numeros.slice(0, 2) + ") " + numeros.slice(2, 6) + "-" + numeros.slice(6, 10);
  }

  if (numeros.length === 11) {
    return "(" + numeros.slice(0, 2) + ") " + numeros.slice(2, 7) + "-" + numeros.slice(7, 11);
  }

  return numeros;
}

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function converterValorParaNumero(valor) {
  const texto = String(valor || "")
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  if (!texto) {
    return 0;
  }

  const numero = Number(texto);
  return Number.isNaN(numero) ? null : numero;
}

function obterSelecionados() {
  return Array.from(
    document.querySelectorAll('input[name="clienteSelecionado"]:checked')
  ).map(function (checkbox) {
    return limparCPF(checkbox.value);
  });
}

function limparFormulario() {
  document.getElementById("input-nome").value = "";
  document.getElementById("input-cpf").value = "";
  document.getElementById("input-telefone").value = "";
  document.getElementById("input-endereco").value = "";
  document.getElementById("input-email").value = "";
  document.getElementById("input-valor").value = "";
  document.getElementById("input-vencimento").value = "";
  document.getElementById("input-status-pagamento").value = "Pendente";
  document.getElementById("input-ativo").value = "Ativo";
  document.getElementById("input-ultimo-pagamento").value = "";
}

function abrirModalNovo() {
  modoEdicao = false;
  cpfOriginal = "";

  document.getElementById("modal-titulo").textContent = "Novo Cliente";
  limparFormulario();

  document.body.classList.add("modal-aberto");
  document.getElementById("modal-cliente").classList.remove("hidden");
  document.getElementById("input-nome").focus();
}

function abrirModalEdicao() {
  const selecionados = obterSelecionados();

  if (selecionados.length === 0) {
    mostrarErro("Selecione um cliente para editar.");
    return;
  }

  if (selecionados.length > 1) {
    mostrarErro("Selecione apenas um cliente para editar.");
    return;
  }

  const cliente = clientesCache.find(function (item) {
    return limparCPF(item.cpf) === selecionados[0];
  });

  if (!cliente) {
    mostrarErro("Cliente não encontrado.");
    return;
  }

  modoEdicao = true;
  cpfOriginal = limparCPF(cliente.cpf);

  document.getElementById("modal-titulo").textContent = "Editar Cliente";
  document.getElementById("input-nome").value = cliente.nome || "";
  document.getElementById("input-cpf").value = formatarCPF(cliente.cpf || "");
  document.getElementById("input-telefone").value = formatarTelefone(cliente.telefone || "");
  document.getElementById("input-endereco").value = cliente.endereco || "";
  document.getElementById("input-email").value = cliente.email || "";
  document.getElementById("input-valor").value = cliente.valor || "";
  document.getElementById("input-vencimento").value = cliente.vencimento || "";
  document.getElementById("input-status-pagamento").value = cliente.statusPagamento || "Pendente";
  document.getElementById("input-ativo").value = cliente.ativo || "Ativo";
  document.getElementById("input-ultimo-pagamento").value = cliente.ultimoPagamento || "";

  document.body.classList.add("modal-aberto");
  document.getElementById("modal-cliente").classList.remove("hidden");
  document.getElementById("input-nome").focus();
}

function fecharModal() {
  document.body.classList.remove("modal-aberto");
  document.getElementById("modal-cliente").classList.add("hidden");

  limparFormulario();
  modoEdicao = false;
  cpfOriginal = "";
}

function validarFormulario() {
  const nome = document.getElementById("input-nome").value.trim();
  const cpf = limparCPF(document.getElementById("input-cpf").value);
  const telefone = limparTelefone(document.getElementById("input-telefone").value);
  const endereco = document.getElementById("input-endereco").value.trim();
  const email = document.getElementById("input-email").value.trim();
  const valor = converterValorParaNumero(document.getElementById("input-valor").value);

  if (!nome || !cpf || !telefone || !endereco || !email) {
    mostrarErro("Preencha todos os campos obrigatórios.");
    return false;
  }

  if (cpf.length !== 11) {
    mostrarErro("CPF inválido. Digite 11 números.");
    return false;
  }

  if (telefone.length < 10 || telefone.length > 11) {
    mostrarErro("Telefone inválido.");
    return false;
  }

  if (valor === null) {
    mostrarErro("Informe um valor válido.");
    return false;
  }

  return true;
}

function montarClienteDoFormulario() {
  return {
    nome: document.getElementById("input-nome").value.trim(),
    cpf: limparCPF(document.getElementById("input-cpf").value),
    telefone: limparTelefone(document.getElementById("input-telefone").value),
    endereco: document.getElementById("input-endereco").value.trim(),
    email: document.getElementById("input-email").value.trim(),
    valor: converterValorParaNumero(document.getElementById("input-valor").value),
    vencimento: document.getElementById("input-vencimento").value,
    statusPagamento: document.getElementById("input-status-pagamento").value,
    ativo: document.getElementById("input-ativo").value,
    ultimoPagamento: document.getElementById("input-ultimo-pagamento").value,
    diasAtrasoManual: ""
  };
}

async function salvarCliente() {
  if (!validarFormulario()) {
    return;
  }

  const cliente = montarClienteDoFormulario();
  const cpfNovo = limparCPF(cliente.cpf);

  const existeCpf = clientesCache.some(function (item) {
    const cpfAtual = limparCPF(item.cpf);

    if (modoEdicao) {
      return cpfAtual === cpfNovo && cpfAtual !== cpfOriginal;
    }

    return cpfAtual === cpfNovo;
  });

  if (existeCpf) {
    mostrarErro("Já existe um cliente com esse CPF.");
    return;
  }

  if (modoEdicao) {
    clientesCache = clientesCache.map(function (item) {
      return limparCPF(item.cpf) === cpfOriginal ? cliente : item;
    });

    await salvarClientes(clientesCache);
    mostrarSucesso("Cliente editado com sucesso.");
  } else {
    clientesCache.push(cliente);
    await salvarClientes(clientesCache);
    mostrarSucesso("Cliente cadastrado com sucesso.");
  }

  fecharModal();
  await carregarClientes();
}

async function excluirClientesSelecionados() {
  const selecionados = obterSelecionados();

  if (selecionados.length === 0) {
    mostrarErro("Selecione pelo menos um cliente para excluir.");
    return;
  }

  const confirmado = await confirmarComDesign(
    "Deseja excluir " + selecionados.length + " cliente(s)?"
  );

  if (!confirmado) {
    return;
  }

  clientesCache = clientesCache.filter(function (cliente) {
    return !selecionados.includes(limparCPF(cliente.cpf));
  });

  await salvarClientes(clientesCache);
  mostrarSucesso("Cliente(s) excluído(s) com sucesso.");
  await carregarClientes();
}

function clienteCombinaComPesquisa(cliente, termo) {
  const termoTexto = normalizarTexto(termo);
  const termoCpf = limparCPF(termo);

  const nome = normalizarTexto(cliente.nome);
  const cpf = limparCPF(cliente.cpf);
  const telefone = normalizarTexto(cliente.telefone);
  const endereco = normalizarTexto(cliente.endereco);
  const email = normalizarTexto(cliente.email);

  return (
    nome.includes(termoTexto) ||
    email.includes(termoTexto) ||
    telefone.includes(termoTexto) ||
    endereco.includes(termoTexto) ||
    (termoCpf.length > 0 && cpf.includes(termoCpf))
  );
}

function escaparHtml(valor) {
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderizarTabela(clientes) {
  const corpoTabela = document.getElementById("tabela-body");
  corpoTabela.innerHTML = "";

  if (clientes.length === 0) {
    corpoTabela.innerHTML = `
      <tr>
        <td colspan="6" class="mensagem-vazia">Nenhum cliente cadastrado.</td>
      </tr>
    `;
    return;
  }

  clientes.forEach(function (cliente) {
    const linha = document.createElement("tr");
    const cpfLimpo = limparCPF(cliente.cpf);

    linha.innerHTML = `
      <td>
        <input
          class="checkbox-cliente"
          type="checkbox"
          name="clienteSelecionado"
          value="${cpfLimpo}"
        >
      </td>
      <td>${escaparHtml(cliente.nome)}</td>
      <td>${formatarCPF(cliente.cpf)}</td>
      <td>${formatarTelefone(cliente.telefone)}</td>
      <td>${escaparHtml(cliente.endereco)}</td>
      <td>${escaparHtml(cliente.email)}</td>
    `;

    corpoTabela.appendChild(linha);
  });
}

function aplicarPesquisa() {
  const termo = document.getElementById("pesquisa").value.trim();

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

  clientesCache = Array.isArray(clientes)
    ? clientes.slice().sort(function (a, b) {
        return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
      })
    : [];

  aplicarPesquisa();
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("btn-novo").addEventListener("click", abrirModalNovo);
  document.getElementById("btn-editar").addEventListener("click", abrirModalEdicao);
  document.getElementById("btn-excluir").addEventListener("click", excluirClientesSelecionados);
  document.getElementById("btn-cancelar").addEventListener("click", fecharModal);
  document.getElementById("btn-confirmar").addEventListener("click", salvarCliente);
  document.getElementById("pesquisa").addEventListener("input", aplicarPesquisa);

  document.getElementById("input-cpf").addEventListener("input", function (evento) {
    evento.target.value = formatarCPF(evento.target.value);
  });

  document.getElementById("input-telefone").addEventListener("input", function (evento) {
    evento.target.value = formatarTelefone(evento.target.value);
  });

  carregarClientes();
});