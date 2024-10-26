const fs = require('fs');
const path = require('path');

// OBTENER PARÁMETROS DE LA LÍNEA DE COMANDOS
const args = process.argv.slice(2);
const configPath = args[2] ? args[2] : './config.json';

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

// LEER EL ARCHIVO JSON ORIGINAL
function readData(filePath) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data); // DEVOLVER JSON PARSEADO
  }
  return []; 
}

// APLANAR Y TRANSFORMAR EL ARRAY DE MENSAJES
function transformMessages(messages) {
  return messages.map(message => flattenObject(message)); 
}

// GUARDAR EL ARCHIVO JSON APLANADO
function saveFlattenedData(inputFilename, outputFilename) {
  const messages = readData(inputFilename);
  const flattenedMessages = transformMessages(messages); // APLANAR MENSAJES

  // GUARDAR JSON APLANADO
  fs.writeFileSync(outputFilename, JSON.stringify(flattenedMessages, null, 2));
  console.log(`[ FLATTEN: ${outputFilename} ]`);
}

// OBTENER NOMBRES DE ARCHIVO DESDE LA LÍNEA DE COMANDOS
if (args.length < 2) {
  console.error('! ERROR: INPUT AND OUTPUT NEEDED !');
  process.exit(1); 
}

// AÑADIR .JSON A LOS ARCHIVOS SI NO LO TIENEN
const inputFile = args[0];
const outputFile = args[1];

saveFlattenedData(inputFile, outputFile);
