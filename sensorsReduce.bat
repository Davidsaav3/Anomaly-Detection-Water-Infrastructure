@echo off
echo -> SENSORS EXPANDED 2 - Flatten...
node ./processing/flatten.js ./dataset/acquisition.json ./dataset/flatten.json ./sensorsConfig.json
if %errorlevel% neq 0 exit /b %errorlevel%

echo -> SENSORS EXPANDED 4 - Reduce Column...
node ./processing/reduceColumn.js ./dataset/flatten.json ./dataset/reduceColumn.json ./sensorsConfig.json
if %errorlevel% neq 0 exit /b %errorlevel%

echo -> SENSORS EXPANDED 5 - To CSV...
node ./processing/toCsv.js ./dataset/reduceColumn.json ./dataset/toCsv.csv ./sensorsConfig.json
if %errorlevel% neq 0 exit /b %errorlevel%

echo -> SENSORS EXPANDED 6 - Encoding...
node ./processing/encoding.js ./dataset/toCsv.csv ./dataset/auxiliaryDictionary.csv ./dataset/encoding.csv ./sensorsConfig.json
if %errorlevel% neq 0 exit /b %errorlevel%

echo -> SENSORS EXPANDED 7 - Create Template...
node ./processing/createTemplate.js ./dataset/encoding.csv ./dataset/auxiliaryNulls.csv ./dataset/auxiliaryNormalize.csv ./sensorsConfig.json
if %errorlevel% neq 0 exit /b %errorlevel%

echo -> SENSORS EXPANDED 8 - Nulls...
node ./processing/nulls.js ./dataset/encoding.csv ./dataset/auxiliaryNulls.csv ./dataset/nulls.csv ./sensorsConfig.json
if %errorlevel% neq 0 exit /b %errorlevel%

echo -> SENSORS EXPANDED 9 - Normalize...
node ./processing/normalize.js ./dataset/nulls.csv ./dataset/auxiliaryNormalize.csv ./dataset/normalize.csv ./dataset/auxiliaryMaxMin.csv ./sensorsConfig.json
if %errorlevel% neq 0 exit /b %errorlevel%

echo -> SENSORS EXPANDED 10 - Add Column...
node ./processing/addColumn.js ./dataset/auxiliaryNormalize.csv ./dataset/addColumn.csv ./dataset/auxiliaryWeight.csv ./sensorsConfig.json
if %errorlevel% neq 0 exit /b %errorlevel%

echo -> SENSORS EXPANDED 11 - Index...
node ./models/isolationForest/index.js ./dataset/addColumn.csv ./dataset/auxiliaryWeight.csv 25 ./models/isolationForest/results/ isolation.csv scores.csv metrics.csv image ./sensorsConfig.json
if %errorlevel% neq 0 exit /b %errorlevel%

echo Todos los pasos completados exitosamente.
pause