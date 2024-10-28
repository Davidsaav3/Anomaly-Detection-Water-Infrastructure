const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// [ OBTENER PARÁMETROS ]
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('! ERROR: INPUT !');
  process.exit(1);
}

let config = {};
const inputFile = args[0];
const configPath = args[1] ? args[1] : './config.json';

// [ CARGAR CONFIGURACIÓN ]
try {
  const configFile = fs.readFileSync(configPath);
  config = JSON.parse(configFile);
}
catch (error) {
  console.error(`! ERROR: CONFIG ${configPath} !`, error);
  process.exit(1);
}

const outputDir = path.join(__dirname, config.createGroups.folder_name);

// [ LEER CSV ORIGINAL ]
async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    let headers = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('headers', headerList => { headers = headerList; })
      .on('data', data => results.push(data))
      .on('end', () => resolve({ headers, results }))
      .on('error', reject);
  });
}

// [ GUARDAR CSV ]
function saveToCSV(data, headers, groupName) {
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header] !== undefined ? row[header] : '').join(','))
  ].join('\n');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputFileName = `${groupName.toLowerCase()}.csv`; // USAR NOMBRE DEL GRUPO
  fs.writeFileSync(path.join(outputDir, outputFileName), csvContent);
  console.log(`[ CREATE GROUPS: ${outputFileName} ]`);
}

// [ DIVIDIR EN GRUPOS ]
function divideIntoGroups(data, groupHeaders) {
  return data.map(row => {
    const newRow = {};
    groupHeaders.forEach(header => { newRow[header] = row[header] || ''; });
    return newRow;
  });
}

// [ MAIN:  PREPARAR DATOS ]
async function main(inputFile) {
  try {
    const { headers, results } = await readCSV(inputFile);
    const groups = config.createGroups.groups.reduce((acc, group) => { // OBTENER GRUPOS DE LA CONFIGURACIÓN
      acc[group.output] = group.fields;
      return acc;
    }, {});
    for (const [groupName, groupHeaders] of Object.entries(groups)) { // DIVIDIR Y GUARDAR CADA GRUPO
      const groupData = divideIntoGroups(results, groupHeaders);
      saveToCSV(groupData, groupHeaders, groupName); // NOMBRE DEL GRUPO
    }
  }
  catch (error) {
    console.error('PROCESSING ERROR: ', error);
  }
}

main(inputFile);
