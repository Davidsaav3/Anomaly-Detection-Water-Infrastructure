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
const sal = args[1];
const configPath = args[2] ? args[2] : '../exec/config.json';

// [ CARGAR CONFIGURACIÓN ]
try {
  const configFile = fs.readFileSync(configPath);
  config = JSON.parse(configFile);
}
catch (error) {
  console.error(`! ERROR: CONFIG ${configPath} !`, error);
  process.exit(1);
}

const outputDir = path.join(__dirname, sal);

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
function saveCSV(data, headers, groupName) {
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header] !== undefined ? row[header] : '').join(',')) // RELLENAR ARCHIVO DE CADA GRUPO
  ].join('\n');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true }); // CREAR DIRECTORIO
  const outputFileName = `${groupName.toLowerCase()}.csv`; // NOMBRE DEL GRUPO COMO NOMBRE DEL ARCHIVO
  fs.writeFileSync(path.join(outputDir, outputFileName), csvContent);
  console.log(`[ CREATE GROUPS: ${outputFileName} ]`);
}

// [ *** DIVIDIR EN GRUPOS ]
function divideGroups(data, groupHeaders, headers) {
  return data.map(row => {
    const newRow = {};
    groupHeaders.forEach(header => {
      if (headers.includes(header)) { // VERIFICAR QUE EXISTE
        newRow[header] = row[header]; // FORMAR GRUPOS
      }
    });
    return newRow;
  });
}

// [ MAIN ]
async function main(inputFile) {
  try {
    const { headers, results } = await readCSV(inputFile);
    const groups = config.createGroups.groups.reduce((acc, group) => { // OBTENER GRUPOS
      acc[group.output] = group.fields;
      return acc;
    }, {});

    for (const [groupName, groupHeaders] of Object.entries(groups)) { // DIVIDIR Y GUARDAR CADA GRUPO
      const groupData = divideGroups(results, groupHeaders, headers);
      saveCSV(groupData, groupHeaders.filter(header => headers.includes(header)), groupName); // GUARDAR CADA GRUPO
    }
  } catch (error) {
    console.error('PROCESSING ERROR: ', error);
  }
}

main(inputFile);
