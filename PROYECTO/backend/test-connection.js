// test-connection.js
import mysql from "mysql2/promise";


async function test() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'hotel_user',
            password: '12345',
            database: 'hotel_vinedo'
        });
        
        console.log('✅ Conexión exitosa a MySQL');
        await connection.end();
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    }
}

test();