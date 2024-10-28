node index.js:
nombre de salida...

1. acquisition     /  node acquisition.js acquisition.json ../config.json

2. flatten         /  node flatten.js acquisition.json flatten.json ../config.json

3.1 expanded       /  node expanded.js flatten.json expanded.json ../config.json
3.2 reduce         /  node reduce.js expanded.json reduce.json ../config.json

4. format          /  node format.js reduce.json format.csv ../config.json
// union    /  node union.js add.csv  union.csv  ../config.json
6. onehot          /  node onehot.js format.csv  onehot.csv  dictionary.csv  ../config.json

// 5. filter       /  node filter.js onehot.csv  filter.csv  ../config.json

7. createTemplate        /  node createTemplate.js onehot.csv  nulls.csv normalize.csv weight.csv  ../config.json 

8. nulls           /  node nulls.js onehot.csv  nulls.csv  normalize.csv  ../config.json
9. normalize       /  node normalize.js onehot.csv normalize.csv  normalize.csv  ../config.json

10. add          /  node add.js normalize.csv  add.csv  ../config.json // pesos añadir 1

// 11. separate    /  node separate.js add.csv  separate.csv  ../config.json

12. index          /  node index add isolation scores metrics image weight ../config.json

--- 2 ---
-diccionrio x columnas
-problema de q se sustituia para generar el nombre de salida
-filtrar ahora las q quiero eliminar
-"#fill#"

-comparar expanded y reduce
    -excel
    -graficas...
    -datos isolation en json

-thrut
-separe

--------- 3 ---------
-Archivo de Carlos
-Median, media...
-parametro opional q si no llega se completa...
-Archivo ../config.jsonurable de entrada... todo 
---filtrar y separate con archivo csv
---thrut-> add-> generico ara añadir columnas...
-Asignar pesos
-disingir si es numerico, si no tiene comillas...
-Errores diccionario
-union
---

-artículo comenzar, plantilla -data anaisis, data ,ining, michene lerning / contexto y predicado,  intersecciones
-dos respuestas, corregir...
-grabar video... 
-aprender isolation forest como va...
-archivo de scores columnas son las ejcucuiones

------ 5 ------
-noralizar y desnormalizar
-
-
-

normalizar va mal si la columna todo es 13
separav pesos de temlate 
y alicar pesos
sumar 1