// create_db.js
const mysql = require('mysql2/promise');

async function main() {
  try {
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',   // if you set a root password, put it here
      port: 3306
    });

    console.log('Connected to MySQL');

    // Create database & table
    await conn.query('CREATE DATABASE IF NOT EXISTS placehub');
    await conn.query('USE placehub');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company VARCHAR(100),
        role VARCHAR(100),
        location VARCHAR(100),
        postedOn DATE,
        status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
        salary VARCHAR(50),
        description TEXT
      )
    `);

    await conn.query(`
      INSERT INTO jobs (company, role, location, postedOn, status, salary, description)
      VALUES
      ('TCS', 'Software Developer', 'Bangalore', '2024-06-19', 'Pending', '₹4.5-6.5 LPA', 'Looking for fresh graduates with strong programming skills'),
      ('Infosys', 'Quality Analyst', 'Hyderabad', '2024-06-17', 'Approved', '₹3.5-5.0 LPA', 'QA role for testing web and mobile applications')
    `);

    console.log('Database and table created (and sample rows inserted).');
    await conn.end();
  } catch (err) {
    console.error('Error:', err.message || err);
  }
}

main();
