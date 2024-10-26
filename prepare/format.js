const fs = require('fs');
const path = require('path');

// OBTENER PARÁMETROS DE LA LÍNEA DE COMANDOS
const args = process.argv.slice(2);
const configPath = args[3] ? args[3] : './config.json';

let config = {};

// CARGAR CONFIGURACIÓN DESDE EL ARCHIVO JSON (O USAR VALORES POR DEFECTO)
try {
  const configFile = fs.readFileSync(configPath);
  config = JSON.parse(configFile);
} 
catch (error) {
  console.error(`! ERROR: NO SE PUDO LEER ${configPath}, USANDO CONFIGURACIÓN POR DEFECTO !`, error);
  process.exit(1); // SALIR SI NO SE PUEDE LEER EL ARCHIVO DE CONFIGURACIÓN
}

// APLANAR EL JSON
function flattenObject(ob) {
  const result = {};
  function recurse(cur, prop) {
    if (Object(cur) !== cur) {
      result[prop] = cur; // AÑADIR CLAVE-VALOR AL RESULTADO
    } 
    else if (Array.isArray(cur)) {
      cur.forEach((item, index) => {
        recurse(item, `${prop}_${index}`); // APLANAR ARRAYS
      });
    } 
    else {
      for (const key in cur) {
        recurse(cur[key], prop ? `${prop}.${key}` : key); // CONCATENAR CLAVES
      }
    }
  }
  recurse(ob, '');
  return result;
}

// LEER JSON ORIGINAL
function readData(filePath) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data); // DEVOLVER JSON PARSEADO
  }
  return []; // DEVOLVER ARRAY VACÍO SI NO EXISTE
}

// APLANAR Y TRANSFORMAR EL ARRAY DE MENSAJES
function transformMessages(messages) {
  return messages.map(message => flattenObject(message));
}

// GUARDAR RESULTADO EN CSV
function saveToCSV(data, outputFilename) {
  const csvRows = [];
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(',')); // AÑADIR CABECERAS

  // OBTENER VALORES DE CADA OBJETO
  data.forEach(obj => {
    const values = Object.values(obj).map(value => {
      let stringValue = (typeof value === 'string') ? value.replace(/"/g, '""') : String(value); // ESCAPAR COMILLAS
      return (typeof value === 'string') ? `'${stringValue}'` : stringValue; // RODEAR CON COMILLAS SI ES CADENA
    });
    csvRows.push(values.join(',')); // AÑADIR FILA
  });

  // GUARDAR CSV CON EL NOMBRE DEL SEGUNDO PARÁMETRO
  fs.writeFileSync(outputFilename, csvRows.join('\n')); // ESCRIBIR CSV
  console.log(`[ FORMAT: ${outputFilename} ]`);
}

// GUARDAR JSON APLANADO Y CODIFICADO
function saveFlattenedData(inputFilename, outputFilename) {
  const messages = readData(inputFilename);
  const flattenedMessages = transformMessages(messages); // APLANAR MENSAJES

  if (flattenedMessages.length > 0) {
    saveToCSV(flattenedMessages, outputFilename); // GUARDAR EN CSV
  } 
  else {
    console.error('! ERROR: EL ARCHIVO JSON NO CONTIENE DATOS !');
  }
}

// OBTENER NOMBRES DE ARCHIVO DESDE LA LÍNEA DE COMANDOS
if (args.length < 2) {
  console.error('! ERROR: INPUT AND OUTPUT NEEDED !');
  process.exit(1);
}

// AÑADIR .JSON AL ARCHIVO DE ENTRADA SI NO LO TIENE
const inputFile = args[0];
const outputFile = args[1];

saveFlattenedData(inputFile, outputFile);
