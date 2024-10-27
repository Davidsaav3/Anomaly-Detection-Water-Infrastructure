const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// OBTENER PARÁMETROS DE LA LÍNEA DE COMANDOS
const args = process.argv.slice(2);
if (args.length !== 5) {
  console.error('! ERROR: INPUT, NULLS NAME, NORMALIZE NAME, WEIGHT NAME, AND CONFIG NEEDED !');
  process.exit(1);
}

const inputFile = args[0];
const nullsFileName = args[1];
const normalizeFileName = args[2];
const configPath = args[3] ? args[3] : './config.json';

let config = {};

// CARGAR CONFIGURACIÓN DESDE EL ARCHIVO JSON
try {
  const configFile = fs.readFileSync(configPath);
  config = JSON.parse(configFile);
} 
catch (error) {
  console.error(`! ERROR: NO SE PUDO LEER ${configPath}, USANDO CONFIGURACIÓN POR DEFECTO !`, error);
  process.exit(1);
}

// LEER CSV
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

// VERIFICAR NULLS POR COLUMNAS
function getNullsByColumn(data, headers) {
  const nullsMap = {};
  headers.forEach(header => nullsMap[header] = false); // INICIALIZAR SIN NULLS

  for (const row of data) { // RECORRER FILAS
    headers.forEach(header => {
      if (row[header] === null || row[header] === '') nullsMap[header] = true; // MARCAR NULL
    });
  }
  return nullsMap; // DEVOLVER MAPA
}

// CREAR ARCHIVO NULLS
function saveNullsFile(headers, nullsMap) {
  const nullsRow = headers.map(header => (nullsMap[header] ? 'null' : '0')).join(','); // GENERAR FILA
  const csvContent = [headers.join(','), nullsRow].join('\n');

  fs.writeFileSync(nullsFileName, csvContent);
  console.log(`[ NULLS: ${nullsFileName} ]`);
}

// CREAR ARCHIVO NORMALIZADO
function saveNormalizedFile(headers) {
  const nullsRow = headers.map(() => '0').join(',');
  const onesRow = headers.map(() => '1').join(',');
  const csvContent = [headers.join(','), nullsRow, onesRow].join('\n');

  fs.writeFileSync(normalizeFileName, csvContent);
  console.log(`[ NORMALIZE: ${normalizeFileName} ]`);
}

// PROCESAR CSV
async function processCSV(inputFilename) {
  const data = await readCSV(inputFilename);
  const headers = Object.keys(data[0]); // OBTENER CABECERAS
  const nullsMap = getNullsByColumn(data, headers); // VERIFICAR NULLS
  saveNullsFile(headers, nullsMap); // GUARDAR ARCHIVOS
  saveNormalizedFile(headers); // NORMALIZADO
  saveWeightFile(headers); // GUARDAR WEIGHT
}

processCSV(inputFile)
  .catch(error => console.error('! ERROR ! ', error));
// CREAR ARCHIVO NORMALIZADO
function saveNormalizedFile(headers) {
  
  // GENERAR FILAS PARA CADA CABECERA
  const nullsRow = headers.map(() => '0').join(',');
  const onesRow = headers.map(() => '1').join(',');
  const csvContent = [headers.join(','), nullsRow, onesRow].join('\n');

  fs.writeFileSync(normalizeFileName, csvContent);
  console.log(`[ NORMALIZE: ${normalizeFileName} ]`);
}

// CREAR ARCHIVO WEIGHT
function saveWeightFile(headers) {  
  // FILA DE 1's DEBE COINCIDIR EN LONGITUD CON LAS CABECERAS
  const onesRow = headers.map(() => '1').join(',');
  const csvContent = [headers.join(','), onesRow].join('\n');

  fs.writeFileSync(weightFileName, csvContent);
  console.log(`[ WEIGHT: ${weightFileName} ]`);
}

// PROCESAR CSV
async function processCSV(inputFilename) {
  const data = await readCSV(inputFilename);
  
  // Asegúrate de que hay datos para evitar errores
  if (data.length === 0) {
    console.error('! ERROR: EL CSV ESTÁ VACÍO !');
    return;
  }

  const headers = Object.keys(data[0]); // OBTENER CABECERAS
  const nullsMap = getNullsByColumn(data, headers); // VERIFICAR NULLS
  saveNullsFile(headers, nullsMap); // GUARDAR ARCHIVOS
  saveNormalizedFile(headers); // NORMALIZADO
  //saveWeightFile(headers); // GUARDAR WEIGHT
}
