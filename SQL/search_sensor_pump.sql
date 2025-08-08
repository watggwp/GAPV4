SELECT fullname , name_house , spg.device_id
FROM acc_farmer ac
LEFT JOIN housefarm hf ON hf.uid_line = ac.uid_line
LEFT JOIN sensor_pump_greenhouse spg ON spg.greenhouse_id = hf.id_farm_house
WHERE spg.status = "on";