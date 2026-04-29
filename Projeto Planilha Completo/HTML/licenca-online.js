const CHAVE_LOCAL = "licenca_sistema";

async function validarLicenca(chave) {
  try {
    if (!window.api || !window.api.validarLicenca) {
      return {
        valida: false,
        erro: "API interna do sistema não encontrada."
      };
    }

    return await window.api.validarLicenca(chave);
  } catch (erro) {
    return {
      valida: false,
      erro: "Erro interno ao validar licença."
    };
  }
}

function criarTelaLicenca() {
  if (document.getElementById("modal-licenca")) {
    return;
  }

  const fundo = document.createElement("div");
  fundo.id = "modal-licenca";

  fundo.innerHTML = `
    <div style="
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      font-family: Arial, sans-serif;
    ">
      <div style="
        background: #81cafc;
        color: #34495e;
        width: 420px;
        max-width: 90%;
        padding: 30px;
        border-radius: 14px;
        border: 3px solid #34495e;
        text-align: center;
        box-shadow: 0 8px 24px rgba(0,0,0,0.35);
      ">
        <h2 style="margin-top:0;">Ativação do Sistema</h2>

        <p>Digite sua chave de licença:</p>

        <input
          id="inputLicenca"
          type="password"
          placeholder="Digite sua licença"
          style="
            width: 90%;
            padding: 10px;
            font-size: 16px;
            border: 2px solid #34495e;
            border-radius: 6px;
            margin-bottom: 15px;
          "
        >

        <br>

        <button
          id="btnValidarLicenca"
          type="button"
          style="
            background: #34495e;
            color: rgb(215,248,250);
            border: 2px solid #34495e;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
          "
        >
          Validar
        </button>

        <p id="mensagemLicenca" style="margin-top:15px;"></p>
      </div>
    </div>
  `;

  document.body.appendChild(fundo);

  const input = document.getElementById("inputLicenca");
  const botao = document.getElementById("btnValidarLicenca");
  const mensagem = document.getElementById("mensagemLicenca");

  async function processarLicenca() {
    const chave = input.value.trim();

    if (!chave) {
      mensagem.textContent = "Digite uma licença.";
      mensagem.style.color = "#7a2f2f";
      return;
    }

    botao.disabled = true;
    botao.textContent = "Validando...";
    mensagem.textContent = "";

    const resultado = await validarLicenca(chave);

    if (resultado.valida) {
      localStorage.setItem(CHAVE_LOCAL, chave);

      mensagem.style.color = "#2d6a4f";
      mensagem.textContent = `Licença ativada: ${resultado.cliente}`;

      setTimeout(() => {
        fundo.remove();
      }, 800);
    } else {
      mensagem.style.color = "#7a2f2f";
      mensagem.textContent = resultado.erro || "Licença inválida.";
    }

    botao.disabled = false;
    botao.textContent = "Validar";
  }

  botao.addEventListener("click", processarLicenca);

  input.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
      processarLicenca();
    }
  });

  input.focus();
}

async function iniciarLicenca() {
  const chaveSalva = localStorage.getItem(CHAVE_LOCAL);

  if (chaveSalva) {
    const resultado = await validarLicenca(chaveSalva);

    if (resultado.valida) {
      return;
    }

    localStorage.removeItem(CHAVE_LOCAL);
  }

  criarTelaLicenca();
}

document.addEventListener("DOMContentLoaded", iniciarLicenca);