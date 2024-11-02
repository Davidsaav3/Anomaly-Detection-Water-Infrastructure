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

// [ GUARDAR EL RESULTADO ]
function saveJSON(data, outputFilename) {
  fs.writeFileSync(outputFilename, JSON.stringify(data, null, 2)); // GUARDAR JSON
  console.log(`[ REDUCE COLUMN: ${outputFilename} ]`);
}

// [ *** OBTENER CLAVES COMUNES A TODOS LOS OBJETOS ]
function commonKey(data) {
  if (data.length === 0) return []; // SIN CLAVES COMUNES...
  let commonKeys = Object.keys(data[0]); // CLAVES DEL PRIMER OBJETO
  data.forEach(item => {
    commonKeys = commonKeys.filter(key => key in item); // FILTRAR CLAVES PRESENTES EN TODOS
  });
  return commonKeys;
}

// [ *** REDUCIR DATOS ]
function reduceData(data, commonKeys) {
  return data.map(item => {
    const normalizedItem = {}; // ARRAY
    commonKeys.forEach(key => {
      normalizedItem[key] = item[key]; // ASIGNAR VALOR EXISTENTES EN TODOS LOS OBJETOS
    });
    return normalizedItem;
  });
}

// [ MAIN ]
function main(inputFilename, outputFilename) {
  const jsonData = readData(inputFilename); // LEER JSON
  const commonKeys = commonKey(jsonData); // OBTENER CLAVES COMUNES
  const reducedData = reduceData(jsonData, commonKeys); // REDUCIR DATOS
  saveJSON(reducedData, outputFilename);
}

main(args[0], args[1]);
