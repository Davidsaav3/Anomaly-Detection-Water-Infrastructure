const fs = require('fs');
const path = require('path');

// OBTENER PARÁMETROS DE LA LÍNEA DE COMANDOS
const args = process.argv.slice(2);
const configPath = args[2] ? args[2] : './config.json

let config = {};

// FUNCIÓN PARA ASEGURARSE DE QUE EL ARCHIVO TIENE EXTENSIÓN .JSON
function ensureJsonExtension(filename) {
  return filename.endsWith('.json') ? filename : `${filename}.json`;
}

// CARGAR CONFIGURACIÓN DESDE EL ARCHIVO JSON (O USAR VALORES POR DEFECTO)
try {
  const configFile = fs.readFileSync(configPath);
  config = JSON.parse(configFile);
} 
catch (error) {
  console.error(`! ERROR: NO SE PUDO LEER ${configPath}, USANDO CONFIGURACIÓN POR DEFECTO !`, error);
  process.exit(1); // SALIR SI NO SE PUEDE LEER EL ARCHIVO DE CONFIGURACIÓN
}

// LEER EL ARCHIVO JSON ORIGINAL
function readData(filePath) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data); // DEVOLVER JSON PARSEADO
  }
  throw new Error('EL ARCHIVO NO EXISTE.');
}

// OBTENER CLAVES COMUNES A TODOS LOS OBJETOS
function getCommonKeys(data) {
  if (data.length === 0) return []; // SIN DATOS, SIN CLAVES COMUNES
  let commonKeys = Object.keys(data[0]); // INICIAR CON CLAVES DEL PRIMER OBJETO
  data.forEach(item => {
    commonKeys = commonKeys.filter(key => key in item); // FILTRAR CLAVES PRESENTES EN TODOS
  });
  return commonKeys;
}

// NORMALIZAR OBJETOS (SOLO CON CLAVES COMUNES)
function normalizeData(data, commonKeys) {
  return data.map(item => {
    const normalizedItem = {};
    commonKeys.forEach(key => {
      normalizedItem[key] = item[key]; // ASIGNAR VALOR EXISTENTE
    });
    return normalizedItem;
  });
}

// GUARDAR EL RESULTADO EN UN NUEVO ARCHIVO JSON
function saveToJSON(data, outputFilename) {
  fs.writeFileSync(outputFilename, JSON.stringify(data, null, 2)); // GUARDAR JSON
  console.log(`[ REDUCE: ${outputFilename} ]`); // CONFIRMAR GUARDADO
}

// PROCESAR Y GUARDAR LOS DATOS
function processData(inputFilename, outputFilename) {
  const jsonData = readData(inputFilename); // LEER DATOS DEL JSON
  const commonKeys = getCommonKeys(jsonData); // OBTENER CLAVES COMUNES
  const normalizedData = normalizeData(jsonData, commonKeys); // NORMALIZAR DATOS
  saveToJSON(normalizedData, outputFilename); // GUARDAR DATOS
}

// OBTENER NOMBRES DE ARCHIVO DESDE LA LÍNEA DE COMANDOS
if (args.length < 2) {
  console.error('! ERROR: INPUT AND OUTPUT NEEDED !');
  process.exit(1);
}

// AÑADIR .JSON A LOS ARCHIVOS SI NO LO TIENEN
const inputFile = args[0];
const outputFile = args[1];

processData(inputFile, outputFile);
