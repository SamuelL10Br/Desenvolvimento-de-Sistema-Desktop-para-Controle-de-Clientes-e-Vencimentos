const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  obterClientes: () => ipcRenderer.invoke("clientes:obter"),
  salvarClientes: (clientes) => ipcRenderer.invoke("clientes:salvar", clientes),
  recarregarClientes: () => ipcRenderer.invoke("clientes:recarregar"),
  storageGet: (chave) => ipcRenderer.invoke("storage:get", chave),
  storageSet: (chave, valor) => ipcRenderer.invoke("storage:set", chave, valor),
  validarLicenca: (chave) => ipcRenderer.invoke("licenca:validar", chave)
});