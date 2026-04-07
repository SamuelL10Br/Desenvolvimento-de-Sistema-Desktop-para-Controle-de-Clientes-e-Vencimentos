const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  obterClientes: () => ipcRenderer.invoke("clientes:obter"),
  salvarClientes: (clientes) => ipcRenderer.invoke("clientes:salvar", clientes),
  recarregarClientes: () => ipcRenderer.invoke("clientes:recarregar")
});