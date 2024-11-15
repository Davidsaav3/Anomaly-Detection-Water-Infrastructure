const fs = require('fs');
const path = require('path');

function analyzeCSVFiles(fileNames, outputFileNum, outputFileScores) {
  const idMap = new Map();

  fileNames.forEach(fileName => {
    const filePath = path.join(__dirname, fileName);
    const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');

    // Obtiene los índices de las columnas
    const header = lines[0].split(',');
    const idIndex = header.indexOf('id');
    const scoreIndex = header.indexOf('score');
    const monthIndex = header.indexOf('month');
    const dayIndex = header.indexOf('day');
    const hourIndex = header.indexOf('hour');
    const minIndex = header.indexOf('min');

    if (idIndex === -1 || scoreIndex === -1 || monthIndex === -1 || dayIndex === -1 || hourIndex === -1 || minIndex === -1) {
      console.error(`Archivo ${fileName} no contiene las columnas requeridas ('id', 'score', 'month', 'day', 'hour', 'min')`);
      return;
    }

    lines.slice(1).forEach(line => {
      const columns = line.split(',');
      const id = columns[idIndex];
      const score = parseFloat(columns[scoreIndex]);
      const month = columns[monthIndex];
      const day = columns[dayIndex];
      const hour = columns[hourIndex];
      const min = columns[minIndex];

      if (!idMap.has(id)) {
        idMap.set(id, {
          count: 0,
          files: [],
          scores: [],
          scores_sum: 0,
          firstMonth: month,
          firstDay: day,
          firstHour: hour,
          firstMin: min
        });
      }

      const idData = idMap.get(id);
      idData.count++;
      idData.files.push(fileName);
      idData.scores.push(score);
      idData.scores_sum += score;
    });
  });

  // Ordena los IDs primero por num (count) de forma descendente, luego por scores_sum de forma ascendente
  const sortedByNum = Array.from(idMap.keys()).sort((a, b) => {
    const countDiff = idMap.get(b).count - idMap.get(a).count;
    if (countDiff !== 0) return countDiff;
    return idMap.get(a).scores_sum - idMap.get(b).scores_sum;
  });

  let outputNum = 'id,num,scores_files,scores_sum,num_files,month,day,hour,min\n';
  sortedByNum.forEach(id => {
    const value = idMap.get(id);
    const numFiles = value.count;
    const files = value.files.join(';');
    const scores = value.scores.join(';');
    const scoresSum = value.scores_sum;
    const month = value.firstMonth;
    const day = value.firstDay;
    const hour = value.firstHour;
    const min = value.firstMin;
    outputNum += `${id},${numFiles},${scores},${scoresSum},${files},${month},${day},${hour},${min}\n`;
  });
  fs.writeFileSync(outputFileNum, outputNum);
  console.log(`Resultado guardado en ${outputFileNum}`);

  // Ordena los IDs primero por scores_sum de forma descendente, luego por num (count) de forma ascendente
  const sortedByScore = Array.from(idMap.keys()).sort((a, b) => {
    const scoreDiff = idMap.get(b).scores_sum - idMap.get(a).scores_sum;
    if (scoreDiff !== 0) return scoreDiff;
    return idMap.get(a).count - idMap.get(b).count;
  });

  let outputScore = 'id,num,scores_files,scores_sum,num_files,month,day,hour,min\n';
  sortedByScore.forEach(id => {
    const value = idMap.get(id);
    const numFiles = value.count;
    const files = value.files.join(';');
    const scores = value.scores.join(';');
    const scoresSum = value.scores_sum;
    const month = value.firstMonth;
    const day = value.firstDay;
    const hour = value.firstHour;
    const min = value.firstMin;
    outputScore += `${id},${numFiles},${scores},${scoresSum},${files},${month},${day},${hour},${min}\n`;
  });
  fs.writeFileSync(outputFileScores, outputScore);
  console.log(`Resultado guardado en ${outputFileScores}`);
}

// Lista de archivos a analizar
const fileNames = ['total.csv', 'position_pueblo.csv', 'position_playa.csv','position_plaxiquet.csv', 'position_falcon.csv', 'function_presure.csv','function_level.csv', 'function_flow.csv', 'function_drive.csv'];
analyzeCSVFiles(fileNames, 'resultados_num.csv', 'resultados_scores.csv');
