// diagnostico.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function diagnosticoCompleto() {
  console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO\n');

  // 1. Verificar variables de entorno
  console.log('1. 📋 Variables de entorno:');
  console.log('   DB_HOST:', process.env.DB_HOST || 'No definido (usará default)');
  console.log('   DB_USER:', process.env.DB_USER || 'No definido (usará default)');
  console.log('   DB_NAME:', process.env.DB_NAME || 'No definido (usará default)');
  console.log('   PORT:', process.env.PORT || '5000 (default)');

  // 2. Probar conexión directa
  console.log('\n2. 🗄️ Probando conexión directa a MySQL...');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'hotel_user',
      password: process.env.DB_PASSWORD || '12345',
      database: process.env.DB_NAME || 'hotel_vinedo'
    });
    
    console.log('   ✅ Conexión directa exitosa');
    
    // 3. Verificar tablas
    console.log('\n3. 📊 Verificando tablas en la base de datos...');
    const [tablas] = await connection.execute('SHOW TABLES');
    console.log('   Tablas encontradas:', tablas.map(t => Object.values(t)[0]));
    
    // 4. Verificar datos en habitaciones
    console.log('\n4. 🏨 Verificando habitaciones...');
    const [habitaciones] = await connection.execute('SELECT COUNT(*) as total FROM habitaciones');
    console.log('   Total habitaciones:', habitaciones[0].total);
    
    // 5. Verificar datos en usuarios
    console.log('\n5. 👥 Verificando usuarios...');
    const [usuarios] = await connection.execute('SELECT username, role FROM usuarios');
    console.log('   Usuarios encontrados:');
    usuarios.forEach(user => {
      console.log(`     - ${user.username} (${user.role})`);
    });
    
    await connection.end();
    
  } catch (error) {
    console.log('   ❌ Error en conexión directa:', error.message);
    console.log('\n💡 SOLUCIÓN: Verifica que:');
    console.log('   - MySQL esté ejecutándose');
    console.log('   - El usuario "hotel_user" exista y tenga permisos');
    console.log('   - La base de datos "hotel_vinedo" exista');
    console.log('   - Las credenciales en .env o server.js sean correctas');
  }

  console.log('\n🎯 DIAGNÓSTICO COMPLETADO');
}

diagnosticoCompleto();