const mysql = require('mysql2');
const con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gap_dev1163'
});

con.connect(err => {
  if(err) { console.error('Error connecting: ' + err.stack); return; }
  con.query('DESCRIBE formplant', (error, results) => {
      console.log("formplant:", results.map(r => r.Field));
      con.end();
  });
});
