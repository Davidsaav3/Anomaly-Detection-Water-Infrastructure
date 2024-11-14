@echo off
setlocal enabledelayedexpansion
set "folder=realtime"

echo WATER 3.1 - Create Template...
node ../processing/createTemplate.js ../results/!folder!/water.csv ../results/!folder!/auxiliaryNulls.csv ../results/!folder!/auxiliaryNormalize.csv ./waterConfigRealtime.json
echo WATER 3.2 - Nulls...
node ../processing/nulls.js ../results/!folder!/water.csv ../results/!folder!/auxiliaryNulls.csv ../results/!folder!/nulls.csv ./waterConfigRealtime.json
echo WATER 4.1 - Union...
node ../processing/union.js ../results/!folder!/nulls.csv ../results/!folder!/water.csv 2 2 ./waterConfigRealtime.json
echo WATER 4.1 - Create Groups...
node ../processing/createGroups.js ../results/!folder!/union.csv ../results/!folder!/createGroups  ./waterConfigRealtime.json

bucle para dentro de 
    
    echo WATER 3.3 - Create Weight...
    node ../processing/createWeight.js ../results/!folder!/nulls.csv ../results/!folder!/auxiliaryWeight.csv ./waterConfigRealtime.json
    echo WATER 4.1 - Create Groups...
    node ../processing/createGroups.js ../results/!folder!/nulls.csv ../results/!folder!/createGroups ./waterConfigRealtime.json
    echo WATER 3.4 - Delete Truth...
    node ../processing/deleteTruth.js ../results/!folder!/nulls.csv ../results/!folder!/deleteTruth.csv  ./waterConfig.json

echo WATER - Index...
node ../models/isolationForest/indexRealtime.js ../results/!folder!/deleteTruth.csv ../results/!folder!/nulls.csv ../results/!folder!/auxiliaryWeight.csv 1 10 ../results/!folder!/ isolation.csv scores.csv metrics.csv image ./waterConfigRealtime.json

endlocal
pause