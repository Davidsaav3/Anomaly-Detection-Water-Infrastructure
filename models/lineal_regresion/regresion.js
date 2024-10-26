const tf = require('@tensorflow/tfjs'); 
const _ = require('lodash');         

// CLASE PARA GESTIONAR LÓGICA DE REGRESIÓN LINEAL
class RegresionLineal {

    // CONSTRUCTOR: INICIALIZA FEATURES, LABELS Y OPCIONES
    constructor(features, labels, options) {
        this.features = this.processFeatures(features);
        this.labels = tf.tensor(labels);
        this.mseHistory = [];

        // OPCIONES CON TASA DE APRENDIZAJE Y NÚMERO DE ITERACIONES
        this.options = Object.assign({ learningRate: 0.1, iterations: 1000 }, options);

        // INICIALIZA PESOS ('M' Y 'B')
        this.weights = tf.zeros([this.features.shape[1], 1]);
    }

    // ENTRENAMIENTO EN N ITERACIONES
    train() {
        for (let i = 0; i < this.options.iterations; i++) {
            this.gradientDescent();
            this.recordMSE();
            this.updateLearningRate();
        }
    }

    // DESCENSO DE GRADIENTE
    gradientDescent() {
        const currentGuess = this.features.matMul(this.weights);
        const differences = currentGuess.sub(this.labels);
        const slopes = this.features
            .transpose()
            .matMul(differences)
            .div(this.features.shape[0]);

        this.weights = this.weights.sub(slopes.mul(this.options.learningRate));
    }

    // PRUEBA PARA EVALUAR EFICACIA
    test(testFeatures, testLabels) {
        testFeatures = this.processFeatures(testFeatures);
        testLabels = tf.tensor(testLabels);
        const preditions = testFeatures.matMul(this.weights);
        const res = testLabels.sub(preditions).pow(2).sum().get();
        const tot = testLabels.sub(testLabels.mean()).pow(2).sum().get();
        
        // RETORNA RESULTADO PARA COMPARAR EFICACIA
        return 1 - res / tot;
    }

    // PROCESA FEATURES (NORMALIZA Y AGREGA COLUMNA DE UNOS)
    processFeatures(features) {
        features = tf.tensor(features);
        if (this.mean && this.variance) {
            features = features.sub(this.mean).div(this.variance.pow(0.5));
        } else {
            features = this.standardize(features);
        }
        return tf.ones([features.shape[0], 1]).concat(features, 1);
    }

    // NORMALIZACIÓN
    standardize(features) {
        const { mean, variance } = tf.moments(features, 0);
        this.mean = mean;
        this.variance = variance;
        return features.sub(mean).div(variance.pow(0.5));
    }

    // REGISTRA MSE
    recordMSE() {
        const mse = this.features
            .matMul(this.weights)
            .sub(this.labels)
            .pow(2)
            .sum()
            .div(this.features.shape[0])
            .get();

        this.mseHistory.unshift(mse);
    }

    // ACTUALIZA TASA DE APRENDIZAJE
    updateLearningRate() {
        if (this.mseHistory.length < 2) return;

        if (this.mseHistory[0] > this.mseHistory[1]) {
            this.options.learningRate /= 2;
        } else {
            this.options.learningRate *= 1.05;
        }
    }

    // PREDICE RESULTADO
    predictResult(features) {
        features = tf.tensor(features);
        features = tf.reshape(features, [1, features.shape[0]]);
        features = features.sub(this.mean).div(this.variance.pow(0.5));
        features = tf.ones([features.shape[0], 1]).concat(features, 1);

        const preditions = features.matMul(this.weights);
        return preditions.sum().get();
    }

    // MUESTRA PESOS 'B' Y 'M'
    mostrarPesos() {
        console.log(' ');
        console.log('[ WEIGHT ]');
        for (let i = 0; i < this.weights.shape[0]; i++) {
            if (i == 0) console.log('[ VALUE OF B =>', this.weights.get(0, 0));
            else console.log(`[ VALUE OF M${i} =>`, this.weights.get(i, 0));
        }
        console.log(' ');
    }
}

module.exports = RegresionLineal;
