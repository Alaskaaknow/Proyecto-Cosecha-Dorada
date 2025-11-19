// server-completo-corregido.js - VERSIÓN CON SISTEMA DE DISPONIBILIDAD CORREGIDO
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

// Configurar dotenv primero
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log("🔄 Iniciando servidor backend...");

// Middleware CORS MEJORADO
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "hotel_vinedo",
  port: process.env.DB_PORT || 3306,
};

console.log("🔗 Configurando conexión a BD:", {
  host: dbConfig.host,
  database: dbConfig.database,
  user: dbConfig.user
});

// Crear pool de conexiones
let pool;

// =============================================
// 🗄️ FUNCIÓN CORREGIDA PARA INICIALIZAR BD
// =============================================
async function inicializarBD() {
  try {
    pool = mysql.createPool(dbConfig);

    // Probar la conexión inmediatamente
    const connection = await pool.getConnection();
    console.log("✅ Conexión a MySQL exitosa");
    connection.release();

    return true;
  } catch (error) {
    console.error("❌ Error creando pool MySQL:", error.message);
    return false;
  }
}

// =============================================
// 🚀 FUNCIÓN PARA INICIAR EL SERVIDOR
// =============================================
async function iniciarServidor() {
  console.log('🔄 Inicializando servidor...');

  // 1. Primero inicializar la base de datos
  console.log('🗄️ Inicializando base de datos...');
  const bdInicializada = await inicializarBD();

  if (!bdInicializada) {
    console.error('❌ NO SE PUEDE INICIAR EL SERVIDOR - Error de base de datos');
    console.log('💡 Verifica que:');
    console.log('   - MySQL esté ejecutándose');
    console.log('   - La base de datos "hotel_vinedo" exista');
    console.log('   - El usuario y contraseña sean correctos');
    process.exit(1);
  }

  console.log('✅ Base de datos inicializada correctamente');

  // 2. Configurar email transporter (opcional)
  const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'tu_email@gmail.com',
      pass: process.env.EMAIL_PASS || 'tu_password_app'
    }
  });

  console.log('✅ Servidor configurado correctamente');

  // 3. Iniciar el servidor web
  app.listen(PORT, () => {
    console.log(`\n🎉 ==========================================`);
    console.log(`✅ BACKEND INICIADO EXITOSAMENTE`);
    console.log(`📍 Puerto: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🌐 URL: http://127.0.0.1:${PORT}`);
    console.log(`📊 Endpoints principales:`);
    console.log(`   GET  /                              - Test del servidor`);
    console.log(`   GET  /api/test                      - Test de la API`);
    console.log(`   GET  /api/db-test                   - Test de la base de datos`);
    console.log(`   GET  /api/habitaciones              - Todas las habitaciones`);
    console.log(`   GET  /api/habitaciones-con-reservas - Habitaciones con info de reservas`);
    console.log(`   POST /api/habitaciones              - Crear habitación`);
    console.log(`   PUT  /api/habitaciones/:id          - Actualizar habitación`);
    console.log(`   PATCH /api/habitaciones/:id/estado  - Cambiar estado`);
    console.log(`   PATCH /api/habitaciones/:id/checkin - Check-in manual`);
    console.log(`   PATCH /api/habitaciones/:id/checkout- Check-out manual`);
    console.log(`   DELETE /api/habitaciones/:id        - Eliminar habitación`);
    console.log(`   GET  /api/actividades               - Actividades`);
    console.log(`   GET  /api/reportes/*                - Reportes y gráficos`);
    console.log(`   POST /api/login                     - Login`);
    console.log(`🎉 ==========================================\n`);
  });
}

// ===============================
// 🧪 ENDPOINTS DE PRUEBA BÁSICOS
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "🚀 Backend del Hotel La Cosecha Dorada funcionando!",
    timestamp: new Date().toISOString(),
    status: "active",
    database: pool ? "✅ Conectada" : "❌ Desconectada"
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "✅ API funcionando correctamente",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/db-test", async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Pool de conexiones no disponible"
      });
    }

    const connection = await pool.getConnection();
    const [rows] = await connection.query("SELECT NOW() as server_time, DATABASE() as database_name");
    connection.release();

    res.json({
      success: true,
      message: "✅ Conexión a la base de datos exitosa",
      data: rows[0]
    });
  } catch (error) {
    console.error("❌ Error en db-test:", error.message);
    res.status(500).json({
      success: false,
      error: "Error de conexión a la base de datos: " + error.message
    });
  }
});

// ===============================
// 🏨 ENDPOINTS CRÍTICOS - HABITACIONES
// ===============================

// OBTENER TODAS LAS HABITACIONES
app.get("/api/habitaciones", async (req, res) => {
  try {
    console.log("🔍 Solicitando todas las habitaciones...");

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    const [habitaciones] = await pool.execute(`
      SELECT * FROM habitaciones 
      ORDER BY 
        CASE 
          WHEN estado = 'disponible' THEN 1
          WHEN estado = 'ocupada' THEN 2
          WHEN estado = 'mantenimiento' THEN 3
        END,
        numero
    `);

    console.log(`✅ ${habitaciones.length} habitaciones encontradas`);

    res.json({
      success: true,
      data: habitaciones
    });

  } catch (error) {
    console.error("❌ Error obteniendo habitaciones:", error.message);
    res.status(500).json({
      success: false,
      error: "Error al obtener habitaciones: " + error.message
    });
  }
});

// ENDPOINT MEJORADO: OBTENER HABITACIONES CON INFO DE RESERVAS ACTIVAS
app.get("/api/habitaciones-con-reservas", async (req, res) => {
  try {
    console.log("🔍 Solicitando habitaciones con info de reservas...");

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    const [habitaciones] = await pool.execute(`
      SELECT 
        h.*,
        COUNT(CASE WHEN r.estado = 'confirmada' AND r.fecha_salida >= CURDATE() THEN 1 END) as reservas_activas
      FROM habitaciones h
      LEFT JOIN reservas r ON h.id = r.habitacion_id
      GROUP BY h.id, h.numero, h.nombre, h.tipo, h.descripcion, h.capacidad, h.precio, h.imagen, h.estado
      ORDER BY 
        CASE 
          WHEN h.estado = 'disponible' THEN 1
          WHEN h.estado = 'ocupada' THEN 2
          WHEN h.estado = 'mantenimiento' THEN 3
        END,
        h.numero
    `);

    console.log(`✅ ${habitaciones.length} habitaciones con info de reservas`);

    res.json({
      success: true,
      data: habitaciones
    });

  } catch (error) {
    console.error("❌ Error obteniendo habitaciones con reservas:", error.message);
    res.status(500).json({
      success: false,
      error: "Error al obtener habitaciones: " + error.message
    });
  }
});

