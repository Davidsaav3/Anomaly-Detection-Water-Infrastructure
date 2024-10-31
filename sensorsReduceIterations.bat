@echo off
setlocal enabledelayedexpansion

for /L %%i in (1,1,10) do (
    set "iterFolder=iteration%%i"
    set "treesFolder=sensorsReduceTrees100"

    echo
    echo ITERACION %%i
    echo

    rem Crear directorios si no existen
    if not exist "./dataset/!treesFolder!/!iterFolder!/!treesFolder!/!iterFolder!" mkdir "./dataset/!treesFolder!/!iterFolder!/!treesFolder!/!iterFolder!"
    if not exist "./results/!treesFolder!/!iterFolder!" mkdir "./results/!treesFolder!/!iterFolder!"

    echo -> SENSORS REDUCE 2 - Flatten...
    node ./processing/flatten.js ./dataset/!treesFolder!/acquisition.json ./dataset/!treesFolder!/!iterFolder!/flatten.json ./sensorsConfig.json
    if %errorlevel% neq 0 exit /b %errorlevel%

    echo -> SENSORS REDUCE 4 - Reduce Column...
    node ./processing/reduceColumn.js ./dataset/!treesFolder!/!iterFolder!/flatten.json ./dataset/!treesFolder!/!iterFolder!/reduceColumn.json ./sensorsConfig.json
    if %errorlevel% neq 0 exit /b %errorlevel%

    echo -> SENSORS REDUCE 5 - To CSV...
    node ./processing/toCsv.js ./dataset/!treesFolder!/!iterFolder!/reduceColumn.json ./dataset/!treesFolder!/!iterFolder!/toCsv.csv ./sensorsConfig.json
    if %errorlevel% neq 0 exit /b %errorlevel%

    echo -> SENSORS REDUCE 6 - Encoding...
    node ./processing/encoding.js ./dataset/!treesFolder!/!iterFolder!/toCsv.csv ./dataset/!treesFolder!/!iterFolder!/auxiliaryDictionary.csv ./dataset/!treesFolder!/!iterFolder!/encoding.csv ./sensorsConfig.json
    if %errorlevel% neq 0 exit /b %errorlevel%

    echo -> SENSORS REDUCE 7 - Create Template...
    node ./processing/createTemplate.js ./dataset/!treesFolder!/!iterFolder!/encoding.csv ./dataset/!treesFolder!/!iterFolder!/auxiliaryNulls.csv ./dataset/!treesFolder!/!iterFolder!/auxiliaryNormalize.csv ./sensorsConfig.json
    if %errorlevel% neq 0 exit /b %errorlevel%

    echo -> SENSORS REDUCE 8 - Nulls...
    node ./processing/nulls.js ./dataset/!treesFolder!/!iterFolder!/encoding.csv ./dataset/!treesFolder!/!iterFolder!/auxiliaryNulls.csv ./dataset/!treesFolder!/!iterFolder!/nulls.csv ./sensorsConfig.json
    if %errorlevel% neq 0 exit /b %errorlevel%

    echo -> SENSORS REDUCE 9 - Normalize...
    node ./processing/normalize.js ./dataset/!treesFolder!/!iterFolder!/nulls.csv ./dataset/!treesFolder!/!iterFolder!/auxiliaryNormalize.csv ./dataset/!treesFolder!/!iterFolder!/normalize.csv ./dataset/!treesFolder!/!iterFolder!/auxiliaryMaxMin.csv ./sensorsConfig.json
    if %errorlevel% neq 0 exit /b %errorlevel%

    echo -> SENSORS REDUCE 10 - Add Column...
    node ./processing/addColumn.js ./dataset/!treesFolder!/!iterFolder!/auxiliaryNormalize.csv ./dataset/!treesFolder!/!iterFolder!/addColumn.csv ./dataset/!treesFolder!/!iterFolder!/auxiliaryWeight.csv ./sensorsConfig.json
    if %errorlevel% neq 0 exit /b %errorlevel%

    echo -> SENSORS REDUCE 11 - Index...
    node ./models/isolationForest/index.js ./dataset/!treesFolder!/!iterFolder!/addColumn.csv ./dataset/!treesFolder!/!iterFolder!/auxiliaryWeight.csv 25 ./models/isolationForest/results/ isolation.csv scores.csv metrics.csv image ./sensorsConfig.json
    if %errorlevel% neq 0 exit /b %errorlevel%

    echo Todos los pasos completados exitosamente en la iteración %%i.
)

endlocal
pause
