const pool = require('../conexao');
const { verificarPreenchimento } = require('../utils/verificacoes');
const { criptografarSenha } = require('../utils/criptografia');

const cadastrarUsuario = async (req, res) => {
    const { nome, email, senha } = req.body;

    if (verificarPreenchimento(nome) || verificarPreenchimento(email) || verificarPreenchimento(senha)) {
        return res.status(400).json({ mensagem: "Todos os campos são obrigatórios." });
    }

    try {
        const senhaCriptografada = await criptografarSenha(senha);

        const query = 
        `INSERT INTO usuarios
        (nome, email, senha) 
		VALUES 
		($1, $2, $3)
        RETURNING *`;

        const params = [nome, email, senhaCriptografada];

		const { rows } = await pool.query(query, params);

        const novoUsuario = {
            id: rows[0].id,
            nome: rows[0].nome,
            email: rows[0].email
        }

		return res.status(201).json(novoUsuario);
	} catch (error) {
		console.error(error.message);
		return res.status(400).json({ mensagem: "Já existe usuário cadastrado com o e-mail informado." });
	}
}

const detalharUsuario = async (req, res) => {
	const idToken = req.usuario.id;

	try {
		const { rowCount } = await pool.query(
			`SELECT * FROM usuarios 
            WHERE id = $1`,
			[idToken]
		);

		if (rowCount === 0) {
			return res.status(404).json({ mensagem: "Para acessar este recurso um token de autenticação válido deve ser enviado." });
		}

		const usuarioAutenticado = {
			id: idToken,
			nome: req.usuario.nome,
			email: req.usuario.email
		}

		return res.json(usuarioAutenticado);
	} catch (error) {
        console.error(message.error);
		return res.status(500).json({ mensagem: "Erro interno do servidor." });
	}
}

const atualizarUsuario = async (req, res) => {
	const idToken = req.usuario.id;
	const { nome, email, senha } = req.body;

    if (verificarPreenchimento(nome) || verificarPreenchimento(email) || verificarPreenchimento(senha)) {
        return res.status(400).json({ mensagem: "Todos os campos são obrigatórios." });
    }

	try {
		const { rowCount } = await pool.query(
			`SELECT * FROM usuarios 
            WHERE id = $1`,
			[idToken]
		);

		if (rowCount === 0) {
			return res.status(404).json({ mensagem: "Para acessar este recurso um token de autenticação válido deve ser enviado." });
		}

		const senhaCriptografada = await criptografarSenha(senha);

		await pool.query(
			`UPDATE usuarios 
            SET nome = $1, email = $2, senha = $3
            WHERE id = $4`,
			[ nome, email, senhaCriptografada, idToken ]
		);

		return res.status(204).send();
	} catch (error) {
        console.error(error.message);
		return res.status(500).json({ mensagem: "O e-mail informado já está sendo utilizado por outro usuário." });
	}
}

module.exports = {
    cadastrarUsuario,
    detalharUsuario,
    atualizarUsuario
}