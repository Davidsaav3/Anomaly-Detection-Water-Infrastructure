@echo off
setlocal enabledelayedexpansion
set "treesFolder=waterInfrastructureTrees"

echo WATER 1.1 - Join Column...
node ../processing/joinColumn.js ../results/!treesFolder!/waterInfrastructure.csv ../results/!treesFolder!/joinColumn.csv ./waterConfig.json
echo WATER 1.2 - Delete Column...
node ../processing/deleteColumn.js ../results/!treesFolder!/joinColumn.csv ../results/!treesFolder!/deleteColumn.csv ./waterConfig.json
echo WATER 1.3 - Add Column...
node ../processing/addColumn.js ../results/!treesFolder!/deleteColumn.csv ../results/!treesFolder!/addColumn.csv ./waterConfig.json

echo WATER 2.1 - Encoding...d 
node ../processing/encoding.js ../results/!treesFolder!/addColumn.csv ../results/!treesFolder!/auxiliaryDictionary.csv ../results/!treesFolder!/encoding.csv ./waterConfig.json

echo WATER 3.1 - Create Template...
node ../processing/createTemplate.js ../results/!treesFolder!/encoding.csv ../results/!treesFolder!/auxiliaryNulls.csv ../results/!treesFolder!/auxiliaryNormalize.csv ./waterConfig.json
echo WATER 3.2 - Nulls...
node ../processing/nulls.js ../results/!treesFolder!/encoding.csv ../results/!treesFolder!/auxiliaryNulls.csv ../results/!treesFolder!/nulls.csv ./waterConfig.json
echo WATER 3.3 - Create Weight...
node ../processing/createWeight.js ../results/!treesFolder!/nulls.csv ../results/!treesFolder!/auxiliaryWeight.csv ./waterConfig.json
echo WATER 3.4 - Delete Truth...
node ../processing/deleteTruth.js ../results/!treesFolder!/nulls.csv ../results/!treesFolder!/deleteTruth.csv  ./waterConfig.json

echo WATER 4.1 - Create Groups...
node ../processing/createGroups.js ../results/!treesFolder!/nulls.csv ../results/!treesFolder!/createGroups ./waterConfig.json

for /L %%i in (1,10,1) do (
    set "iterFolder=iteration%%i"

    rem Crear directorios si no existen
    if not exist "../results/!treesFolder!/!iterFolder!" mkdir "../results/!treesFolder!/!iterFolder!"

    echo.
    echo ITERACION %%i

    echo WATER - Index...
    node ../models/isolationForest/index.js ../results/!treesFolder!/deleteTruth.csv ../results/!treesFolder!/nulls.csv ../results/!treesFolder!/auxiliaryWeight.csv 10 10 ../results/!treesFolder!/!iterFolder!/ isolation.csv scores.csv metrics.csv image ./waterConfig.json

    echo OK ITERACON %%i.
)

endlocal
pause