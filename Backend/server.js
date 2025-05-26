const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json()); // permite receber JSON

app.post('/users', (req, res) => {
  const { username, password } = req.body;
  const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
  db.query(sql, [username, password], (err, result) => {
    if (err) {
      console.error('Erro ao inserir usuário:', err);
      return res.status(500).send('Erro no servidor');
    }
    res.status(201).send('Usuário cadastrado com sucesso');
  });
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
