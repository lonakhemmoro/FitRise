CREATE DATABASE  IF NOT EXISTS `fitrise_v2` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `fitrise_v2`;
-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: localhost    Database: fitrise_v2
-- ------------------------------------------------------
-- Server version	8.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `active_refresh`
--

DROP TABLE IF EXISTS `active_refresh`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `active_refresh` (
  `userID` int NOT NULL,
  `token` varchar(1000) NOT NULL,
  `expiresAt` datetime NOT NULL,
  `sessionNum` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `active_refresh`
--

LOCK TABLES `active_refresh` WRITE;
/*!40000 ALTER TABLE `active_refresh` DISABLE KEYS */;
/*!40000 ALTER TABLE `active_refresh` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_activity`
--

DROP TABLE IF EXISTS `daily_activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_activity` (
  `userID` int NOT NULL,
  `goalTypeID` int NOT NULL,
  `goalID` int NOT NULL,
  `date` date NOT NULL,
  `value` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_activity`
--

LOCK TABLES `daily_activity` WRITE;
/*!40000 ALTER TABLE `daily_activity` DISABLE KEYS */;
INSERT INTO `daily_activity` VALUES (1,1,17,'2025-06-26',12),(1,1,17,'2025-06-27',13),(1,1,17,'2025-06-28',14),(1,3,18,'2025-07-10',23),(1,1,17,'2025-07-10',19),(1,2,19,'2025-07-10',40349),(10,1,28,'2025-07-22',12),(10,1,28,'2025-07-24',1),(10,1,28,'2025-07-25',2),(10,1,29,'2025-07-03',15),(10,1,29,'2025-07-04',16);
/*!40000 ALTER TABLE `daily_activity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `friend_requests`
--

DROP TABLE IF EXISTS `friend_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friend_requests` (
  `userID` int NOT NULL,
  `receiverID` int NOT NULL,
  KEY `userID_idx` (`userID`),
  KEY `recieverID_idx` (`receiverID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friend_requests`
--

LOCK TABLES `friend_requests` WRITE;
/*!40000 ALTER TABLE `friend_requests` DISABLE KEYS */;
INSERT INTO `friend_requests` VALUES (1,5),(3,4),(6,1);
/*!40000 ALTER TABLE `friend_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `friends`
--

DROP TABLE IF EXISTS `friends`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friends` (
  `userID` int NOT NULL,
  `friendID` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friends`
--

LOCK TABLES `friends` WRITE;
/*!40000 ALTER TABLE `friends` DISABLE KEYS */;
INSERT INTO `friends` VALUES (1,2),(3,1);
/*!40000 ALTER TABLE `friends` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goal_type`
--

DROP TABLE IF EXISTS `goal_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `goal_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goal_type`
--

LOCK TABLES `goal_type` WRITE;
/*!40000 ALTER TABLE `goal_type` DISABLE KEYS */;
INSERT INTO `goal_type` VALUES (1,'Water'),(2,'Sleep'),(3,'Step');
/*!40000 ALTER TABLE `goal_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goals`
--

DROP TABLE IF EXISTS `goals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `goals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `goalTypeID` int NOT NULL,
  `date` date NOT NULL,
  `value` int NOT NULL,
  `status` enum('Complete','Fail','Active') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goals`
--

LOCK TABLES `goals` WRITE;
/*!40000 ALTER TABLE `goals` DISABLE KEYS */;
INSERT INTO `goals` VALUES (15,1,1,'2025-06-12',400,'Complete'),(16,1,1,'2025-06-19',600,'Fail'),(17,1,1,'2025-06-26',450,'Active'),(18,1,3,'2025-07-08',777,'Active'),(19,1,2,'2025-07-08',2,'Active'),(28,10,1,'2025-07-22',100,'Active'),(29,10,1,'2025-07-01',900,'Fail');
/*!40000 ALTER TABLE `goals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `past_refresh`
--

DROP TABLE IF EXISTS `past_refresh`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `past_refresh` (
  `userID` int NOT NULL,
  `token` varchar(1000) NOT NULL,
  `sessionNum` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `past_refresh`
--

LOCK TABLES `past_refresh` WRITE;
/*!40000 ALTER TABLE `past_refresh` DISABLE KEYS */;
/*!40000 ALTER TABLE `past_refresh` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rewards`
--

DROP TABLE IF EXISTS `rewards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rewards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `description` varchar(100) DEFAULT NULL,
  `points` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rewards`
--

LOCK TABLES `rewards` WRITE;
/*!40000 ALTER TABLE `rewards` DISABLE KEYS */;
INSERT INTO `rewards` VALUES (1,'Bronze Badge',NULL,500),(2,'Silver Badge',NULL,1000),(3,'Gold Badge',NULL,2000),(4,'Premium Badge',NULL,5000);
/*!40000 ALTER TABLE `rewards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `streaks`
--

DROP TABLE IF EXISTS `streaks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `streaks` (
  `userID` int NOT NULL,
  `goalTypeID` int NOT NULL,
  `value` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `streaks`
--

LOCK TABLES `streaks` WRITE;
/*!40000 ALTER TABLE `streaks` DISABLE KEYS */;
INSERT INTO `streaks` VALUES (1,2,1),(1,1,0),(5,2,78);
/*!40000 ALTER TABLE `streaks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_rewards`
--

DROP TABLE IF EXISTS `user_rewards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_rewards` (
  `userID` int NOT NULL,
  `rewardID` int NOT NULL,
  `dateAwarded` date NOT NULL,
  KEY `rewardID_idx` (`rewardID`),
  CONSTRAINT `rewardID` FOREIGN KEY (`rewardID`) REFERENCES `rewards` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_rewards`
--

LOCK TABLES `user_rewards` WRITE;
/*!40000 ALTER TABLE `user_rewards` DISABLE KEYS */;
INSERT INTO `user_rewards` VALUES (1,1,'2025-07-01'),(1,2,'2025-07-02'),(1,3,'2025-07-09'),(1,4,'2025-07-09');
/*!40000 ALTER TABLE `user_rewards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL,
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `username` varchar(100) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `birthdate` date DEFAULT NULL,
  `gender` enum('M','F') CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL,
  `weight` float DEFAULT NULL COMMENT 'In pounds (lb)',
  `height` float DEFAULT NULL COMMENT 'In centimeters cause I think separate columns for feet and inch is stupid',
  `activityLevelID` int DEFAULT NULL,
  `extraPoints` int DEFAULT '0',
  `fName` varchar(100) DEFAULT NULL,
  `lName` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'a@gmail.com','?','appleB','2025-07-02','F',123,124,NULL,920,'Apple','Bottom'),(2,'b@gmail.com','5678','bananaG','2025-07-02','M',123,124,NULL,124,NULL,NULL),(3,'c@gmail.com','90','camp','2025-07-03','F',1234,456,NULL,0,NULL,NULL),(4,'d@aol.com','N','dang','2025-07-08','F',1,1,NULL,1,NULL,NULL),(5,'email',NULL,'ted',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,'a','v','c','2021-07-01','M',10,26,NULL,98,'d','e'),(7,'','','',NULL,'M',NULL,NULL,NULL,0,'','');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-10 20:13:28
