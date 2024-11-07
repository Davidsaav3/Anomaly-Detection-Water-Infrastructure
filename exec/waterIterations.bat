@echo off
setlocal enabledelayedexpansion
set "treesFolder=operation_falcon"

# echo WATER 5.1 - Join Column...
# node ../processing/joinColumn.js ../results/!treesFolder!/waterInfrastructure.csv ../results/!treesFolder!/joinColumn.csv ./waterConfig.json

# echo WATER 5.2 - Create Groups...
# node ../processing/createGroups.js ../results/!treesFolder!/joinColumn.csv ../results/!treesFolder!/createGroups ./waterConfig.json

# echo WATER 6 - Encoding...d 
# node ../processing/encoding.js ../results/!treesFolder!/operation_falcon.csv ../results/!treesFolder!/auxiliaryDictionary.csv ../results/!treesFolder!/encoding.csv ./waterConfig.json

# echo WATER 6.1 - Delete Column...
# node ../processing/deleteColumn.js ../results/!treesFolder!/encoding.csv ../results/!treesFolder!/deleteColumn.csv ./waterConfig.json

# echo WATER 7 - Create Template...
# node ../processing/createTemplate.js ../results/!treesFolder!/deleteColumn.csv ../results/!treesFolder!/auxiliaryNulls.csv ../results/!treesFolder!/auxiliaryNormalize.csv ./waterConfig.json

# echo WATER 8 - Nulls...
# node ../processing/nulls.js ../results/!treesFolder!/deleteColumn.csv ../results/!treesFolder!/auxiliaryNulls.csv ../results/!treesFolder!/nulls.csv ./waterConfig.json

# echo WATER 9 - Normalize...
# node ../processing/normalize.js ../results/!treesFolder!/nulls.csv ../results/!treesFolder!/auxiliaryNormalize.csv ../results/!treesFolder!/normalize.csv ../results/!treesFolder!/auxiliaryMaxMin.csv ./waterConfig.json

# echo WATER 10 - Add Column...
# node ../processing/addColumn.js ../results/!treesFolder!/normalize.csv ../results/!treesFolder!/addColumn.csv ../results/!treesFolder!/auxiliaryWeight.csv ./waterConfig.json

for /L %%i in (1,10,1) do (
    set "iterFolder=iteration%%i"

    rem Crear directorios si no existen
    if not exist "../results/!treesFolder!/!iterFolder!" mkdir "../results/!treesFolder!/!iterFolder!"

    echo.
    echo ITERACION %%i

    echo WATER - Index...
    node ../models/isolationForest/index.js ../results/!treesFolder!/º.csv ../results/!treesFolder!/operation_falcon_t.csv ../results/!treesFolder!/auxiliaryWeight.csv 25 ../results/!treesFolder!/!iterFolder!/ isolation.csv scores.csv metrics.csv image ./waterConfig.json

    echo OK ITERACON %%i.
)

endlocal
pause