// CREAR NUEVA HABITACIÓN
app.post("/api/habitaciones", async (req, res) => {
  const { numero, nombre, tipo, descripcion, capacidad, precio, imagen, estado } = req.body;

  console.log("📝 Creando nueva habitación:", { numero, nombre, tipo });

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // Verificar si el número de habitación ya existe
    const [existe] = await pool.execute(
      "SELECT id FROM habitaciones WHERE numero = ?",
      [numero]
    );

    if (existe.length > 0) {
      return res.status(400).json({
        success: false,
        error: "El número de habitación ya existe"
      });
    }

    // Insertar nueva habitación
    const [result] = await pool.execute(
      `INSERT INTO habitaciones (numero, nombre, tipo, descripcion, capacidad, precio, imagen, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [numero, nombre, tipo, descripcion, capacidad, precio, imagen || 'doble1.jpg', estado || 'disponible']
    );

    console.log("✅ Nueva habitación creada:", numero);

    res.json({
      success: true,
      message: "Habitación creada exitosamente",
      habitacionId: result.insertId
    });

  } catch (error) {
    console.error("❌ Error creando habitación:", error);
    res.status(500).json({
      success: false,
      error: "Error al crear la habitación: " + error.message
    });
  }
});

// ACTUALIZAR HABITACIÓN - ENDPOINT NUEVO
app.put("/api/habitaciones/:id", async (req, res) => {
  const { id } = req.params;
  const { numero, nombre, tipo, descripcion, capacidad, precio, imagen, estado } = req.body;

  console.log("📝 Actualizando habitación:", id, { numero, nombre });

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // Verificar si la habitación existe
    const [existe] = await pool.execute(
      "SELECT id FROM habitaciones WHERE id = ?",
      [id]
    );

    if (existe.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Habitación no encontrada"
      });
    }

    // Verificar si el nuevo número ya existe en otra habitación
    const [numeroExiste] = await pool.execute(
      "SELECT id FROM habitaciones WHERE numero = ? AND id != ?",
      [numero, id]
    );

    if (numeroExiste.length > 0) {
      return res.status(400).json({
        success: false,
        error: "El número de habitación ya existe en otra habitación"
      });
    }

    // Actualizar habitación
    await pool.execute(
      `UPDATE habitaciones 
       SET numero = ?, nombre = ?, tipo = ?, descripcion = ?, capacidad = ?, precio = ?, imagen = ?, estado = ?
       WHERE id = ?`,
      [numero, nombre, tipo, descripcion, capacidad, precio, imagen || 'doble1.jpg', estado, id]
    );

    console.log("✅ Habitación actualizada:", numero);

    res.json({
      success: true,
      message: "Habitación actualizada exitosamente"
    });

  } catch (error) {
    console.error("❌ Error actualizando habitación:", error);
    res.status(500).json({
      success: false,
      error: "Error al actualizar la habitación: " + error.message
    });
  }
});

// CAMBIAR ESTADO DE HABITACIÓN - SOLO PARA MANTENIMIENTO/OCUPADA REAL
app.patch("/api/habitaciones/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  console.log("🔄 Cambiando estado de habitación:", id, "->", estado);

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // Verificar si la habitación existe
    const [existe] = await pool.execute(
      "SELECT id, numero FROM habitaciones WHERE id = ?",
      [id]
    );

    if (existe.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Habitación no encontrada"
      });
    }

    // Validar que el estado sea válido (no permitir "reservada")
    const estadosValidos = ['disponible', 'ocupada', 'mantenimiento'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: "Estado no válido. Use: disponible, ocupada o mantenimiento"
      });
    }

    // Actualizar estado
    await pool.execute(
      "UPDATE habitaciones SET estado = ? WHERE id = ?",
      [estado, id]
    );

    console.log("✅ Estado cambiado:", existe[0].numero, "->", estado);

    res.json({
      success: true,
      message: `Estado cambiado a ${estado}`
    });

  } catch (error) {
    console.error("❌ Error cambiando estado:", error);
    res.status(500).json({
      success: false,
      error: "Error al cambiar estado: " + error.message
    });
  }
});

// ENDPOINT PARA CHECK-IN MANUAL (marca habitación como ocupada)
app.patch("/api/habitaciones/:id/checkin", async (req, res) => {
  const { id } = req.params;

  console.log("🏨 Realizando check-in para habitación:", id);

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // Verificar si la habitación existe
    const [existe] = await pool.execute(
      "SELECT id, numero, estado FROM habitaciones WHERE id = ?",
      [id]
    );

    if (existe.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Habitación no encontrada"
      });
    }

    const habitacion = existe[0];

    // Solo permitir check-in si está disponible
    if (habitacion.estado !== 'disponible') {
      return res.status(400).json({
        success: false,
        error: `No se puede hacer check-in. La habitación está en estado: ${habitacion.estado}`
      });
    }

    // Marcar como ocupada
    await pool.execute(
      "UPDATE habitaciones SET estado = 'ocupada' WHERE id = ?",
      [id]
    );

    console.log("✅ Check-in realizado:", habitacion.numero);

    res.json({
      success: true,
      message: `Check-in realizado para habitación ${habitacion.numero}`
    });

  } catch (error) {
    console.error("❌ Error en check-in:", error);
    res.status(500).json({
      success: false,
      error: "Error al realizar check-in: " + error.message
    });
  }
});

// ENDPOINT PARA CHECK-OUT (libera habitación)
app.patch("/api/habitaciones/:id/checkout", async (req, res) => {
  const { id } = req.params;

  console.log("🏨 Realizando check-out para habitación:", id);

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // Verificar si la habitación existe
    const [existe] = await pool.execute(
      "SELECT id, numero, estado FROM habitaciones WHERE id = ?",
      [id]
    );

    if (existe.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Habitación no encontrada"
      });
    }

    const habitacion = existe[0];

    // Solo permitir check-out si está ocupada
    if (habitacion.estado !== 'ocupada') {
      return res.status(400).json({
        success: false,
        error: `No se puede hacer check-out. La habitación está en estado: ${habitacion.estado}`
      });
    }

    // Marcar como disponible
    await pool.execute(
      "UPDATE habitaciones SET estado = 'disponible' WHERE id = ?",
      [id]
    );

    console.log("✅ Check-out realizado:", habitacion.numero);

    res.json({
      success: true,
      message: `Check-out realizado para habitación ${habitacion.numero}`
    });

  } catch (error) {
    console.error("❌ Error en check-out:", error);
    res.status(500).json({
      success: false,
      error: "Error al realizar check-out: " + error.message
    });
  }
});

// ELIMINAR HABITACIÓN
app.delete("/api/habitaciones/:id", async (req, res) => {
  const { id } = req.params;

  console.log("🗑️ Eliminando habitación:", id);

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // Verificar si la habitación existe
    const [existe] = await pool.execute(
      "SELECT id, numero FROM habitaciones WHERE id = ?",
      [id]
    );

    if (existe.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Habitación no encontrada"
      });
    }

    // Verificar si hay reservas activas para esta habitación
    const [reservasActivas] = await pool.execute(
      `SELECT id FROM reservas 
       WHERE habitacion_id = ? AND estado IN ('pendiente', 'confirmada')`,
      [id]
    );

    if (reservasActivas.length > 0) {
      return res.status(400).json({
        success: false,
        error: "No se puede eliminar la habitación porque tiene reservas activas"
      });
    }

    // Eliminar habitación
    await pool.execute(
      "DELETE FROM habitaciones WHERE id = ?",
      [id]
    );

    console.log("✅ Habitación eliminada:", existe[0].numero);

    res.json({
      success: true,
      message: "Habitación eliminada exitosamente"
    });

  } catch (error) {
    console.error("❌ Error eliminando habitación:", error);
    res.status(500).json({
      success: false,
      error: "Error al eliminar la habitación: " + error.message
    });
  }
});

// ===============================
// 🗓️ SISTEMA DE DISPONIBILIDAD CORREGIDO - NUEVOS ENDPOINTS
// ===============================

// ENDPOINT MEJORADO: HABITACIONES DISPONIBLES (para búsqueda de usuarios)
app.post("/api/habitaciones/disponibles", async (req, res) => {
  const { entrada, salida, adultos, ninos } = req.body;

  console.log("🔍 Buscando habitaciones disponibles:", { entrada, salida, adultos, ninos });

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // Validar fechas
    if (!entrada || !salida) {
      return res.status(400).json({
        success: false,
        error: "Las fechas de entrada y salida son requeridas"
      });
    }

    const fechaEntrada = new Date(entrada);
    const fechaSalida = new Date(salida);

    if (fechaSalida <= fechaEntrada) {
      return res.status(400).json({
        success: false,
        error: "La fecha de salida debe ser posterior a la de entrada"
      });
    }

    // CONSULTA SIMPLIFICADA - Solo verificar fechas reservadas
    const [habitaciones] = await pool.execute(`
      SELECT h.* 
      FROM habitaciones h
      WHERE h.estado = 'disponible'  -- SOLO habitaciones disponibles
        AND h.capacidad >= ?
        AND h.id NOT IN (
          SELECT fr.habitacion_id 
          FROM fechas_reservadas fr
          JOIN reservas r ON fr.reserva_id = r.id
          WHERE r.estado = 'confirmada'  -- SOLO reservas confirmadas
            AND fr.fecha >= ? AND fr.fecha < ?
        )
      ORDER BY h.precio ASC
    `, [
      parseInt(adultos) + parseInt(ninos || 0),
      entrada,
      salida
    ]);

    console.log(`✅ ${habitaciones.length} habitaciones disponibles encontradas`);

    // 🔥 CORRECCIÓN: Devuelve la estructura que el frontend espera
    res.json({
      success: true,
      data: habitaciones
    });

  } catch (error) {
    console.error("❌ Error buscando habitaciones disponibles:", error);
    res.status(500).json({
      success: false,
      error: "Error al buscar habitaciones disponibles: " + error.message
    });
  }
});

// ENDPOINT NUEVO: OBTENER DISPONIBILIDAD CON FECHAS RESERVADAS
app.get("/api/habitaciones/disponibilidad/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { mes, año } = req.query;

    console.log(`📅 Solicitando disponibilidad para habitación ${id}, mes: ${mes}, año: ${año}`);

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // Si no se especifica mes/año, usar el actual
    const fechaBase = mes && año ?
      new Date(año, mes - 1, 1) :
      new Date();

    const primerDia = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), 1);
    const ultimoDia = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 0);

    // Obtener fechas reservadas para este mes
    const [fechasReservadas] = await pool.execute(`
      SELECT DISTINCT fr.fecha
      FROM fechas_reservadas fr
      JOIN reservas r ON fr.reserva_id = r.id
      WHERE fr.habitacion_id = ?
        AND fr.fecha BETWEEN ? AND ?
        AND r.estado = 'confirmada'
      ORDER BY fr.fecha ASC
    `, [id, primerDia.toISOString().split('T')[0], ultimoDia.toISOString().split('T')[0]]);

    // Obtener reservas activas
    const [reservas] = await pool.execute(`
      SELECT 
        id,
        cliente_nombre,
        cliente_apellido,
        fecha_entrada,
        fecha_salida,
        estado
      FROM reservas 
      WHERE habitacion_id = ? 
        AND estado = 'confirmada'
        AND (
          (fecha_entrada BETWEEN ? AND ?) OR
          (fecha_salida BETWEEN ? AND ?) OR
          (fecha_entrada <= ? AND fecha_salida >= ?)
        )
      ORDER BY fecha_entrada ASC
    `, [
      id,
      primerDia.toISOString().split('T')[0],
      ultimoDia.toISOString().split('T')[0],
      primerDia.toISOString().split('T')[0],
      ultimoDia.toISOString().split('T')[0],
      primerDia.toISOString().split('T')[0],
      ultimoDia.toISOString().split('T')[0]
    ]);

    // Generar calendario del mes
    const diasMes = [];
    const currentDate = new Date(primerDia);
    const fechasReservadasSet = new Set(fechasReservadas.map(fr => fr.fecha.toISOString().split('T')[0]));

    while (currentDate <= ultimoDia) {
      const fechaStr = currentDate.toISOString().split('T')[0];
      const estaReservada = fechasReservadasSet.has(fechaStr);

      diasMes.push({
        fecha: fechaStr,
        dia: currentDate.getDate(),
        diaSemana: currentDate.getDay(),
        estado: estaReservada ? 'reservada' : 'disponible'
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      data: {
        mes: fechaBase.getMonth() + 1,
        año: fechaBase.getFullYear(),
        dias: diasMes,
        reservas: reservas,
        totalReservas: reservas.length
      }
    });

  } catch (error) {
    console.error("❌ Error obteniendo disponibilidad:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener disponibilidad: " + error.message
    });
  }
});

// ENDPOINT ALTERNATIVO: OBTENER RESERVAS SIN DEPENDER DE fechas_reservadas
app.get("/api/reservas/habitacion/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📋 Solicitando reservas básicas para habitación ${id}`);

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    const [reservas] = await pool.execute(`
      SELECT 
        r.id,
        r.cliente_nombre,
        r.cliente_apellido,
        r.cliente_email,
        r.fecha_entrada,
        r.fecha_salida,
        r.adultos,
        r.ninos,
        r.total,
        r.estado,
        r.estado_pago,
        r.fecha_reserva
      FROM reservas r
      WHERE r.habitacion_id = ?
        AND r.estado IN ('confirmada', 'completada')
      ORDER BY r.fecha_entrada ASC
    `, [id]);

    console.log(`✅ ${reservas.length} reservas encontradas (método básico)`);

    res.json({
      success: true,
      data: reservas
    });

  } catch (error) {
    console.error("❌ Error obteniendo reservas básicas:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener reservas: " + error.message
    });
  }
});

