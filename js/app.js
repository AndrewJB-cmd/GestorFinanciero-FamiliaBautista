// ==========================================
// ⚙️ CONFIGURACIÓN GENERAL
// ==========================================

// 🔑 TU LLAVE MAESTRA DE IA (Consíguela en aistudio.google.com)
var GEMINI_API_KEY = 'PEGAR_TU_API_KEY_AQUI'; 

// Identificador de la Hoja de Cálculo (Opcional, si el script está incrustado usa getActive)
var SS = SpreadsheetApp.getActiveSpreadsheet();

// ==========================================
// 🚀 INICIO DE LA APLICACIÓN
// ==========================================

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Finanzas Familiares - Yenny')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

// ==========================================
// 💾 GUARDADO DE DATOS (El Corazón)
// ==========================================

function guardarMovimiento(datos) {
  /* Recibe un objeto 'datos' desde el HTML:
    { fecha: "2024-02-20", tipo: "Gasto", responsable: "Casa", 
      categoria: "Servicios", concepto: "Luz", monto: 120000 }
  */
  
  // 1. Identificar el mes para saber en qué pestaña guardar
  var fechaObj = new Date(datos.fecha);
  // Ajuste de zona horaria si es necesario, o split simple del string YYYY-MM-DD
  var partesFecha = datos.fecha.split('-'); 
  var mesIndex = parseInt(partesFecha[1]); // 1 = Enero, 2 = Febrero...
  
  var nombresMeses = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                      
  var nombreHoja = nombresMeses[mesIndex];
  var hoja = SS.getSheetByName(nombreHoja);
  
  // Si la hoja no existe (ej. error de dedo), avisar
  if (!hoja) return { exito: false, mensaje: "❌ Error: No existe la hoja '" + nombreHoja + "'." };

  // 2. Guardar el registro
  // Columnas sugeridas: [Fecha Registro, Fecha Gasto, Tipo, Responsable, Categoría, Concepto, Monto]
  hoja.appendRow([
    new Date(),       // Timestamp de registro
    datos.fecha,      // Fecha del movimiento
    datos.tipo,
    datos.responsable,
    datos.categoria,
    datos.concepto,
    parseFloat(datos.monto)
  ]);

  // 3. Ordenar automáticamente por fecha (Asumiendo fecha en Columna 2 / B)
  var ultimaFila = hoja.getLastRow();
  if (ultimaFila > 1) {
    var rangoDatos = hoja.getRange(2, 1, ultimaFila - 1, hoja.getLastColumn());
    rangoDatos.sort({column: 2, ascending: true});
  }

  return { exito: true, mensaje: "✅ Guardado en " + nombreHoja };
}

// ==========================================
// 🤖 INTELIGENCIA ARTIFICIAL (Gemini)
// ==========================================

// Función A: El "Resumen Mágico" (Wrapped)
function generarResumenMensualIA() {
  // 1. Obtener datos del mes actual (Ej. Febrero)
  var mesActual = "Febrero"; // Podrías calcularlo dinámicamente con new Date()
  var hoja = SS.getSheetByName(mesActual);
  
  if (!hoja) return { error: "No encontré datos de este mes." };
  
  // Leer datos crudos (Simplificado para no saturar la IA con miles de filas)
  // Leemos encabezados y datos
  var datos = hoja.getDataRange().getValues();
  // Calculamos totales rápidos en JS para ayudar a la IA
  var totalIngreso = 0;
  var totalGasto = 0;
  
  // Saltamos encabezado
  for (var i = 1; i < datos.length; i++) {
    var fila = datos[i];
    // Asumiendo Columna 3 (índice 2) es Tipo, y Columna 7 (índice 6) es Monto
    if (fila[2] == 'Ingreso') totalIngreso += Number(fila[6]);
    if (fila[2] == 'Gasto') totalGasto += Number(fila[6]);
  }
  
  var balance = totalIngreso - totalGasto;

  // 2. Prompt para Gemini
  var prompt = `
    Actúa como un asistente financiero personal divertido y carismático para 'Yenny'.
    Datos del mes de ${mesActual}:
    - Ingresos: $${totalIngreso}
    - Gastos: $${totalGasto}
    - Balance: $${balance}
    
    Genera 3 tarjetas de resumen (slides) en formato JSON puro:
    1. Vibe general del mes (con emojis).
    2. Un dato curioso o consejo sobre el gasto.
    3. Una motivación para el próximo mes.
    
    Formato JSON esperado:
    [
      {"emoji": "😎", "title": "Título corto", "text": "Texto divertido..."},
      {"emoji": "📉", "title": "Título corto", "text": "Texto divertido..."},
      {"emoji": "🚀", "title": "Título corto", "text": "Texto divertido..."}
    ]
  `;

  return llamarGemini(prompt);
}

// Función B: Procesar Texto Natural (La varita mágica)
function procesarFraseConIA(frase) {
  var prompt = `
    Analiza esta frase contable: "${frase}".
    Extrae la información en JSON con estos campos exactos:
    - fecha: YYYY-MM-DD (usa la fecha de hoy si no se especifica)
    - monto: número (sin símbolos)
    - tipo: "Ingreso" o "Gasto"
    - categoria: "Servicios", "Alimentos", "Arriendo", "Mantenimiento" u "Otros"
    - concepto: descripción breve
    - responsable: quién pagó o recibió
    
    Responde SOLO el JSON.
  `;
  
  return llamarGemini(prompt);
}

// Helper para conectar con Gemini
function llamarGemini(prompt) {
  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;
  
  var payload = {
    "contents": [{
      "parts": [{"text": prompt}]
    }]
  };

  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var json = JSON.parse(response.getContentText());
    var textoIA = json.candidates[0].content.parts[0].text;
    
    // Limpieza de Markdown si la IA pone ```json ... ```
    textoIA = textoIA.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(textoIA);
  } catch (e) {
    return { error: "La IA está durmiendo. Error: " + e.toString() };
  }
}

// ==========================================
// 🛠️ HERRAMIENTAS EXTRAS
// ==========================================

function crearCopiaSeguridad() {
  var fecha = new Date();
  var nombreCopia = "Respaldo Contabilidad - " + fecha.toLocaleDateString();
  
  // Hace una copia del archivo actual en Drive
  DriveApp.getFileById(SS.getId()).makeCopy(nombreCopia);
  
  return "✅ Copia de seguridad creada en Google Drive.";
}

function obtenerDatosDashboard() {
  // Esta función alimentaría los números del Dashboard al cargar
  // Para la versión 1.0, puedes usarla para traer el total del mes actual
  
  // Lógica simplificada de ejemplo
  return {
    gastos: 1250,
    ingresos: 2800,
    saldo: 1550,
    ultimosMovimientos: [
      {fecha: "Hoy", concepto: "Ejemplo", monto: -50}
    ]
  };
}