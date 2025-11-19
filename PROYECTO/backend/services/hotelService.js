import db from '../db.js';

const hotelService = {
    // Obtener información del hotel
    getHotelInfo: async () => {
        try {
            console.log('🔍 Buscando información del hotel en la base de datos...');
            const [rows] = await db.query('SELECT * FROM hotel_info ORDER BY id DESC LIMIT 1');
            console.log('📊 Resultado de la consulta:', rows);
            
            if (rows.length === 0) {
                console.log('⚠️ No se encontraron registros en hotel_info');
                return null;
            }
            
            return rows[0];
        } catch (error) {
            console.error('❌ Error en hotelService.getHotelInfo:', error);
            console.error('🔧 Detalles del error:', error.message);
            throw error;
        }
    },

    // Actualizar información del hotel
    updateHotelInfo: async (hotelData) => {
        try {
            const {
                nombre_hotel,
                email_principal,
                email_secundario,
                telefono_principal,
                telefono_secundario,
                direccion,
                ubicacion_mapa,
                historia,
                horario_atencion
            } = hotelData;

            console.log('📝 Actualizando información del hotel:', hotelData);

            // Primero verifica si existe algún registro
            const [existing] = await db.query('SELECT id FROM hotel_info ORDER BY id DESC LIMIT 1');
            
            let result;
            if (existing.length > 0) {
                // Actualizar registro existente
                [result] = await db.query(`
                    UPDATE hotel_info 
                    SET nombre_hotel = ?, 
                        email_principal = ?, 
                        email_secundario = ?, 
                        telefono_principal = ?, 
                        telefono_secundario = ?, 
                        direccion = ?, 
                        ubicacion_mapa = ?, 
                        historia = ?, 
                        horario_atencion = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [
                    nombre_hotel,
                    email_principal,
                    email_secundario,
                    telefono_principal,
                    telefono_secundario,
                    direccion,
                    ubicacion_mapa,
                    historia,
                    horario_atencion,
                    existing[0].id
                ]);
            } else {
                // Insertar nuevo registro si no existe
                [result] = await db.query(`
                    INSERT INTO hotel_info (
                        nombre_hotel, email_principal, email_secundario, 
                        telefono_principal, telefono_secundario, direccion, 
                        ubicacion_mapa, historia, horario_atencion
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    nombre_hotel,
                    email_principal,
                    email_secundario,
                    telefono_principal,
                    telefono_secundario,
                    direccion,
                    ubicacion_mapa,
                    historia,
                    horario_atencion
                ]);
            }

            console.log('✅ Información del hotel actualizada correctamente');
            return result;
        } catch (error) {
            console.error('❌ Error en hotelService.updateHotelInfo:', error);
            throw error;
        }
    }
};

export default hotelService;