// ENDPOINT NUEVO: OBTENER RESERVAS DE UNA HABITACIÓN
app.get("/api/habitaciones/:id/reservas", async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📋 Solicitando reservas para habitación ${id}`);

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    const [reservas] = await pool.execute(`
      SELECT 
        r.id,
        r.cliente_nombre,
        r.cliente_apellido,
        r.cliente_email,
        r.fecha_entrada,
        r.fecha_salida,
        r.adultos,
        r.ninos,
        r.total,
        r.estado,
        r.estado_pago,
        GROUP_CONCAT(fr.fecha ORDER BY fr.fecha) as fechas_reservadas
      FROM reservas r
      LEFT JOIN fechas_reservadas fr ON r.id = fr.reserva_id
      WHERE r.habitacion_id = ?
        AND r.estado IN ('confirmada', 'completada')
      GROUP BY r.id
      ORDER BY r.fecha_entrada ASC
    `, [id]);

    console.log(`✅ ${reservas.length} reservas encontradas`);

    res.json({
      success: true,
      data: reservas
    });

  } catch (error) {
    console.error("❌ Error obteniendo reservas:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener reservas: " + error.message
    });
  }
});

// ENDPOINT NUEVO: CANCELAR RESERVA DESDE ADMIN
app.patch("/api/reservas/:id/cancelar-admin", async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  console.log("❌ Cancelando reserva (admin):", id);

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // Verificar que la reserva existe
    const [reservas] = await pool.execute(
      `SELECT r.*, h.numero, h.nombre 
       FROM reservas r 
       JOIN habitaciones h ON r.habitacion_id = h.id 
       WHERE r.id = ?`,
      [id]
    );

    if (reservas.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Reserva no encontrada"
      });
    }

    const reserva = reservas[0];

    // Actualizar estado de la reserva a cancelada
    await pool.execute(
      "UPDATE reservas SET estado = 'cancelada' WHERE id = ?",
      [id]
    );

    // Eliminar fechas reservadas
    await pool.execute(
      "DELETE FROM fechas_reservadas WHERE reserva_id = ?",
      [id]
    );

    console.log("✅ Reserva cancelada por admin:", id);

    res.json({
      success: true,
      message: "Reserva cancelada exitosamente"
    });

  } catch (error) {
    console.error("❌ Error cancelando reserva:", error);
    res.status(500).json({
      success: false,
      error: "Error al cancelar reserva: " + error.message
    });
  }
});
// ===============================
// 📊 CONSULTAS PARAMETRIZADAS
// ===============================

// CONSULTA: RESERVAS POR FECHA
app.get("/api/consultas/reservas-por-fecha", async (req, res) => {
  try {
    const { fechaInicio, fechaFin, habitacion } = req.query;

    console.log("📊 Consulta: Reservas por fecha", { fechaInicio, fechaFin, habitacion });

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        error: "Las fechas inicio y fin son requeridas"
      });
    }

    let query = `
      SELECT 
        r.id,
        r.cliente_nombre,
        r.cliente_apellido,
        r.cliente_email,
        r.fecha_entrada,
        r.fecha_salida,
        r.total,
        r.estado,
        r.estado_pago,
        h.numero as numero_habitacion,
        h.tipo as habitacion_tipo
      FROM reservas r
      JOIN habitaciones h ON r.habitacion_id = h.id
      WHERE r.fecha_entrada >= ? AND r.fecha_salida <= ?
    `;

    const params = [fechaInicio, fechaFin];

    if (habitacion) {
      query += " AND h.numero = ?";
      params.push(habitacion);
    }

    query += " ORDER BY r.fecha_entrada ASC";

    const [reservas] = await pool.execute(query, params);

    console.log(`✅ ${reservas.length} reservas encontradas`);

    res.json({
      success: true,
      data: reservas
    });

  } catch (error) {
    console.error("❌ Error en consulta reservas por fecha:", error);
    res.status(500).json({
      success: false,
      error: "Error al ejecutar consulta: " + error.message
    });
  }
});

// CONSULTA: OCUPACIÓN POR HABITACIÓN
app.get("/api/consultas/ocupacion-habitacion", async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    console.log("📊 Consulta: Ocupación por habitación", { fechaInicio, fechaFin });

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        error: "Las fechas inicio y fin son requeridas"
      });
    }

    const [ocupacion] = await pool.execute(`
      SELECT 
        h.numero,
        h.tipo,
        COUNT(r.id) as total_reservas,
        SUM(DATEDIFF(LEAST(r.fecha_salida, ?), GREATEST(r.fecha_entrada, ?))) as total_noches,
        COALESCE(SUM(r.total), 0) as ingresos_totales,
        ROUND(
          (SUM(DATEDIFF(LEAST(r.fecha_salida, ?), GREATEST(r.fecha_entrada, ?))) / 
          DATEDIFF(?, ?)) * 100, 2
        ) as porcentaje_ocupacion
      FROM habitaciones h
      LEFT JOIN reservas r ON h.id = r.habitacion_id 
        AND r.estado = 'confirmada'
        AND (
          (r.fecha_entrada BETWEEN ? AND ?) OR
          (r.fecha_salida BETWEEN ? AND ?) OR
          (r.fecha_entrada <= ? AND r.fecha_salida >= ?)
        )
      GROUP BY h.id, h.numero, h.tipo
      ORDER BY total_noches DESC
    `, [
      fechaFin, fechaInicio,
      fechaFin, fechaInicio,
      fechaFin, fechaInicio,
      fechaInicio, fechaFin,
      fechaInicio, fechaFin,
      fechaInicio, fechaFin
    ]);

    console.log(`✅ ${ocupacion.length} habitaciones con datos de ocupación`);

    res.json({
      success: true,
      data: ocupacion
    });

  } catch (error) {
    console.error("❌ Error en consulta ocupación:", error);
    res.status(500).json({
      success: false,
      error: "Error al ejecutar consulta: " + error.message
    });
  }
});

// CONSULTA: CLIENTES FRECUENTES
app.get("/api/consultas/clientes-frecuentes", async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    console.log("📊 Consulta: Clientes frecuentes", { fechaInicio, fechaFin });

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        error: "Las fechas inicio y fin son requeridas"
      });
    }

    const [clientes] = await pool.execute(`
      SELECT 
        c.nombre,
        c.apellido,
        c.email,
        c.nacionalidad,
        COUNT(r.id) as total_reservas,
        SUM(DATEDIFF(r.fecha_salida, r.fecha_entrada)) as total_noches,
        COALESCE(SUM(r.total), 0) as total_gastado,
        MAX(r.fecha_salida) as ultima_reserva
      FROM clientes c
      JOIN reservas r ON c.email = r.cliente_email
      WHERE r.fecha_entrada >= ? AND r.fecha_salida <= ?
        AND r.estado = 'confirmada'
      GROUP BY c.id, c.nombre, c.apellido, c.email, c.nacionalidad
      HAVING total_reservas >= 1
      ORDER BY total_reservas DESC, total_gastado DESC
      LIMIT 20
    `, [fechaInicio, fechaFin]);

    console.log(`✅ ${clientes.length} clientes frecuentes encontrados`);

    res.json({
      success: true,
      data: clientes
    });

  } catch (error) {
    console.error("❌ Error en consulta clientes frecuentes:", error);
    res.status(500).json({
      success: false,
      error: "Error al ejecutar consulta: " + error.message
    });
  }
});

// CONSULTA: INGRESOS POR PERÍODO
app.get("/api/consultas/ingresos-periodo", async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    console.log("📊 Consulta: Ingresos por período", { fechaInicio, fechaFin });

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        error: "Las fechas inicio y fin son requeridas"
      });
    }

    const [ingresos] = await pool.execute(`
      SELECT 
        DATE_FORMAT(fecha_entrada, '%Y-%m') as mes,
        COUNT(*) as total_reservas,
        COALESCE(SUM(total), 0) as ingresos_totales,
        ROUND(AVG(total), 2) as promedio_por_reserva,
        SUM(DATEDIFF(fecha_salida, fecha_entrada)) as total_noches,
        ROUND(AVG(DATEDIFF(fecha_salida, fecha_entrada)), 1) as promedio_estadia
      FROM reservas 
      WHERE fecha_entrada >= ? AND fecha_salida <= ?
        AND estado = 'confirmada'
      GROUP BY DATE_FORMAT(fecha_entrada, '%Y-%m')
      ORDER BY mes DESC
    `, [fechaInicio, fechaFin]);

    console.log(`✅ ${ingresos.length} períodos con datos de ingresos`);

    res.json({
      success: true,
      data: ingresos
    });

  } catch (error) {
    console.error("❌ Error en consulta ingresos:", error);
    res.status(500).json({
      success: false,
      error: "Error al ejecutar consulta: " + error.message
    });
  }
});

// CONSULTA: HABITACIONES POPULARES
app.get("/api/consultas/habitaciones-populares", async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    console.log("📊 Consulta: Habitaciones populares", { fechaInicio, fechaFin });

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        error: "Las fechas inicio y fin son requeridas"
      });
    }

    const [habitaciones] = await pool.execute(`
      SELECT 
        h.numero,
        h.tipo,
        h.precio,
        COUNT(r.id) as total_reservas,
        SUM(DATEDIFF(r.fecha_salida, r.fecha_entrada)) as total_noches,
        COALESCE(SUM(r.total), 0) as ingresos_generados,
        ROUND(AVG(DATEDIFF(r.fecha_salida, r.fecha_entrada)), 1) as promedio_estadia,
        ROUND((COUNT(r.id) / (SELECT COUNT(*) FROM reservas WHERE fecha_entrada >= ? AND fecha_salida <= ? AND estado = 'confirmada')) * 100, 2) as porcentaje_reservas
      FROM habitaciones h
      LEFT JOIN reservas r ON h.id = r.habitacion_id
        AND r.estado = 'confirmada'
        AND r.fecha_entrada >= ? AND r.fecha_salida <= ?
      GROUP BY h.id, h.numero, h.tipo, h.precio
      HAVING total_reservas > 0
      ORDER BY total_reservas DESC, ingresos_generados DESC
    `, [fechaInicio, fechaFin, fechaInicio, fechaFin]);

    console.log(`✅ ${habitaciones.length} habitaciones populares encontradas`);

    res.json({
      success: true,
      data: habitaciones
    });

  } catch (error) {
    console.error("❌ Error en consulta habitaciones populares:", error);
    res.status(500).json({
      success: false,
      error: "Error al ejecutar consulta: " + error.message
    });
  }
});
// ===============================
// 📊 REPORTES Y GRÁFICOS - VERSIÓN CORREGIDA
// ===============================

// REPORTE: VENTAS E INGRESOS - VERSIÓN FUNCIONAL
app.get("/api/reportes/ventas-ingresos", async (req, res) => {
  try {
    const { periodo, fechaInicio, fechaFin } = req.query;

    console.log("📊 Reporte: Ventas e ingresos", { periodo, fechaInicio, fechaFin });

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        error: "Las fechas inicio y fin son requeridas"
      });
    }

    let groupByClause, dateFormat;
    switch (periodo) {
      case 'diario':
        groupByClause = "DATE(fecha_entrada)";
        dateFormat = '%Y-%m-%d';
        break;
      case 'semanal':
        groupByClause = "YEARWEEK(fecha_entrada)";
        dateFormat = 'Semana %u/%Y';
        break;
      case 'mensual':
        groupByClause = "DATE_FORMAT(fecha_entrada, '%Y-%m')";
        dateFormat = '%Y-%m';
        break;
      case 'anual':
        groupByClause = "YEAR(fecha_entrada)";
        dateFormat = '%Y';
        break;
      default:
        groupByClause = "DATE_FORMAT(fecha_entrada, '%Y-%m')";
        dateFormat = '%Y-%m';
    }

    // Query principal corregido
    const query = `
      SELECT 
        ${groupByClause} as periodo,
        DATE_FORMAT(MIN(fecha_entrada), ?) as periodo_formateado,
        COUNT(*) as total_reservas,
        COALESCE(SUM(total), 0) as ingresos_totales,
        COALESCE(AVG(total), 0) as promedio_venta,
        COALESCE(SUM(DATEDIFF(fecha_salida, fecha_entrada)), 0) as total_noches
      FROM reservas 
      WHERE fecha_entrada >= ? AND fecha_salida <= ?
        AND estado = 'confirmada'
      GROUP BY ${groupByClause}
      ORDER BY MIN(fecha_entrada) ASC
    `;

    console.log('🔍 Ejecutando query:', query.substring(0, 100) + '...');

    const [datosGrafico] = await pool.execute(query, [dateFormat, fechaInicio, fechaFin]);

    // Estadísticas generales
    const [estadisticas] = await pool.execute(`
      SELECT 
        COUNT(*) as total_reservas,
        COALESCE(SUM(total), 0) as ventas_totales,
        COALESCE(AVG(total), 0) as ticket_promedio,
        COALESCE(SUM(DATEDIFF(fecha_salida, fecha_entrada)), 0) as total_noches,
        COALESCE(AVG(DATEDIFF(fecha_salida, fecha_entrada)), 0) as promedio_estadia,
        COUNT(DISTINCT cliente_email) as clientes_unicos
      FROM reservas 
      WHERE fecha_entrada >= ? AND fecha_salida <= ?
        AND estado = 'confirmada'
    `, [fechaInicio, fechaFin]);

    console.log(`✅ Reporte generado: ${datosGrafico.length} períodos`);

    res.json({
      success: true,
      data: datosGrafico,
      estadisticas: {
        ventasTotales: estadisticas[0]?.ventas_totales || 0,
        totalReservas: estadisticas[0]?.total_reservas || 0,
        ticketPromedio: estadisticas[0]?.ticket_promedio || 0,
        totalNoches: estadisticas[0]?.total_noches || 0,
        promedioEstadia: estadisticas[0]?.promedio_estadia || 0,
        clientesUnicos: estadisticas[0]?.clientes_unicos || 0,
        crecimiento: 0 // Simplificado por ahora
      }
    });

  } catch (error) {
    console.error("❌ Error en reporte ventas:", error);
    res.status(500).json({
      success: false,
      error: "Error al generar reporte: " + error.message
    });
  }
});

// REPORTE: OCUPACIÓN Y RENDIMIENTO - VERSIÓN FUNCIONAL
app.get("/api/reportes/ocupacion-rendimiento", async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    console.log("📊 Reporte: Ocupación y rendimiento", { fechaInicio, fechaFin });

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        error: "Las fechas inicio y fin son requeridas"
      });
    }

    // Ocupación por tipo de habitación - CORREGIDO
    const [ocupacionTipo] = await pool.execute(`
      SELECT 
        h.tipo,
        COUNT(r.id) as total_reservas,
        COALESCE(SUM(r.total), 0) as ingresos_generados,
        COALESCE(SUM(DATEDIFF(r.fecha_salida, r.fecha_entrada)), 0) as total_noches,
        ROUND(
          (COALESCE(SUM(DATEDIFF(r.fecha_salida, r.fecha_entrada)), 0) / 
          (DATEDIFF(?, ?) * COUNT(DISTINCT h.id))) * 100, 2
        ) as tasa_ocupacion
      FROM habitaciones h
      LEFT JOIN reservas r ON h.id = r.habitacion_id
        AND r.estado = 'confirmada'
        AND r.fecha_entrada >= ? AND r.fecha_salida <= ?
      GROUP BY h.tipo
      ORDER BY ingresos_generados DESC
    `, [fechaFin, fechaInicio, fechaInicio, fechaFin]);

    // Métricas generales
    const [metricas] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT r.habitacion_id) as habitaciones_ocupadas,
        (SELECT COUNT(*) FROM habitaciones) as total_habitaciones,
        COUNT(r.id) as total_reservas,
        COALESCE(SUM(r.total), 0) as ingresos_totales,
        ROUND(AVG(DATEDIFF(r.fecha_salida, r.fecha_entrada)), 1) as promedio_estadia,
        ROUND(
          (COALESCE(SUM(DATEDIFF(r.fecha_salida, r.fecha_entrada)), 0) / 
          (DATEDIFF(?, ?) * (SELECT COUNT(*) FROM habitaciones))) * 100, 2
        ) as tasa_ocupacion_general
      FROM reservas r
      JOIN habitaciones h ON r.habitacion_id = h.id
      WHERE r.estado = 'confirmada'
        AND r.fecha_entrada >= ? AND r.fecha_salida <= ?
    `, [fechaFin, fechaInicio, fechaInicio, fechaFin]);

    console.log(`✅ Reporte ocupación generado: ${ocupacionTipo.length} tipos de habitación`);

    res.json({
      success: true,
      data: {
        ocupacionTipo: ocupacionTipo || [],
        metricas: metricas[0] || {}
      }
    });

  } catch (error) {
    console.error("❌ Error en reporte ocupación:", error);
    res.status(500).json({
      success: false,
      error: "Error al generar reporte: " + error.message
    });
  }
});

