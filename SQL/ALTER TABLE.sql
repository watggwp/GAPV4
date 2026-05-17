ALTER TABLE `line_chat_gap`.`acc_doctor`
MODIFY password_doctor varchar(256);

ALTER TABLE formplant
MODIFY generation int(11) NULL,
MODIFY date_glow varchar(50) NULL,
MODIFY date_plant varchar(50) NOT NULL,
MODIFY posi_w float NULL,
MODIFY posi_h float NULL,
MODIFY qty int(11) NULL,
MODIFY area float NULL,
MODIFY date_harvest varchar(50) NULL,
MODIFY system_glow varchar(50) NULL,
MODIFY water varchar(50) NULL,
MODIFY water_flow varchar(50) NULL,
MODIFY history varchar(50) NULL,
MODIFY insect varchar(50) NULL,
MODIFY qtyInsect varchar(50) NULL,
MODIFY seft varchar(200) NULL,
MODIFY state_status int(11) NULL,
MODIFY date_success varchar(50) NULL,
MODIFY unit varchar(30) NULL,
MODIFY name_varieties varchar(50) NULL,
MODIFY expected_yield decimal(10,2) NULL,
MODIFY default_yield decimal(10,2) NULL;