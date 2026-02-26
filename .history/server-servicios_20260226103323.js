const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// =============================
// MIDDLEWARE
// =============================
app.use(cors());
app.use(express.json());

// =============================
// CONFIG SUPABASE
// =============================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;
let connectionStatus = 'not-initialized';

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  connectionStatus = 'connected';
} else {
  connectionStatus = 'error-config';
  console.error("❌ SUPABASE_URL o SUPABASE_KEY no definidos");
}

// =============================
// 1. STATUS
// =============================
app.get('/api/status', async (req, res) => {
  try {
    const { error } = await supabase
      .from('servicios')
      .select('id_servicio')
      .limit(1);

    if (error) {
      console.error("🔥 STATUS ERROR:", error);
      return res.status(500).json(error);
    }

    res.json({
      status: 'success',
      connection: connectionStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("🔥 STATUS CATCH:", error);
    res.status(500).json(error);
  }
});

// =============================
// 2. GET ALL
// =============================
app.get('/api/servicios', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .order('id_servicio', { ascending: true });

    if (error) {
      console.error("🔥 GET SERVICIOS ERROR:", error);
      return res.status(500).json(error);
    }

    res.json(data);

  } catch (error) {
    console.error("🔥 GET SERVICIOS CATCH:", error);
    res.status(500).json(error);
  }
});

// =============================
// 3. GET BY ID
// =============================
app.get('/api/servicios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .eq('id_servicio', id)
      .single();

    if (error) {
      console.error("🔥 GET BY ID ERROR:", error);
      return res.status(404).json(error);
    }

    res.json(data);

  } catch (error) {
    console.error("🔥 GET BY ID CATCH:", error);
    res.status(500).json(error);
  }
});

// =============================
// 4. CREATE
// =============================

app.post('/api/servicios', async (req, res) => {
  try {
    console.log("📦 BODY RECIBIDO:", req.body);

    const {
      id_auto,
      id_empleado,
      fecha_servicio,
      tipo_servicio,
      costo,
      estado
    } = req.body;

    if (!id_auto || !id_empleado || !fecha_servicio || !tipo_servicio) {
      return res.status(400).json({
        message: 'Campos obligatorios faltantes'
      });
    }

    const nuevoServicio = {
      id_auto: Number(id_auto),
      id_empleado: Number(id_empleado),
      fecha_servicio,
      tipo_servicio,
      costo: costo ?? 0,
      estado: (estado || 'pendiente').toLowerCase().trim()
    };

    console.log("🚀 INSERTANDO FINAL:", nuevoServicio);

    const { data, error } = await supabase
      .from('servicios')
      .insert([nuevoServicio])
      .select();

    if (error) {
      console.error("🔥 SUPABASE INSERT ERROR:", error);
      return res.status(500).json(error);
    }

    res.status(201).json(data[0]);

  } catch (error) {
    console.error("🔥 CREATE CATCH:", error);
    res.status(500).json(error);
  }
});

// =============================
// 5. UPDATE
// =============================
app.put('/api/servicios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = { ...req.body };

    // Limpiar undefined
    Object.keys(updateData).forEach(
      key => updateData[key] === undefined && delete updateData[key]
    );

    console.log("✏️ ACTUALIZANDO:", id, updateData);

    const { data, error } = await supabase
      .from('servicios')
      .update(updateData)
      .eq('id_servicio', id)
      .select();

    if (error) {
      console.error("🔥 UPDATE ERROR:", error);
      return res.status(500).json(error);
    }

    if (!data.length) {
      return res.status(404).json({ message: "No encontrado" });
    }

    res.json(data[0]);

  } catch (error) {
    console.error("🔥 UPDATE CATCH:", error);
    res.status(500).json(error);
  }
});

// =============================
// 6. DELETE
// =============================
app.delete('/api/servicios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('servicios')
      .delete()
      .eq('id_servicio', id)
      .select();

    if (error) {
      console.error("🔥 DELETE ERROR:", error);
      return res.status(500).json(error);
    }

    if (!data.length) {
      return res.status(404).json({ message: "No encontrado" });
    }

    res.json(data[0]);

  } catch (error) {
    console.error("🔥 DELETE CATCH:", error);
    res.status(500).json(error);
  }
});

// =============================
// PUERTO
// =============================
const PORT = process.env.PORT || process.env.PORT_SERVICIOS || 4000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API Servicios ejecutándose en puerto ${PORT}`);
  console.log(`Estado de conexión: ${connectionStatus}`);
});