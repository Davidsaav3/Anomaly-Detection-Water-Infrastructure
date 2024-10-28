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
  const configFile = fs.readFileSync(configPath); // LEER CONFIGURACIÓN
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
function saveToCSV(data, headers, fileName) {
  const csvContent = [
    headers.join(','), // CABECERAS
    ...data.map(row => headers.map(header => row[header] !== undefined ? row[header] : '').join(',')) // VALORES
  ].join('\n'); // UNIR LÍNEAS
  fs.writeFileSync(fileName, csvContent);
  console.log(`[ ADD COLUMN: ${fileName} ]`);
}

// AÑADIR COLUMNA TRUTH
async function addGroundTruthColumn(results) {
  const truthKeys = config.addColumn.truth_key;  // CLAVES DE CONFIG
  const truthValues = config.addColumn.value;  // VALORES DE CONFIG
  return results.map(row => {
    const newRow = { ...row }; // CLONAR FILA
    truthKeys.forEach((key, index) => {
      newRow[key] = truthValues[index]; // ASIGNAR VALORES
    });
    return newRow;
  });
}

// [ CREAR ARCHIVO WEIGHT ]
function saveWeightFile(headers) {
  const onesRow = headers.map(() => '1').join(','); // FILA DE '1'
  const csvContent = [headers.join(','), onesRow].join('\n'); // UNIR CABECERAS Y FILA
  fs.writeFileSync(weightFileName, csvContent); // ESCRIBIR ARCHIVO DE PESO
  console.log(`[ ADD COLUMN - WEIGHT: ${weightFileName} ]`);
}

// [ MAIN: PREPARAR DATOS ]
async function main(inputFile, outputFile) {
  try {
    const results = await readCSV(inputFile);
    const updatedResults = await addGroundTruthColumn(results); // AGREGAR COLUMNA
    const headers = [...Object.keys(results[0]), ...config.addColumn.truth_key]; // NUEVAS CABECERAS
    saveToCSV(updatedResults, headers, outputFile);
    saveWeightFile(headers);
  }
  catch (error) {
    console.error('ERROR MAIN: ', error); // ERROR DE PROCESAMIENTO
  }
}

main(inputFile, outputFile); 
