const fs = require('fs');
const args = process.argv.slice(2);
const configPath = args[2] ? args[2] : './config.json';

// [ OBTENER NOMBREz DE ARCHIVO ]
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

// [ LEER EL ARCHIVO JSON ORIGINAL ]
function readData(filePath) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }
  return [];
}

// [ APLANAR Y TRANSFORMAR EL ARRAY DE MENSAJES ]
function transformMessages(messages) {
  return messages.map(message => flattenObject(message));
}

// [ GUARDAR EL ARCHIVO JSON APLANADO ]
function main(inputFilename, outputFilename) {
  const messages = readData(inputFilename);
  const flattenedMessages = transformMessages(messages); // APLANAR MENSAJES
  fs.writeFileSync(outputFilename, JSON.stringify(flattenedMessages, null, 2));
  console.log(`[ FLATTEN: ${outputFilename} ]`);
}

main(args[0], args[1]);
