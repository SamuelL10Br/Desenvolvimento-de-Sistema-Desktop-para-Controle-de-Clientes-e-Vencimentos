const URL_SERVIDOR = "https://licenca-api-eta.vercel.app/api/validar";
const CHAVE_LOCAL = "licenca_sistema";

async function validarLicenca(chave) {
  try {
    const resposta = await fetch(`${URL_SERVIDOR}?licenca=${encodeURIComponent(chave)}`, {
      method: "GET",
      cache: "no-store"
    });

    if (!resposta.ok) {
      throw new Error(`HTTP ${resposta.status}`);
    }

    return await resposta.json();
  } catch (erro) {
    console.error("Erro real da licença:", erro);
    alert("Erro ao validar licença.");
    return { valida: false, erro: "Erro ao validar licença." };
  }
}

function criarTelaLicenca() {
  if (document.getElementById("modal-licenca")) return;

  const fundo = document.createElement("div");
  fundo.id = "modal-licenca";
  fundo.style.position = "fixed";
  fundo.style.top = "0";
  fundo.style.left = "0";
  fundo.style.width = "100%";
  fundo.style.height = "100%";
  fundo.style.background = "rgba(0,0,0,0.65)";
  fundo.style.display = "flex";
  fundo.style.justifyContent = "center";
  fundo.style.alignItems = "center";
  fundo.style.zIndex = "99999";

  const caixa = document.createElement("div");
  caixa.style.background = "#ffffff";
  caixa.style.padding = "30px";
  caixa.style.borderRadius = "12px";
  caixa.style.boxShadow = "0 0 20px rgba(0,0,0,0.3)";
  caixa.style.textAlign = "center";
  caixa.style.minWidth = "340px";
  caixa.style.fontFamily = "Arial, sans-serif";

  caixa.innerHTML = `
    <h2 style="margin:0 0 12px 0;">Ativação do Sistema</h2>
    <p style="margin:0 0 15px 0;">Digite sua chave de licença:</p>
    <input
      id="inputLicenca"
      type="password"
      placeholder="Digite sua licença"
      style="width:90%;padding:10px;font-size:16px;margin-bottom:15px;"
    />
    <br>
    <button
      id="btnValidarLicenca"
      style="padding:10px 20px;font-size:16px;cursor:pointer;"
    >
      Validar
    </button>
  `;

  fundo.appendChild(caixa);
  document.body.appendChild(fundo);

  const input = document.getElementById("inputLicenca");
  const botao = document.getElementById("btnValidarLicenca");

  async function processarLicenca() {
    const chave = input.value.trim();

    if (!chave) {
      alert("Digite uma licença.");
      return;
    }

    const resultado = await validarLicenca(chave);

    if (resultado.valida) {
      localStorage.setItem(CHAVE_LOCAL, chave);

      alert(
        `Licença ativada com sucesso!\nCliente: ${resultado.cliente}\nValidade: ${resultado.expiraEm}`
      );

      fundo.remove();
    } else {
      alert(resultado.erro || "Licença inválida.");
    }
  }

  botao.addEventListener("click", processarLicenca);

  input.addEventListener("keydown", (evento) => {
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