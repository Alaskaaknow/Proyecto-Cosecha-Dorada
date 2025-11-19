-- ===========================================
-- 🏨 HOTEL LA COSECHA DORADA - SISTEMA CORREGIDO
-- ===========================================

-- Eliminar base de datos existente
DROP DATABASE IF EXISTS hotel_vinedo;
CREATE DATABASE hotel_vinedo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hotel_vinedo;

-- ===============================
-- 🧑‍💼 TABLA DE EMPLEADOS
-- ===============================
CREATE TABLE empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    puesto ENUM('administrador', 'recepcionista', 'limpieza', 'cocina', 'seguridad') NOT NULL,
    salario DECIMAL(10,2) NOT NULL,
    fecha_contratacion DATE NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar empleados
INSERT INTO empleados (nombre, apellido, email, telefono, puesto, salario, fecha_contratacion) VALUES
('Juan', 'Pérez', 'juan.perez@hotel.com', '123-456-7890', 'administrador', 3000.00, '2024-01-15'),
('María', 'Gómez', 'maria.gomez@hotel.com', '123-456-7891', 'recepcionista', 1500.00, '2024-02-20'),
('Carlos', 'López', 'carlos.lopez@hotel.com', '123-456-7892', 'limpieza', 1200.00, '2024-03-10');

-- ===============================
-- 👨‍💼 TABLA DE STAFF (EMPLEADOS CON LOGIN)
-- ===============================
CREATE TABLE staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    empleado_id INT NOT NULL,
    role ENUM('administrador', 'recepcionista') NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE
);

-- Insertar staff
INSERT INTO staff (username, password, empleado_id, role) VALUES
('admin', '1234', 1, 'administrador'),
('recepcion', '1234', 2, 'recepcionista');

-- ===============================
-- 👥 TABLA DE CLIENTES (USUARIOS WEB)
-- ===============================
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar cliente de ejemplo
INSERT INTO clientes (username, password, nombre, apellido, email, telefono) VALUES
('cliente1', '1234', 'Carlos', 'López', 'cliente@ejemplo.com', '123-456-7892');

-- ===============================
-- 🎯 TABLA DE ACTIVIDADES
-- ===============================
CREATE TABLE actividades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    imagen VARCHAR(500),
    activa BOOLEAN DEFAULT true,
    orden INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar actividades de ejemplo
INSERT INTO actividades (titulo, descripcion, imagen, orden) VALUES
('Paseos a Caballo', 'Recorridos guiados por nuestros viñedos al atardecer', '/images/actividad1.jpg', 1),
('Cenas Gourmet', 'Experiencias culinarias con productos locales y nuestros vinos', '/images/actividad2.jpg', 2),
('Catas de Vino', 'Degustación de nuestras reservas exclusivas en la bodega', '/images/actividad3.jpg', 3),
('Noches de Baile', 'Veladas con música en vivo y danzas tradicionales', '/images/actividad4.jpg', 4);

-- ===============================
-- 🏨 TABLA DE HABITACIONES - SOLO 3 ESTADOS
-- ===============================
CREATE TABLE habitaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(10) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('simple', 'doble', 'suite', 'familiar') NOT NULL,
    descripcion TEXT NOT NULL,
    capacidad INT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    imagen VARCHAR(255) DEFAULT NULL,
    estado ENUM('disponible', 'ocupada', 'mantenimiento') DEFAULT 'disponible' -- ELIMINADO 'reservada'
);

-- Insertar habitaciones
INSERT INTO habitaciones (numero, nombre, tipo, descripcion, capacidad, precio, imagen, estado) VALUES
('101', 'Suite Deluxe', 'suite', 'Habitación amplia con jacuzzi y vista al viñedo.', 2, 258.00, 'suitel.jpg', 'disponible'),
('102', 'Habitación Doble', 'doble', 'Con dos camas individuales y balcón privado.', 2, 180.00, 'doble1.jpg', 'disponible'),
('103', 'Habitación Familiar', 'familiar', 'Perfecta para familias con niños.', 4, 300.00, 'familiar1.jpg', 'disponible'),
('104', 'Habitación Simple', 'simple', 'Ideal para una persona, cómoda y económica.', 1, 120.00, 'simple1.jpg', 'disponible'),
('105', 'Suite Premium', 'suite', 'Con terraza privada y minibar.', 2, 280.00, 'suite2.jpg', 'mantenimiento');

