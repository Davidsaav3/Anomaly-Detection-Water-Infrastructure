@echo off
setlocal enabledelayedexpansion
set "treesFolder=waterInfrastructure/pollution"

for /L %%i in (1,100,1) do (
    set "iterFolder=iteration%%i"

    rem Crear directorios si no existen
    if not exist "../results/!treesFolder!/!iterFolder!" mkdir "../results/!treesFolder!/!iterFolder!"

    echo.
    echo ITERACION %%i

    echo WATER - Index...
    node ../models/isolationForest/index.js ../results/!treesFolder!/pollution_10.csv ../results/!treesFolder!/truth.csv ../results/!treesFolder!/auxiliaryWeight.csv 1 10 ../results/!treesFolder!/!iterFolder!/ isolation.csv scores.csv metrics.csv image ./waterConfig.json

    echo OK ITERACON %%i
)

endlocal
pause