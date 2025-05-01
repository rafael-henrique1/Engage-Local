const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',  // Usuário do MySQL
  password: 'EngageLocal@2025',  // Substitua por sua senha do MySQL
  database: 'engage_local'  // O banco de dados que você criou
});

db.connect((err) => {
  if (err) {
    console.error('Erro de conexão: ' + err.stack);
    return;
  }
  console.log('Conectado ao banco de dados!');
});

module.exports = db;
