const fs = require('fs');
const args = process.argv.slice(2);
const configPath = args[2] ? args[2] : './config.json';
let config = {};

// [ OBTENER NOMBRES DE ARCHIVO ]
if (args.length < 2) {
  console.error('! ERROR: INPUT !');
  process.exit(1);
}

// [ CARGAR CONFIGURACIÓN ]
try {
  const configFile = fs.readFileSync(configPath);
  config = JSON.parse(configFile);
}
catch (error) {
  console.error(`! ERROR: CONFIG ${configPath} !`, error);
  process.exit(1);
}

// [ LEER EL ARCHIVO JSON ]
function readData(filePath) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data); // DEVOLVER JSON PARSEADO
  }
  throw new Error('THE FILE DOES NOT EXIST');
}

// [ OBTENER CLAVES COMUNES A TODOS LOS OBJETOS ]
function getCommonKeys(data) {
  if (data.length === 0) return []; // SIN DATOS, SIN CLAVES COMUNES
  let commonKeys = Object.keys(data[0]); // INICIAR CON CLAVES DEL PRIMER OBJETO
  data.forEach(item => {
    commonKeys = commonKeys.filter(key => key in item); // FILTRAR CLAVES PRESENTES EN TODOS
  });
  return commonKeys;
}

// [ NORMALIZAR OBJETOS ]
function normalizeData(data, commonKeys) {
  return data.map(item => {
    const normalizedItem = {};
    commonKeys.forEach(key => {
      normalizedItem[key] = item[key]; // ASIGNAR VALOR EXISTENTE
    });
    return normalizedItem;
  });
}

// [ GUARDAR EL RESULTADO ]
function saveToJSON(data, outputFilename) {
  fs.writeFileSync(outputFilename, JSON.stringify(data, null, 2)); // GUARDAR JSON
  console.log(`[ REDUCE COLUMN: ${outputFilename} ]`);
}

// [ MAIN: PROCESAR Y GUARDAR LOS DATOS ]
function main(inputFilename, outputFilename) {
  const jsonData = readData(inputFilename); // LEER DATOS DEL JSON
  const commonKeys = getCommonKeys(jsonData); // OBTENER CLAVES COMUNES
  const normalizedData = normalizeData(jsonData, commonKeys); // NORMALIZAR DATOS
  saveToJSON(normalizedData, outputFilename);
}

main(args[0], args[1]);
