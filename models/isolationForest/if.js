const _ = require("lodash");
const graphviz = require("graphviz");

// Definimos un nodo interno, que representa una división en el árbol
class InternalNode {
  constructor(splitAttribute, splitValue, left, right) {
    this.splitAttribute = splitAttribute; // Atributo elegido para la división
    this.splitValue = splitValue; // Valor del atributo en la división
    this.left = left; // Subárbol izquierdo
    this.right = right; // Subárbol derecho
  }
}

// Definimos un nodo externo (hoja), que contiene solo la profundidad alcanzada
class ExternalNode {
  constructor(size) {
    this.size = size; // Número de elementos en esta hoja
  }
}

class IsolationForest {
  constructor(data, numTrees = 100, sampleSize = 256) {
    if (!Array.isArray(data) || data.length === 0 || !Array.isArray(data[0])) {
      throw new Error("Los datos deben ser un array no vacío de arrays.");
    }
    this.data = data;
    this.numTrees = numTrees;
    this.sampleSize = Math.min(sampleSize, data.length); // Aseguramos que la muestra no supere el total de datos
    this.limitHeight = Math.ceil(Math.log2(this.sampleSize)); // Altura máxima del árbol
    this.forest = this.buildForest(); // Construimos el bosque de árboles de aislamiento
  }

  // Construye el bosque con varios árboles
  buildForest() {
    return _.range(this.numTrees).map(() => {
      const sample = this.sample(this.data, this.sampleSize);
      return this.buildTree(sample, 0);
    });
  }

  // Toma una muestra aleatoria de los datos
  sample(data, size) {
    return _.sampleSize(data, size);
  }

  // Construye un árbol de aislamiento recursivamente
  buildTree(data, height) {
    if (height >= this.limitHeight || data.length <= 1) {
      return new ExternalNode(data.length);
    }

    // Seleccionamos aleatoriamente un atributo y un valor de corte
    const splitAttribute = _.random(0, data[0].length - 1);
    const values = data.map(point => point[splitAttribute]);
    const splitValue = _.random(Math.min(...values), Math.max(...values), true);

    // Dividimos los datos en base al atributo y valor seleccionados
    const left = data.filter(point => point[splitAttribute] < splitValue);
    const right = data.filter(point => point[splitAttribute] >= splitValue);

    return new InternalNode(splitAttribute, splitValue, this.buildTree(left, height + 1), this.buildTree(right, height + 1));
  }

  // Calcula la longitud del camino para un dato en un árbol dado
  pathLength(instance, tree, currentDepth = 0) {
    if (tree instanceof ExternalNode) {
      return currentDepth + this.calculateC(tree.size);
    }
    return this.pathLength(
      instance,
      instance[tree.splitAttribute] < tree.splitValue ? tree.left : tree.right,
      currentDepth + 1
    );
  }

  // Calcula la constante c(n), usada para la normalización del score de anomalía
  calculateC(n) {
    return n <= 1 ? 0 : 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1) / n);
  }

  // Calcula los puntajes de anomalía para los datos
  dataAnomalyScore() {
    return this.data.map(instance => {
      const pathLengths = this.forest.map(tree => this.pathLength(instance, tree));
      const avgPathLength = _.mean(pathLengths);
      return {
        instance,
        score: Math.pow(2, -avgPathLength / this.calculateC(this.sampleSize))
      };
    });
  }

  // Obtiene los elementos con los puntajes de anomalía más altos
  maxAnomalyScores(n = 5) {
    const scores = this.dataAnomalyScore();
    return _.orderBy(scores, ['score'], ['desc']).slice(0, n);
  }

  // Exporta un árbol a una imagen usando Graphviz
  exportTree(tree, filename = "tree.png") {
    const g = graphviz.digraph("G");
    this.buildGraph(g, tree, "root");
    g.render("png", filename);
  }

  // Construcción recursiva del grafo para la visualización
  buildGraph(g, node, name) {
    if (node instanceof ExternalNode) {
      g.addNode(name, { label: `Leaf (size: ${node.size})`, shape: "box" });
    } else {
      const nodeName = `node_${name}`;
      g.addNode(nodeName, { label: `Attr ${node.splitAttribute} < ${node.splitValue.toFixed(2)}` });
      g.addEdge(nodeName, this.buildGraph(g, node.left, `${name}L`));
      g.addEdge(nodeName, this.buildGraph(g, node.right, `${name}R`));
    }
    return name;
  }
}

module.exports = IsolationForest;
