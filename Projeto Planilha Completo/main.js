const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");

/*
  Modo de compatibilidade máxima para evitar bugs visuais no renderer.
*/
app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-gpu-compositing");
app.commandLine.appendSwitch("disable-direct-composition");
app.commandLine.appendSwitch("disable-features", "UseSkiaRenderer,CanvasOopRasterization,CalculateNativeWinOcclusion,BackForwardCache");
app.commandLine.appendSwitch("enable-unsafe-swiftshader");

let janelaPrincipal = null;

const PASTA_DADOS = path.join(app.getPath("userData"), "dados");
const ARQUIVO_CLIENTES = path.join(PASTA_DADOS, "clientes.json");

let filaDeSalvamento = Promise.resolve();

async function garantirEstrutura() {
  if (!fs.existsSync(PASTA_DADOS)) {
    fs.mkdirSync(PASTA_DADOS, { recursive: true });
  }

  if (!fs.existsSync(ARQUIVO_CLIENTES)) {
    fs.writeFileSync(ARQUIVO_CLIENTES, "[]", "utf-8");
  }
}

async function lerClientesDoArquivo() {
  await garantirEstrutura();

  try {
    const conteudo = await fsp.readFile(ARQUIVO_CLIENTES, "utf-8");
    const dados = JSON.parse(conteudo);
    return Array.isArray(dados) ? dados : [];
  } catch (erro) {
    console.error("Erro ao ler arquivo de clientes:", erro);
    return [];
  }
}

async function salvarClientesNoArquivo(clientes) {
  await garantirEstrutura();

  const dadosValidos = Array.isArray(clientes) ? clientes : [];
  const conteudo = JSON.stringify(dadosValidos, null, 2);

  await fsp.writeFile(ARQUIVO_CLIENTES, conteudo, "utf-8");
  return true;
}

function salvarClientesEmFila(clientes) {
  filaDeSalvamento = filaDeSalvamento
    .then(async () => {
      await salvarClientesNoArquivo(clientes);
      return true;
    })
    .catch(async (erro) => {
      console.error("Erro na fila de salvamento:", erro);
      throw erro;
    });

  return filaDeSalvamento;
}

function criarJanela() {
  janelaPrincipal = new BrowserWindow({
    width: 1600,
    height: 950,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: "#d7f8fa",
    show: false,
    autoHideMenuBar: true,
    paintWhenInitiallyHidden: true,
    useContentSize: true,
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
    if (janelaPrincipal) {
      janelaPrincipal.show();
      janelaPrincipal.focus();
    }
  });

  janelaPrincipal.on("unresponsive", () => {
    console.error("Janela ficou sem resposta.");
  });

  janelaPrincipal.webContents.on("render-process-gone", (_event, details) => {
    console.error("Renderer caiu:", details);
  });

  janelaPrincipal.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
  });

  janelaPrincipal.on("closed", () => {
    janelaPrincipal = null;
  });
}

app.whenReady().then(async () => {
  await garantirEstrutura();

  ipcMain.handle("clientes:obter", async () => {
    return await lerClientesDoArquivo();
  });

  ipcMain.handle("clientes:salvar", async (_event, clientes) => {
    return await salvarClientesEmFila(clientes);
  });

  ipcMain.handle("clientes:recarregar", async () => {
    return await lerClientesDoArquivo();
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