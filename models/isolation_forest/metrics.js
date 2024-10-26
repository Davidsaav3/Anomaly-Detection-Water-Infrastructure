const fs = require('fs');

// CALCULA MÉTRICAS: PRECISIÓN, RECALL, F1, Y ACCURACY
const calculateMetrics = (y_true, y_pred) => {
    let tp = 0, fp = 0, tn = 0, fn = 0;

    // ITERA A TRAVÉS DE LOS RESULTADOS Y CUENTA LOS VERDADEROS Y FALSOS POSITIVOS Y NEGATIVOS
    for (let i = 0; i < y_true.length; i++) {
        tp += (y_true[i] === 1 && y_pred[i] === 1) ? 1 : 0; // TRUE POSITIVE
        fp += (y_true[i] === 0 && y_pred[i] === 1) ? 1 : 0; // FALSE POSITIVE
        tn += (y_true[i] === 0 && y_pred[i] === 0) ? 1 : 0; // TRUE NEGATIVE
        fn += (y_true[i] === 1 && y_pred[i] === 0) ? 1 : 0; // FALSE NEGATIVE
    }

    // EVITA DIVISIONES POR CERO AL CALCULAR LAS MÉTRICAS
    const precision = tp + fp ? tp / (tp + fp) : 0; 
    const recall = tp + fn ? tp / (tp + fn) : 0;     
    const f1 = precision + recall ? 2 * (precision * recall) / (precision + recall) : 0; 
    const accuracy = tp + tn + fp + fn ? (tp + tn) / (tp + tn + fp + fn) : 0; 

    return { precision, recall, f1, accuracy };
};

// GUARDA MÉTRICAS EN FORMATO CSV
const saveMetricsToCSV = (metrics, filePath) => {
    const csvHeader = 'precision,recall,f1,accuracy\n';
    const csvRow = `${metrics.precision},${metrics.recall},${metrics.f1},${metrics.accuracy}\n`;
    fs.writeFileSync(filePath, csvHeader + csvRow, 'utf8');
    console.log(`[ METRICS: ${filePath} ]`); 
};

module.exports = { calculateMetrics, saveMetricsToCSV };
