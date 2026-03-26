document.addEventListener("DOMContentLoaded", () => {
  const btnEditar = document.getElementById("btn-editar");
  const modal = document.getElementById("modal-editar");
  const btnConfirmar = document.getElementById("btn-confirmar");
  const btnCancelar = document.getElementById("btn-cancelar");

  const inputNome = document.getElementById("edit-nome");
  const inputCpf = document.getElementById("edit-cpf");
  const inputVencimento = document.getElementById("edit-vencimento");
  const inputStatus = document.getElementById("edit-status");

  let linhaSelecionada = null;

  function calcularDiasParaVencer(dataISO) {
    const hoje = new Date();
    const vencimento = new Date(dataISO + "T00:00:00");
    hoje.setHours(0, 0, 0, 0);
    const diferenca = vencimento - hoje;
    return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
  }

  btnEditar.addEventListener("click", () => {
    const radioSelecionado = document.querySelector('input[name="selecionado"]:checked');

    if (!radioSelecionado) {
      alert("Selecione um cliente para editar.");
      return;
    }

    linhaSelecionada = radioSelecionado.closest("tr");
    const colunas = linhaSelecionada.querySelectorAll("td");

    inputNome.value = colunas[1].textContent.trim();
    inputCpf.value = colunas[2].textContent.trim();
    inputVencimento.value = colunas[3].textContent.trim();
    inputStatus.value = colunas[4].textContent.trim();

    modal.classList.remove("hidden");
  });

  btnCancelar.addEventListener("click", () => {
    modal.classList.add("hidden");
    linhaSelecionada = null;
  });

  btnConfirmar.addEventListener("click", () => {
    if (!linhaSelecionada) return;

    const nome = inputNome.value.trim();
    const cpf = inputCpf.value.trim();
    const vencimento = inputVencimento.value;
    const status = inputStatus.value;

    if (!nome || !cpf || !vencimento || !status) {
      alert("Preencha todos os campos.");
      return;
    }

    const dias = calcularDiasParaVencer(vencimento);
    const colunas = linhaSelecionada.querySelectorAll("td");

    colunas[1].textContent = nome;
    colunas[2].textContent = cpf;
    colunas[3].textContent = vencimento;
    colunas[4].textContent = status;
    colunas[5].textContent = dias;

    modal.classList.add("hidden");
    linhaSelecionada = null;
  });
});