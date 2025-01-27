 /*"node ./processing/joinColumn.js ./results/waterInfrastructure/waterInfrastructure ./results/waterInfrastructure/Join_Column_s1 '{separator1":"_","separator2": "_","joinFiles": ["month","day","hour","min"]}'"

    "node ./processing/deleteColumn.js ./results/waterInfrastructure/Join_Column_s1 ./results/waterInfrastructure/Delete_Column_s1 '{"delete": ["num"]}'"

    "node ./processing/addColumn.js ./results/waterInfrastructure/Delete_Column_s1 ./results/waterInfrastructure/Add_Column_s1 '{"columnName":["truth"], "value":[0]}'"

    "node ./processing/encoding.js ./results/waterInfrastructure/Add_Column_s1 ./results/waterInfrastructure/Encoding_e2 ./results/waterInfrastructure/Encoding_s1 '{"expandedValue":"#fill#", "headers":"header,value,key", "fillTransform":"mean", "_":["none","zero","one","mean","median"]}'"

    "node ./processing/createTemplate.js ./results/waterInfrastructure/Encoding_s1 ./results/waterInfrastructure/Create_Template_s1 ./results/waterInfrastructure/Create_Template_s2 '{"nulls": "0","normalize1": "0","normalize2": "1"}'"

    "node ./processing/nulls.js ./results/waterInfrastructure/Encoding_s1 ./results/waterInfrastructure/Create_Template_s1 ./results/waterInfrastructure/Nulls_s1 '{"remove": ["R", "r", "D", "d"]}'"

    "node ./processing/createWeight.js ./results/waterInfrastructure/Nulls_s1 ./results/waterInfrastructure/Create_Weight_s1 '{"weight": "1"}'"

    "node ./processing/deleteTruth.js ./results/waterInfrastructure/Nulls_s1 ./results/waterInfrastructure/Delete_Truth_s1 '{"delete": ["truth"]}'"

    "node ./processing/createGroups.js ./results/waterInfrastructure/Nulls_s1 ./results/waterInfrastructure/Create_Groups_s1 '{"groups": [{"output": "function_level","fields": ["month","day","hour","min","n_px","n_p","truth"]},{"output": "function_drive","fields": ["month","day","hour","min","i_uiip","i_f","i_uiipu","truth"]},{"output": "function_pressure","fields": ["month","day","hour","min","p_uiip","p_f","p_pu","truth"]},{"output": "function_flow","fields": ["month","day","hour","min","ce_px","cs_px","c_pu_p","truth"]},{"output": "position_plaXiquet","fields": ["month","day","hour","min","n_px","ce_px","cs_px","truth"]},{"output": "position_playa","fields": ["month","day","hour","min","n_p","i_uiip","p_uiip","truth"]},{"output": "position_falcon","fields": ["month","day","hour","min","i_f","p_f","truth"]},{"output": "position_pueblo","fields": ["month","day","hour","min","i_uiipu","c_pu_p","p_pu","truth"]}]}'"
  */
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
