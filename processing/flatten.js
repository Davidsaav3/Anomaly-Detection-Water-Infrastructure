const fs = require('fs');
const args = process.argv.slice(2);
//const configPath = args[2] ? args[2] : './exec/config.json';

if (args.length < 2) {
  console.error('! ERROR: INPUT !');
  process.exit(1);
}

// [ CARGAR CONFIGURACIÓN ]
// try {
//   const configFile = fs.readFileSync(configPath);
//   config = JSON.parse(configFile);
// }
// catch (error) {
//   console.error(`! ERROR: CONFIG ${configPath} !`, error);
//   process.exit(1);
// }

// [ LEER EL ARCHIVO JSON ORIGINAL ]
function readData(filePath) {
  if (fs.existsSync(filePath)) { // SI EXISTE
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }
  return [];
}

// [ *** APLANAR Y TRANSFORMAR EL ARRAY ]
function flattenData(messages) {
  return messages.map(message => flattenObject(message));
}

// [ *** APLANAR JSON ]
function flattenObject(ob) {
  const result = {};
  function recurse(cur, prop) { // RECURSIVO
    if (Object(cur) !== cur) {
      result[prop] = cur; // AÑADIR CLAVE Y VALOR 
    }
    else if (Array.isArray(cur)) {
      cur.forEach((item, index) => {
        recurse(item, `${prop}_${index}`); // APLANAR ARRAYS CON BARRAS BAJAS
      });
    }
    else {
      for (const key in cur) {
        recurse(cur[key], prop ? `${prop}.${key}` : key); // CONCATENAR CLAVES
      }
    }
  }
  recurse(ob, ''); // DE FORMA RECURSIVA SE APLANA
  return result;
}

// [ MAIN ]
function main(inputFilename, outputFilename) {
  const messages = readData(inputFilename); // LEER ENTRADA
  const flattenedMessages = flattenData(messages); // APLANAR JSON
  fs.writeFileSync(outputFilename, JSON.stringify(flattenedMessages, null, 2)); // GUARDAR
  console.log(`[ FLATTEN: ${outputFilename} ]`);
}

main(args[0], args[1]);
