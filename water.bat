@echo off
echo -> WATER 5.1 - Join Column...
node ./processing/joinColumn.js ./dataset/toCsv.csv ./dataset/joinColumn.csv ./waterConfig.json
if %errorlevel% neq 0 exit /b %errorlevel%

echo -> WATER 6 - Encoding...
node ./processing/encoding.js ./dataset/joinColumn.csv ./dataset/auxiliaryDictionary.csv ./dataset/encoding.csv ./waterConfig.json
if %errorlevel% neq 0 exit /b %errorlevel%

echo -> WATER 6.1 - Delete Column...
node ./processing/deleteColumn.js ./dataset/encoding.csv ./dataset/deleteColumn.csv ./waterConfig.json
if %errorlevel% neq 0 exit /b %errorlevel%

echo -> WATER 7 - Create Template...
node ./processing/createTemplate.js ./dataset/deleteColumn.csv ./dataset/auxiliaryNulls.csv ./dataset/auxiliaryNormalize.csv ./waterConfig.json
if %errorlevel% neq 0 exit /b %errorlevel%

echo -> WATER 8 - Nulls...
node ./processing/nulls.js ./dataset/deleteColumn.csv ./dataset/auxiliaryNulls.csv ./dataset/nulls.csv ./waterConfig.json
if %errorlevel% neq 0 exit /b %errorlevel%

echo -> WATER 9 - Normalize...
node ./processing/normalize.js ./dataset/nulls.csv ./dataset/auxiliaryNormalize.csv ./dataset/normalize.csv ./dataset/auxiliaryMaxMin.csv ./waterConfig.json
if %errorlevel% neq 0 exit /b %errorlevel%

echo -> WATER 10 - Add Column...
node ./processing/addColumn.js ./dataset/normalize.csv ./dataset/addColumn.csv ./dataset/auxiliaryWeight.csv ./waterConfig.json
if %errorlevel% neq 0 exit /b %errorlevel%

echo -> WATER 10.1 - Create Groups...
node ./processing/createGroups.js ./dataset/addColumn.csv ./waterConfig.json
if %errorlevel% neq 0 exit /b %errorlevel%

echo -> WATER 11 - Index...
node ./models/isolationForest/index.js ./dataset/addColumn.csv ./dataset/auxiliaryWeight.csv 25 ./models/isolationForest/results/ isolation.csv scores.csv metrics.csv image ./waterConfig.json
if %errorlevel% neq 0 exit /b %errorlevel%

echo Todos los pasos completados exitosamente.
pause
