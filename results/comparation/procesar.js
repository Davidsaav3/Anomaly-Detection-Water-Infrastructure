const fs = require('fs');
const path = require('path');

function analyzeCSVFiles(fileNames, outputFileNum, outputFileScores) {
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
      const score = parseFloat(columns[scoreIndex]);

      if (!idMap.has(id)) {
        idMap.set(id, { count: 0, files: [], scores: [], scores_sum: 0 });
      }
      const idData = idMap.get(id);
      idData.count++;
      idData.files.push(fileName);
      idData.scores.push(score);
      idData.scores_sum += score; // Suma acumulativa de scores
    });
  });

  // Ordena los IDs primero por num (count) de forma descendente, luego por scores_sum de forma ascendente
  const sortedByNum = Array.from(idMap.keys()).sort((a, b) => {
    const countDiff = idMap.get(b).count - idMap.get(a).count;
    if (countDiff !== 0) return countDiff;
    return idMap.get(a).scores_sum - idMap.get(b).scores_sum;
  });

  let outputNum = 'id,num,scores_files,scores_sum,num_files\n';
  sortedByNum.forEach(id => {
    const value = idMap.get(id);
    const numFiles = value.count;
    const files = value.files.join(';');
    const scores = value.scores.join(';');
    const scoresSum = value.scores_sum;
    outputNum += `${id},${numFiles},${scores},${scoresSum},${files}\n`;
  });
  fs.writeFileSync(outputFileNum, outputNum);
  console.log(`Resultado guardado en ${outputFileNum}`);

  // Ordena los IDs primero por scores_sum de forma descendente, luego por num (count) de forma ascendente
  const sortedByScore = Array.from(idMap.keys()).sort((a, b) => {
    const scoreDiff = idMap.get(b).scores_sum - idMap.get(a).scores_sum;
    if (scoreDiff !== 0) return scoreDiff;
    return idMap.get(a).count - idMap.get(b).count;
  });

  let outputScore = 'id,num,scores_files,scores_sum,num_files\n';
  sortedByScore.forEach(id => {
    const value = idMap.get(id);
    const numFiles = value.count;
    const files = value.files.join(';');
    const scores = value.scores.join(';');
    const scoresSum = value.scores_sum;
    outputScore += `${id},${numFiles},${scores},${scoresSum},${files}\n`;
  });
  fs.writeFileSync(outputFileScores, outputScore);
  console.log(`Resultado guardado en ${outputFileScores}`);
}

// Lista de archivos a analizar
const fileNames = ['total.csv', 'position_pueblo.csv', 'position_playa.csv','position_plaxiquet.csv', 'position_falcon.csv', 'function_presure.csv','function_level.csv', 'function_flow.csv', 'function_drive.csv'];
analyzeCSVFiles(fileNames, 'resultados_num.csv', 'resultados_scores.csv');
