node   ./processing/flatten.js   ./results/iot/acquisition.json   ./results/iot/flatten.json   ./exec/waterConfig.json

node   ./processing/expandedColumn.js   ./results/iot/flatten.json   ./results/iot/expandedColumn.json   ./exec/waterConfig.json

node   ./processing/toCsv.js   ./results/iot/expandedColumn.json   ./results/iot/toCsv.csv   ./exec/waterConfig.json

node   ./processing/encoding.js    ./results/iot/toCsv.csv   ./results/iot/auxiliaryDictionary.csv   ./results/iot/encoding.csv    ./exec/waterConfig.json

node   ./processing/createTemplate.js   ./results/iot/encoding.csv   ./results/iot/auxiliaryNulls.csv   ./results/iot/auxiliaryNormalize.csv   ./exec/waterConfig.json

node   ./processing/nulls.js   ./results/iot/encoding.csv   ./results/iot/auxiliaryNulls.csv   ./results/iot/nulls.csv    ./exec/waterConfig.json

node   ./processing/normalize.js   ./results/iot/nulls.csv   ./results/iot/auxiliaryNormalize.csv    ./results/iot/normalize.csv   ./results/iot/auxiliaryMaxMin.csv   ./exec/waterConfig.json
    
node   ./processing/createWeight.js   ./results/iot/normalize.csv   ./results/iot/auxiliaryWeight.csv   ./exec/waterConfig.json

node   ./processing/deleteTruth.js   ./results/iot/normalize.csv   ./results/iot/deleteTruth.csv   ./exec/waterConfig.json


...SUB...
node ./models/isolationForest/index.js ./results/iot/deleteTruth.csv ./results/iot/normalize.csv ./results/iot/auxiliaryWeight.csv 1 100 ./results/iot/result/ isolation.csv scores.csv metrics.csv image ./exec/waterConfig.json


...TREES...
node   ./processing/normalize.js   ./results/iot/nulls.csv   ./results/iot/auxiliaryNormalize.csv    ./results/iot/normalize.csv   ./results/iot/auxiliaryMaxMin.csv   ./exec/waterConfig.json
    
node   ./processing/createWeight.js   ./results/iot/normalize.csv   ./results/iot/auxiliaryWeight.csv   ./exec/waterConfig.json

node   ./processing/deleteTruth.js   ./results/iot/normalize.csv   ./results/iot/deleteTruth.csv   ./exec/waterConfig.json

POLLUTION
node   ./processing/pollution.js   ./results/trees/scores.csv   ./results/trees/pollute.csv   18  1.5   ./exec/waterConfig.json

node ./models/isolationForest/index.js ./results/trees/deleteTruth.csv ./results/trees/pollute.csv ./results/trees/auxiliaryWeight.csv 1 1 ./results/trees/1/ isolation.csv scores.csv metrics.csv image ./exec/waterConfig.json

umbral
contaminar 




90 - 907 – 1815 - 2723 - 3631 - 4539
1 vez...
node   ./processing/deleteColumn.js   ./results/umbral/pollution_18_10.csv   ./results/umbral/deleteTruth_18_10.csv   ./exec/waterConfig.json

90
node   ./processing/pollution.js   ./results/umbral/scores90.csv   ./results/umbral/pollution_1_10.csv   1  1.1   ./exec/waterConfig.json

907
node   ./processing/pollution.js   ./results/umbral/scores907.csv   ./results/umbral/pollution_9_10.csv   9  1.1   ./exec/waterConfig.json

1815
node   ./processing/pollution.js   ./results/umbral/scores1815.csv   ./results/umbral/pollution_18_10.csv   18  1.1   ./exec/waterConfig.json

2723
node   ./processing/pollution.js   ./results/umbral/scores2723.csv   ./results/umbral/pollution_27_10.csv   27  1.1   ./exec/waterConfig.json

3631
node   ./processing/pollution.js   ./results/umbral/scores3631.csv   ./results/umbral/pollution_36_10.csv   36  1.1   ./exec/waterConfig.json

4539
node   ./processing/pollution.js   ./results/umbral/scores4539.csv   ./results/umbral/pollution_45_10.csv   45  1.1   ./exec/waterConfig.json

---
node ./models/isolationForest/index.js ./results/umbral/deleteTruth_9.csv ./results/umbral/pollution_9_10.csv ./results/iot/auxiliaryWeight.csv 1 20 ./results/umbral/9_10/ isolation.csv scores.csv metrics.csv image ./exec/waterConfig.json
---

node   ./processing/select.js

..................

node   ./processing/createGroups.js   ./results/iot/normalize.csv   ./results/iot/createGroups   ./exec/config.json

node ../models/isolationForest/index.js ../results/!treesFolder!/deleteTruth.csv ../results/!treesFolder!/nulls.csv ../results/!treesFolder!/auxiliaryWeight.csv 1 20 ../results/!treesFolder!/!iterFolder!/ isolation.csv scores.csv metrics.csv image ./waterConfig.json