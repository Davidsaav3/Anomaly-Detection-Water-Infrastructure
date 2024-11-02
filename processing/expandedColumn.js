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

// [ GUARDAR EL RESULTADO ]
function saveJSON(data, outputFilename) {
  fs.writeFileSync(outputFilename, JSON.stringify(data, null, 2));
  console.log(`[ EXPANDED COLUMN: ${outputFilename} ]`);
}

// [ *** CLAVES ÚNICAS ]
function uniquesKeys(data) {
  const keys = new Set(); // INICIALIZAR
  data.forEach(item => {
    Object.keys(item).forEach(key => keys.add(key)); // AGREGAR CLAVES AL SET
  });
  return Array.from(keys); // SET DE CLAVES
}

// [ *** EXPANDIR DATOS ]
function expandedData(data, uniqueKeys) {
  return data.map(item => {
    const expandedItem = {};
    uniqueKeys.forEach(key => {
      // SI NO EXISTE -> ASIGNAR VALOR O VALOR POR DEFECTO DEFINIDO
      expandedItem[key] = item[key] !== undefined ? item[key] : config.expandedColumn.expandedValue; 
    });
    return expandedItem; // OBJETO NORMALIZADO
  });
}

// [ MAIN ]
function main(inputFilename, outputFilename) {
  const jsonData = readData(inputFilename); // LEER DATOS
  const uniqueKeys = uniquesKeys(jsonData); // OBTENER CLAVES UNICAS 
  const normalizedData = expandedData(jsonData, uniqueKeys); // EXPANDIR DATOS
  saveJSON(normalizedData, outputFilename);
}

main(args[0], args[1]);
