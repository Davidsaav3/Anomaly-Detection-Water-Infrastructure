const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// [ OBTENER PARÁMETROS ]
const args = process.argv.slice(2);
if (args.length < 4) {
  console.error('! ERROR: INPUT !');
  process.exit(1);
}

const inputFile = args[0]; // ENTRADA
const outputFile = args[1]; // SALIDA
const weightFileName = args[2]; // PESO
const configPath = args[3] ? args[3] : './config.json'; // CONFIGURACIÓN
let config = {};

// [ CARGAR CONFIGURACIÓN ]
try {
  const configFile = fs.readFileSync(configPath); 
  config = JSON.parse(configFile); // PARSEAR JSON
}
catch (error) {
  console.error(`! ERROR: CONFIG ${configPath} !`, error); // ERROR EN LECTURA
  process.exit(1);
}

// [ LEER CSV ORIGINAL ]
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

// [ GUARDAR CSV ]
function saveCSV(data, headers, fileName) {
  const csvContent = [
    headers.join(','), // CABECERAS
    ...data.map(row => headers.map(header => row[header] !== undefined ? row[header] : '').join(',')) // RELLENAR ARCHIVO DE CADA GRUPO
  ].join('\n'); // UNIR LOS ELEMENTOS CON COMAS
  fs.writeFileSync(fileName, csvContent);
  console.log(`[ ADD COLUMN: ${fileName} ]`);
}

// [ GUARDAR ARCHIVO WEIGHT ]
function saveWeight(headers) {
  const onesRow = headers.map(() => '1').join(','); // FILA DE VALORES (1) MULTIPLICADOR DE PESOS
  const csvContent = [headers.join(','), onesRow].join('\n'); // UNIR VALORES Y CLAVES
  fs.writeFileSync(weightFileName, csvContent); // GUARDAR
  console.log(`[ ADD COLUMN - WEIGHT: ${weightFileName} ]`);
}

// [ *** AÑADIR COLUMNA ]
async function addColumn(results) {
  const truthKeys = config.addColumn.truth_key;  // NUEVAS CLAVES 
  const truthValues = config.addColumn.value;  // NUEVOS VALORES 
  return results.map(row => {
    const newRow = { ...row }; // DUPLICAR DATOS
    truthKeys.forEach((key, index) => {
      newRow[key] = truthValues[index]; // ASIGNAR VALORES A LA COLUMNA
    });
    return newRow;
  });
}


// [ MAIN ]
async function main(inputFile, outputFile) {
  try {
    const results = await readCSV(inputFile);
    const updatedResults = await addColumn(results); // AGREGAR COLUMNA
    const headers = [...Object.keys(results[0]), ...config.addColumn.truth_key]; // NUEVAS CABECERAS
    saveCSV(updatedResults, headers, outputFile);
    saveWeight(headers);
  }
  catch (error) {
    console.error('ERROR MAIN: ', error); // ERROR DE PROCESAMIENTO
  }
}

main(inputFile, outputFile); 
