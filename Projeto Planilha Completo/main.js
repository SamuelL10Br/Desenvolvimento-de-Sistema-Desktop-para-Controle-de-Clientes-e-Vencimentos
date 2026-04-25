const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");

let janelaPrincipal = null;

const PASTA_DADOS = path.join(app.getPath("userData"), "dados");
const ARQUIVO_CLIENTES = path.join(PASTA_DADOS, "clientes.json");
const ARQUIVO_CONFIG = path.join(PASTA_DADOS, "config.json");

let filaDeSalvamento = Promise.resolve();

async function garantirEstrutura() {
  if (!fs.existsSync(PASTA_DADOS)) {
    fs.mkdirSync(PASTA_DADOS, { recursive: true });
  }

  if (!fs.existsSync(ARQUIVO_CLIENTES)) {
    fs.writeFileSync(ARQUIVO_CLIENTES, "[]", "utf-8");
  }

  if (!fs.existsSync(ARQUIVO_CONFIG)) {
    fs.writeFileSync(ARQUIVO_CONFIG, "{}", "utf-8");
  }
}

async function lerJsonSeguro(caminho, fallback) {
  try {
    const conteudo = await fsp.readFile(caminho, "utf-8");
    return JSON.parse(conteudo);
  } catch (erro) {
    console.error(`Erro ao ler ${caminho}:`, erro);
    return fallback;
  }
}

async function escreverJsonSeguro(caminho, dados) {
  const conteudo = JSON.stringify(dados, null, 2);
  await fsp.writeFile(caminho, conteudo, "utf-8");
  return true;
}

async function lerClientesDoArquivo() {
  await garantirEstrutura();
  const dados = await lerJsonSeguro(ARQUIVO_CLIENTES, []);
  return Array.isArray(dados) ? dados : [];
}

async function salvarClientesNoArquivo(clientes) {
  await garantirEstrutura();
  const dadosValidos = Array.isArray(clientes) ? clientes : [];
  return escreverJsonSeguro(ARQUIVO_CLIENTES, dadosValidos);
}

function salvarClientesEmFila(clientes) {
  filaDeSalvamento = filaDeSalvamento
    .then(() => salvarClientesNoArquivo(clientes))
    .catch((erro) => {
      console.error("Erro na fila de salvamento:", erro);
      throw erro;
    });

  return filaDeSalvamento;
}

async function lerConfig() {
  await garantirEstrutura();
  const dados = await lerJsonSeguro(ARQUIVO_CONFIG, {});
  return dados && typeof dados === "object" ? dados : {};
}

async function salvarConfig(config) {
  await garantirEstrutura();
  const dados = config && typeof config === "object" ? config : {};
  return escreverJsonSeguro(ARQUIVO_CONFIG, dados);
}

function criarJanela() {
  janelaPrincipal = new BrowserWindow({
    width: 1600,
    height: 950,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: "#d7f8fa",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      devTools: true,
      backgroundThrottling: false,
      spellcheck: false
    }
  });

  janelaPrincipal.loadFile(path.join(__dirname, "HTML", "index.html"));

  janelaPrincipal.once("ready-to-show", () => {
    janelaPrincipal.show();
    janelaPrincipal.focus();
  });

  janelaPrincipal.on("closed", () => {
    janelaPrincipal = null;
  });
}

app.whenReady().then(async () => {
  await garantirEstrutura();

  ipcMain.handle("clientes:obter", async () => {
    return lerClientesDoArquivo();
  });

  ipcMain.handle("clientes:salvar", async (_event, clientes) => {
    return salvarClientesEmFila(clientes);
  });

  ipcMain.handle("clientes:recarregar", async () => {
    return lerClientesDoArquivo();
  });

  ipcMain.handle("storage:get", async (_event, chave) => {
    const config = await lerConfig();
    return config[chave];
  });

  ipcMain.handle("storage:set", async (_event, chave, valor) => {
    const config = await lerConfig();
    config[chave] = valor;
    await salvarConfig(config);
    return true;
  });

  criarJanela();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      criarJanela();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});