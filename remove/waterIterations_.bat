@echo off
setlocal enabledelayedexpansion

for /L %%i in (1,1,10) do (
    set "iterFolder=iteration%%i"
    set "treesFolder=waterTrees100"

    echo.
    echo ITERACION %%i
    echo.

    rem Crear directorios si no existen
    if not exist "../dataset/!treesFolder!/!iterFolder!" mkdir "../dataset/!treesFolder!/!iterFolder!"
    if not exist "../results/!treesFolder!/!iterFolder!" mkdir "../results/!treesFolder!/!iterFolder!"

    echo WATER 5.1 - Join Column...
    node ../processing/joinColumn.js ../dataset/!treesFolder!/toCsv.csv ../dataset/!treesFolder!/!iterFolder!/joinColumn.csv ./waterConfig.json
    if !errorlevel! neq 0 exit /b !errorlevel!

    echo WATER 6 - Encoding...
    node ../processing/encoding.js ../dataset/!treesFolder!/!iterFolder!/joinColumn.csv ../dataset/!treesFolder!/!iterFolder!/auxiliaryDictionary.csv ../dataset/!treesFolder!/!iterFolder!/encoding.csv ./waterConfig.json
    if !errorlevel! neq 0 exit /b !errorlevel!

    echo WATER 6.1 - Delete Column...
    node ../processing/deleteColumn.js ../dataset/!treesFolder!/!iterFolder!/encoding.csv ../dataset/!treesFolder!/!iterFolder!/deleteColumn.csv ./waterConfig.json
    if !errorlevel! neq 0 exit /b !errorlevel!

    echo WATER 7 - Create Template...
    node ../processing/createTemplate.js ../dataset/!treesFolder!/!iterFolder!/deleteColumn.csv ../dataset/!treesFolder!/!iterFolder!/auxiliaryNulls.csv ../dataset/!treesFolder!/!iterFolder!/auxiliaryNormalize.csv ./waterConfig.json
    if !errorlevel! neq 0 exit /b !errorlevel!

    echo WATER 8 - Nulls...
    node ../processing/nulls.js ../dataset/!treesFolder!/!iterFolder!/deleteColumn.csv ../dataset/!treesFolder!/!iterFolder!/auxiliaryNulls.csv ../dataset/!treesFolder!/!iterFolder!/nulls.csv ./waterConfig.json
    if !errorlevel! neq 0 exit /b !errorlevel!

    echo WATER 9 - Normalize...
    node ../processing/normalize.js ../dataset/!treesFolder!/!iterFolder!/nulls.csv ../dataset/!treesFolder!/!iterFolder!/auxiliaryNormalize.csv ../dataset/!treesFolder!/!iterFolder!/normalize.csv ../dataset/!treesFolder!/!iterFolder!/auxiliaryMaxMin.csv ./waterConfig.json
    if !errorlevel! neq 0 exit /b !errorlevel!

    echo WATER 10 - Add Column...
    node ../processing/addColumn.js ../dataset/!treesFolder!/!iterFolder!/normalize.csv ../dataset/!treesFolder!/!iterFolder!/addColumn.csv ../dataset/!treesFolder!/!iterFolder!/auxiliaryWeight.csv ./waterConfig.json
    if !errorlevel! neq 0 exit /b !errorlevel!

    echo WATER 10.1 - Create Groups...
    node ../processing/createGroups.js ../dataset/!treesFolder!/!iterFolder!/addColumn.csv ../dataset/!treesFolder!/!iterFolder!/createGroups ./waterConfig.json
    if !errorlevel! neq 0 exit /b !errorlevel!

    echo WATER 11 - Index...
    node ../models/isolationForest/index.js ../dataset/!treesFolder!/!iterFolder!/addColumn.csv ../dataset/!treesFolder!/!iterFolder!/auxiliaryWeight.csv 25 ../results/!treesFolder!/!iterFolder!/ isolation.csv scores.csv metrics.csv image ./waterConfig.json
    if !errorlevel! neq 0 exit /b !errorlevel!

    echo Todos los pasos completados exitosamente en la iteración %%i.
)

endlocal
pause
