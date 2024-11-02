@echo off
setlocal enabledelayedexpansion
set "treesFolder=sensorsExpandedTrees"

echo SENSORS EXPANDED 2 - Flatten..
node ../processing/flatten.js ../results/!treesFolder!/acquisition.json ../results/!treesFolder!/flatten.json ./sensorsConfig.json

echo SENSORS EXPANDED 4 - Reduce Column..
node ../processing/expandedColumn.js ../results/!treesFolder!/flatten.json ../results/!treesFolder!/expandedColumn.json ./sensorsConfig.json

echo SENSORS EXPANDED 5 - To CSV..
node ../processing/toCsv.js ../results/!treesFolder!/expandedColumn.json ../results/!treesFolder!/toCsv.csv ./sensorsConfig.json

echo SENSORS REDUCE 5.1 - Create Groups...
node ../processing/createGroups.js ../results/!treesFolder!/toCsv.csv ../results/!treesFolder!/createGroups ./sensorsConfig.json

echo SENSORS EXPANDED 6 - Encoding..
node ../processing/encoding.js ../results/!treesFolder!/toCsv.csv ../results/!treesFolder!/auxiliaryDictionary.csv ../results/!treesFolder!/encoding.csv ./sensorsConfig.json

echo SENSORS EXPANDED 7 - Create Template..
node ../processing/createTemplate.js ../results/!treesFolder!/encoding.csv ../results/!treesFolder!/auxiliaryNulls.csv ../results/!treesFolder!/auxiliaryNormalize.csv ./sensorsConfig.json

echo SENSORS EXPANDED 8 - Nulls..
node ../processing/nulls.js ../results/!treesFolder!/encoding.csv ../results/!treesFolder!/auxiliaryNulls.csv ../results/!treesFolder!/nulls.csv ./sensorsConfig.json

echo SENSORS EXPANDED 9 - Normalize..
node ../processing/normalize.js ../results/!treesFolder!/nulls.csv ../results/!treesFolder!/auxiliaryNormalize.csv ../results/!treesFolder!/normalize.csv ../results/!treesFolder!/auxiliaryMaxMin.csv ./sensorsConfig.json

echo SENSORS EXPANDED 10 - Add Column..
node ../processing/addColumn.js ../results/!treesFolder!/normalize.csv ../results/!treesFolder!/addColumn.csv ../results/!treesFolder!/auxiliaryWeight.csv ./sensorsConfig.json

for /L %%i in (1,1,1) do (
    set "iterFolder=iteration%%i"

    rem Crear directorios si no existen
    if not exist "../results/!treesFolder!/!iterFolder!" mkdir "../results/!treesFolder!/!iterFolder!"

    echo.
    echo ITERACION %%i

    echo SENSORS EXPANDED - Index..
    node ../models/isolationForest/index.js ../results/!treesFolder!/normalize.csv ../results/!treesFolder!/addColumn.csv ../results/!treesFolder!/auxiliaryWeight.csv 25 ../results/!treesFolder!/!iterFolder!/ isolation.csv scores.csv metrics.csv image ./sensorsConfig.json

    echo OK ITERACON %%i.
)

endlocal
pause