// REPORTE: CLIENTES Y FIDELIZACIÓN - VERSIÓN FUNCIONAL
app.get("/api/reportes/clientes-fidelizacion", async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    console.log("📊 Reporte: Clientes y fidelización", { fechaInicio, fechaFin });

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        error: "Las fechas inicio y fin son requeridas"
      });
    }

    // Clientes por nacionalidad
    const [clientesNacionalidad] = await pool.execute(`
      SELECT 
        COALESCE(cliente_nacionalidad, 'No especificada') as nacionalidad,
        COUNT(DISTINCT cliente_email) as total_clientes,
        COUNT(*) as total_reservas,
        COALESCE(SUM(total), 0) as total_gastado
      FROM reservas 
      WHERE fecha_entrada >= ? AND fecha_salida <= ?
        AND estado = 'confirmada'
      GROUP BY COALESCE(cliente_nacionalidad, 'No especificada')
      ORDER BY total_clientes DESC
      LIMIT 10
    `, [fechaInicio, fechaFin]);

    console.log(`✅ Reporte clientes generado: ${clientesNacionalidad.length} nacionalidades`);

    res.json({
      success: true,
      data: {
        clientesNacionalidad: clientesNacionalidad || [],
        clientesFrecuentes: [], // Simplificado por ahora
        nuevosClientes: [] // Simplificado por ahora
      }
    });

  } catch (error) {
    console.error("❌ Error en reporte clientes:", error);
    res.status(500).json({
      success: false,
      error: "Error al generar reporte: " + error.message
    });
  }
});

// =============================================
// RUTAS PARA LA INFORMACIÓN DEL HOTEL
// =============================================

import hotelService from './services/hotelService.js';

// Obtener información del hotel
app.get('/api/hotel/info', async (req, res) => {
    try {
        const hotelInfo = await hotelService.getHotelInfo();
        res.json(hotelInfo);
    } catch (error) {
        console.error('Error al obtener información del hotel:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Actualizar información del hotel
app.put('/api/hotel/info', async (req, res) => {
    try {
        const result = await hotelService.updateHotelInfo(req.body);
        res.json({ 
            success: true, 
            message: 'Información del hotel actualizada correctamente',
            affectedRows: result.affectedRows 
        });
    } catch (error) {
        console.error('Error al actualizar información del hotel:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ===============================
// 🎯 ACTIVIDADES
// ===============================

app.get("/api/actividades", async (req, res) => {
  try {
    console.log("🔍 Solicitando actividades...");

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    const [actividades] = await pool.execute(`
      SELECT * FROM actividades 
      ORDER BY orden ASC, id ASC
    `);

    res.json({
      success: true,
      data: actividades
    });
  } catch (error) {
    console.error("❌ Error obteniendo actividades:", error.message);
    res.status(500).json({
      success: false,
      error: "Error al obtener actividades: " + error.message
    });
  }
});

// ===============================
// 🔑 AUTENTICACIÓN
// ===============================

app.post("/api/login", async (req, res) => {
  console.log("📨 Solicitud de login recibida:", req.body);

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: "Usuario y contraseña son requeridos"
    });
  }

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // Primero buscar en STAFF (empleados)
    let [users] = await pool.execute(
      `SELECT s.id, s.username, s.role, e.nombre, e.apellido, e.email, e.telefono, 'staff' as tipo
       FROM staff s 
       JOIN empleados e ON s.empleado_id = e.id 
       WHERE s.username = ? AND s.password = ?`,
      [username, password]
    );

    // Si no está en staff, buscar en CLIENTES
    if (users.length === 0) {
      [users] = await pool.execute(
        `SELECT id, username, 'cliente' as role, nombre, apellido, email, telefono, 'cliente' as tipo
         FROM clientes 
         WHERE username = ? AND password = ?`,
        [username, password]
      );
    }

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Credenciales incorrectas"
      });
    }

    const user = users[0];
    console.log("✅ Login exitoso para:", user.username, "- Tipo:", user.tipo);

    res.json({
      success: true,
      user: user,
      message: "Login exitoso"
    });

  } catch (error) {
    console.error("❌ Error en login:", error.message);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor: " + error.message
    });
  }
});