-- ===============================
-- 🗓️ TABLA DE RESERVAS
-- ===============================
CREATE TABLE reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Datos del cliente
    cliente_nombre VARCHAR(100) NOT NULL,
    cliente_apellido VARCHAR(100) NOT NULL,
    cliente_email VARCHAR(150) NOT NULL,
    cliente_telefono VARCHAR(20),
    cliente_nacionalidad VARCHAR(50),
    
    -- Datos de la reserva
    habitacion_id INT NOT NULL,
    fecha_entrada DATE NOT NULL,
    fecha_salida DATE NOT NULL,
    adultos INT NOT NULL,
    ninos INT NOT NULL DEFAULT 0,
    
    -- Datos de pago
    total DECIMAL(10,2) NOT NULL,
    pago_id VARCHAR(100) UNIQUE,
    estado_pago ENUM('pendiente', 'completado', 'reembolsado', 'fallido') DEFAULT 'pendiente',
    
    -- Estado de reserva
    estado ENUM('pendiente', 'confirmada', 'cancelada', 'completada') DEFAULT 'pendiente',
    
    -- Fechas de auditoría
    fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id) ON DELETE CASCADE
);

-- ===============================
-- 📅 TABLA DE FECHAS RESERVADAS - SOLO PARA CONTROL
-- ===============================
CREATE TABLE fechas_reservadas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    habitacion_id INT NOT NULL,
    reserva_id INT NOT NULL,
    fecha DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_habitacion_fecha (habitacion_id, fecha)
);

-- ===============================
-- 💰 TABLA DE REEMBOLSOS
-- ===============================
CREATE TABLE reembolsos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reserva_id INT NOT NULL,
    monto_reembolsado DECIMAL(10,2) NOT NULL,
    motivo TEXT,
    fecha_reembolso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE
);

-------------------------------------------------------------------------
-- TABLA PARA CONSULTAS DE CLIENTES
CREATE TABLE IF NOT EXISTS consultas_clientes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  asunto VARCHAR(200) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo ENUM('consulta_cliente', 'soporte_tecnico', 'reserva', 'general') DEFAULT 'consulta_cliente',
  estado ENUM('pendiente', 'en_proceso', 'resuelto') DEFAULT 'pendiente',
  respuesta TEXT,
  operador_respuesta VARCHAR(100),
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  fecha_respuesta DATETIME,
  INDEX idx_estado (estado),
  INDEX idx_fecha_creacion (fecha_creacion)
);
-----------------------------------------------------------

-- ===============================
-- 🔧 TRIGGERS SIMPLIFICADOS - SIN CAMBIAR ESTADO POR RESERVAS
-- ===============================

-- Eliminar triggers existentes
DROP TRIGGER IF EXISTS after_reserva_update;
DROP TRIGGER IF EXISTS after_reserva_insert;

-- NUEVO TRIGGER SIMPLIFICADO - Solo maneja check-in/check-out real
DELIMITER //

CREATE TRIGGER after_reserva_update
AFTER UPDATE ON reservas
FOR EACH ROW
BEGIN
    -- SOLO cambiar a "ocupada" cuando hay check-in REAL
    -- Las reservas confirmadas NO cambian el estado de la habitación
    
    -- Cuando se completa el check-out, liberar la habitación
    IF NEW.estado = 'completada' AND OLD.estado != 'completada' THEN
        UPDATE habitaciones 
        SET estado = 'disponible' 
        WHERE id = NEW.habitacion_id;
        
        -- Eliminar fechas reservadas
        DELETE FROM fechas_reservadas WHERE reserva_id = NEW.id;
    END IF;
    
    -- Si se cancela, liberar las fechas
    IF NEW.estado = 'cancelada' AND OLD.estado != 'cancelada' THEN
        -- Eliminar fechas reservadas
        DELETE FROM fechas_reservadas WHERE reserva_id = NEW.id;
    END IF;
END//

DELIMITER ;

-- Trigger para nuevas reservas - SOLO inserta fechas reservadas
DELIMITER //

CREATE TRIGGER after_reserva_insert
AFTER INSERT ON reservas
FOR EACH ROW
BEGIN
    -- Cuando se crea una reserva confirmada, insertar las fechas reservadas
    IF NEW.estado = 'confirmada' THEN
        SET @fecha_actual = NEW.fecha_entrada;
        WHILE @fecha_actual < NEW.fecha_salida DO
            INSERT IGNORE INTO fechas_reservadas (habitacion_id, reserva_id, fecha)
            VALUES (NEW.habitacion_id, NEW.id, @fecha_actual);
            SET @fecha_actual = DATE_ADD(@fecha_actual, INTERVAL 1 DAY);
        END WHILE;
    END IF;
