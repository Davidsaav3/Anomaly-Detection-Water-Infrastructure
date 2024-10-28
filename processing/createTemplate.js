const fs = require('fs');
const csv = require('csv-parser');

// [ OBTENER PARÁMETROS ]
const args = process.argv.slice(2);
if (args.length !== 4) {
  console.error('! ERROR: INPUT !');
  process.exit(1);
}

const inputFile = args[0];
const nullsFileName = args[1];
const normalizeFileName = args[2];
const configPath = args[3] ? args[3] : './sensors_config.json';
let config = {};

// [ CARGAR CONFIGURACIÓN ]
try {
  const configFile = fs.readFileSync(configPath);
  config = JSON.parse(configFile);
}
catch (error) {
  console.error(`! ERROR: CONFIG ${configPath} !`, error);
  process.exit(1);
}

// [ LEER CSV ]
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

// [ *** VERIFICAR NULLS POR COLUMNAS ]
function getNulls(data, headers) {
  const nullsMap = {};
  headers.forEach(header => nullsMap[header] = false); // INICIALIZAR
  for (const row of data) {
    headers.forEach(header => {
      if (row[header] === null || row[header] === '') nullsMap[header] = true; // SI HAY NULL O VACIO SE INDICA
    });
  }
  return nullsMap;
}

// [ *** NULLS ]
function saveNulls(headers, nullsMap) {
  const nullsRow = headers.map(header => (nullsMap[header] ? 'null' : '0')).join(','); // GENERAR FILA
  const csvContent = [headers.join(','), nullsRow].join('\n'); // GENERAR PLANTILLA NULLS
  fs.writeFileSync(nullsFileName, csvContent);
  console.log(`[ CREATE TEMPLATE - NULLS: ${nullsFileName} ]`);
}

// [ *** NORMALIZADO ]
function saveNormalized(headers) {
  const nullsRow = headers.map(() => '0').join(','); // SI HAY NULL -> 1
  const onesRow = headers.map(() => '1').join(','); // SI NO HAY NULL -> 0
  const csvContent = [headers.join(','), nullsRow, onesRow].join('\n'); // UNIR CLAVES VALOR
  fs.writeFileSync(normalizeFileName, csvContent);
  console.log(`[ CREATE TEMPLATE - NORMALIZE: ${normalizeFileName} ]`);
}

// [ MAIN ]
async function main(inputFilename) { // LEER ENTRADA
  const data = await readCSV(inputFilename);
  if (data.length === 0) {
    console.error('! ERROR: EMPTY CSV !');
    return;
  }
  const headers = Object.keys(data[0]);
  const nullsMap = getNulls(data, headers);
  saveNulls(headers, nullsMap); // NULLS
  saveNormalized(headers); // NORMALIZADO
}

main(inputFile)
  .catch(error => console.error('! ERROR ! ', error));
