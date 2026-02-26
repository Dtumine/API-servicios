const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;
let connectionStatus = 'not-initialized';

// Inicializar Supabase
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  connectionStatus = 'connected';
} else {
  connectionStatus = 'error-config';
}

// =============================
// RUTAS
// =============================

// 1. Ruta de estado
app.get('/api/status', async (req, res) => {
  try {
    if (connectionStatus === 'error-config') {
      return res.status(500).json({
        status: 'error',
        message: 'Configuración de Supabase incompleta',
        details: 'Faltan variables de entorno: SUPABASE_URL y/o SUPABASE_KEY'
      });
    }

    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .limit(1);

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al conectar con Supabase',
        details: error.message
      });
    }

    res.json({
      status: 'success',
      message: 'Conexión exitosa con Supabase (Tabla servicios)',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// 2. Obtener todos los servicios
app.get('/api/servicios', async (req, res) => {
  try {
    if (connectionStatus === 'error-config') {
      return res.status(500).json({
        status: 'error',
        message: 'Configuración incompleta'
      });
    }

    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .order('id_servicio', { ascending: true });

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al obtener servicios',
        details: error.message
      });
    }

    res.json({
      status: 'success',
      total: data ? data.length : 0,
      data: data || []
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// 3. Obtener servicio por ID
app.get('/api/servicios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'El parámetro id es requerido'
      });
    }

    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .eq('id_servicio', id)
      .single();

    if (error) {
      return res.status(404).json({
        status: 'error',
        message: 'Servicio no encontrado',
        details: error.message
      });
    }

    res.json({
      status: 'success',
      data
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// 4. Crear servicio
app.post('/api/servicios', async (req, res) => {
  try {
    const {
      id_auto,
      id_empleado,
      id_cliente,
      fecha_servicio,
      tipo_servicio, // 👈 CAMBIADO
      costo,
      kilometraje,
      fecha_ingreso,
      fecha_entrega,
      estado
    } = req.body;

    if (!id_auto || !id_empleado || !id_cliente || !fecha_servicio || !tipo_servicio) {
      return res.status(400).json({
        status: 'error',
        message: 'Campos obligatorios faltantes'
      });
    }

    const { data, error } = await supabase
      .from('servicios')


      .insert([
        {
          id_auto,
          id_empleado,
          id_cliente,
          fecha_servicio,
          tipo_servicio, // 👈 CAMBIADO
          costo: costo || 0,
          kilometraje: kilometraje || 0,
          fecha_ingreso: fecha_ingreso || new Date().toISOString(),
          fecha_entrega: fecha_entrega || null,
          estado: estado || 'pendiente'
        }
      ])
      .select();

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al crear servicio',
        details: error.message
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Servicio creado exitosamente',
      data: data[0]
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// 5. Actualizar servicio
app.put('/api/servicios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      id_auto,
      id_empleado,
      id_cliente,
      fecha_servicio,
      tipo_servicio,
      costo,
      kilometraje,
      fecha_ingreso,
      fecha_entrega,
      estado
    } = req.body;

    const { data, error } = await supabase
      .from('servicios')
      .update({
        id_auto,
        id_empleado,
        id_cliente,
        fecha_servicio,
        tipo_servicio,
        costo,
        kilometraje,
        fecha_ingreso,
        fecha_entrega,
        estado
      })
      .eq('id_servicio', id)
      .select();

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al actualizar servicio',
        details: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Servicio no encontrado'
      });
    }

    res.json({
      status: 'success',
      message: 'Servicio actualizado exitosamente',
      data: data[0]
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// 6. Eliminar servicio
app.delete('/api/servicios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('servicios')
      .delete()
      .eq('id_servicio', id)
      .select();

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al eliminar servicio',
        details: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Servicio no encontrado'
      });
    }

    res.json({
      status: 'success',
      message: 'Servicio eliminado exitosamente',
      data: data[0]
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// =============================
// MANEJO DE ERRORES
// =============================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor',
    details: err.message
  });
});

// =============================
// PUERTO (IMPORTANTE PARA RENDER)
// =============================

const PORT = process.env.PORT || process.env.PORT_SERVICIOS || 4000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API Servicios ejecutándose en puerto ${PORT}`);
  console.log(`Estado de conexión: ${connectionStatus}`);
});