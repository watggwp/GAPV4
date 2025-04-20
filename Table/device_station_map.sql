-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 20, 2025 at 12:14 PM
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
-- Table structure for table `device_station_map`
--

CREATE TABLE `device_station_map` (
  `id` int(11) DEFAULT NULL,
  `device_id` varchar(50) NOT NULL,
  `station_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `device_station_map`
--

INSERT INTO `device_station_map` (`id`, `device_id`, `station_id`) VALUES
(2, 'DEV002', 2),
(1, 'hel-lora-32', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `device_station_map`
--
ALTER TABLE `device_station_map`
  ADD PRIMARY KEY (`device_id`),
  ADD KEY `station_id` (`station_id`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `device_station_map`
--
ALTER TABLE `device_station_map`
  ADD CONSTRAINT `device_station_map_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `station_list` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
