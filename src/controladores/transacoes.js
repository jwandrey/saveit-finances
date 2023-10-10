const pool = require('../conexao');
const { verificarPreenchimento, validarTipoTransacao, validarId } = require('../utils/verificacoes');

const listarCategorias = async (req, res) => {
    try {
		const { rows } = await pool.query(
            `SELECT * FROM categorias`
        );

		return res.json(rows);
	} catch (error) {
        console.error(error.message);
		return res.status(500).json({ mensagem: "Erro interno do servidor" });
	}
}

const listarTransacoes = async (req, res) => {
    const idToken = req.usuario.id;
    const { filtro } = req.query;

    try {
        let query = 
        `SELECT 
        t.id, t.tipo, t.descricao, t.valor, t.data, t.usuario_id, 
        c.id as categoria_id, c.descricao as categoria_nome
		FROM transacoes t 
		LEFT JOIN categorias c 
		ON t.categoria_id = c.id WHERE t.usuario_id = $1 `;

        let params = [ idToken ];

        if (filtro) {
            params = [ idToken, filtro ];
            query = query + `AND c.descricao ILIKE ANY($2)`;
        }

		const { rows } = await pool.query(query, params);

		const transacoes = rows.map(transacao => {
			return {
				id: transacao.id,
				tipo: transacao.tipo,
				descricao: transacao.descricao,
				valor: transacao.valor,
				data: transacao.data,
                usuario_id: transacao.usuario_id,
                categoria_id: transacao.categoria_id,
                categoria_nome: transacao.categoria_nome
			}
		});

		return res.json(transacoes);
	} catch (error) {
        console.error(error.message);
		return res.status(500).json({ mensagem: "Erro interno do servidor." });
	}
}

const obterExtrato = async (req, res) => {
    const idToken = req.usuario.id;
    let entrada = 0;
    let saida = 0;

    try {
        const queryEntradas = await pool.query(
        `SELECT SUM(valor) AS entradas 
        FROM transacoes 
        WHERE tipo = 'entrada' AND usuario_id = $1`,
        [ idToken ]
        );

        if (queryEntradas.rows[0].entradas !== 0) {
            entrada = Number(queryEntradas.rows[0].entradas);
        }

        const querySaidas = await pool.query(
        `SELECT SUM(valor) AS saidas 
        FROM transacoes 
        WHERE tipo = 'saida' AND usuario_id = $1`,
        [ idToken ]
        );

        if (querySaidas.rows[0].saidas !== 0) {
            saida = Number(querySaidas.rows[0].saidas);
        }

        const extrato = {
			entrada,
			saida
        }

		return res.json(extrato);
	} catch (error) {
        console.error(error.message);
		return res.status(500).json({ mensagem: "Erro interno do servidor." });
	}
}

const detalharTransacao = async (req, res) => {
    const idToken = req.usuario.id;
    const { id } = req.params;

    if (validarId(id)) {
        return res.status(400).json({ mensagem: "O id deve ser um número válido." });
    }

    try {
        const query = 
        `SELECT 
        t.id, t.tipo, t.descricao, t.valor, t.data, t.usuario_id, 
        c.id as categoria_id, c.descricao as categoria_nome
		FROM transacoes t 
		LEFT JOIN categorias c 
		ON t.categoria_id = c.id WHERE t.usuario_id = $1 AND t.id = $2`;

        const params = [ idToken, id ];

		const { rows, rowCount } = await pool.query(query, params);

        if (rowCount === 0) {
            return res.status(404).json({ mensagem: "Transação não encontrada." });
        }

		const transacao = {
				id: rows[0].id,
				tipo: rows[0].tipo,
				descricao: rows[0].descricao,
				valor: rows[0].valor,
				data: rows[0].data,
                usuario_id: rows[0].usuario_id,
                categoria_id: rows[0].categoria_id,
                categoria_nome: rows[0].categoria_nome
			};

		return res.json(transacao);
	} catch (error) {
        console.error(error.message);
		return res.status(500).json({ mensagem: "Erro interno do servidor" });
	}
}

