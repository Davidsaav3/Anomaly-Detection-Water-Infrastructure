 /*"node ./processing/joinColumn.js ./results/waterInfrastructure/waterInfrastructure ./results/waterInfrastructure/Join_Column_s1 '{separator1":"_","separator2": "_","joinFiles": ["month","day","hour","min"]}'"

    "node ./processing/deleteColumn.js ./results/waterInfrastructure/Join_Column_s1 ./results/waterInfrastructure/Delete_Column_s1 '{"delete": ["num"]}'"

    "node ./processing/addColumn.js ./results/waterInfrastructure/Delete_Column_s1 ./results/waterInfrastructure/Add_Column_s1 '{"columnName":["truth"], "value":[0]}'"

    "node ./processing/encoding.js ./results/waterInfrastructure/Add_Column_s1 ./results/waterInfrastructure/Encoding_e2 ./results/waterInfrastructure/Encoding_s1 '{"expandedValue":"#fill#", "headers":"header,value,key", "fillTransform":"mean", "_":["none","zero","one","mean","median"]}'"

    "node ./processing/createTemplate.js ./results/waterInfrastructure/Encoding_s1 ./results/waterInfrastructure/Create_Template_s1 ./results/waterInfrastructure/Create_Template_s2 '{"nulls": "0","normalize1": "0","normalize2": "1"}'"

    "node ./processing/nulls.js ./results/waterInfrastructure/Encoding_s1 ./results/waterInfrastructure/Create_Template_s1 ./results/waterInfrastructure/Nulls_s1 '{"remove": ["R", "r", "D", "d"]}'"

    "node ./processing/createWeight.js ./results/waterInfrastructure/Nulls_s1 ./results/waterInfrastructure/Create_Weight_s1 '{"weight": "1"}'"

    "node ./processing/deleteTruth.js ./results/waterInfrastructure/Nulls_s1 ./results/waterInfrastructure/Delete_Truth_s1 '{"delete": ["truth"]}'"

    "node ./processing/createGroups.js ./results/waterInfrastructure/Nulls_s1 ./results/waterInfrastructure/Create_Groups_s1 '{"groups": [{"output": "function_level","fields": ["month","day","hour","min","n_px","n_p","truth"]},{"output": "function_drive","fields": ["month","day","hour","min","i_uiip","i_f","i_uiipu","truth"]},{"output": "function_pressure","fields": ["month","day","hour","min","p_uiip","p_f","p_pu","truth"]},{"output": "function_flow","fields": ["month","day","hour","min","ce_px","cs_px","c_pu_p","truth"]},{"output": "position_plaXiquet","fields": ["month","day","hour","min","n_px","ce_px","cs_px","truth"]},{"output": "position_playa","fields": ["month","day","hour","min","n_p","i_uiip","p_uiip","truth"]},{"output": "position_falcon","fields": ["month","day","hour","min","i_f","p_f","truth"]},{"output": "position_pueblo","fields": ["month","day","hour","min","i_uiipu","c_pu_p","p_pu","truth"]}]}'"
  */