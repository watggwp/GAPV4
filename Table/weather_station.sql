-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 29, 2025 at 02:03 PM
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
  `device_id` varchar(50) DEFAULT NULL,
  `station_id` int(11) NOT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  `temperature` double DEFAULT NULL,
  `humidity` double DEFAULT NULL,
  `light` double DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `weather_station`
--

INSERT INTO `weather_station` (`id`, `device_id`, `station_id`, `timestamp`, `temperature`, `humidity`, `light`) VALUES
(1, 'weather-station-1', 2, '2025-03-24 00:40:00', 45, 70, 1000),
(2, 'hel-lora-32', 1, '2025-03-24 18:18:14', 32.24, 34.56, 969),
(3, 'hel-lora-32', 1, '2025-03-24 18:18:29', 26.92, 74.83, 866),
(4, 'hel-lora-32', 1, '2025-03-24 18:19:29', 25.11, 76.81, 395),
(5, 'hel-lora-32', 1, '2025-03-24 18:20:15', 30.63, 59.72, 174),
(6, 'hel-lora-32', 1, '2025-03-24 18:20:31', 25.87, 63.38, 609),
(7, 'hel-lora-32', 1, '2025-03-24 18:21:31', 21.61, 74.85, 639),
(8, 'hel-lora-32', 1, '2025-03-24 18:22:32', 30.09, 50.6, 683),
(9, 'hel-lora-32', 1, '2025-03-24 18:22:46', 34.54, 34.86, 267),
(10, 'hel-lora-32', 1, '2025-03-24 18:23:33', 26.55, 79.72, 466),
(11, 'hel-lora-32', 1, '2025-03-24 18:24:19', 20.18, 53.02, 7),
(12, 'hel-lora-32', 1, '2025-03-24 18:24:35', 32.14, 49.45, 541),
(13, 'hel-lora-32', 1, '2025-03-24 18:25:36', 25.67, 43.39, 544),
(14, 'hel-lora-32', 1, '2025-03-24 18:25:51', 24.7, 55.16, 509),
(15, 'hel-lora-32', 1, '2025-03-24 18:26:23', 23.84, 75.25, 715),
(16, 'hel-lora-32', 1, '2025-03-24 18:26:37', 20.57, 77.88, 881),
(17, 'hel-lora-32', 1, '2025-03-24 18:26:52', 29.4, 48.68, 263),
(18, 'hel-lora-32', 1, '2025-03-24 18:27:37', 21.76, 42.72, 331),
(19, 'hel-lora-32', 1, '2025-03-24 18:28:38', 30.43, 65.54, 519),
(20, 'hel-lora-32', 1, '2025-03-24 19:14:32', 29.94, 71.11, 744),
(21, 'hel-lora-32', 1, '2025-03-24 19:14:46', 32.97, 35.66, 818),
(22, 'hel-lora-32', 1, '2025-03-24 19:15:22', 21.6, 51.98, 607);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `weather_station`
--
ALTER TABLE `weather_station`
  ADD PRIMARY KEY (`id`),
  ADD KEY `station_id` (`station_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `weather_station`
--
ALTER TABLE `weather_station`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `weather_station`
--
ALTER TABLE `weather_station`
  ADD CONSTRAINT `weather_station_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `station_list` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
