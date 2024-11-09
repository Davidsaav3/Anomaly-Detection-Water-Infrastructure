const { IsolationForest } = require('isolation-forest-visualization');

// Sample data
const limit = 1000; // numero de elementos del dataset
const max = 40;  // valor máximo entre 0 y 40
const data = [];

// Crearr array de valores, el dataset
for (let index = 0; index < limit; index++) {
    data.push([index, Math.floor(Math.random() * max), Math.floor(Math.random() * max)])
}

// Contaminar el dataset
const pollution = 10; // elementos que van a ser contaminados
const ratePollution = 1.5555555555;

const pollutionElements=[];
const pollutionElementsIndex=[];
for (let index = 0; index < pollution; index++) {
    const pos = Math.floor(Math.random() * limit);
    const original = { 1:data[pos][1], 2:data[pos][2]}
    data[pos][1] = data[pos][1] * ratePollution;
    data[pos][2] = data[pos][2] * ratePollution;
    pollutionElements.push({element:pos, original: original, new: { 1:data[pos][1], 2:data[pos][2]} })
    pollutionElementsIndex.push(pos);
}

console.log('--------------------------- POLLUTION -----------------------------<')
console.log(pollutionElements);
console.log('--------------------------- END POLLUTION -----------------------------<')


// console.log('--------------------------- DATA -----------------------------<')
// console.log(data)
// console.log('--------------------------- FIN DATA -----------------------------<')

// create an Isolation Forest instance with 5 trees and sample 2

const sampleSize = data.length; //Math.floor(data.length / 2);
const numberOfTree = 20;

const myForest = new IsolationForest(data, numberOfTree, sampleSize);
// calculate average path lengths all data
const pathLengths = myForest.dataPathLength;


// calculate anomaly scores for all data, show 2 top anomalies in the console
const anomalyScores = myForest.dataAnomalyScore(pollution);
console.log("Indices:", pollutionElementsIndex);
//console.log(anomalyScores);

//console.log(anomalyScores);

// // export the tree on index 0
// myForest.exportTree(myForest.forest[0], 'png', 'primerArbol');

// // export the forest
//myForest.exportForest('png', 'arbolDelBosque');
