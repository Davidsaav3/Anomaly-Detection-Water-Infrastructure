const fs = require('fs');
const args = process.argv.slice(2);
const configPath = args[2] ? args[2] : './config.json';
let config = {};

// [ NOMBRES DE ARCHIVO ]
if (args.length < 2) {
  console.error('! ERROR: INPUT !');
  process.exit(1);
}

// [ CARGAR CONFIGURACIÓN ]
try {
  const configFile = fs.readFileSync(configPath);
  config = JSON.parse(configFile); // PARSEAR CONFIGURACIÓN
}
catch (error) {
  console.error(`! ERROR: CONFIG ${configPath} !`, error);
  process.exit(1);
}

// [ LEER JSON  ]
function readData(filePath) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data); // DEVOLVER JSON PARSEADO
  }
  throw new Error('THE FILE DOES NOT EXIST');
}

// [ OBTENER CLAVES ÚNICAS DE TODOS LOS OBJETOS ]
function getUniqueKeys(data) {
  const keys = new Set(); // INICIALIZAR SET DE CLAVES
  data.forEach(item => {
    Object.keys(item).forEach(key => keys.add(key)); // AGREGAR CLAVES AL SET
  });
  return Array.from(keys); // ARRAY DE CLAVES
}

// [ NORMALIZAR OBJETOS ]
function normalizeData(data, uniqueKeys) {
  return data.map(item => {
    const normalizedItem = {};
    uniqueKeys.forEach(key => {
      normalizedItem[key] = item[key] !== undefined ? item[key] : config.expandedColumn.expand_value; // ASIGNAR VALOR O VALOR POR DEFECTO
    });
    return normalizedItem; // OBJETO NORMALIZADO
  });
}

// [ GUARDAR EL RESULTADO ]
function saveToJSON(data, outputFilename) {
  fs.writeFileSync(outputFilename, JSON.stringify(data, null, 2));
  console.log(`[ EXPANDED: ${outputFilename} ]`);
}

// [ PROCESAR Y GUARDAR LOS DATOS ]
function main(inputFilename, outputFilename) {
  const jsonData = readData(inputFilename); // LEER DATOS
  const uniqueKeys = getUniqueKeys(jsonData); // OBTENER CLAVES
  const normalizedData = normalizeData(jsonData, uniqueKeys); // NORMALIZAR
  saveToJSON(normalizedData, outputFilename);
}

main(args[0], args[1]);
