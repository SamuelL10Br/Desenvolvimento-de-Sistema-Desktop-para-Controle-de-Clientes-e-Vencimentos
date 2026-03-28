const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const db = require("./db");

function criarJanela() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Planilha Medeiros e Moreira 1.0",
    icon: path.join(__dirname, "Build", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, "HTML", "index.html"));
}

app.whenReady().then(async () => {
  await db.inicializarBanco(app);
  criarJanela();
});

ipcMain.handle("clientes:listar", async () => {
  return await db.obterClientes();
});

ipcMain.handle("clientes:adicionar", async (_, clientes) => {
  return await db.adicionarClientes(clientes);
});

ipcMain.handle("clientes:excluir", async (_, cpf) => {
  return await db.excluirCliente(cpf);
});

ipcMain.handle("clientes:atualizar", async (_, cpf, dados) => {
  return await db.atualizarCliente(cpf, dados);
});