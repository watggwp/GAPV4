-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 20, 2025 at 05:29 PM
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
-- Database: `gapv3`
--

-- --------------------------------------------------------

--
-- Table structure for table `sensor_weather_greenhouse`
--

CREATE TABLE `sensor_weather_greenhouse` (
  `id` int(11) NOT NULL,
  `device_id` varchar(50) NOT NULL,
  `greenhouse_id` int(11) NOT NULL,
  `status` enum('on','off') NOT NULL DEFAULT 'on',
  `create_timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sensor_weather_station`
--

CREATE TABLE `sensor_weather_station` (
  `id` int(11) NOT NULL,
  `device_id` varchar(50) NOT NULL,
  `station_signature` varchar(255) NOT NULL,
  `status` enum('on','off') NOT NULL DEFAULT 'on',
  `create_timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `weather_greenhouse`
--

CREATE TABLE `weather_greenhouse` (
  `id` int(11) NOT NULL,
  `device_id` varchar(50) DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `air_temperature` float DEFAULT NULL,
  `air_humidity` float DEFAULT NULL,
  `light` float DEFAULT NULL,
  `soil_temperature` float DEFAULT NULL,
  `soil_humidity` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `weather_station`
--

CREATE TABLE `weather_station` (
  `id` int(11) NOT NULL,
  `device_id` varchar(50) DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  `temperature` double DEFAULT NULL,
  `humidity` double DEFAULT NULL,
  `light` double DEFAULT NULL,
  `rainfall` double DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `weather_station`
--

INSERT INTO `weather_station` (`id`, `device_id`, `timestamp`, `temperature`, `humidity`, `light`, `rainfall`) VALUES
(138, 'dev-001', '2025-03-15 15:14:01', 32.1, 42, 150.3, 2.2),
(139, 'dev-001', '2025-04-13 07:15:47', 32, 73, 68.8, 8.6),
(140, 'dev-001', '2025-03-01 11:40:13', 35.5, 77, 50.9, 7.9),
(141, 'dev-001', '2025-02-26 11:52:40', 31.6, 57, 99.3, 5.1),
(142, 'dev-001', '2025-03-18 12:39:16', 34.3, 52, 152, 6.7),
(143, 'dev-001', '2025-03-12 08:07:06', 29.5, 58, 140.9, 3.7),
(144, 'dev-001', '2025-02-10 05:09:44', 29.8, 64, 60.6, 4.8),
(145, 'dev-001', '2025-03-10 08:35:09', 28.9, 43, 189.4, 6.1),
(146, 'dev-001', '2025-02-09 20:34:42', 32.6, 63, 191.5, 9.6),
(147, 'dev-001', '2025-01-30 16:57:03', 33.7, 49, 193.4, 6.1),
(148, 'dev-001', '2025-01-28 12:57:29', 29.6, 72, 103.7, 2.1),
(149, 'dev-001', '2025-01-30 14:10:35', 30.1, 45, 174.7, 7.7),
(150, 'dev-001', '2025-03-08 05:22:43', 34.3, 78, 172.2, 6.6),
(151, 'dev-001', '2025-04-11 18:12:21', 31.5, 62, 170.2, 1.1),
(152, 'dev-001', '2025-01-22 20:04:01', 30.3, 66, 122.4, 4.2),
(153, 'dev-001', '2025-04-03 00:26:11', 33.2, 50, 146.3, 3.6),
(154, 'dev-001', '2025-02-21 19:17:55', 29, 66, 173, 9.7),
(155, 'dev-001', '2025-02-06 13:00:13', 33.3, 55, 64.2, 6.6),
(156, 'dev-001', '2025-03-21 17:45:38', 33.7, 72, 177.2, 6.7),
(157, 'dev-001', '2025-02-08 04:40:14', 28.9, 64, 105.9, 4.2),
(158, 'dev-001', '2025-02-07 05:59:57', 35.7, 70, 194.9, 5.1),
(159, 'dev-001', '2025-01-21 10:57:47', 30.7, 72, 111.4, 2.7),
(160, 'dev-001', '2025-02-25 19:04:27', 34.4, 47, 59.3, 8.2),
(161, 'dev-001', '2025-01-22 14:12:17', 33.1, 64, 134.5, 6.3),
(162, 'dev-001', '2025-03-30 00:53:14', 31, 43, 146, 0.4),
(163, 'dev-001', '2025-03-25 04:36:44', 30, 41, 61.6, 3.5),
(164, 'dev-001', '2025-02-14 14:28:04', 30.5, 61, 132.3, 6.1),
(165, 'dev-001', '2025-02-13 00:52:55', 33.7, 72, 168.7, 0.5),
(166, 'dev-001', '2025-04-06 18:37:43', 35.9, 55, 102.2, 3.6),
(167, 'dev-001', '2025-03-06 07:52:30', 33.5, 61, 130.3, 6.3),
(168, 'dev-001', '2025-02-28 12:59:48', 31.7, 75, 122.6, 2.8),
(169, 'dev-001', '2025-01-20 00:27:17', 30.3, 62, 191, 7.2),
(170, 'dev-001', '2025-04-02 22:13:39', 29.8, 63, 63.1, 7.2),
(171, 'dev-001', '2025-03-03 20:15:43', 35.6, 46, 155.1, 1.2),
(172, 'dev-001', '2025-03-09 13:46:01', 30.4, 48, 156.3, 6.1),
(173, 'dev-001', '2025-03-04 21:11:37', 30.1, 44, 191.5, 5.6),
(174, 'dev-001', '2025-03-24 00:01:23', 29.6, 76, 63.8, 8.2),
(175, 'dev-001', '2025-03-07 15:03:19', 35.2, 80, 195.7, 7.2),
(176, 'dev-001', '2025-01-24 07:57:41', 34.1, 74, 158.6, 5.2),
(177, 'dev-001', '2025-01-23 14:09:42', 30.4, 62, 162.3, 7.4),
(178, 'dev-001', '2025-03-27 08:31:07', 28.9, 70, 130.8, 7.2),
(179, 'dev-001', '2025-02-11 17:04:57', 29.2, 62, 84.1, 5.7),
(180, 'dev-001', '2025-02-15 16:28:35', 30.5, 65, 125.9, 0.8),
(181, 'dev-001', '2025-01-26 22:50:11', 30.3, 71, 170.6, 4.5),
(182, 'dev-001', '2025-01-27 17:32:17', 28.8, 67, 163.3, 7.3),
(183, 'dev-001', '2025-03-26 04:11:32', 28.8, 61, 132.1, 6.9),
(184, 'dev-001', '2025-04-17 06:16:24', 28.1, 43, 150.7, 0.1),
(185, 'dev-001', '2025-04-08 01:32:13', 28.2, 53, 145.9, 4.4),
(186, 'dev-001', '2025-02-12 01:36:46', 35.1, 53, 84, 5.4),
(187, 'dev-001', '2025-01-29 23:23:19', 28.7, 58, 191.6, 6.4),
(188, 'dev-001', '2025-04-04 18:20:08', 34.7, 65, 125.9, 8.9),
(189, 'dev-001', '2025-04-20 01:10:42', 31.8, 54, 77.6, 3.3),
(190, 'dev-001', '2025-02-02 21:42:42', 28.4, 63, 158.5, 2.2),
(191, 'dev-001', '2025-04-20 01:10:42', 32.1, 74, 157.5, 7.3),
(192, 'dev-001', '2025-04-20 01:10:42', 32.4, 54, 57.2, 5),
(193, 'dev-001', '2025-04-20 01:10:42', 29.2, 62, 84.8, 5.8),
(194, 'dev-001', '2025-02-04 19:36:01', 29.5, 51, 135.8, 1.6),
(195, 'dev-001', '2025-02-05 19:36:47', 31.8, 79, 129, 8.7),
(196, 'dev-001', '2025-04-20 01:10:42', 31.5, 40, 64.4, 2),
(197, 'dev-001', '2025-02-19 10:17:59', 32.2, 61, 79.6, 4.3),
(198, 'dev-001', '2025-04-20 01:10:42', 35.4, 70, 89, 8.1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `sensor_weather_greenhouse`
--
ALTER TABLE `sensor_weather_greenhouse`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sensor_weather_station`
--
ALTER TABLE `sensor_weather_station`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `weather_greenhouse`
--
ALTER TABLE `weather_greenhouse`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `weather_station`
--
ALTER TABLE `weather_station`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `sensor_weather_greenhouse`
--
ALTER TABLE `sensor_weather_greenhouse`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sensor_weather_station`
--
ALTER TABLE `sensor_weather_station`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `weather_greenhouse`
--
ALTER TABLE `weather_greenhouse`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `weather_station`
--
ALTER TABLE `weather_station`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=199;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