const cadastrarTransacao = async (req, res) => {
    const idToken = req.usuario.id;
    const { descricao, valor, data, categoria_id, tipo } = req.body;

    if (verificarPreenchimento(descricao) || verificarPreenchimento(valor) || verificarPreenchimento(data) || verificarPreenchimento(categoria_id) || verificarPreenchimento(tipo)) {
        return res.status(400).json({ mensagem: "Todos os campos obrigatórios devem ser informados." });
    }

    if (!validarTipoTransacao(tipo)) {
        return res.status(400).json({ mensagem: "O tipo deve ser 'entrada' ou 'saida'." });
    }

    try {
        const categoriaExistente = await pool.query(
            `SELECT * FROM categorias
            WHERE id = $1`,
            [categoria_id]
        );

        if (categoriaExistente.rowCount === 0) {
            return res.status(400).json({ mensagem: "Não existe categoria cadastrada com o id informado." });
        }

        const queryTrans = 
        `INSERT INTO transacoes
        (descricao, valor, data, categoria_id, usuario_id, tipo) 
		VALUES 
		($1, $2, $3, $4, $5, $6)
        RETURNING *`;

        const paramsTrans = [ descricao, valor, data, categoria_id, idToken, tipo ];

		const { rows } = await pool.query(queryTrans, paramsTrans);

        const resultado = {
            id: rows[0].id,
            tipo: rows[0].tipo,
            descricao: rows[0].descricao,
            valor: rows[0].valor,
            data: rows[0].data,
            usuario_id: idToken,
            categoria_id: rows[0].categoria_id,
            categoria_nome: categoriaExistente.rows[0].descricao
        }

		return res.status(201).json(resultado);
	} catch (error) {
		console.error(error.message);
		return res.status(400).json({ mensagem: "Já existe usuário cadastrado com o e-mail informado." });
	}
}

const atualizarTransacao = async (req, res) => {
    const idToken = req.usuario.id;
    const { id } = req.params;
    const { descricao, valor, data, categoria_id, tipo } = req.body;

    if (verificarPreenchimento(descricao) || verificarPreenchimento(valor) || verificarPreenchimento(data) || verificarPreenchimento(categoria_id) || verificarPreenchimento(tipo)) {
        return res.status(400).json({ mensagem: "Todos os campos obrigatórios devem ser informados." });
    }

    if (!validarTipoTransacao(tipo)) {
        return res.status(400).json({ mensagem: "O tipo deve ser 'entrada' ou 'saida'." });
    }
    
    if (validarId(id)) {
        return res.status(400).json({ mensagem: "O id deve ser um número válido." });
    }

    try {
        const categoriaExistente = await pool.query(
            `SELECT * FROM categorias
            WHERE id = $1`,
            [categoria_id]
        );

        if (categoriaExistente.rowCount === 0) {
            return res.status(400).json({ mensagem: "Não existe categoria cadastrada com o id informado." });
        }

		const transacaoExistente = await pool.query(
			`SELECT * FROM transacoes
            WHERE id = $1 AND usuario_id = $2`,
			[ id, idToken ]
		);

		if (transacaoExistente.rowCount === 0) {
			return res.status(404).json({ mensagem: "Transação não encontrada." });
		}

		await pool.query(
			`UPDATE transacoes 
            SET descricao = $1, valor = $2, data = $3, categoria_id = $4, tipo = $5 
            WHERE id = $6`,
			[descricao, valor, data, categoria_id, tipo, id]
		);

		return res.status(204).send();
	} catch (error) {
        console.error(error.message);
		return res.status(500).json({ mensagem: "Já existe usuário cadastrado com o e-mail informado." });
	}
}

const excluirTransacao = async (req, res) => {
    const idToken = req.usuario.id;
    const { id } = req.params;

    if (validarId(id)) {
        return res.status(400).json({ mensagem: "O id deve ser um número válido." });
    }

    try {
        const transacaoExistente = await pool.query(
			`SELECT * FROM transacoes
            WHERE id = $1 AND usuario_id = $2`,
			[ id, idToken ]
		);

		if (transacaoExistente.rowCount === 0) {
			return res.status(404).json({ mensagem: "Transação não encontrada." });
		}

        await pool.query(
            `DELETE FROM transacoes
            WHERE id = $1`,
            [ id ]
        );

        return res.status(204).send();
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ mensagem: "Já existe usuário cadastrado com o e-mail informado." });
    }
}

module.exports = {
    listarCategorias,
    listarTransacoes,
    obterExtrato,
    detalharTransacao,
    cadastrarTransacao,
    atualizarTransacao,
    excluirTransacao
}