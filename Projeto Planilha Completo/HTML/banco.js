async function obterClientes() {
  return await window.api.obterClientes();
}

async function adicionarClientes(clientes) {
  return await window.api.adicionarClientes(clientes);
}

async function excluirCliente(cpf) {
  return await window.api.excluirCliente(cpf);
}

async function atualizarCliente(cpf, dados) {
  return await window.api.atualizarCliente(cpf, dados);
}