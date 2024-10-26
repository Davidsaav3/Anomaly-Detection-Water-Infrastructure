const tf = require('@tensorflow/tfjs'); // TENSORFLOW

// CLASE PARA GESTIONAR LA LÓGICA DE REGRESIÓN LINEAL
class Regresion {

    // CONSTRUCTOR: INICIALIZA FEATURES Y LABELS
    constructor(features, labels) {
        this.features = tf.tensor(features);
        this.labels = tf.tensor(labels);

        // INICIALIZA PARÁMETROS 'W' Y 'B'
        this.w = tf.variable(tf.scalar(Math.random()));
        this.b = tf.variable(tf.scalar(Math.random()));

        this.train = this.train.bind(this);
    }

    // FUNCIÓN DE PRUEBA PARA CALCULAR PREDICCIONES
    test() {
        return this.w.mul(this.features).add(this.b);
    }

    // FUNCIÓN DE PÉRDIDA PARA CALCULAR ERROR CUADRÁTICO MEDIO
    loss(y_hat) {
        return y_hat.sub(this.labels).square().mean();
    }

    // ENTRENAMIENTO POR 2000 ITERACIONES
    train() {
        for (let i = 0; i < 2000; i++) {
            let optimizer = tf.train.sgd(0.05);
            optimizer.minimize(() => {
                let y_hat = this.test();
                let stepLoss = this.loss(y_hat);
                return stepLoss;
            });
        }
    }

    // IMPRIME PARÁMETROS 'W' Y 'B', Y PREDICE
    predict() {
        this.w.print(); // IMPRIME VALOR DE W
        this.b.print(); // IMPRIME VALOR DE B
        return this.w.mul(feature).add(this.b);
    }

}

module.exports = Regresion;
