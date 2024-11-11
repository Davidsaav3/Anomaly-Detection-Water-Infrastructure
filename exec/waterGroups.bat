@echo off
setlocal enabledelayedexpansion
set "treesFolder=/groups/function_flow
"

echo WATER 3.3 - Create Weight...
node ../processing/createWeight.js ../results/!treesFolder!/pollution.csv ../results/!treesFolder!/auxiliaryWeight.csv ./waterConfig.json
echo WATER 3.4 - Delete Truth...
node ../processing/deleteTruth.js ../results/!treesFolder!/pollution.csv ../results/!treesFolder!/deleteTruth.csv  ./waterConfig.json


for /L %%i in (1,10,1) do (
    set "iterFolder=iteration%%i"

    rem Crear directorios si no existen
    if not exist "../results/!treesFolder!/!iterFolder!" mkdir "../results/!treesFolder!/!iterFolder!"

    echo.
    echo ITERACION %%i

    echo WATER - Index...
    node ../models/isolationForest/index.js ../results/!treesFolder!/deleteTruth.csv ../results/!treesFolder!/pollution.csv ../results/!treesFolder!/auxiliaryWeight.csv 10 22 ../results/!treesFolder!/!iterFolder!/ isolation.csv scores.csv metrics.csv image ./waterConfig.json

    echo OK ITERACON %%i.
)

endlocal
pause