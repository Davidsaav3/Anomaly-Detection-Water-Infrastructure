const fs = require('fs');
const csv = require('csv-parser');

// [ OBTENER PARÁMETROS ]
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('! ERROR: INPUT !');
  process.exit(1);
}

let config = {};
const inputFile = args[0];
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
const saveCSV = (data, headers, fileName) => {
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header] ?? '').join(',')) // FORMATEAR FILAS
  ].join('\n');
  fs.writeFileSync(fileName, csvContent); // GUARDAR
  console.log(`[ JOIN COLUMN: ${fileName} ]`);
};

// [ *** UNIR COLUMNAS ]
function joinColumns(data, columnsToUnite) {
  if (!columnsToUnite || columnsToUnite.length === 0) { // HAY COLUMNAS PARA UNIR ?
    throw new Error("NO COLUMNS TO JOIN");
  }
  return data.map(row => {
    for (const col of columnsToUnite) { // TODAS LAS COLUMNAS EXISTEN EN LA FILA ?
      if (!(col in row)) {
        throw new Error(`DO NOT EXIST IN THE ROW`);
      }
    }
    const newRow = { ...row };
    const newColumnName = columnsToUnite.join('_'); // NOMBRE NUEVO CON BARRA BAJA
    const joinedValues = columnsToUnite.map(col => row[col].replace(/'/g, '')).join('_'); // QUITAR COMILLAS 
    newRow[newColumnName] = `'${joinedValues}'`; // AÑADIR COMILLAS 
    return newRow;
  });
}

// [ MAIN ]
async function main(inputFile) {
  try {
    const { headers, results } = await readCSV(inputFile);
    const columnsToUnite = config.joinColumn.joinFiles; // OBTENER COLUMNAS A UNIR
    const unitedData = joinColumns(results, columnsToUnite); // UNIR COLUMNAS
    const newHeaders = [...headers, columnsToUnite.join('_')]; // NUEVA CABECERA (UNIÓN DE LAS DOS)
    saveCSV(unitedData, newHeaders, args[1]);
  }
  catch (error) {
    console.error('ERROR:', error);
  }
}

main(inputFile);