// ===============================
// 📧 CONSULTAS DE CLIENTES - NUEVOS ENDPOINTS
// ===============================

// GUARDAR CONSULTA DEL BOTÓN FLOTANTE
// GUARDAR CONSULTA DEL BOTÓN FLOTANTE
app.post("/api/contacto", async (req, res) => {
  const { nombre, email, telefono, asunto, mensaje, tipo } = req.body;

  console.log("📧 Recibiendo consulta de cliente:", { nombre, email, asunto });

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // Validar campos requeridos
    if (!nombre || !email || !asunto || !mensaje) {
      return res.status(400).json({
        success: false,
        error: "Nombre, email, asunto y mensaje son campos obligatorios"
      });
    }

    // Insertar consulta en la base de datos
    const [result] = await pool.execute(
      `INSERT INTO consultas_clientes 
       (nombre, email, telefono, asunto, mensaje, tipo, estado, fecha_creacion) 
       VALUES (?, ?, ?, ?, ?, ?, 'pendiente', NOW())`,
      [
        nombre,
        email,
        telefono || null,
        asunto,
        mensaje,
        tipo || 'consulta_cliente'
      ]
    );

    console.log("✅ Consulta guardada exitosamente. ID:", result.insertId);

    res.json({
      success: true,
      message: "Consulta enviada exitosamente",
      consultaId: result.insertId
    });

  } catch (error) {
    console.error("❌ Error guardando consulta:", error);
    res.status(500).json({
      success: false,
      error: "Error al enviar la consulta: " + error.message
    });
  }
});

// OBTENER TODAS LAS CONSULTAS (PARA EL OPERADOR)
app.get("/api/consultas", async (req, res) => {
  try {
    console.log("🔍 Solicitando lista de consultas...");

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    const [consultas] = await pool.execute(`
      SELECT 
        id,
        nombre,
        email,
        telefono,
        asunto,
        mensaje,
        tipo,
        estado,
        fecha_creacion,
        fecha_actualizacion
      FROM consultas_clientes 
      ORDER BY 
        CASE estado
          WHEN 'pendiente' THEN 1
          WHEN 'en_proceso' THEN 2
          WHEN 'resuelto' THEN 3
        END,
        fecha_creacion DESC
    `);

    console.log(`✅ ${consultas.length} consultas encontradas`);

    res.json({
      success: true,
      consultas: consultas
    });

  } catch (error) {
    console.error("❌ Error obteniendo consultas:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener consultas: " + error.message
    });
  }
});

// OBTENER CONSULTA POR ID
app.get("/api/consultas/:id", async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`🔍 Solicitando consulta ${id}...`);

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    const [consultas] = await pool.execute(
      `SELECT * FROM consultas_clientes WHERE id = ?`,
      [id]
    );

    if (consultas.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Consulta no encontrada"
      });
    }

    res.json({
      success: true,
      consulta: consultas[0]
    });

  } catch (error) {
    console.error("❌ Error obteniendo consulta:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener consulta: " + error.message
    });
  }
});

// ACTUALIZAR ESTADO DE CONSULTA
app.patch("/api/consultas/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  console.log(`🔄 Actualizando estado de consulta ${id} -> ${estado}`);

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // Validar estado
    const estadosValidos = ['pendiente', 'en_proceso', 'resuelto'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: "Estado no válido. Use: pendiente, en_proceso o resuelto"
      });
    }

    // Verificar que la consulta existe
    const [consultas] = await pool.execute(
      "SELECT id FROM consultas_clientes WHERE id = ?",
      [id]
    );

    if (consultas.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Consulta no encontrada"
      });
    }

    // Actualizar estado
    await pool.execute(
      "UPDATE consultas_clientes SET estado = ?, fecha_actualizacion = NOW() WHERE id = ?",
      [estado, id]
    );

    console.log("✅ Estado de consulta actualizado:", id);

    res.json({
      success: true,
      message: `Estado actualizado a ${estado}`
    });

  } catch (error) {
    console.error("❌ Error actualizando estado:", error);
    res.status(500).json({
      success: false,
      error: "Error al actualizar estado: " + error.message
    });
  }
});

// RESPONDER CONSULTA (ENVÍO DE EMAIL)
app.post("/api/consultas/:id/responder", async (req, res) => {
  const { id } = req.params;
  const { respuesta, operador } = req.body;

  console.log(`📧 Respondiendo consulta ${id}...`);

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // Obtener datos de la consulta
    const [consultas] = await pool.execute(
      "SELECT * FROM consultas_clientes WHERE id = ?",
      [id]
    );

    if (consultas.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Consulta no encontrada"
      });
    }

    const consulta = consultas[0];

    // Aquí integrarías con el servicio de email (nodemailer)
    // Por ahora simulamos el envío
    console.log(`📤 Enviando respuesta a: ${consulta.email}`);
    console.log(`📝 Asunto: Re: ${consulta.asunto}`);
    console.log(`💬 Respuesta: ${respuesta.substring(0, 100)}...`);

    // Marcar como resuelta y guardar respuesta
    await pool.execute(
      `UPDATE consultas_clientes 
       SET estado = 'resuelto', 
           respuesta = ?,
           operador_respuesta = ?,
           fecha_respuesta = NOW(),
           fecha_actualizacion = NOW()
       WHERE id = ?`,
      [respuesta, operador || 'Sistema', id]
    );

    console.log("✅ Consulta respondida y marcada como resuelta");

    res.json({
      success: true,
      message: "Respuesta enviada exitosamente"
    });

  } catch (error) {
    console.error("❌ Error respondiendo consulta:", error);
    res.status(500).json({
      success: false,
      error: "Error al responder consulta: " + error.message
    });
  }
});

// ELIMINAR CONSULTA
app.delete("/api/consultas/:id", async (req, res) => {
  const { id } = req.params;

  console.log(`🗑️ Eliminando consulta ${id}...`);

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // Verificar que la consulta existe
    const [consultas] = await pool.execute(
      "SELECT id FROM consultas_clientes WHERE id = ?",
      [id]
    );

    if (consultas.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Consulta no encontrada"
      });
    }

    // Eliminar consulta
    await pool.execute(
      "DELETE FROM consultas_clientes WHERE id = ?",
      [id]
    );

    console.log("✅ Consulta eliminada:", id);

    res.json({
      success: true,
      message: "Consulta eliminada exitosamente"
    });

  } catch (error) {
    console.error("❌ Error eliminando consulta:", error);
    res.status(500).json({
      success: false,
      error: "Error al eliminar consulta: " + error.message
    });
  }
});

// ESTADÍSTICAS DE CONSULTAS
app.get("/api/consultas/estadisticas", async (req, res) => {
  try {
    console.log("📊 Solicitando estadísticas de consultas...");

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    const [estadisticas] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'en_proceso' THEN 1 ELSE 0 END) as en_proceso,
        SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END) as resueltas,
        SUM(CASE WHEN DATE(fecha_creacion) = CURDATE() THEN 1 ELSE 0 END) as hoy
      FROM consultas_clientes
    `);

    const [ultimaSemana] = await pool.execute(`
      SELECT 
        DATE(fecha_creacion) as fecha,
        COUNT(*) as cantidad
      FROM consultas_clientes
      WHERE fecha_creacion >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(fecha_creacion)
      ORDER BY fecha ASC
    `);

    res.json({
      success: true,
      data: {
        total: estadisticas[0]?.total || 0,
        pendientes: estadisticas[0]?.pendientes || 0,
        en_proceso: estadisticas[0]?.en_proceso || 0,
        resueltas: estadisticas[0]?.resueltas || 0,
        hoy: estadisticas[0]?.hoy || 0,
        ultimaSemana: ultimaSemana
      }
    });

  } catch (error) {
    console.error("❌ Error obteniendo estadísticas:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener estadísticas: " + error.message
    });
  }
});

// ===============================
// 📧 VERIFICACIÓN DE EMAIL
// ===============================

app.post("/api/usuarios/verificar-email", async (req, res) => {
  const { email } = req.body;

  console.log("📧 Verificando email:", email);

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // Buscar en clientes
    const [clientes] = await pool.execute(
      "SELECT id, email FROM clientes WHERE email = ?",
      [email]
    );

    // Buscar en empleados (por si es staff)
    const [empleados] = await pool.execute(
      "SELECT id, email FROM empleados WHERE email = ?",
      [email]
    );

    const existe = clientes.length > 0 || empleados.length > 0;

    console.log(`✅ Email ${email} ${existe ? 'EXISTE' : 'NO existe'}`);

    res.json({
      success: true,
      existe: existe,
      message: existe ? "Email ya registrado" : "Email disponible"
    });

  } catch (error) {
    console.error("❌ Error verificando email:", error);
    res.status(500).json({
      success: false,
      error: "Error al verificar email: " + error.message,
      existe: false // Por defecto asumimos que no existe en caso de error
    });
  }
});

// ===============================
// 📝 REGISTRO DE USUARIOS
// ===============================

app.post("/api/usuarios/registrar", async (req, res) => {
  const {
    nombre,
    apellido,
    email,
    telefono,
    fecha_nacimiento,
    username,
    password
  } = req.body;

  console.log("📝 Registrando nuevo usuario:", { username, email });

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // Validar campos requeridos
    if (!nombre || !apellido || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: "Todos los campos marcados con * son obligatorios"
      });
    }

    // Verificar si el email ya existe
    const [emailExistente] = await pool.execute(
      "SELECT id FROM clientes WHERE email = ?",
      [email]
    );

    if (emailExistente.length > 0) {
      return res.status(400).json({
        success: false,
        error: "El email ya está registrado"
      });
    }

    // Verificar si el username ya existe
    const [usernameExistente] = await pool.execute(
      "SELECT id FROM clientes WHERE username = ?",
      [username]
    );

    if (usernameExistente.length > 0) {
      return res.status(400).json({
        success: false,
        error: "El nombre de usuario ya está en uso"
      });
    }

    // Crear nuevo cliente
    const [result] = await pool.execute(
      `INSERT INTO clientes (nombre, apellido, email, telefono, fecha_nacimiento, username, password) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        apellido,
        email,
        telefono || null,
        fecha_nacimiento || null,
        username,
        password // En producción, esto debería estar encriptado
      ]
    );

    console.log("✅ Usuario registrado exitosamente:", username);

    res.json({
      success: true,
      message: "Usuario registrado exitosamente",
      usuario: {
        id: result.insertId,
        username: username,
        nombre: nombre,
        apellido: apellido,
        email: email
      }
    });

  } catch (error) {
    console.error("❌ Error en registro:", error);
    res.status(500).json({
      success: false,
      error: "Error al registrar usuario: " + error.message
    });
  }
});

