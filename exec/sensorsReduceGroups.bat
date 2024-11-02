@echo off
setlocal enabledelayedexpansion
rem set "treesFolder=sensorsReduceTrees-device"
rem set "treesFolder=sensorsReduceTrees-device_configurations"
rem set "treesFolder=sensorsReduceTrees-message"
set "treesFolder=sensorsReduceTrees-network"

echo SENSORS REDUCE 6 - Encoding...
node ../processing/encoding.js ../results/!treesFolder!/toCsv.csv ../results/!treesFolder!/auxiliaryDictionary.csv ../results/!treesFolder!/encoding.csv ./sensorsConfig.json

echo SENSORS REDUCE 7 - Create Template...
node ../processing/createTemplate.js ../results/!treesFolder!/encoding.csv ../results/!treesFolder!/auxiliaryNulls.csv ../results/!treesFolder!/auxiliaryNormalize.csv ./sensorsConfig.json

echo SENSORS REDUCE 8 - Nulls...
node ../processing/nulls.js ../results/!treesFolder!/encoding.csv ../results/!treesFolder!/auxiliaryNulls.csv ../results/!treesFolder!/nulls.csv ./sensorsConfig.json

echo SENSORS REDUCE 9 - Normalize...
node ../processing/normalize.js ../results/!treesFolder!/nulls.csv ../results/!treesFolder!/auxiliaryNormalize.csv ../results/!treesFolder!/normalize.csv ../results/!treesFolder!/auxiliaryMaxMin.csv ./sensorsConfig.json

echo SENSORS REDUCE 10 - Add Column...
node ../processing/addColumn.js ../results/!treesFolder!/normalize.csv ../results/!treesFolder!/addColumn.csv ../results/!treesFolder!/auxiliaryWeight.csv ./sensorsConfig.json

for /L %%i in (1,1,1) do (
    set "iterFolder=iteration%%i"

    rem Crear directorios si no existen
    if not exist "../results/!treesFolder!/!iterFolder!" mkdir "../results/!treesFolder!/!iterFolder!"

    echo.
    echo ITERACION %%i

    echo SENSORS REDUCE - Index...
    node ../models/isolationForest/index.js ../results/!treesFolder!/normalize.csv ../results/!treesFolder!/addColumn.csv ../results/!treesFolder!/auxiliaryWeight.csv 25 ../results/!treesFolder!/!iterFolder!/ isolation.csv scores.csv metrics.csv image ./sensorsConfig.json

    echo OK ITERACON %%i.
)

endlocal
pause
