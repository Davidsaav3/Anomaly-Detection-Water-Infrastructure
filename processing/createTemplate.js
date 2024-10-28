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
const configPath = args[3] ? args[3] : './config.json';
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

// [ MAIN: PROCESAR CSV ]
async function main(inputFilename) {
  const data = await readCSV(inputFilename);
  if (data.length === 0) {
    console.error('! ERROR: EMPTY CSV !');
    return;
  }
  const headers = Object.keys(data[0]);
  const nullsMap = getNullsByColumn(data, headers);
  saveNullsFile(headers, nullsMap); // NULLS
  saveNormalizedFile(headers); // NORMALIZADO
}

// [ VERIFICAR NULLS POR COLUMNAS ]
function getNullsByColumn(data, headers) {
  const nullsMap = {};
  headers.forEach(header => nullsMap[header] = false); // INICIALIZAR SIN NULLS
  for (const row of data) {
    headers.forEach(header => {
      if (row[header] === null || row[header] === '') nullsMap[header] = true; // MARCAR NULL
    });
  }
  return nullsMap;
}

// [ NULLS ]
function saveNullsFile(headers, nullsMap) {
  const nullsRow = headers.map(header => (nullsMap[header] ? 'null' : '0')).join(','); // GENERAR FILA
  const csvContent = [headers.join(','), nullsRow].join('\n');

  fs.writeFileSync(nullsFileName, csvContent);
  console.log(`[ NULLS: ${nullsFileName} ]`);
}

// [ NORMALIZADO ]
function saveNormalizedFile(headers) {
  const nullsRow = headers.map(() => '0').join(',');
  const onesRow = headers.map(() => '1').join(',');
  const csvContent = [headers.join(','), nullsRow, onesRow].join('\n');
  fs.writeFileSync(normalizeFileName, csvContent);
  console.log(`[ NORMALIZE: ${normalizeFileName} ]`);
}

main(inputFile)
  .catch(error => console.error('! ERROR ! ', error));
