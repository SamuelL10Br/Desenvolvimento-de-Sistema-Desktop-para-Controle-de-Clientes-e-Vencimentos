const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {

  obterClientes: () =>
    ipcRenderer.invoke("clientes:listar"),

  adicionarClientes: (clientes) =>
    ipcRenderer.invoke("clientes:adicionar", clientes),

  excluirCliente: (cpf) =>
    ipcRenderer.invoke("clientes:excluir", cpf),

  atualizarCliente: (cpf, dados) =>
    ipcRenderer.invoke("clientes:atualizar", cpf, dados)

});