// ===============================
// 👤 OBTENER RESERVAS DEL USUARIO
// ===============================

app.get("/api/usuarios/:email/reservas", async (req, res) => {
  const { email } = req.params;

  console.log("📋 Obteniendo reservas para usuario:", email);

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    const [reservas] = await pool.execute(
      `SELECT 
        r.id,
        r.cliente_nombre,
        r.cliente_apellido,
        r.cliente_email,
        r.fecha_entrada,
        r.fecha_salida,
        r.adultos,
        r.ninos,
        r.total,
        r.estado,
        r.estado_pago,
        r.pago_id,
        r.fecha_reserva,
        h.numero as habitacion_numero,
        h.nombre as habitacion_nombre,
        h.tipo as habitacion_tipo,
        h.imagen as habitacion_imagen
       FROM reservas r
       JOIN habitaciones h ON r.habitacion_id = h.id
       WHERE r.cliente_email = ?
       ORDER BY r.fecha_reserva DESC`,
      [email]
    );

    console.log(`✅ ${reservas.length} reservas encontradas para ${email}`);

    res.json({
      success: true,
      data: reservas
    });

  } catch (error) {
    console.error("❌ Error obteniendo reservas:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener reservas: " + error.message
    });
  }
});

// ===============================
// ❌ CANCELAR RESERVA
// ===============================

app.patch("/api/reservas/:id/cancelar", async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  console.log("❌ Cancelando reserva:", id);

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // Verificar que la reserva existe
    const [reservas] = await pool.execute(
      `SELECT r.*, h.numero, h.nombre 
       FROM reservas r 
       JOIN habitaciones h ON r.habitacion_id = h.id 
       WHERE r.id = ?`,
      [id]
    );

    if (reservas.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Reserva no encontrada"
      });
    }

    const reserva = reservas[0];

    // Verificar que la reserva se puede cancelar
    if (reserva.estado === 'cancelada') {
      return res.status(400).json({
        success: false,
        error: "La reserva ya está cancelada"
      });
    }

    // Verificar fecha de cancelación (no permitir cancelar el mismo día del check-in)
    const fechaEntrada = new Date(reserva.fecha_entrada);
    const hoy = new Date();
    const diferenciaDias = Math.ceil((fechaEntrada - hoy) / (1000 * 60 * 60 * 24));

    if (diferenciaDias <= 0) {
      return res.status(400).json({
        success: false,
        error: "No se puede cancelar una reserva el mismo día del check-in o después"
      });
    }

    // Actualizar estado de la reserva a cancelada
    await pool.execute(
      "UPDATE reservas SET estado = 'cancelada' WHERE id = ?",
      [id]
    );

    // Eliminar fechas reservadas
    await pool.execute(
      "DELETE FROM fechas_reservadas WHERE reserva_id = ?",
      [id]
    );

    // Registrar reembolso si el pago fue completado
    if (reserva.estado_pago === 'completado') {
      await pool.execute(
        "INSERT INTO reembolsos (reserva_id, monto_reembolsado, motivo) VALUES (?, ?, ?)",
        [id, reserva.total, motivo || 'Cancelación voluntaria']
      );

      // Actualizar estado de pago a reembolsado
      await pool.execute(
        "UPDATE reservas SET estado_pago = 'reembolsado' WHERE id = ?",
        [id]
      );
    }

    console.log("✅ Reserva cancelada exitosamente:", id);

    res.json({
      success: true,
      message: "Reserva cancelada exitosamente",
      reembolso: reserva.estado_pago === 'completado' ? {
        monto: reserva.total,
        motivo: motivo || 'Cancelación voluntaria'
      } : null
    });

  } catch (error) {
    console.error("❌ Error cancelando reserva:", error);
    res.status(500).json({
      success: false,
      error: "Error al cancelar reserva: " + error.message
    });
  }
});

// ===============================
// 👥 GESTIÓN DE EMPLEADOS - CORREGIDO PARA TU ESQUEMA
// ===============================

// OBTENER TODOS LOS EMPLEADOS
app.get("/api/empleados", async (req, res) => {
  try {
    console.log("🔍 Solicitando lista de empleados...");

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    const [empleados] = await pool.execute(`
      SELECT 
        e.id,
        e.nombre,
        e.apellido,
        e.email,
        e.telefono,
        e.puesto,
        e.salario,
        e.fecha_contratacion,
        e.fecha_creacion,
        e.fecha_actualizacion,
        s.username,
        s.role,
        CASE 
          WHEN s.id IS NOT NULL THEN 'activo'
          ELSE 'inactivo'
        END as estado_sistema
      FROM empleados e
      LEFT JOIN staff s ON e.id = s.empleado_id
      ORDER BY e.fecha_contratacion DESC
    `);

    console.log(`✅ ${empleados.length} empleados encontrados`);

    res.json({
      success: true,
      data: empleados
    });

  } catch (error) {
    console.error("❌ Error obteniendo empleados:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener empleados: " + error.message
    });
  }
});

// BUSCAR EMPLEADOS
app.get("/api/empleados/buscar", async (req, res) => {
  try {
    const { query } = req.query;

    console.log("🔍 Buscando empleados:", query);

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    if (!query || query.trim() === '') {
      const [empleados] = await pool.execute(`
        SELECT 
          e.id,
          e.nombre,
          e.apellido,
          e.email,
          e.telefono,
          e.puesto,
          e.salario,
          e.fecha_contratacion,
          e.fecha_creacion,
          e.fecha_actualizacion,
          s.username,
          s.role,
          CASE 
            WHEN s.id IS NOT NULL THEN 'activo'
            ELSE 'inactivo'
          END as estado_sistema
        FROM empleados e
        LEFT JOIN staff s ON e.id = s.empleado_id
        ORDER BY e.fecha_contratacion DESC
      `);

      return res.json({
        success: true,
        data: empleados
      });
    }

    const searchTerm = `%${query}%`;
    const [empleados] = await pool.execute(`
      SELECT 
        e.id,
        e.nombre,
        e.apellido,
        e.email,
        e.telefono,
        e.puesto,
        e.salario,
        e.fecha_contratacion,
        e.fecha_creacion,
        e.fecha_actualizacion,
        s.username,
        s.role,
        CASE 
          WHEN s.id IS NOT NULL THEN 'activo'
          ELSE 'inactivo'
        END as estado_sistema
      FROM empleados e
      LEFT JOIN staff s ON e.id = s.empleado_id
      WHERE 
        e.nombre LIKE ? OR 
        e.apellido LIKE ? OR 
        e.email LIKE ? OR 
        e.puesto LIKE ? OR
        s.username LIKE ?
      ORDER BY e.fecha_contratacion DESC
    `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);

    console.log(`✅ ${empleados.length} empleados encontrados en búsqueda`);

    res.json({
      success: true,
      data: empleados
    });

  } catch (error) {
    console.error("❌ Error buscando empleados:", error);
    res.status(500).json({
      success: false,
      error: "Error al buscar empleados: " + error.message
    });
  }
});

