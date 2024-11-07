const fs = require('fs');
const csv = require('csv-parser');

// [ OBTENER PARÁMETROS ]
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('! ERROR: INPUT !');
  process.exit(1);
}

const inputFile = args[0]; // ARCHIVO DE ENTRADA PARA LEER CABECERAS
const weightFileName = args[1]; // ARCHIVO DE SALIDA PARA PESOS
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

// [ LEER CABECERAS DEL CSV ]
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = []; // RESULTADOS VACÍOS
    fs.createReadStream(filePath) // LEER CSV
      .pipe(csv()) // PARSEAR CSV
      .on('data', data => results.push(data)) // ALMACENAR DATOS
      .on('end', () => resolve(results)) // RESOLVER PROMESA
      .on('error', reject); // RECHAZAR EN ERROR
  });
}

// [ GUARDAR ARCHIVO WEIGHT ]
function saveWeight(headers) {
  const onesRow = headers.map(() => config.createWeight.weight).join(','); // FILA DE VALORES (1) MULTIPLICADOR DE PESOS
  const csvContent = [headers.join(','), onesRow].join('\n'); // UNIR VALORES Y CLAVES
  fs.writeFileSync(weightFileName, csvContent); // GUARDAR
  console.log(`[ ADD COLUMN - WEIGHT: ${weightFileName}]`);
}

// [ MAIN ]
async function main() {
  try {
    const results = await readCSV(inputFile);
    const headers = [...Object.keys(results[0])]; // NUEVAS CABECERAS
    saveWeight(headers);
  } 
  catch (error) {
    console.error('ERROR MAIN: ', error); // ERROR DE PROCESAMIENTO
  }
}

main();
