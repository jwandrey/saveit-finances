const pool = require('../conexao');
const jwt = require('jsonwebtoken');
const senhaSegura = require('../senhaSegura');
const { verificarPreenchimento } = require('../utils/verificacoes');
const { validarSenha } = require('../utils/criptografia');

const login = async (req, res) => {
    const { email, senha } = req.body;

    if (verificarPreenchimento(email) || verificarPreenchimento(senha)) {
        return res.status(400).json({ mensagem: "Todos os campos são obrigatórios." });
    }

    try {
        const query = 
        `SELECT * FROM usuarios
		WHERE email = $1`;

        const params = [ email ];

        const { rows, rowCount } = await pool.query(query, params);

        if (rowCount < 1) {
            return res.status(404).json({ mensagem: "Usuário e/ou senha inválido(s)." });
        }

        const senhaValida = await validarSenha(senha, rows[0].senha);

        if (!senhaValida) {
            return res.status(404).json({ mensagem: "Usuário e/ou senha inválido(s)." });
        }

        const token = jwt.sign({ id: rows[0].id }, senhaSegura, { expiresIn: '8h'});

        const usuario = {
            usuario: {
                id: rows[0].id,
                nome: rows[0].nome,
                email: rows[0].email
            },
            token
        }

        return res.status(200).json(usuario);
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ mensagem: "Erro interno do servidor" });
    }
}

module.exports = login;