const fs = require('fs');
const csv = require('csv-parser');

// [ OBTENER PARÁMETROS ]
const args = process.argv.slice(2);

if (args.length === 1 && (args[0] === '-c' || args[0] === '-C')) {
  console.log(`input:1,output:1,config:1`); // Ejemplo de valores reales
  console.log(`example.csv,output.csv,config.json`);
  process.exit(0);
}

if (args.length < 3) {
  console.error('! ERROR: INPUT !');
  process.exit(1);
}

const inputFile = args[0]; // ENTRADA
const outputFile = args[1]; // SALIDA
const configPath = args[2] ? args[2] : './config.json'; // CONFIGURACIÓN
let config = {};

// [ CARGAR CONFIGURACIÓN ]
try {
  const configFile = fs.readFileSync(configPath); 
  config = JSON.parse(configFile); // PARSEAR JSON
} catch (error) {
  console.error(`! ERROR: CONFIG ${configPath} !`, error);
  process.exit(1);
}

// [ LEER CSV ORIGINAL ]
const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', reject);
  });
};

// [ GUARDAR CSV ]
function saveCSV(data, headers, fileName) {
  const csvContent = [
    headers.join(','), // CABECERAS
    ...data.map(row => headers.map(header => row[header] !== undefined ? row[header] : '').join(',')) // RELLENAR ARCHIVO DE CADA GRUPO
  ].join('\n'); // UNIR LOS ELEMENTOS CON COMAS
  fs.writeFileSync(fileName, csvContent);
  console.log(`[ TEMPLATE: ${fileName} ]`);
}

// [ *** FUNCIÓN PRINCIPAL ]
async function mainFunction(results) {
}

// [ MAIN ]
async function main(inputFile, outputFile) {
  try {
    const results = await readCSV(inputFile);
    const updatedResults = await mainFunction(results); // FUNCIÓN PRINCIPAL
    const headers = [...Object.keys(results[0]), ...config.ELEMENT.columnName]; // CABECERAS
    saveCSV(updatedResults, headers, outputFile);
  } 
  catch (error) {
    console.error('ERROR MAIN: ', error); // ERROR DE PROCESAMIENTO
  }
}

main(inputFile, outputFile);