// CREAR NUEVO EMPLEADO
app.post("/api/empleados", async (req, res) => {
  const {
    nombre,
    apellido,
    email,
    telefono,
    puesto,
    salario,
    fecha_contratacion,
    username,
    password,
    role
  } = req.body;

  console.log("📝 Creando nuevo empleado:", { nombre, apellido, email, puesto });

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // Validar campos requeridos según tu esquema
    if (!nombre || !apellido || !email || !puesto) {
      return res.status(400).json({
        success: false,
        error: "Nombre, apellido, email y puesto son campos obligatorios"
      });
    }

    // Validar que el puesto sea válido según tu ENUM
    const puestosValidos = ['administrador', 'recepcionista', 'limpieza', 'cocina', 'seguridad'];
    if (!puestosValidos.includes(puesto)) {
      return res.status(400).json({
        success: false,
        error: "Puesto no válido. Opciones: administrador, recepcionista, limpieza, cocina, seguridad"
      });
    }

    // Verificar si el email ya existe
    const [emailExistente] = await pool.execute(
      "SELECT id FROM empleados WHERE email = ?",
      [email]
    );

    if (emailExistente.length > 0) {
      return res.status(400).json({
        success: false,
        error: "El email ya está registrado"
      });
    }

    // Iniciar transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insertar empleado (sin campo estado, según tu esquema)
      const [resultEmpleado] = await connection.execute(
        `INSERT INTO empleados (nombre, apellido, email, telefono, puesto, salario, fecha_contratacion) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          nombre,
          apellido,
          email,
          telefono || null,
          puesto,
          salario || 0,
          fecha_contratacion || new Date().toISOString().split('T')[0]
        ]
      );

      const empleadoId = resultEmpleado.insertId;

      // Si se proporcionaron credenciales, crear usuario staff
      if (username && password && role) {
        // Validar que el role sea válido según tu ENUM
        const rolesValidos = ['administrador', 'recepcionista'];
        if (!rolesValidos.includes(role)) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            success: false,
            error: "Rol no válido. Opciones: administrador, recepcionista"
          });
        }

        // Verificar si el username ya existe
        const [usernameExistente] = await connection.execute(
          "SELECT id FROM staff WHERE username = ?",
          [username]
        );

        if (usernameExistente.length > 0) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            success: false,
            error: "El nombre de usuario ya está en uso"
          });
        }

        // Crear usuario staff
        await connection.execute(
          `INSERT INTO staff (username, password, empleado_id, role) 
           VALUES (?, ?, ?, ?)`,
          [username, password, empleadoId, role]
        );
      }

      await connection.commit();
      connection.release();

      console.log("✅ Empleado creado exitosamente:", email);

      res.json({
        success: true,
        message: "Empleado creado exitosamente",
        empleadoId: empleadoId
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error("❌ Error creando empleado:", error);
    res.status(500).json({
      success: false,
      error: "Error al crear empleado: " + error.message
    });
  }
});

// ACTUALIZAR EMPLEADO
app.put("/api/empleados/:id", async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    apellido,
    email,
    telefono,
    puesto,
    salario,
    fecha_contratacion,
    username,
    password,
    role
  } = req.body;

  console.log("📝 Actualizando empleado:", id);

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // Verificar que el empleado existe
    const [empleadoExistente] = await pool.execute(
      "SELECT id FROM empleados WHERE id = ?",
      [id]
    );

    if (empleadoExistente.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Empleado no encontrada"
      });
    }

    // Verificar si el email ya existe en otro empleado
    const [emailExistente] = await pool.execute(
      "SELECT id FROM empleados WHERE email = ? AND id != ?",
      [email, id]
    );

    if (emailExistente.length > 0) {
      return res.status(400).json({
        success: false,
        error: "El email ya está registrado en otro empleado"
      });
    }

    // Validar puesto
    const puestosValidos = ['administrador', 'recepcionista', 'limpieza', 'cocina', 'seguridad'];
    if (!puestosValidos.includes(puesto)) {
      return res.status(400).json({
        success: false,
        error: "Puesto no válido"
      });
    }

    // Iniciar transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Actualizar empleado
      await connection.execute(
        `UPDATE empleados 
         SET nombre = ?, apellido = ?, email = ?, telefono = ?, puesto = ?, salario = ?, fecha_contratacion = ?
         WHERE id = ?`,
        [
          nombre,
          apellido,
          email,
          telefono || null,
          puesto,
          salario || 0,
          fecha_contratacion,
          id
        ]
      );

      // Manejar credenciales de staff
      if (username && role) {
        // Validar role
        const rolesValidos = ['administrador', 'recepcionista'];
        if (!rolesValidos.includes(role)) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            success: false,
            error: "Rol no válido. Opciones: administrador, recepcionista"
          });
        }

        // Verificar si ya existe un usuario staff para este empleado
        const [staffExistente] = await connection.execute(
          "SELECT id FROM staff WHERE empleado_id = ?",
          [id]
        );

        if (staffExistente.length > 0) {
          // Actualizar usuario staff existente
          if (password) {
            await connection.execute(
              "UPDATE staff SET username = ?, password = ?, role = ? WHERE empleado_id = ?",
              [username, password, role, id]
            );
          } else {
            await connection.execute(
              "UPDATE staff SET username = ?, role = ? WHERE empleado_id = ?",
              [username, role, id]
            );
          }
        } else {
          // Crear nuevo usuario staff
          if (!password) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
              success: false,
              error: "La contraseña es requerida para crear un nuevo usuario"
            });
          }

          // Verificar si el username ya existe
          const [usernameExistente] = await connection.execute(
            "SELECT id FROM staff WHERE username = ?",
            [username]
          );

          if (usernameExistente.length > 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
              success: false,
              error: "El nombre de usuario ya está en uso"
            });
          }

          await connection.execute(
            "INSERT INTO staff (username, password, empleado_id, role) VALUES (?, ?, ?, ?)",
            [username, password, id, role]
          );
        }
      }

      await connection.commit();
      connection.release();

      console.log("✅ Empleado actualizado exitosamente:", id);

      res.json({
        success: true,
        message: "Empleado actualizado exitosamente"
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error("❌ Error actualizando empleado:", error);
    res.status(500).json({
      success: false,
      error: "Error al actualizar empleado: " + error.message
    });
  }
});

// ELIMINAR EMPLEADO
app.delete("/api/empleados/:id", async (req, res) => {
  const { id } = req.params;

  console.log("🗑️ Eliminando empleado:", id);

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // Verificar que el empleado existe
    const [empleadoExistente] = await pool.execute(
      "SELECT id, nombre, apellido FROM empleados WHERE id = ?",
      [id]
    );

    if (empleadoExistente.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Empleado no encontrado"
      });
    }

    const empleado = empleadoExistente[0];

    // Iniciar transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Eliminar usuario staff si existe (CASCADE se encargará por la FK)
      await connection.execute(
        "DELETE FROM staff WHERE empleado_id = ?",
        [id]
      );

      // Eliminar empleado
      await connection.execute(
        "DELETE FROM empleados WHERE id = ?",
        [id]
      );

      await connection.commit();
      connection.release();

      console.log("✅ Empleado eliminado exitosamente:", `${empleado.nombre} ${empleado.apellido}`);

      res.json({
        success: true,
        message: "Empleado eliminado exitosamente"
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error("❌ Error eliminando empleado:", error);
    res.status(500).json({
      success: false,
      error: "Error al eliminar empleado: " + error.message
    });
  }
});

// ===============================
// 👥 GESTIÓN DE CLIENTES
// ===============================

// OBTENER TODOS LOS CLIENTES
app.get("/api/clientes", async (req, res) => {
  try {
    console.log("🔍 Solicitando lista de clientes...");

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    const [clientes] = await pool.execute(`
      SELECT 
        c.id,
        c.username,
        c.nombre,
        c.apellido,
        c.email,
        c.telefono,
        c.fecha_nacimiento,
        c.fecha_registro,
        c.fecha_actualizacion,
        COUNT(r.id) as total_reservas,
        COALESCE(SUM(r.total), 0) as total_gastado
      FROM clientes c
      LEFT JOIN reservas r ON c.email = r.cliente_email
      GROUP BY c.id, c.username, c.nombre, c.apellido, c.email, c.telefono, c.fecha_nacimiento, c.fecha_registro, c.fecha_actualizacion
      ORDER BY c.fecha_registro DESC
    `);

    console.log(`✅ ${clientes.length} clientes encontrados`);

    res.json({
      success: true,
      data: clientes
    });

  } catch (error) {
    console.error("❌ Error obteniendo clientes:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener clientes: " + error.message
    });
  }
});

// BUSCAR CLIENTES
app.get("/api/clientes/buscar", async (req, res) => {
  try {
    const { query } = req.query;

    console.log("🔍 Buscando clientes:", query);

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    if (!query || query.trim() === '') {
      const [clientes] = await pool.execute(`
        SELECT 
          c.id,
          c.username,
          c.nombre,
          c.apellido,
          c.email,
          c.telefono,
          c.fecha_nacimiento,
          c.fecha_registro,
          c.fecha_actualizacion,
          COUNT(r.id) as total_reservas,
          COALESCE(SUM(r.total), 0) as total_gastado
        FROM clientes c
        LEFT JOIN reservas r ON c.email = r.cliente_email
        GROUP BY c.id, c.username, c.nombre, c.apellido, c.email, c.telefono, c.fecha_nacimiento, c.fecha_registro, c.fecha_actualizacion
        ORDER BY c.fecha_registro DESC
      `);

      return res.json({
        success: true,
        data: clientes
      });
    }

    const searchTerm = `%${query}%`;
    const [clientes] = await pool.execute(`
      SELECT 
        c.id,
        c.username,
        c.nombre,
        c.apellido,
        c.email,
        c.telefono,
        c.fecha_nacimiento,
        c.fecha_registro,
        c.fecha_actualizacion,
        COUNT(r.id) as total_reservas,
        COALESCE(SUM(r.total), 0) as total_gastado
      FROM clientes c
      LEFT JOIN reservas r ON c.email = r.cliente_email
      WHERE 
        c.nombre LIKE ? OR 
        c.apellido LIKE ? OR 
        c.email LIKE ? OR 
        c.username LIKE ? OR
        c.telefono LIKE ?
      GROUP BY c.id, c.username, c.nombre, c.apellido, c.email, c.telefono, c.fecha_nacimiento, c.fecha_registro, c.fecha_actualizacion
      ORDER BY c.fecha_registro DESC
    `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);

    console.log(`✅ ${clientes.length} clientes encontrados en búsqueda`);

    res.json({
      success: true,
      data: clientes
    });

  } catch (error) {
    console.error("❌ Error buscando clientes:", error);
    res.status(500).json({
      success: false,
      error: "Error al buscar clientes: " + error.message
    });
  }
});

// ===============================
// 💳 PROCESAMIENTO DE PAGOS
// ===============================

app.post("/api/pagos/procesar", async (req, res) => {
  const { tarjeta, vencimiento, cvv, monto, email } = req.body;

  console.log("💳 Procesando pago:", {
    email,
    monto,
    tarjeta: tarjeta ? `${tarjeta.substring(0, 4)}...${tarjeta.substring(-4)}` : 'no proporcionada',
    vencimiento
  });

  try {
    // Validaciones básicas
    if (!tarjeta || !vencimiento || !cvv) {
      return res.status(400).json({
        success: false,
        error: "Datos de tarjeta incompletos"
      });
    }

    // Simular validación de tarjeta (en producción usarías un servicio como Stripe)
    const tarjetaLimpia = tarjeta.replace(/\s/g, '');

    if (tarjetaLimpia.length !== 16) {
      return res.status(400).json({
        success: false,
        error: "Número de tarjeta inválido"
      });
    }

    if (cvv.length < 3 || cvv.length > 4) {
      return res.status(400).json({
        success: false,
        error: "CVV inválido"
      });
    }

    // Simular procesamiento de pago exitoso
    // En un entorno real, aquí integrarías con Stripe, PayPal, etc.
    const pagoId = 'pago_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    console.log("✅ Pago procesado exitosamente:", pagoId);

    res.json({
      success: true,
      pagoId: pagoId,
      transactionId: pagoId,
      monto: monto,
      message: "Pago procesado exitosamente",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error procesando pago:", error);
    res.status(500).json({
      success: false,
      error: "Error al procesar el pago: " + error.message
    });
  }
});

// ===============================
// 📋 CREACIÓN DE RESERVAS
// ===============================

/*app.post("/api/reservas/crear", async (req, res) => {
  const {
    habitacion_id,
    datos_personales,
    datos_busqueda,
    pago_id,
    total
  } = req.body;

  console.log("📋 Creando reserva:", {
    habitacion_id,
    cliente: datos_personales.email,
    total
  });

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    // 1. Verificar que la habitación existe y está disponible
    const [habitaciones] = await pool.execute(
      `SELECT id, numero, nombre, estado, precio 
       FROM habitaciones 
       WHERE id = ? AND estado = 'disponible'`,
      [habitacion_id]
    );

    if (habitaciones.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Habitación no disponible"
      });
    }

    const habitacion = habitaciones[0];

    // 2. Verificar que no hay reservas superpuestas usando fechas_reservadas
    const [reservasExistentes] = await pool.execute(
      `SELECT fr.reserva_id 
       FROM fechas_reservadas fr
       JOIN reservas r ON fr.reserva_id = r.id
       WHERE fr.habitacion_id = ?
         AND r.estado = 'confirmada'
         AND fr.fecha >= ? AND fr.fecha < ?`,
      [
        habitacion_id,
        datos_busqueda.entrada,
        datos_busqueda.salida
      ]
    );

    if (reservasExistentes.length > 0) {
      return res.status(400).json({
        success: false,
        error: "La habitación ya está reservada en esas fechas"
      });
    }

    // 3. Crear reserva
    const [resultReserva] = await pool.execute(
      `INSERT INTO reservas (
        habitacion_id, 
        cliente_nombre, cliente_apellido, cliente_email, cliente_telefono, cliente_nacionalidad,
        fecha_entrada, fecha_salida, adultos, ninos, total, pago_id, estado_pago, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completado', 'confirmada')`,
      [
        habitacion_id,
        datos_personales.nombre,
        datos_personales.apellido,
        datos_personales.email,
        datos_personales.telefono,
        datos_personales.nacionalidad || 'No especificada',
        datos_busqueda.entrada,
        datos_busqueda.salida,
        datos_busqueda.adultos,
        datos_busqueda.ninos || 0,
        total,
        pago_id
      ]
    );

    const reservaId = resultReserva.insertId;

    // 4. Insertar fechas reservadas (el trigger se encargará de esto automáticamente)
    // Pero lo hacemos manualmente también para asegurar
    const fechaEntrada = new Date(datos_busqueda.entrada);
    const fechaSalida = new Date(datos_busqueda.salida);
    const fechaActual = new Date(fechaEntrada);

    while (fechaActual < fechaSalida) {
      await pool.execute(
        `INSERT INTO fechas_reservadas (habitacion_id, reserva_id, fecha) 
         VALUES (?, ?, ?)`,
        [habitacion_id, reservaId, fechaActual.toISOString().split('T')[0]]
      );
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    console.log("✅ Reserva creada exitosamente:", reservaId);

    res.json({
      success: true,
      reserva: {
        id: reservaId,
        habitacion: habitacion.nombre,
        numero: habitacion.numero,
        cliente: `${datos_personales.nombre} ${datos_personales.apellido}`,
        email: datos_personales.email,
        entrada: datos_busqueda.entrada,
        salida: datos_busqueda.salida,
        total: total,
        pagoId: pago_id
      },
      message: "Reserva creada exitosamente"
    });

  } catch (error) {
    console.error("❌ Error creando reserva:", error);
    res.status(500).json({
      success: false,
      error: "Error al crear la reserva: " + error.message
    });
  }
});*/

app.post("/api/reservas/crear", async (req, res) => {
  const {
    habitacion_id,
    datos_personales,
    datos_busqueda,
    pago_id,
    total
  } = req.body;

  console.log("📋 Creando reserva:", {
    habitacion_id,
    cliente: datos_personales.email,
    total
  });

  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Verificar que la habitación existe y está disponible
      const [habitaciones] = await connection.execute(
        `SELECT id, numero, nombre, estado, precio 
         FROM habitaciones 
         WHERE id = ? AND estado = 'disponible'`,
        [habitacion_id]
      );

      if (habitaciones.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          error: "Habitación no disponible"
        });
      }

      const habitacion = habitaciones[0];

      // 2. Verificar disponibilidad (tu lógica actual)
      const [reservasExistentes] = await connection.execute(
        `SELECT fr.reserva_id 
         FROM fechas_reservadas fr
         JOIN reservas r ON fr.reserva_id = r.id
         WHERE fr.habitacion_id = ?
           AND r.estado = 'confirmada'
           AND fr.fecha >= ? AND fr.fecha < ?`,
        [habitacion_id, datos_busqueda.entrada, datos_busqueda.salida]
      );

      if (reservasExistentes.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          error: "La habitación ya está reservada en esas fechas"
        });
      }

      // 3. Crear reserva
      const [resultReserva] = await connection.execute(
        `INSERT INTO reservas (
          habitacion_id, 
          cliente_nombre, cliente_apellido, cliente_email, cliente_telefono, cliente_nacionalidad,
          fecha_entrada, fecha_salida, adultos, ninos, total, pago_id, estado_pago, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completado', 'confirmada')`,
        [
          habitacion_id,
          datos_personales.nombre,
          datos_personales.apellido,
          datos_personales.email,
          datos_personales.telefono,
          datos_personales.nacionalidad || 'No especificada',
          datos_busqueda.entrada,
          datos_busqueda.salida,
          datos_busqueda.adultos,
          datos_busqueda.ninos || 0,
          total,
          pago_id
        ]
      );

      const reservaId = resultReserva.insertId;

      // 4. El trigger se encargará de insertar las fechas automáticamente
      // (Ya no necesitas insertarlas manualmente)

      await connection.commit();
      connection.release();

      console.log("✅ Reserva creada exitosamente:", reservaId);

      res.json({
        success: true,
        reservaId: reservaId,
        reserva: {
          id: reservaId,
          habitacion: habitacion.nombre,
          numero: habitacion.numero,
          cliente: `${datos_personales.nombre} ${datos_personales.apellido}`,
          email: datos_personales.email,
          entrada: datos_busqueda.entrada,
          salida: datos_busqueda.salida,
          total: total,
          pagoId: pago_id
        },
        message: "Reserva creada exitosamente"
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error("❌ Error creando reserva:", error);
    res.status(500).json({
      success: false,
      error: "Error al crear la reserva: " + error.message
    });
  }
});

