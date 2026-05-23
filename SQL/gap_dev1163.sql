-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 26, 2024 at 03:43 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `gap_dev1163`
--

-- --------------------------------------------------------

--
-- Table structure for table `acc_doctor`
--

CREATE TABLE `acc_doctor` (
  `id_table_doctor` int(11) NOT NULL,
  `id_doctor` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `uid_line_doctor` varchar(50) NOT NULL,
  `password_doctor` varchar(256) NOT NULL,
  `fullname_doctor` varchar(50) NOT NULL,
  `station_doctor` varchar(50) NOT NULL,
  `img_doctor` longblob NOT NULL,
  `status_account` tinyint(1) NOT NULL,
  `status_delete` tinyint(1) NOT NULL,
  `time_online` varchar(60) NOT NULL,
  `role` varchar(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `acc_doctor`
--

INSERT INTO `acc_doctor` (`id_table_doctor`, `id_doctor`, `uid_line_doctor`, `password_doctor`, `fullname_doctor`, `station_doctor`, `img_doctor`, `status_account`, `status_delete`, `time_online`, `role`) VALUES
(1, '12345', '', 'b79ea17b7c5ca8fe9cccd8cdba6e8f8ed0b3c948f9f709ed0f47d2fd47fcba82', 'สุขกาย สบายใจ', '2', '', 1, 0, '', ''),
(3, '666', '', 'c7e616822f366fb1b5e0756af498cc11d2c0862edcb32ca65882f622ff39de1b', 'ศิลา หินผา', '2', '', 1, 0, '', '');

-- --------------------------------------------------------

--
-- Table structure for table `acc_doctor_1`
--

CREATE TABLE `acc_doctor_1` (
  `id_table_doctor` int(11) NOT NULL,
  `id_doctor` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `uid_line_doctor` varchar(50) NOT NULL,
  `password_doctor` varchar(256) NOT NULL,
  `fullname_doctor` varchar(50) NOT NULL,
  `station_doctor` varchar(50) NOT NULL,
  `img_doctor` longblob NOT NULL,
  `status_account` tinyint(1) NOT NULL,
  `status_delete` tinyint(1) NOT NULL,
  `time_online` varchar(60) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` point NOT NULL,
  `Operations_center` varchar(100) NOT NULL,
  `Add by` varchar(50) NOT NULL,
  `Delet by` varchar(50) NOT NULL,
  `Status` varchar(50) NOT NULL,
  `admin` bit(1) NOT NULL,
  `doctor` bit(1) NOT NULL,
  `analyst` bit(1) NOT NULL,
  `consultant` bit(1) NOT NULL,
  `id_line` varchar(50) NOT NULL,
  `Time_Add` datetime DEFAULT NULL,
  `Time_Delet` datetime DEFAULT NULL,
  `record_time` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `acc_farmer`
--

CREATE TABLE `acc_farmer` (
  `id_table` int(11) NOT NULL,
  `id_farmer` varchar(50) NOT NULL,
  `id_table_doctor` varchar(50) NOT NULL,
  `fullname` varchar(50) NOT NULL,
  `img` longblob NOT NULL,
  `station` varchar(50) NOT NULL,
  `location` point NOT NULL,
  `password` varchar(256) NOT NULL,
  `register_auth` tinyint(1) NOT NULL,
  `date_register` datetime NOT NULL DEFAULT current_timestamp(),
  `date_doctor_confirm` varchar(100) NOT NULL,
  `uid_line` varchar(255) NOT NULL,
  `link_user` varchar(50) NOT NULL,
  `tel_number` varchar(15) NOT NULL,
  `text_location` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `password` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` point NOT NULL,
  `station_admin` varchar(50) NOT NULL,
  `img_admin` longblob NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `username`, `password`, `phone`, `address`, `station_admin`, `img_admin`) VALUES
(1, 'wanchana', 'b79ea17b7c5ca8fe9cccd8cdba6e8f8ed0b3c948f9f709ed0f47d2fd47fcba82', '0999999999', 0x00000000010100000000000000000000000000000000000000, '', ''),
(2, 'benchanak', 'aef8a41f5c2a4908b0bbd7e61cb4259dd399189afc67112f547fb6b167c35393', '0998888888', 0x00000000010100000000000000000000000000000000000000, '', ''),
(3, 'wanchana', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '0999999999', 0x00000000010100000000000000000000000000000000000000, '', '');

-- --------------------------------------------------------

--
-- Table structure for table `because_delete`
--

CREATE TABLE `because_delete` (
  `id` int(11) NOT NULL,
  `id_table_doctor` varchar(50) NOT NULL,
  `id_admin` varchar(50) NOT NULL,
  `because_text` longtext NOT NULL,
  `date` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `because_status`
--

CREATE TABLE `because_status` (
  `id` int(11) NOT NULL,
  `id_table_doctor` varchar(50) NOT NULL,
  `id_admin` varchar(50) NOT NULL,
  `because_text` longtext NOT NULL,
  `date` varchar(50) NOT NULL,
  `type_status` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `check_form_detail`
--

CREATE TABLE `check_form_detail` (
  `id` int(11) NOT NULL,
  `id_plant` varchar(50) NOT NULL,
  `status_check` int(11) NOT NULL,
  `note_text` longtext NOT NULL,
  `id_table_doctor` int(11) NOT NULL,
  `date_check` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `check_plant_detail`
--

CREATE TABLE `check_plant_detail` (
  `id` int(11) NOT NULL,
  `id_plant` varchar(50) NOT NULL,
  `status_check` int(11) NOT NULL,
  `state_check` tinyint(1) NOT NULL,
  `note_text` longtext NOT NULL,
  `id_table_doctor` int(11) NOT NULL,
  `date_check` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chemical_list`
--

CREATE TABLE `chemical_list` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `name_formula` varchar(50) NOT NULL,
  `how_use` longtext NOT NULL,
  `date_safe_list` int(11) NOT NULL,
  `is_use` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `detailedit`
--

CREATE TABLE `detailedit` (
  `id_detail` int(11) NOT NULL,
  `id_edit` int(11) NOT NULL,
  `subject_form` varchar(20) NOT NULL,
  `old_content` varchar(100) NOT NULL,
  `new_content` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `editform`
--

CREATE TABLE `editform` (
  `id_edit` int(11) NOT NULL,
  `id_form` varchar(50) NOT NULL,
  `id_doctor` varchar(50) NOT NULL,
  `because` varchar(100) NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp(),
  `note` varchar(100) NOT NULL,
  `status` int(11) NOT NULL,
  `type_form` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fertilizer_list`
--

CREATE TABLE `fertilizer_list` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `name_formula` varchar(50) NOT NULL,
  `how_use` longtext NOT NULL,
  `is_use` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `formchemical`
--

CREATE TABLE `formchemical` (
  `id` int(11) NOT NULL,
  `id_plant` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  `formula_name` varchar(50) NOT NULL,
  `insect` varchar(100) NOT NULL,
  `use_is` varchar(100) NOT NULL,
  `rate` varchar(20) NOT NULL,
  `volume` varchar(100) NOT NULL,
  `date_safe` varchar(100) NOT NULL,
  `date` varchar(100) NOT NULL,
  `source` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `formfertilizer`
--

CREATE TABLE `formfertilizer` (
  `id` int(11) NOT NULL,
  `id_plant` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  `formula_name` varchar(50) NOT NULL,
  `use_is` varchar(100) NOT NULL,
  `volume` varchar(100) NOT NULL,
  `source` varchar(100) NOT NULL,
  `date` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `formplant`
--

CREATE TABLE `formplant` (
  `id` varchar(50) NOT NULL,
  `id_farm_house` varchar(255) NOT NULL,
  `name_plant` varchar(50) NOT NULL,
  `generation` int(11) NULL,
  `date_glow` varchar(50) NULL,
  `date_plant` varchar(50) NOT NULL,
  `posi_w` float NULL,
  `posi_h` float NULL,
  `qty` int(11) NULL,
  `area` float NULL,
  `date_harvest` varchar(50) NOT NULL,
  `system_glow` varchar(50) NULL,
  `water` varchar(50) NULL,
  `water_flow` varchar(50) NULL,
  `history` varchar(50) NULL,
  `insect` varchar(50) NULL,
  `qtyInsect` varchar(50) NULL,
  `seft` varchar(200) NULL,
  `state_status` int(11) NULL,
  `date_success` varchar(50) NULL,
  `unit` varchar(30) NULL,
  `name_varieties` varchar(50) NULL,
  `expected_yield` decimal(10,2) NULL,
  `default_yield` decimal(10,2) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `housefarm`
--

CREATE TABLE `housefarm` (
  `id_farm_house` int(11) NOT NULL,
  `uid_line` varchar(255) NOT NULL,
  `link_user` varchar(50) NOT NULL,
  `name_house` varchar(50) NOT NULL,
  `img_house` longblob NOT NULL,
  `location` point DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `log_admin`
--

CREATE TABLE `log_admin` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `message_user`
--

CREATE TABLE `message_user` (
  `id` int(11) NOT NULL,
  `message` longtext NOT NULL,
  `uid_line_farmer` varchar(255) DEFAULT NULL,
  `id_read` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`id_read`)),
  `date` datetime NOT NULL DEFAULT current_timestamp(),
  `type` varchar(50) NOT NULL,
  `type_message` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notify_doctor`
--

CREATE TABLE `notify_doctor` (
  `id` int(11) NOT NULL,
  `id_table_farmer` int(11) NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp(),
  `id_read` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`id_read`)),
  `notify` longtext NOT NULL,
  `station` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `notify_doctor`
--

INSERT INTO `notify_doctor` (`id`, `id_table_farmer`, `date`, `id_read`, `notify`, `station`) VALUES
(1, 0, '2024-04-07 01:32:34', '{}', 'ศูนย์โครงการหนองเขียวถูกปิด', '1');

-- --------------------------------------------------------

--
-- Table structure for table `plant_list`
--

CREATE TABLE `plant_list` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `is_use` tinyint(1) NOT NULL,
  `type_plant` varchar(20) NOT NULL,
  `qty_harvest` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `plant_list`
--

INSERT INTO `plant_list` (`id`, `name`, `is_use`, `type_plant`, `qty_harvest`) VALUES
(1, 'มะม่วงหวาน', 1, 'พืชผัก', 30);

-- --------------------------------------------------------

--
-- Table structure for table `report_detail`
--

CREATE TABLE `report_detail` (
  `id` int(11) NOT NULL,
  `id_plant` varchar(50) NOT NULL,
  `report_text` longtext NOT NULL,
  `id_table_doctor` int(11) NOT NULL,
  `date_report` datetime NOT NULL DEFAULT current_timestamp(),
  `image_path` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `source_list`
--

CREATE TABLE `source_list` (
  `id` int(11) NOT NULL,
  `name` varchar(80) NOT NULL,
  `is_use` tinyint(1) NOT NULL,
  `location` point DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `station_list`
--

CREATE TABLE `station_list` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `is_use` tinyint(1) NOT NULL,
  `location` point NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `station_list`
--

INSERT INTO `station_list` (`id`, `name`, `is_use`, `location`) VALUES
(1, 'ศูนย์โครงการหนองเขียว', 0, 0x000000000101000000000000000000f03f0000000000002240),
(2, 'ศูนย์โครงการหนองเขียว', 1, 0x00000000010100000000000000000000000000000000000000);

-- --------------------------------------------------------

--
-- Table structure for table `success_detail`
--

CREATE TABLE `success_detail` (
  `id` int(11) NOT NULL,
  `id_success` varchar(100) NOT NULL,
  `id_plant` varchar(50) NOT NULL,
  `type_success` tinyint(1) NOT NULL,
  `id_table_doctor` int(11) NOT NULL,
  `date_of_doctor` datetime NOT NULL DEFAULT current_timestamp(),
  `date_of_farmer` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `acc_doctor`
--
ALTER TABLE `acc_doctor`
  ADD PRIMARY KEY (`id_table_doctor`);

--
-- Indexes for table `acc_farmer`
--
ALTER TABLE `acc_farmer`
  ADD PRIMARY KEY (`id_table`);

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `because_delete`
--
ALTER TABLE `because_delete`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `because_status`
--
ALTER TABLE `because_status`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `check_form_detail`
--
ALTER TABLE `check_form_detail`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `check_plant_detail`
--
ALTER TABLE `check_plant_detail`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `chemical_list`
--
ALTER TABLE `chemical_list`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `detailedit`
--
ALTER TABLE `detailedit`
  ADD PRIMARY KEY (`id_detail`);

--
-- Indexes for table `editform`
--
ALTER TABLE `editform`
  ADD PRIMARY KEY (`id_edit`);

--
-- Indexes for table `fertilizer_list`
--
ALTER TABLE `fertilizer_list`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `formchemical`
--
ALTER TABLE `formchemical`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `formfertilizer`
--
ALTER TABLE `formfertilizer`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `formplant`
--
ALTER TABLE `formplant`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `housefarm`
--
ALTER TABLE `housefarm`
  ADD PRIMARY KEY (`id_farm_house`);

--
-- Indexes for table `log_admin`
--
ALTER TABLE `log_admin`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indexes for table `message_user`
--
ALTER TABLE `message_user`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notify_doctor`
--
ALTER TABLE `notify_doctor`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `plant_list`
--
ALTER TABLE `plant_list`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `report_detail`
--
ALTER TABLE `report_detail`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `source_list`
--
ALTER TABLE `source_list`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `station_list`
--
ALTER TABLE `station_list`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `success_detail`
--
ALTER TABLE `success_detail`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `acc_doctor`
--
ALTER TABLE `acc_doctor`
  MODIFY `id_table_doctor` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `acc_farmer`
--
ALTER TABLE `acc_farmer`
  MODIFY `id_table` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `because_delete`
--
ALTER TABLE `because_delete`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `because_status`
--
ALTER TABLE `because_status`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `check_form_detail`
--
ALTER TABLE `check_form_detail`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `check_plant_detail`
--
ALTER TABLE `check_plant_detail`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chemical_list`
--
ALTER TABLE `chemical_list`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `detailedit`
--
ALTER TABLE `detailedit`
  MODIFY `id_detail` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `editform`
--
ALTER TABLE `editform`
  MODIFY `id_edit` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `fertilizer_list`
--
ALTER TABLE `fertilizer_list`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `formchemical`
--
ALTER TABLE `formchemical`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `formfertilizer`
--
ALTER TABLE `formfertilizer`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `housefarm`
--
ALTER TABLE `housefarm`
  MODIFY `id_farm_house` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `log_admin`
--
ALTER TABLE `log_admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `message_user`
--
ALTER TABLE `message_user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notify_doctor`
--
ALTER TABLE `notify_doctor`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `plant_list`
--
ALTER TABLE `plant_list`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `report_detail`
--
ALTER TABLE `report_detail`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `source_list`
--
ALTER TABLE `source_list`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `station_list`
--
ALTER TABLE `station_list`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `success_detail`
--
ALTER TABLE `success_detail`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `log_admin`
--
ALTER TABLE `log_admin`
  ADD CONSTRAINT `log_admin_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admin` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
