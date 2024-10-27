const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// OBTENER PARÁMETROS DE LA LÍNEA DE COMANDOS
const args = process.argv.slice(2);
if (args.length < 4) {
  console.error('! ERROR: INPUT, OUTPUT, WEIGHT, AND CONFIG NEEDED !');
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];
const weightFileName = args[2];
const configPath = args[3] ? args[3] : './config.json';

let config = {};

// CARGAR CONFIGURACIÓN DESDE EL ARCHIVO JSON (O USAR VALORES POR DEFECTO)
try {
  const configFile = fs.readFileSync(configPath);
  config = JSON.parse(configFile);
} 
catch (error) {
  console.error(`! ERROR: NO SE PUDO LEER ${configPath}, USANDO CONFIGURACIÓN POR DEFECTO !`, error);
  process.exit(1);
}

// LEER CSV ORIGINAL
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', data => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// GUARDAR CSV
function saveToCSV(data, headers, fileName) {
  const csvContent = [
    headers.join(','), // UNIR CABECERAS
    ...data.map(row => headers.map(header => row[header] !== undefined ? row[header] : '').join(',')) // UNIR VALORES POR FILA
  ].join('\n');

  fs.writeFileSync(fileName, csvContent);
  console.log(`[ GUARDADO: ${fileName} ]`);
}

// AÑADIR COLUMNA TRUTH
async function addGroundTruthColumn(results) {
  const truthKeys = config.add.key;  // Claves desde el config
  const truthValues = config.add.value;  // Valores desde el config
  
  return results.map(row => {
    const newRow = { ...row };
    truthKeys.forEach((key, index) => {
      newRow[key] = truthValues[index]; // Asignar valores correspondientes
    });
    return newRow;
  });
}

// CREAR ARCHIVO WEIGHT
function saveWeightFile(headers) {  
  // FILA DE 1's DEBE COINCIDIR EN LONGITUD CON LAS CABECERAS
  const onesRow = headers.map(() => '1').join(',');
  const csvContent = [headers.join(','), onesRow].join('\n');

  fs.writeFileSync(weightFileName, csvContent);
  console.log(`[ WEIGHT: ${weightFileName} ]`);
}

// PREPARAR DATOS
async function prepareData(inputFile, outputFile) {
  try {
    const results = await readCSV(inputFile);
    const updatedResults = await addGroundTruthColumn(results); // Agregar columnas de truth
    const headers = [...Object.keys(results[0]), ...config.add.key]; // Cabeceras con nuevas columnas
    saveToCSV(updatedResults, headers, outputFile); // Guardar resultados

    // Generar archivo de peso después de guardar el CSV actualizado
    saveWeightFile(headers);
  } 
  catch (error) {
    console.error('ERROR AL PROCESAR:', error);
  }
}

prepareData(inputFile, outputFile);
