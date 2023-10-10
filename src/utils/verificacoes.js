const verificarPreenchimento = (item) => {
    return !item;
}

const validarTipoTransacao = (tipo) => {
    return ( tipo === "entrada" || tipo === "saida" );
}

const validarId = (id) => {
    return isNaN(id);
}

module.exports = {
    verificarPreenchimento,
    validarTipoTransacao,
    validarId
}