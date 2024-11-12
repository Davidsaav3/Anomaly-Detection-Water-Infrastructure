const fs = require('fs');
const path = require('path');

function analyzeCSVFiles(fileNames, outputFileName) {
  const idMap = new Map();

  fileNames.forEach(fileName => {
    const filePath = path.join(__dirname, fileName);
    const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
    
    // Obtiene los índices de las columnas `id` y `score`
    const header = lines[0].split(',');
    const idIndex = header.indexOf('id');
    const scoreIndex = header.indexOf('score');
    
    if (idIndex === -1 || scoreIndex === -1) {
      console.error(`Archivo ${fileName} no contiene columnas 'id' y 'score'`);
      return;
    }

    lines.slice(1).forEach(line => {
      const columns = line.split(',');
      const id = columns[idIndex];
      const score = columns[scoreIndex];
      
      if (!idMap.has(id)) {
        idMap.set(id, { count: 0, files: [], scores: [] });
      }
      const idData = idMap.get(id);
      idData.count++;
      idData.files.push(fileName);
      idData.scores.push(score);
    });
  });

  // Ordena los IDs de menor a mayor
  const sortedIds = Array.from(idMap.keys()).sort((a, b) => a - b);

  let output = 'id,num,num_files,scores_files\n'; // Cabecera del CSV

  sortedIds.forEach(id => {
    const value = idMap.get(id);
    const numFiles = value.count;
    const files = value.files.join(';');  // Los nombres de los archivos se separan por punto y coma
    const scores = value.scores.join(';'); // Los scores se separan por punto y coma
    output += `${id},${numFiles},${files},${scores}\n`; // Cada ID y su información en una nueva línea
  });

  fs.writeFileSync(outputFileName, output);
  console.log(`Resultado guardado en ${outputFileName}`);
}

// Lista de archivos a analizar
const fileNames = ['total.csv', 'position_pueblo.csv', 'position_playa.csv','position_plaxiquet.csv', 'position_falcon.csv', 'function_presure.csv','function_level.csv', 'function_flow.csv', 'function_drive.csv'];
analyzeCSVFiles(fileNames, 'resultado.csv');
