const fs = require('fs');
const args = process.argv.slice(2);
const configPath = args[3] ? args[3] : './config.json';
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

// [ LEER JSON ORIGINAL ]
function readData(filePath) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data); // DEVOLVER JSON PARSEADO
  }
  return [];
}

// [ GUARDAR RESULTADO EN CSV ]
function saveToCSV(data, outputFilename) {
  const csvRows = [];
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(',')); // AÑADIR CABECERAS
  data.forEach(obj => { // OBTENER VALORES DE CADA OBJETO
    const values = Object.values(obj).map(value => {
      let stringValue = (typeof value === 'string') ? value.replace(/"/g, '""') : String(value); // ESCAPAR COMILLAS
      return (typeof value === 'string') ? `'${stringValue}'` : stringValue; // RODEAR CON COMILLAS SI ES CADENA
    });
    csvRows.push(values.join(',')); // AÑADIR FILA
  });
  fs.writeFileSync(outputFilename, csvRows.join('\n')); // GUARDAR CSV CON EL NOMBRE DEL SEGUNDO PARÁMETRO
  console.log(`[ joinColumn: ${outputFilename} ]`);
}

// [ APLANAR EL JSON ]
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

// [ APLANAR Y TRANSFORMAR EL ARRAY DE MENSAJES ]
function transformMessages(messages) {
  return messages.map(message => flattenObject(message));
}

// [ MAIN: GUARDAR JSON APLANADO Y CODIFICADO ]
function main(inputFilename, outputFilename) {
  const messages = readData(inputFilename);
  const flattenedMessages = transformMessages(messages); // APLANAR MENSAJES
  if (flattenedMessages.length > 0) {
    saveToCSV(flattenedMessages, outputFilename); // GUARDAR EN CSV
  }
  else {
    console.error('! ERROR: JSON FILE CONTAINS NO DATA !');
  }
}

main(args[0], args[1]);