// ===============================
// 📊 DASHBOARD ADMIN
// ===============================

app.get("/api/admin/dashboard", async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    const connection = await pool.getConnection();

    // 1. Estadísticas principales
    const [estadisticas] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM reservas WHERE DATE(fecha_reserva) = CURDATE()) as reservasHoy,
        (SELECT COUNT(*) FROM habitaciones WHERE estado = 'ocupada') as habitacionesOcupadas,
        (SELECT COUNT(*) FROM habitaciones WHERE estado = 'disponible') as habitacionesDisponibles,
        (SELECT COALESCE(SUM(total), 0) FROM reservas WHERE DATE(fecha_entrada) = CURDATE() AND estado_pago = 'completado') as ingresosHoy,
        (SELECT COUNT(*) FROM actividades WHERE activa = true) as totalActividades,
        (SELECT COUNT(*) FROM clientes) as totalClientes
    `);

    // 2. Reservas recientes (últimas 5)
    const [reservasRecientes] = await connection.execute(`
      SELECT 
        r.id,
        CONCAT(r.cliente_nombre, ' ', r.cliente_apellido) as cliente,
        h.numero as habitacion,
        r.fecha_entrada,
        r.fecha_salida,
        r.total,
        r.estado
      FROM reservas r
      JOIN habitaciones h ON r.habitacion_id = h.id
      WHERE r.estado != 'cancelada'
      ORDER BY r.fecha_reserva DESC
      LIMIT 5
    `);

    // 3. Ocupación por tipo de habitación
    const [ocupacion] = await connection.execute(`
      SELECT 
        tipo,
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'ocupada' THEN 1 ELSE 0 END) as ocupadas,
        SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) as disponibles
      FROM habitaciones
      GROUP BY tipo
    `);

    connection.release();

    res.json({
      success: true,
      data: {
        estadisticas: estadisticas[0],
        reservasRecientes: reservasRecientes,
        ocupacion: ocupacion
      }
    });

  } catch (error) {
    console.error("❌ Error en dashboard:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener datos del dashboard: " + error.message
    });
  }
});

// ===============================
// 📋 RESERVAS BÁSICAS
// ===============================

app.get("/api/reservas", async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Base de datos no disponible"
      });
    }

    const [reservas] = await pool.execute(
      `SELECT r.*, h.numero as habitacion_numero, h.nombre as habitacion_nombre
       FROM reservas r 
       JOIN habitaciones h ON r.habitacion_id = h.id 
       ORDER BY r.fecha_reserva DESC`
    );

    res.json({
      success: true,
      data: reservas
    });
  } catch (error) {
    console.error("❌ Error obteniendo reservas:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener reservas: " + error.message
    });
  }
});

// ===============================
// 📊 STATUS COMPLETO
// ===============================

app.get("/api/status", async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        status: "✅ Online",
        database: "❌ Desconectada",
        timestamp: new Date().toISOString(),
        port: PORT
      });
    }

    const [tablas] = await pool.execute("SHOW TABLES");
    const [habitacionesCount] = await pool.execute("SELECT COUNT(*) as total FROM habitaciones");
    const [reservasCount] = await pool.execute("SELECT COUNT(*) as total FROM reservas");
    const [clientesCount] = await pool.execute("SELECT COUNT(*) as total FROM clientes");
    const [staffCount] = await pool.execute("SELECT COUNT(*) as total FROM staff");
    const [fechasReservadasCount] = await pool.execute("SELECT COUNT(*) as total FROM fechas_reservadas");

    res.json({
      status: "✅ Online",
      database: "✅ Conectada",
      tables: tablas.map(t => Object.values(t)[0]),
      counts: {
        habitaciones: habitacionesCount[0].total,
        reservas: reservasCount[0].total,
        clientes: clientesCount[0].total,
        staff: staffCount[0].total,
        fechas_reservadas: fechasReservadasCount[0].total
      },
      timestamp: new Date().toISOString(),
      port: PORT
    });
  } catch (error) {
    res.status(500).json({
      status: "✅ Online",
      database: "❌ Error: " + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===============================
// 🛡️ MANEJO DE ERRORES GLOBALES
// ===============================

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rechazada no manejada:', reason);
});

// ===============================
// 🚀 INICIAR TODO EL SISTEMA
// ===============================
iniciarServidor().catch(error => {
  console.error('❌ Error fatal al iniciar el servidor:', error);
  process.exit(1);
});