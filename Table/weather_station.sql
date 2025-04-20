-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 20, 2025 at 12:13 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

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
-- Table structure for table `weather_station`
--

CREATE TABLE `weather_station` (
  `id` int(11) NOT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  `temperature` double DEFAULT NULL,
  `humidity` double DEFAULT NULL,
  `light` double DEFAULT NULL,
  `rainfall` double DEFAULT NULL,
  `device_id` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `weather_station`
--

INSERT INTO `weather_station` (`id`, `timestamp`, `temperature`, `humidity`, `light`, `rainfall`, `device_id`) VALUES
(44, '2025-04-20 08:59:56', 2.89, 136.37, 35173, 46.77, 'hel-lora-32');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `weather_station`
--
ALTER TABLE `weather_station`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_device_station` (`device_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `weather_station`
--
ALTER TABLE `weather_station`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `weather_station`
--
ALTER TABLE `weather_station`
  ADD CONSTRAINT `fk_device_station` FOREIGN KEY (`device_id`) REFERENCES `device_station_map` (`device_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
