const tf = require('@tensorflow/tfjs'); 

// ALGORITMO DE RED NEURONAL
class RedNeuronal {

    // INICIALIZACIÓN DE DATOS Y OPCIONES
    constructor(features, labels, options) {
        // DECLARAMOS LOS VALORES INDEPENDIENTES (FEATURES) Y DEPENDIENTES (LABELS)
        this.features = tf.tensor(features);
        this.labels = tf.tensor(labels);

        // DECLARAMOS EL MODELO DEL ALGORITMO
        this.model = tf.sequential();

        // OPCIONES DEL ALGORITMO
        this.options = Object.assign({ epochs: 2000, learningRate: 0.1, neurons: 10, activation: 'relu' }, options);
    };

    // COMPILA EL ALGORITMO DE RED NEURONAL
    compilar() {
        // SE CREAN Y AÑADEN LAS CAPAS AL MODELO
        const hiddenLayer = tf.layers.dense({
            units: this.options.neurons,
            inputShape: [this.features.shape[1]],
            activation: this.options.activation
        });
        this.model.add(hiddenLayer);

        const outputLayer = tf.layers.dense({
            units: 1,
            activation: 'linear'
        });
        this.model.add(outputLayer);

        // COMPILAMOS EL MODELO CON PARÁMETROS DE OPTIMIZACIÓN Y PÉRDIDA
        this.model.compile({
            optimizer: tf.train.adam(this.options.learningRate),
            loss: tf.losses.meanSquaredError,
            metrics: ['mape']
        });
    };

    // ENTRENA EL ALGORITMO CON FEATURES Y LABELS
    async entrenar() {
        console.log('ENTRENANDO');
        return await this.model.fit(this.features, this.labels, {
            epochs: this.options.epochs,
            validationSplit: (100 - this.options.percentage_train) / 100,
            batchSize: this.options.batchSize,
        });
    };

    // PREDICE RESULTADOS A PARTIR DE LOS DATOS DE ENTRADA
    prediccion(features) {
        features = tf.tensor(features);
        return this.model.predict(features);
    };

    // EVALÚA LA EFICACIA DEL ALGORITMO
    testeo(testFeatures, testLabels) {
        testFeatures = tf.tensor(testFeatures);
        testLabels = tf.tensor(testLabels);

        const resultado = this.model.predict(testFeatures);

        // DIFERENCIA ENTRE RESULTADOS REALES Y PREDICCIONES
        const res = testLabels.sub(resultado)
            .pow(2)
            .sum()
            .get();

        // DIFERENCIA ENTRE RESULTADOS REALES Y MEDIA
        const tot = testLabels.sub(testLabels.mean())
            .pow(2)
            .sum()
            .get();

        // DEVUELVE LA EFICACIA DEL ALGORITMO
        return 1 - res / tot;
    };
}

module.exports = RedNeuronal;