END//

DELIMITER ;

-- ===============================
-- 🏨 TABLA DE CONFIGURACIÓN DEL HOTEL
-- ===============================
CREATE TABLE configuracion_hotel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_hotel VARCHAR(255) NOT NULL DEFAULT 'La Cosecha Dorada',
    categoria_hotel VARCHAR(50) DEFAULT '4 Estrellas',
    direccion_hotel TEXT NOT NULL,
    telefono_hotel VARCHAR(20) DEFAULT '+51 123 456 789',
    ruc_hotel VARCHAR(20) DEFAULT '20123456789',
    email_hotel VARCHAR(150) DEFAULT 'info@lacosechadorada.com',
    registro_hotel VARCHAR(100) DEFAULT 'Registro Turístico N° 123456',
    
    -- Datos del Gerente
    nombre_gerente VARCHAR(100) DEFAULT 'Juan Pérez',
    documento_gerente VARCHAR(20) DEFAULT '12345678',
    tipo_documento_gerente VARCHAR(20) DEFAULT 'DNI',
    direccion_gerente TEXT,
    telefono_gerente VARCHAR(20) DEFAULT '+51 987 654 321',
    
    -- Configuración del Sistema
    moneda_nacional VARCHAR(10) DEFAULT 'PEN',
    moneda_cambio VARCHAR(10) DEFAULT 'USD',
    lleva_contabilidad BOOLEAN DEFAULT TRUE,
    descuento_global DECIMAL(5,2) DEFAULT 0.00,
    numero_factura INT DEFAULT 1,
    fecha_autorizacion DATE DEFAULT '2024-01-01',
    
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar configuración por defecto
INSERT INTO configuracion_hotel (direccion_hotel, direccion_gerente) VALUES 
('Av. Principal 123, Valle del Viñedo', 'Av. Gerencial 456');

-- ===============================
-- 🔍 VERIFICACIÓN FINAL
-- ===============================

-- Ver todas las tablas creadas
SHOW TABLES;

-- Insertar una reserva de prueba
INSERT IGNORE INTO reservas (
    cliente_nombre, cliente_apellido, cliente_email, cliente_telefono, cliente_nacionalidad,
    habitacion_id, fecha_entrada, fecha_salida, adultos, ninos, total, pago_id, estado_pago, estado
) VALUES (
    'Cliente', 'Prueba', 'cliente@prueba.com', '123456789', 'Argentina',
    1, CURDATE() + INTERVAL 1 DAY, CURDATE() + INTERVAL 3 DAY, 2, 0, 516.00, 'TEST_001', 'completado', 'confirmada'
);

-- Ver que la habitación sigue DISPONIBLE (no reservada)
SELECT id, numero, nombre, estado FROM habitaciones WHERE id = 1;

-- Ver las fechas reservadas generadas
SELECT * FROM fechas_reservadas WHERE reserva_id = LAST_INSERT_ID();
-- Ver todos los clientes y sus contraseñas

CREATE TABLE IF NOT EXISTS hotel_info (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_hotel VARCHAR(255) NOT NULL,
    email_principal VARCHAR(255),
    email_secundario VARCHAR(255),
    telefono_principal VARCHAR(50),
    telefono_secundario VARCHAR(50),
    direccion TEXT,
    ubicacion_mapa TEXT,
    historia TEXT,
    horario_atencion VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Insertar datos iniciales
INSERT INTO hotel_info (
    nombre_hotel, 
    email_principal, 
    email_secundario, 
    telefono_principal, 
    telefono_secundario, 
    direccion, 
    ubicacion_mapa,
    historia,
    horario_atencion
) VALUES (
    'La Cosecha Dorada',
    'reservas@lacosechadorada.com',
    'info@lacosechadorada.com',
    '+54 261 123 4567',
    '+54 261 987 6543',
    'Av. de Acceso Este 1360, M5519',
    'Av. de Acceso Este 1360, M5519 Mendoza, Argentina',
    'Nacimos entre viñedos, donde el sol acaricia las uvas y el tiempo se detiene. Lo que inició como un pequeño sueño familiar, se convirtió en un refugio de calma, donde cada visita es una celebración de la tierra, el vino y la calidez.',
    '8:00 AM - 10:00 PM'
);