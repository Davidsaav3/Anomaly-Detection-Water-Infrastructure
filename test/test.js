const { IsolationForest } = require('isolation-forest-visualization');

// Sample data
const limit = 1000;
const max = 40;
const data = [];
for (let index = 0; index < limit; index++) {
    data.push([index, Math.floor(Math.random() * max), Math.floor(Math.random() * max)])
    
}

const pos = Math.floor(Math.random() * limit);
data[pos][1]=limit*100;
data[pos][2]=limit*100;
console.log('--------------------------- DATA -----------------------------<')
console.log(data)
console.log('--------------------------- FIN DATA -----------------------------<')

// create an Isolation Forest instance with 5 trees and sample 2

const myForest = new IsolationForest(data, 3, Math.floor(data.length/2));
// calculate average path lengths all data
const pathLengths = myForest.dataPathLength;

// calculate anomaly scores for all data, show 2 top anomalies in the console
const anomalyScores = myForest.dataAnomalyScore(3);
//console.log(anomalyScores);

//console.log(anomalyScores);

// // export the tree on index 0
// myForest.exportTree(myForest.forest[0], 'png', 'primerArbol');

// // export the forest
// myForest.exportForest('png', 'arbolDelBosque');
