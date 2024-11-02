@echo off
setlocal enabledelayedexpansion
set "treesFolder=depositoTrees"

echo DEPOSITO 5.1 - Join Column...
node ../processing/joinColumn.js ../results/!treesFolder!/toCsv.csv ../results/!treesFolder!/joinColumn.csv ./depositoConfig.json

echo DEPOSITO 5.2 - Create Groups...
node ../processing/createGroups.js ../results/!treesFolder!/joinColumn.csv ../results/!treesFolder!/createGroups ./waterConfig.json

echo DEPOSITO 6 - Encoding...
node ../processing/encoding.js ../results/!treesFolder!/joinColumn.csv ../results/!treesFolder!/auxiliaryDictionary.csv ../results/!treesFolder!/encoding.csv ./depositoConfig.json

echo DEPOSITO 6.1 - Delete Column...
node ../processing/deleteColumn.js ../results/!treesFolder!/encoding.csv ../results/!treesFolder!/deleteColumn.csv ./depositoConfig.json

echo DEPOSITO 7 - Create Template...
node ../processing/createTemplate.js ../results/!treesFolder!/deleteColumn.csv ../results/!treesFolder!/auxiliaryNulls.csv ../results/!treesFolder!/auxiliaryNormalize.csv ./depositoConfig.json

echo DEPOSITO 8 - Nulls...
node ../processing/nulls.js ../results/!treesFolder!/deleteColumn.csv ../results/!treesFolder!/auxiliaryNulls.csv ../results/!treesFolder!/nulls.csv ./depositoConfig.json

echo DEPOSITO 9 - Normalize...
node ../processing/normalize.js ../results/!treesFolder!/nulls.csv ../results/!treesFolder!/auxiliaryNormalize.csv ../results/!treesFolder!/normalize.csv ../results/!treesFolder!/auxiliaryMaxMin.csv ./depositoConfig.json

echo DEPOSITO 10 - Add Column...
node ../processing/addColumn.js ../results/!treesFolder!/normalize.csv ../results/!treesFolder!/addColumn.csv ../results/!treesFolder!/auxiliaryWeight.csv ./depositoConfig.json

echo DEPOSITO 10.1 - Create Groups...
node ../processing/createGroups.js ../results/!treesFolder!/addColumn.csv ../results/!treesFolder!/createGroups ./depositoConfig.json

for /L %%i in (1,1,1) do (
    set "iterFolder=iteration%%i"

    rem Crear directorios si no existen
    if not exist "../results/!treesFolder!/!iterFolder!" mkdir "../results/!treesFolder!/!iterFolder!"

    echo.
    echo ITERACION %%i

    echo DEPOSITO - Index...
    node ../models/isolationForest/index.js ../results/!treesFolder!/normalize.csv ../results/!treesFolder!/addColumn.csv ../results/!treesFolder!/auxiliaryWeight.csv 25 ../results/!treesFolder!/!iterFolder!/ isolation.csv scores.csv metrics.csv image ./depositoConfig.json

    echo OK ITERACON %%i.
)

endlocal
pause

