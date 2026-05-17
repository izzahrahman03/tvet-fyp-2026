-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 17, 2026 at 08:39 PM
-- Server version: 8.0.30
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tvet`
--

-- --------------------------------------------------------

--
-- Table structure for table `applications`
--

CREATE TABLE `applications` (
  `application_id` int NOT NULL,
  `user_id` int NOT NULL,
  `ic_number` varchar(14) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female') DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `full_address` text,
  `postal_code` varchar(10) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `hear_about_us` varchar(60) DEFAULT NULL,
  `interview_slot_id` int DEFAULT NULL,
  `application_status` enum('draft','submitted','attended','absent','passed','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'draft',
  `applicant_response` enum('none','accepted','rejected','withdrawn') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'none',
  `remarks` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `applications`
--

INSERT INTO `applications` (`application_id`, `user_id`, `ic_number`, `date_of_birth`, `gender`, `phone`, `full_address`, `postal_code`, `state`, `hear_about_us`, `interview_slot_id`, `application_status`, `applicant_response`, `remarks`, `created_at`, `updated_at`) VALUES
(44, 193, '030913-14-1084', '2008-06-10', 'female', '018-9183253', 'test', '43000', 'Selangor', 'school_teacher', 16, 'passed', 'accepted', NULL, '2026-05-11 18:38:01', '2026-05-11 19:05:59'),
(45, 194, '030913-14-1084', '2026-05-01', 'female', '018-9183253', 'test', '43300', 'Perlis', 'friends_family', 16, 'passed', 'accepted', NULL, '2026-05-11 22:38:27', '2026-05-11 22:41:01'),
(48, 177, '080715-08-4321', '2008-07-15', 'male', '017-8821145', '45, Lorong Kenari 2, 14000 Bukit Mertajam, Pulau Pinang', '14000', 'Penang', 'social_tiktok', 18, 'failed', 'none', NULL, '2026-05-13 12:36:58', '2026-05-13 12:38:46'),
(49, 174, '040921-07-9812', '2004-09-21', 'female', '019-5562201', '88, Jalan Cempaka Indah, 14200 Sungai Jawi, Pulau Pinang', '14200', 'Penang', 'social_instagram', 16, 'submitted', 'none', NULL, '2026-05-13 12:40:27', '2026-05-13 12:40:27'),
(50, 175, '030630-09-6610', '2003-06-03', 'female', '016-7719043', '23, Persiaran Mutiara 1, 13700 Perai, Pulau Pinang', '13700', 'Penang', 'social_facebook', 16, 'absent', 'none', NULL, '2026-05-13 12:42:45', '2026-05-13 12:43:03'),
(51, 189, '030203-14-5678', '2003-02-03', 'female', '012-3456789', '12, Jalan Melur 3, 11900 Bayan Lepas, Pulau Pinang', '11900', 'Penang', 'friends_family', 16, 'passed', 'rejected', NULL, '2026-05-13 13:00:09', '2026-05-13 13:04:18'),
(52, 195, '020613-14-1081', '2002-06-13', 'male', '019-5562201', '23, Persiaran Mutiara 1, 13700 Perai, Pulau Pinang', '13700', 'Penang', 'school_teacher', 16, 'passed', 'accepted', NULL, '2026-05-13 13:11:23', '2026-05-13 13:12:50'),
(53, 196, '020401-08-2764', '2026-05-01', 'female', '018-9765426', '9, Jalan Seri Impian, 14100 Simpang Ampat, Pulau Pinang', '14100', 'Penang', 'social_facebook', 16, 'passed', 'accepted', NULL, '2026-05-13 13:21:51', '2026-05-13 13:22:46'),
(54, 178, '040921-07-8764', '2004-09-03', 'female', '019-5562201', '88, Jalan Cempaka Indah, 14200 Sungai Jawi, Pulau Pinang', '14200', 'Penang', 'social_instagram', 21, 'passed', 'accepted', NULL, '2026-05-13 13:48:36', '2026-05-13 16:45:09'),
(55, 179, '030913-14-1084', '2003-09-12', 'female', '018-9183253', 'No 39 Jalan PUJ 4/3, Taman Puncak Jalil', '43300', 'Selangor', 'friends_family', 21, 'passed', 'accepted', NULL, '2026-05-13 15:00:25', '2026-05-13 15:37:55'),
(56, 182, '030913-14-1084', '2003-09-13', 'female', '018-9183253', 'No 39 Jalan PUJ 4/5, Taman Bukit Jalil', '44330', 'Selangor', 'friends_family', 23, 'passed', 'accepted', NULL, '2026-05-14 17:06:29', '2026-05-16 23:29:47');

-- --------------------------------------------------------

--
-- Table structure for table `application_education`
--

CREATE TABLE `application_education` (
  `id` int NOT NULL,
  `application_id` int NOT NULL,
  `institute_name` varchar(255) NOT NULL,
  `qualification` varchar(100) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `application_education`
--

INSERT INTO `application_education` (`id`, `application_id`, `institute_name`, `qualification`, `start_date`, `end_date`) VALUES
(91, 44, 'test', 'SPM', '2026-05-01', '2026-05-09'),
(92, 45, 'test', 'UEC', '2026-05-01', '2026-05-08'),
(95, 48, 'SMK St.Xavire', 'SPM', '2023-06-13', '2025-06-13'),
(96, 49, 'SMK Sungai Ara', 'SPM', '2026-04-30', '2026-05-05'),
(97, 50, 'SMK Convent Green Lane', 'SPM', '2022-02-13', '2026-02-13'),
(98, 51, 'SMK Bukit Jambul', 'SPM', '2026-05-01', '2026-05-05'),
(99, 52, 'SMK Convent Green Lane', 'SPM', '2026-05-06', '2026-05-11'),
(100, 53, 'MRSM Tumpat', 'SPM', '2026-05-03', '2026-05-14'),
(103, 55, 'MRSM Gerik', 'SPM', '2016-02-08', '2026-05-04'),
(104, 54, 'SMK Sungai Ara', 'SPM', '2021-01-12', '2025-02-12'),
(105, 56, 'MRSM Gerik', 'SPM', '2016-02-09', '2019-02-05');

-- --------------------------------------------------------

--
-- Table structure for table `attendance_records`
--

CREATE TABLE `attendance_records` (
  `attendance_id` int NOT NULL,
  `student_id` int NOT NULL,
  `supervisor_id` int NOT NULL,
  `attendance_date` date NOT NULL,
  `clock_in` time NOT NULL,
  `clock_out` time DEFAULT NULL,
  `remarks` text,
  `status` enum('pending','present','absent') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `attendance_records`
--

INSERT INTO `attendance_records` (`attendance_id`, `student_id`, `supervisor_id`, `attendance_date`, `clock_in`, `clock_out`, `remarks`, `status`, `created_at`, `updated_at`) VALUES
(5, 30, 12, '2026-05-13', '05:24:09', '12:26:54', NULL, 'present', '2026-05-13 05:24:09', '2026-05-13 12:27:34'),
(6, 33, 12, '2026-05-13', '13:15:32', '13:19:33', NULL, 'present', '2026-05-13 13:15:33', '2026-05-13 13:19:57'),
(7, 35, 12, '2026-05-13', '15:44:14', '15:44:19', NULL, 'present', '2026-05-13 15:44:14', '2026-05-13 15:44:32'),
(8, 30, 12, '2026-05-14', '18:12:54', '18:12:58', NULL, 'pending', '2026-05-14 18:12:55', '2026-05-14 18:12:58'),
(9, 30, 12, '2026-05-15', '03:12:37', '13:46:26', NULL, 'pending', '2026-05-15 03:12:37', '2026-05-15 13:46:27');

-- --------------------------------------------------------

--
-- Table structure for table `industry_partners`
--

CREATE TABLE `industry_partners` (
  `partner_id` int NOT NULL,
  `user_id` int NOT NULL,
  `company_name` varchar(100) DEFAULT NULL,
  `industry_sector` varchar(100) DEFAULT NULL,
  `contact_person_phone` varchar(100) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `industry_partners`
--

INSERT INTO `industry_partners` (`partner_id`, `user_id`, `company_name`, `industry_sector`, `contact_person_phone`, `location`) VALUES
(40, 139, 'Keysight Industry', 'IT & Software', '018-9183253', 'Kuala Lumpur'),
(48, 169, 'Tech Solutions', 'IT', '018-9183253', 'Pulau Pinang'),
(51, 180, 'Nextlabs Sdn Bhd', 'IT', '018-1236789', 'KL'),
(52, 183, 'Vitrox Sdn Bhd', 'IT', '018-1236789', 'Penang'),
(53, 198, 'PBAPP', 'Water Management', '018-9183253', 'Pulau Pinang');

-- --------------------------------------------------------

--
-- Table structure for table `industry_supervisors`
--

CREATE TABLE `industry_supervisors` (
  `supervisor_id` int NOT NULL,
  `user_id` int NOT NULL,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `partner_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `industry_supervisors`
--

INSERT INTO `industry_supervisors` (`supervisor_id`, `user_id`, `phone`, `position`, `partner_id`) VALUES
(12, 149, '018-9183253', 'Manager', 40),
(15, 188, '018-9183253', 'Senior Engineer', 40),
(16, 192, '018-9183263', 'Manager', 51);

-- --------------------------------------------------------

--
-- Table structure for table `intakes`
--

CREATE TABLE `intakes` (
  `intake_id` int NOT NULL,
  `intake_name` varchar(100) NOT NULL,
  `max_capacity` int NOT NULL,
  `application_start_date` date DEFAULT NULL,
  `application_end_date` date DEFAULT NULL,
  `intake_start_date` date NOT NULL,
  `intake_end_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `intakes`
--

INSERT INTO `intakes` (`intake_id`, `intake_name`, `max_capacity`, `application_start_date`, `application_end_date`, `intake_start_date`, `intake_end_date`, `created_at`, `updated_at`) VALUES
(1, 'Intake 2026 Semester 1', 50, '2026-05-01', '2026-05-31', '2026-05-11', '2026-06-08', '2026-03-26 15:21:00', '2026-05-11 10:36:49'),
(2, 'Intake 2026 Semester 2', 50, '2026-05-23', '2026-06-23', '2026-06-24', '2026-12-24', '2026-03-26 15:21:00', '2026-05-12 16:06:59'),
(4, 'Intake 2025 Semester 2', 50, '2025-03-11', '2025-04-30', '2025-05-28', '2025-11-27', '2026-04-07 04:43:55', '2026-05-12 16:09:29'),
(7, 'Intake 2027 Semester 1', 50, '2026-11-01', '2026-12-05', '2026-12-31', '2027-05-31', '2026-04-09 05:57:01', '2026-05-12 16:07:28'),
(8, 'Intake 2027 Semester 2', 100, '2027-06-01', '2027-07-01', '2027-07-08', '2027-12-08', '2026-04-09 07:18:05', '2026-05-12 16:07:59'),
(12, 'Intake 2025 Semester 2', 50, '2028-01-12', '2028-01-30', '2028-02-12', '2028-06-30', '2026-05-13 07:27:39', '2026-05-14 08:22:12'),
(13, 'Intake 2028 Semester 2', 50, '2028-07-01', '2028-07-31', '2028-08-01', '2028-12-31', '2026-05-13 08:35:06', '2026-05-13 08:35:06'),
(14, 'Intake 2025 Semester 2', 2, '2026-05-01', '2026-05-06', '2026-05-24', '2026-05-30', '2026-05-14 08:22:50', '2026-05-14 08:22:50'),
(15, 'Intake 2025 Semester 1', 1, '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-14 08:29:32', '2026-05-14 08:29:32');

-- --------------------------------------------------------

--
-- Table structure for table `internship_applications`
--

CREATE TABLE `internship_applications` (
  `internship_application_id` int NOT NULL,
  `student_id` int NOT NULL,
  `partner_id` int NOT NULL,
  `vacancy_id` int NOT NULL,
  `internship_application_status` enum('pending','interview','passed','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending',
  `internship_applicant_response` enum('none','accepted','declined','withdrawn_requested','withdrawn') NOT NULL DEFAULT 'none',
  `resume_path` varchar(500) DEFAULT NULL,
  `cover_letter_path` varchar(500) DEFAULT NULL,
  `internship_application_date` date NOT NULL DEFAULT (curdate()),
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `supervisor_id` int DEFAULT NULL,
  `intern_status` enum('active','inactive','terminated') DEFAULT NULL,
  `intern_remarks` text,
  `intern_status_updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `internship_applications`
--

INSERT INTO `internship_applications` (`internship_application_id`, `student_id`, `partner_id`, `vacancy_id`, `internship_application_status`, `internship_applicant_response`, `resume_path`, `cover_letter_path`, `internship_application_date`, `created_at`, `updated_at`, `supervisor_id`, `intern_status`, `intern_remarks`, `intern_status_updated_at`) VALUES
(27, 30, 40, 9, 'passed', 'withdrawn', 'resume_193_1778498479758.pdf', NULL, '2026-05-11', '2026-05-11 19:21:19', '2026-05-14 17:43:02', 12, NULL, NULL, NULL),
(29, 33, 52, 13, 'pending', 'none', 'resume_195_1778649209185.pdf', 'cover_letter_195_1778649209205.pdf', '2026-05-13', '2026-05-13 13:13:29', '2026-05-13 13:13:29', NULL, NULL, NULL, NULL),
(30, 33, 40, 8, 'passed', 'accepted', 'resume_195_1778649236426.pdf', 'cover_letter_195_1778649236426.pdf', '2026-05-13', '2026-05-13 13:13:56', '2026-05-15 17:58:01', 12, 'active', NULL, '2026-05-15 17:57:51'),
(31, 34, 40, 9, 'passed', 'accepted', 'resume_196_1778649778509.pdf', NULL, '2026-05-13', '2026-05-13 13:22:58', '2026-05-15 17:51:59', 15, 'terminated', 'test', '2026-05-15 17:51:59'),
(32, 35, 40, 14, 'passed', 'withdrawn', 'resume_179_1778657997610.pdf', NULL, '2026-05-13', '2026-05-13 15:39:57', '2026-05-15 10:14:38', 12, NULL, NULL, NULL),
(33, 36, 40, 15, 'pending', 'none', 'resume_178_1778662146674.pdf', NULL, '2026-05-13', '2026-05-13 16:49:06', '2026-05-13 16:49:06', NULL, NULL, NULL, NULL),
(34, 36, 40, 14, 'passed', 'accepted', 'resume_178_1778662239727.pdf', NULL, '2026-05-13', '2026-05-13 16:50:39', '2026-05-15 17:58:01', 12, 'active', NULL, '2026-05-15 10:32:11'),
(35, 30, 40, 15, 'passed', 'accepted', 'resume_193_1778751593364.pdf', NULL, '2026-05-14', '2026-05-14 17:39:53', '2026-05-15 17:58:01', 12, 'active', NULL, '2026-05-15 10:32:11'),
(36, 37, 40, 15, 'pending', 'none', 'resume_182_1778946269508.pdf', NULL, '2026-05-16', '2026-05-16 23:44:29', '2026-05-16 23:44:29', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `internship_evaluations`
--

CREATE TABLE `internship_evaluations` (
  `evaluation_id` int NOT NULL,
  `internship_application_id` int NOT NULL,
  `supervisor_id` int NOT NULL,
  `comments` text,
  `recommend_pass` tinyint(1) NOT NULL DEFAULT '0',
  `recommend_excellence` tinyint(1) NOT NULL DEFAULT '0',
  `award_best_intern` tinyint(1) NOT NULL DEFAULT '0',
  `submission_confirmed` tinyint(1) NOT NULL DEFAULT '0',
  `po2_data_handling` char(1) DEFAULT NULL,
  `po2_dev_tools` char(1) DEFAULT NULL,
  `po2_debugging` char(1) DEFAULT NULL,
  `po3_issues` char(1) DEFAULT NULL,
  `po3_ideas` char(1) DEFAULT NULL,
  `po3_solutions` char(1) DEFAULT NULL,
  `po4_work_relationship` char(1) DEFAULT NULL,
  `po4_communication` char(1) DEFAULT NULL,
  `po5_attendance` char(1) DEFAULT NULL,
  `po5_time_management` char(1) DEFAULT NULL,
  `po5_teamwork` char(1) DEFAULT NULL,
  `po6_ethics` char(1) DEFAULT NULL,
  `po6_perseverance` char(1) DEFAULT NULL,
  `po6_independence` char(1) DEFAULT NULL,
  `po7_passion` char(1) DEFAULT NULL,
  `po9_coordination` char(1) DEFAULT NULL,
  `po9_responsibility` char(1) DEFAULT NULL,
  `po9_emotion` char(1) DEFAULT NULL,
  `po9_tolerance` char(1) DEFAULT NULL,
  `po9_decision` char(1) DEFAULT NULL,
  `p10_digital` char(1) DEFAULT NULL,
  `total_score` decimal(5,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `internship_evaluations`
--

INSERT INTO `internship_evaluations` (`evaluation_id`, `internship_application_id`, `supervisor_id`, `comments`, `recommend_pass`, `recommend_excellence`, `award_best_intern`, `submission_confirmed`, `po2_data_handling`, `po2_dev_tools`, `po2_debugging`, `po3_issues`, `po3_ideas`, `po3_solutions`, `po4_work_relationship`, `po4_communication`, `po5_attendance`, `po5_time_management`, `po5_teamwork`, `po6_ethics`, `po6_perseverance`, `po6_independence`, `po7_passion`, `po9_coordination`, `po9_responsibility`, `po9_emotion`, `po9_tolerance`, `po9_decision`, `p10_digital`, `total_score`, `created_at`, `updated_at`) VALUES
(10, 27, 12, '', 1, 1, 1, 1, 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 100.00, '2026-05-12 21:10:12', '2026-05-12 21:10:12'),
(11, 32, 12, '', 1, 1, 0, 1, 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 100.00, '2026-05-13 07:43:39', '2026-05-13 07:43:39'),
(12, 35, 12, '', 1, 1, 1, 1, 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'B', 'A', 'A', 'B', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 98.00, '2026-05-15 04:31:56', '2026-05-16 16:14:06');

-- --------------------------------------------------------

--
-- Table structure for table `internship_interviews`
--

CREATE TABLE `internship_interviews` (
  `interview_id` int NOT NULL,
  `internship_application_id` int NOT NULL,
  `interview_datetime` datetime NOT NULL,
  `interview_location` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `internship_interviews`
--

INSERT INTO `internship_interviews` (`interview_id`, `internship_application_id`, `interview_datetime`, `interview_location`, `created_at`, `updated_at`) VALUES
(10, 27, '2026-05-16 19:21:00', 'test', '2026-05-11 19:21:53', '2026-05-11 19:21:53'),
(12, 30, '2026-05-13 16:16:00', 'test', '2026-05-13 13:14:28', '2026-05-13 13:14:28'),
(13, 31, '2026-05-30 13:28:00', 'test', '2026-05-13 13:23:41', '2026-05-13 13:23:41'),
(14, 32, '2026-05-14 15:41:00', 'meeting room', '2026-05-13 15:41:15', '2026-05-13 15:41:15'),
(15, 34, '2026-05-27 09:51:00', 'meeting room', '2026-05-13 16:51:50', '2026-05-13 16:51:50'),
(16, 35, '2026-05-30 17:43:00', 'test', '2026-05-14 17:43:13', '2026-05-14 17:43:13');

-- --------------------------------------------------------

--
-- Table structure for table `internship_terminations`
--

CREATE TABLE `internship_terminations` (
  `termination_id` int NOT NULL,
  `internship_application_id` int NOT NULL,
  `supervisor_id` int NOT NULL,
  `reason` varchar(100) NOT NULL,
  `details` text NOT NULL,
  `last_working_date` date NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `admin_remarks` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `internship_terminations`
--

INSERT INTO `internship_terminations` (`termination_id`, `internship_application_id`, `supervisor_id`, `reason`, `details`, `last_working_date`, `status`, `admin_remarks`, `created_at`, `updated_at`) VALUES
(2, 31, 12, 'Performance issues', 'test', '2026-05-29', 'approved', NULL, '2026-05-13 05:35:21', '2026-05-13 05:36:55'),
(3, 32, 12, 'Performance issues', 'always complete work later than due date', '2026-05-30', 'approved', NULL, '2026-05-13 07:46:50', '2026-05-13 07:47:12');

-- --------------------------------------------------------

--
-- Table structure for table `interviewers`
--

CREATE TABLE `interviewers` (
  `interviewer_id` int NOT NULL,
  `user_id` int NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `interviewers`
--

INSERT INTO `interviewers` (`interviewer_id`, `user_id`, `phone`, `created_at`, `updated_at`) VALUES
(1, 184, '018-9183253', '2026-05-15 18:36:47', '2026-05-15 18:36:58'),
(2, 190, '018-9183253', '2026-05-15 18:36:47', '2026-05-15 18:37:02');

-- --------------------------------------------------------

--
-- Table structure for table `interview_evaluations`
--

CREATE TABLE `interview_evaluations` (
  `evaluation_id` int NOT NULL,
  `application_id` int NOT NULL,
  `interviewer_id` int DEFAULT NULL,
  `a1_score` tinyint DEFAULT NULL COMMENT 'Clarity of Expression (1-5)',
  `a2_score` tinyint DEFAULT NULL COMMENT 'Listening Skills (1-5)',
  `a3_score` tinyint DEFAULT NULL COMMENT 'Confidence & Delivery (1-5)',
  `b1_score` tinyint DEFAULT NULL COMMENT 'Domain / Subject Knowledge (1-5)',
  `b2_score` tinyint DEFAULT NULL COMMENT 'Problem-Solving Ability (1-5)',
  `b3_score` tinyint DEFAULT NULL COMMENT 'Analytical Thinking (1-5)',
  `c1_score` tinyint DEFAULT NULL COMMENT 'Attitude & Motivation (1-5)',
  `c2_score` tinyint DEFAULT NULL COMMENT 'Teamwork & Collaboration (1-5)',
  `c3_score` tinyint DEFAULT NULL COMMENT 'Initiative & Creativity (1-5)',
  `d1_score` tinyint DEFAULT NULL COMMENT 'Professionalism (1-5)',
  `d2_score` tinyint DEFAULT NULL COMMENT 'Suitability for Programme (1-5)',
  `d3_score` tinyint DEFAULT NULL COMMENT 'Overall Recommendation (1-5)',
  `total_score` decimal(5,2) DEFAULT NULL COMMENT 'Calculated: (sum / 60) * 100',
  `remarks` text,
  `verdict` enum('pass','fail') DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `interview_evaluations`
--

INSERT INTO `interview_evaluations` (`evaluation_id`, `application_id`, `interviewer_id`, `a1_score`, `a2_score`, `a3_score`, `b1_score`, `b2_score`, `b3_score`, `c1_score`, `c2_score`, `c3_score`, `d1_score`, `d2_score`, `d3_score`, `total_score`, `remarks`, `verdict`, `created_at`, `updated_at`) VALUES
(4, 44, 2, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 100.00, 'Good', NULL, '2026-05-11 18:51:27', '2026-05-15 18:43:11'),
(5, 45, 2, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 100.00, NULL, NULL, '2026-05-11 22:39:23', '2026-05-15 18:43:11'),
(6, 45, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 20.00, NULL, NULL, '2026-05-11 22:40:01', '2026-05-15 18:43:11'),
(7, 48, 2, 2, 2, 4, 3, 2, 5, 2, 1, 1, 2, 2, 3, 48.33, 'moderate ', NULL, '2026-05-13 12:38:06', '2026-05-15 18:43:11'),
(8, 51, 2, 3, 3, 3, 4, 4, 4, 2, 2, 2, 4, 4, 4, 65.00, NULL, NULL, '2026-05-13 13:01:05', '2026-05-15 18:43:11'),
(9, 51, 1, 5, 5, 5, 4, 4, 4, 5, 4, 4, 4, 3, 3, 83.33, NULL, NULL, '2026-05-13 13:01:49', '2026-05-15 18:43:11'),
(10, 52, 2, 5, 3, 3, 4, 4, 4, 4, 3, 4, 4, 5, 4, 78.33, NULL, NULL, '2026-05-13 13:12:12', '2026-05-15 18:43:11'),
(11, 53, 2, 4, 4, 5, 4, 4, 5, 5, 4, 4, 5, 4, 4, 86.67, NULL, NULL, '2026-05-13 13:22:21', '2026-05-15 18:43:11'),
(12, 55, 2, 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 90.00, NULL, NULL, '2026-05-13 15:37:02', '2026-05-15 18:43:11'),
(13, 54, 2, 5, 5, 5, 5, 5, 5, 4, 4, 4, 3, 3, 3, 85.00, NULL, NULL, '2026-05-13 16:44:10', '2026-05-15 18:43:11'),
(14, 56, 2, 5, 5, 5, 4, 4, 4, 3, 3, 3, 5, 5, 5, 85.00, NULL, NULL, '2026-05-16 23:09:44', '2026-05-16 23:09:44');

-- --------------------------------------------------------

--
-- Table structure for table `interview_slots`
--

CREATE TABLE `interview_slots` (
  `slot_id` int NOT NULL,
  `slot_datetime` datetime NOT NULL,
  `capacity` int NOT NULL DEFAULT '10',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `interview_slots`
--

INSERT INTO `interview_slots` (`slot_id`, `slot_datetime`, `capacity`, `created_at`, `updated_at`) VALUES
(5, '2026-04-13 09:00:00', 10, '2026-04-04 01:07:42', '2026-04-04 01:07:42'),
(7, '2026-04-14 23:25:00', 10, '2026-04-06 15:25:39', '2026-04-06 15:25:39'),
(10, '2026-04-20 14:36:00', 10, '2026-04-07 06:36:24', '2026-04-07 06:36:24'),
(12, '2026-04-22 13:55:00', 10, '2026-04-09 04:54:20', '2026-04-09 04:54:20'),
(13, '2026-04-10 14:30:00', 1, '2026-04-09 05:27:58', '2026-04-09 05:27:58'),
(14, '2026-04-29 13:00:00', 10, '2026-04-09 05:58:07', '2026-04-09 05:58:07'),
(15, '2026-04-29 01:38:00', 10, '2026-04-20 17:39:01', '2026-04-20 17:39:01'),
(16, '2026-06-20 02:18:00', 11, '2026-04-20 18:18:59', '2026-04-20 18:19:22'),
(17, '2026-05-22 10:53:00', 10, '2026-05-05 02:53:53', '2026-05-05 02:53:53'),
(18, '2026-05-27 11:23:00', 10, '2026-05-05 03:23:19', '2026-05-05 03:23:19'),
(19, '2026-05-19 10:11:00', 10, '2026-05-07 02:11:34', '2026-05-07 02:11:34'),
(20, '2026-05-17 15:27:00', 10, '2026-05-13 07:28:18', '2026-05-13 07:28:18'),
(21, '2026-05-31 15:28:00', 10, '2026-05-13 07:28:51', '2026-05-13 07:28:51'),
(22, '2026-06-30 15:31:00', 10, '2026-05-13 07:31:36', '2026-05-13 07:31:36'),
(23, '2026-05-18 16:36:00', 11, '2026-05-13 08:36:17', '2026-05-13 08:38:51'),
(24, '2026-05-17 15:27:00', 11, '2026-05-14 08:55:21', '2026-05-14 08:55:21');

-- --------------------------------------------------------

--
-- Table structure for table `interview_slot_interviewers`
--

CREATE TABLE `interview_slot_interviewers` (
  `slot_id` int NOT NULL,
  `user_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `interview_slot_interviewers`
--

INSERT INTO `interview_slot_interviewers` (`slot_id`, `user_id`) VALUES
(16, 184),
(17, 184),
(19, 184),
(20, 184),
(21, 184),
(22, 184),
(23, 184),
(24, 184),
(16, 190),
(18, 190),
(19, 190),
(20, 190),
(21, 190),
(23, 190),
(24, 190);

-- --------------------------------------------------------

--
-- Table structure for table `leave_requests`
--

CREATE TABLE `leave_requests` (
  `leave_id` int NOT NULL,
  `student_id` int NOT NULL,
  `supervisor_id` int NOT NULL,
  `duration_type` enum('full_day','half_day') NOT NULL DEFAULT 'full_day',
  `leave_type` enum('annual','medical','unpaid') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `session` enum('AM','PM') DEFAULT NULL,
  `reason` text NOT NULL,
  `document_path` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `supervisor_remarks` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `leave_requests`
--

INSERT INTO `leave_requests` (`leave_id`, `student_id`, `supervisor_id`, `duration_type`, `leave_type`, `start_date`, `end_date`, `session`, `reason`, `document_path`, `status`, `supervisor_remarks`, `created_at`, `updated_at`) VALUES
(3, 30, 12, 'full_day', 'annual', '2026-05-14', '2026-05-15', NULL, 'test', NULL, 'approved', NULL, '2026-05-13 06:03:34', '2026-05-13 06:04:13'),
(4, 30, 12, 'half_day', 'medical', '2026-05-16', '2026-05-16', 'PM', 'test', 'leave_193_1778624160627.pdf', 'rejected', 'not valid', '2026-05-13 06:16:00', '2026-05-13 06:28:15'),
(5, 33, 12, 'full_day', 'annual', '2026-05-18', '2026-05-19', NULL, 'test', 'leave_195_1778649358681.pdf', 'approved', NULL, '2026-05-13 13:15:58', '2026-05-13 13:18:16'),
(6, 33, 12, 'half_day', 'unpaid', '2026-05-15', '2026-05-15', 'AM', 'test', NULL, 'approved', NULL, '2026-05-13 13:16:16', '2026-05-13 13:18:10'),
(7, 35, 12, 'full_day', 'annual', '2026-05-15', '2026-05-16', NULL, 'personal matter', 'leave_179_1778658312419.pdf', 'approved', NULL, '2026-05-13 15:45:12', '2026-05-13 15:45:30');

-- --------------------------------------------------------

--
-- Table structure for table `managers`
--

CREATE TABLE `managers` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `phone` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `managers`
--

INSERT INTO `managers` (`id`, `user_id`, `created_at`, `updated_at`, `phone`) VALUES
(2, 151, '2026-04-07 12:30:33', '2026-04-09 01:34:23', '018-9183253'),
(3, 152, '2026-04-07 12:31:56', '2026-04-09 01:34:14', '018-9183253');

-- --------------------------------------------------------

--
-- Table structure for table `overtime_requests`
--

CREATE TABLE `overtime_requests` (
  `overtime_id` int NOT NULL,
  `student_id` int NOT NULL,
  `supervisor_id` int NOT NULL,
  `overtime_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `supervisor_remarks` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `overtime_requests`
--

INSERT INTO `overtime_requests` (`overtime_id`, `student_id`, `supervisor_id`, `overtime_date`, `start_time`, `end_time`, `reason`, `status`, `supervisor_remarks`, `created_at`, `updated_at`) VALUES
(2, 30, 12, '2026-05-12', '05:25:00', '11:30:00', 'test', 'approved', NULL, '2026-05-13 05:26:04', '2026-05-13 05:27:33'),
(3, 33, 12, '2026-05-13', '16:17:00', '20:17:00', 'need to complete task', 'approved', NULL, '2026-05-13 13:17:44', '2026-05-13 13:18:21'),
(4, 35, 12, '2026-05-13', '18:47:00', '20:50:00', 'need to complete task', 'approved', NULL, '2026-05-13 15:45:58', '2026-05-13 15:46:08');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `student_id` int NOT NULL,
  `user_id` int NOT NULL,
  `application_id` int NOT NULL,
  `intake_id` int DEFAULT NULL,
  `matric_number` varchar(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `phone` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`student_id`, `user_id`, `application_id`, `intake_id`, `matric_number`, `created_at`, `updated_at`, `phone`) VALUES
(30, 193, 44, 1, 'STU-2026-00011', '2026-05-11 11:05:59', '2026-05-11 11:05:59', NULL),
(31, 194, 45, 1, 'STU-2026-00012', '2026-05-11 14:41:01', '2026-05-11 14:41:01', NULL),
(33, 195, 52, 1, 'STU-2026-00013', '2026-05-13 05:12:50', '2026-05-13 05:12:50', NULL),
(34, 196, 53, 1, 'STU-2026-00014', '2026-05-13 05:22:46', '2026-05-13 05:22:46', NULL),
(35, 179, 55, 1, 'STU-2026-00015', '2026-05-13 07:37:55', '2026-05-13 07:37:55', NULL),
(36, 178, 54, 1, 'STU-2026-00016', '2026-05-13 08:45:09', '2026-05-13 08:45:09', NULL),
(37, 182, 56, 1, 'STU-2026-00017', '2026-05-16 15:29:47', '2026-05-16 15:29:47', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('admin','applicant','student','industry_partner','industry_supervisor','manager','interviewer') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'applicant',
  `active_status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'active',
  `activation_token` varchar(64) DEFAULT NULL,
  `token_expires_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `name`, `email`, `password`, `role`, `active_status`, `activation_token`, `token_expires_at`, `created_at`, `last_login`) VALUES
(1, 'Admin', 'admin@gmail.com', '$2b$08$cEf2aRRMeCKGo9VOQApUY.c/TtmRc7qOAjf3kpDynMVurKzL/dA36', 'admin', 'active', NULL, NULL, '2026-03-18 00:26:14', '2026-05-17 01:38:21'),
(139, 'Siti Nur Izzah binti Abdul Rahman', 'izzxhrhmn03@gmail.com', '$2b$08$e0fLWf.yuUy9y0i2Z1sYoOMaUqeI.F9HFRfkgkOudAQBehODntDJC', 'industry_partner', 'active', 'bdd125aaa88c1aec0fdcc3da45b90ece864b45f6dd20dda226510e4b521fb53a', '2026-05-16 23:27:19', '2026-04-02 18:04:52', '2026-05-17 00:58:43'),
(149, 'Izzah', 'izzxhrhmn@gmail.com', '$2b$08$16p//nFsIxfhIM6gKDo.eekCWgGvhKvNKzKBI4Xw8NaXd4ZCIVu1C', 'industry_supervisor', 'active', NULL, NULL, '2026-04-06 22:50:34', '2026-05-17 00:58:38'),
(151, 'Siti Nur Izzah binti Abdul Rahman', 'izzxhrhmn03333@gmail.com', '$2b$08$2HdxiAnD7KsXuzAUYWfdIO6VXKI13dYo/kBctc.jJr89.c.afHdCS', 'manager', 'active', NULL, NULL, '2026-04-07 12:30:33', '2026-04-21 01:59:45'),
(152, 'Siti Nur Izzah binti Abdul Rahman', 'izzxhrhmn033333333@gmail.com', '$2b$08$DDIyAlvLv123s1zRalSabeOpoWjzOKpyMSLINglG2uYBuz3bMj8gm', 'manager', 'active', NULL, NULL, '2026-04-07 12:31:56', '2026-05-03 21:24:14'),
(169, 'Hemah Rao', 'hemahtest@gmail.com', '$2b$10$P.4gWn65bsAEzdLbt6FblOvTqX9Dzaosu0IS5eoqE9ni2QeFaALuy', 'industry_partner', 'inactive', 'cb974864de9507276e824f8b6beb20f65f0b3d3884ee2269f39809ad5edbb24d', '2026-04-10 01:26:27', '2026-04-09 01:26:26', '2026-04-09 01:26:26'),
(174, 'Alya Nadhirah binti Muhd', 'alyanadhirahtest@gmail.com', '$2b$08$kQ8fqU5RphktHMJdY/5KeuYuzc5D6/AVuNK8ZNy5nUcevddutGbde', 'applicant', 'active', NULL, NULL, '2026-04-09 13:30:26', '2026-05-13 12:39:08'),
(175, 'Asilah Zarifah binti Yusof', 'asilahtest01@gmail.com', '$2b$08$e1JK7BOegWXhMVJaMO/Z1.1UglG8/YxYayn5DPiP7HSIzMEfDQWr2', 'applicant', 'active', NULL, NULL, '2026-04-09 13:32:38', '2026-05-13 12:41:13'),
(177, 'Ahmad Hamizan bin Rosli', 'hamizantest@gmail.com', '$2b$08$0kcylHxXaHv559bmhfHOsOYhRR.NasgUuRkgT7YqGcKAurgESi572', 'applicant', 'active', NULL, NULL, '2026-04-09 13:39:44', '2026-05-16 23:02:46'),
(178, 'Nurin Hanani binti Yusof', 'nurinhananitest@gmail.com', '$2b$08$3k.x/V/lEkWYeYqqMNA9uutqOpfE5rgZcg1nFG8nFiJjgq.0D5/x6', 'student', 'active', NULL, NULL, '2026-04-09 13:44:45', '2026-05-13 16:41:23'),
(179, 'Siti Nur Izzah binti Abdul Rahman', 'izzahrahman@student.usm.my', '$2b$08$vTZOya07NEXCL0ciomrzJOwOajJosZ/yMU7pIWit15So5APEgYv7O', 'student', 'active', NULL, NULL, '2026-04-09 13:51:31', '2026-05-13 16:19:17'),
(180, 'Che Tom binti Ahmad', 'sabrichetom@gmail.com', '$2b$08$bbdthsYsdwyFQOjisJMJi.Qjm5Q2LOSVUAbt17ISdMjcZ9/dpuUSS', 'industry_partner', 'active', NULL, NULL, '2026-04-09 13:52:27', '2026-04-09 13:55:43'),
(182, 'Siti Nur Izzah binti Abdul Rahman', 'izzxhrhmn031@gmail.com', '$2b$08$O1.Hap8euGuNYpOOrCMVgOFrnqNgVXOxI625pAUUibh1lYh99QtDm', 'student', 'active', NULL, NULL, '2026-04-09 15:10:04', '2026-05-16 23:52:24'),
(183, 'Che Tom binti Ahmad', 'sabrichetom1@gmail.com', '$2b$08$OVDI/dCuUGLIwVlU7PzPzevzmff.cVsWTsbYcDKt7.qZnlzL2STRq', 'industry_partner', 'active', NULL, NULL, '2026-04-09 15:11:01', '2026-05-11 12:59:08'),
(184, 'Ahmad', 'test1ahmad@gmail.com', '$2b$08$jM6WDZxxBZbkioFkNBZ7qOq7Jri6IQbkvSzd5ZGVD2wr/2OoDGlGG', 'interviewer', 'active', NULL, NULL, '2026-04-21 01:17:30', '2026-05-13 13:01:36'),
(188, 'test', 'testizzah@gmail.com', '$2b$08$XqrsbhsnZ.EJPzSaCTL/ke7rivVz..FFKr9hTJs8miMBIhLXyo7h2', 'industry_supervisor', 'active', NULL, NULL, '2026-05-04 01:17:08', '2026-05-13 00:51:51'),
(189, 'Munirah', 'munirahtest001@gmail.com', '$2b$08$y7M6GhVYPgrZmYgyDQL5l..sgj/DpTlyct5FLdvqWmzHHpvPiUB8O', 'applicant', 'active', NULL, NULL, '2026-05-05 11:14:22', '2026-05-13 13:02:18'),
(190, 'Anisah Jamin', 'anisahjamintest001@gmail.com', '$2b$08$nSJRcBID1rY0RLRf6C2nxO/qx4P.Xaez383acsI7BSVABXZNUP9MS', 'interviewer', 'active', NULL, NULL, '2026-05-05 11:19:31', '2026-05-16 23:09:06'),
(192, 'sabrina', 'sabrinaramlitest001@gmail.com', '$2b$10$QvhtlQO9zZoqAOQlrcTyi.iSed5AcQ5SLX3z22UAhV3iwLUAZJ0WW', 'industry_supervisor', 'inactive', '4313f84d66e94055fc4175f45f1b3b0364e6f5b6720e6082be315423a6499081', '2026-05-08 10:33:07', '2026-05-07 10:33:07', '2026-05-07 10:33:07'),
(193, 'Fatin Aqilah binti Mohd', 'fatinaqilahtest001@gmail.com', '$2b$08$GGoQ90mlRviqiFT/gf34Muhvr.3e.dbwBXe9hIqm68NDgszwjqyFu', 'student', 'active', NULL, NULL, '2026-05-11 16:17:05', '2026-05-17 00:51:17'),
(194, 'Diana bin Yusof', 'dianatest001@gmail.com', '$2b$08$Cgl/vjeFSqH5R8WfZ9p3wOBQrQNHMW8sxFKLFJDlMpMkjA2S/bF4e', 'student', 'active', NULL, NULL, '2026-05-11 22:37:37', '2026-05-14 18:14:59'),
(195, 'Lim Jia Liang', 'limtest001@gmail.com', '$2b$08$qzzZfyltLDhmeMylNzlNJO2EIlDqeSUAx1JkSPYY7lj7D6/SVxLES', 'student', 'active', NULL, NULL, '2026-05-13 13:09:33', '2026-05-13 13:19:31'),
(196, 'Tharsni A/P Letchumanan', 'tharsnitest001@gmail.com', '$2b$08$8PfmUf3c9Ay3P2UVTPwoAujXsHT6GkfCw6yhjc8NSdf6hDbAcV3Eu', 'student', 'active', NULL, NULL, '2026-05-13 13:20:42', '2026-05-13 13:24:15'),
(197, 'Isma Nor Idayu binti Ismail', 'ismatest001@gmail.com', '$2b$08$FtzNpDN1FunmZo6QRGd9UuBznOE6PMvGUfzCH8mIe1FFeakq2IIlu', 'applicant', 'active', NULL, NULL, '2026-05-13 13:50:00', '2026-05-13 16:32:19'),
(198, 'Azwa Syafiqah binti Mohd', 'azwatest001@gmail.com', '$2b$10$hda4lDrT849t0enPLn3o1ev9lIeyHOH2LRrc9UZi0zaTRb5jk.wV2', 'industry_partner', 'inactive', '8abdd3829492c0990ab21be5f597ad2a886d42d89fa44749b62499e4199a22e7', '2026-05-17 22:24:43', '2026-05-16 22:24:42', '2026-05-16 22:24:42');

-- --------------------------------------------------------

--
-- Table structure for table `vacancies`
--

CREATE TABLE `vacancies` (
  `vacancy_id` int NOT NULL,
  `partner_id` int NOT NULL,
  `position_name` varchar(255) NOT NULL,
  `capacity` int NOT NULL DEFAULT '1',
  `description` text,
  `responsibilities` text,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'open',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `vacancies`
--

INSERT INTO `vacancies` (`vacancy_id`, `partner_id`, `position_name`, `capacity`, `description`, `responsibilities`, `start_date`, `end_date`, `status`, `created_at`, `updated_at`) VALUES
(4, 40, 'Software Engineer Intern', 10, 'Assists in designing, developing, testing, and maintaining software applications under supervision.', 'Write, test, and debug code\nAssist in developing new features or modules\nFix bugs and improve system performance\nParticipate in code reviews', '2026-04-17', '2026-09-18', 'open', '2026-04-06 15:38:45', '2026-04-09 01:38:52'),
(5, 40, 'Machine Learning Intern', 4, 'Supports the development and implementation of machine learning models and data-driven solutions.', 'Assist in data preprocessing and cleaning\nBuild and test basic machine learning models\nEvaluate model performance', '2026-04-02', '2026-04-23', 'closed', '2026-04-06 15:39:21', '2026-05-13 00:46:01'),
(7, 40, 'Cybersecurity Intern', 9, 'Supports the organization in protecting systems, networks, and data from cyber threats by assisting in monitoring, analysis, and security implementation.', 'Assist in monitoring network traffic and security alerts\nIdentify and report potential vulnerabilities or threats\nSupport security audits and risk assessments', '2026-04-09', '2026-04-28', 'open', '2026-04-06 16:08:24', '2026-05-06 17:27:12'),
(8, 40, 'Data Analyst Intern', 3, 'Assists in collecting, processing, and analyzing data to support business decision-making and reporting.', 'Collect and clean data from various sources\nAnalyze datasets to identify trends and insights\nGenerate reports and dashboards', '2026-03-29', '2026-04-27', 'open', '2026-04-08 09:55:43', '2026-05-13 13:15:02'),
(9, 40, 'IT Intern', 7, 'Provides general technical support and assists in maintaining the organization’s IT infrastructure and systems.', 'Assist in troubleshooting hardware and software issues\nSupport system installation and configuration\nMaintain IT equipment and inventory', '2026-04-13', '2026-10-13', 'open', '2026-04-08 10:42:07', '2026-05-14 17:43:02'),
(13, 52, 'Software Engineer Intern', 3, 'test', 'test', '2026-05-09', '2026-09-09', 'open', '2026-04-09 15:42:16', '2026-05-07 10:34:10'),
(14, 40, 'Software Engineering Intern', 3, NULL, NULL, '2026-05-24', '2026-09-24', 'open', '2026-05-13 15:39:18', '2026-05-13 16:52:49'),
(15, 40, 'Mechanical Engineer Intern', 3, NULL, NULL, '2026-05-20', '2026-10-21', 'open', '2026-05-13 16:48:24', '2026-05-14 17:54:21');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`application_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `fk_app_slot` (`interview_slot_id`);

--
-- Indexes for table `application_education`
--
ALTER TABLE `application_education`
  ADD PRIMARY KEY (`id`),
  ADD KEY `application_id` (`application_id`);

--
-- Indexes for table `attendance_records`
--
ALTER TABLE `attendance_records`
  ADD PRIMARY KEY (`attendance_id`),
  ADD UNIQUE KEY `uq_student_date` (`student_id`,`attendance_date`),
  ADD KEY `fk_att_supervisor` (`supervisor_id`);

--
-- Indexes for table `industry_partners`
--
ALTER TABLE `industry_partners`
  ADD PRIMARY KEY (`partner_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `industry_supervisors`
--
ALTER TABLE `industry_supervisors`
  ADD PRIMARY KEY (`supervisor_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `partner_id` (`partner_id`);

--
-- Indexes for table `intakes`
--
ALTER TABLE `intakes`
  ADD PRIMARY KEY (`intake_id`);

--
-- Indexes for table `internship_applications`
--
ALTER TABLE `internship_applications`
  ADD PRIMARY KEY (`internship_application_id`),
  ADD UNIQUE KEY `uq_student_vacancy` (`student_id`,`vacancy_id`),
  ADD KEY `idx_ia_student` (`student_id`),
  ADD KEY `idx_ia_vacancy` (`vacancy_id`),
  ADD KEY `idx_ia_partner` (`partner_id`),
  ADD KEY `idx_ia_status` (`internship_application_status`),
  ADD KEY `fk_app_supervisor` (`supervisor_id`);

--
-- Indexes for table `internship_evaluations`
--
ALTER TABLE `internship_evaluations`
  ADD PRIMARY KEY (`evaluation_id`),
  ADD UNIQUE KEY `internship_application_id` (`internship_application_id`),
  ADD KEY `fk_eval_supervisor` (`supervisor_id`);

--
-- Indexes for table `internship_interviews`
--
ALTER TABLE `internship_interviews`
  ADD PRIMARY KEY (`interview_id`),
  ADD UNIQUE KEY `uq_one_interview_per_application` (`internship_application_id`);

--
-- Indexes for table `internship_terminations`
--
ALTER TABLE `internship_terminations`
  ADD PRIMARY KEY (`termination_id`),
  ADD UNIQUE KEY `uq_active_termination` (`internship_application_id`),
  ADD KEY `fk_term_supervisor` (`supervisor_id`);

--
-- Indexes for table `interviewers`
--
ALTER TABLE `interviewers`
  ADD PRIMARY KEY (`interviewer_id`),
  ADD UNIQUE KEY `uq_interviewers_user` (`user_id`);

--
-- Indexes for table `interview_evaluations`
--
ALTER TABLE `interview_evaluations`
  ADD PRIMARY KEY (`evaluation_id`),
  ADD UNIQUE KEY `uq_app_interviewer_profile` (`application_id`,`interviewer_id`),
  ADD KEY `fk_ie_interviewer_profile` (`interviewer_id`);

--
-- Indexes for table `interview_slots`
--
ALTER TABLE `interview_slots`
  ADD PRIMARY KEY (`slot_id`);

--
-- Indexes for table `interview_slot_interviewers`
--
ALTER TABLE `interview_slot_interviewers`
  ADD PRIMARY KEY (`slot_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD PRIMARY KEY (`leave_id`),
  ADD KEY `fk_leave_student` (`student_id`),
  ADD KEY `fk_leave_supervisor` (`supervisor_id`);

--
-- Indexes for table `managers`
--
ALTER TABLE `managers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_managers_user` (`user_id`);

--
-- Indexes for table `overtime_requests`
--
ALTER TABLE `overtime_requests`
  ADD PRIMARY KEY (`overtime_id`),
  ADD KEY `fk_ot_student` (`student_id`),
  ADD KEY `fk_ot_supervisor` (`supervisor_id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`student_id`),
  ADD UNIQUE KEY `matric_number` (`matric_number`),
  ADD KEY `fk_student_user` (`user_id`),
  ADD KEY `fk_student_application` (`application_id`),
  ADD KEY `fk_student_intake` (`intake_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `vacancies`
--
ALTER TABLE `vacancies`
  ADD PRIMARY KEY (`vacancy_id`),
  ADD KEY `idx_vacancies_partner_id` (`partner_id`),
  ADD KEY `idx_vacancies_status` (`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `applications`
--
ALTER TABLE `applications`
  MODIFY `application_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `application_education`
--
ALTER TABLE `application_education`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=106;

--
-- AUTO_INCREMENT for table `attendance_records`
--
ALTER TABLE `attendance_records`
  MODIFY `attendance_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `industry_partners`
--
ALTER TABLE `industry_partners`
  MODIFY `partner_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT for table `industry_supervisors`
--
ALTER TABLE `industry_supervisors`
  MODIFY `supervisor_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `intakes`
--
ALTER TABLE `intakes`
  MODIFY `intake_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `internship_applications`
--
ALTER TABLE `internship_applications`
  MODIFY `internship_application_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `internship_evaluations`
--
ALTER TABLE `internship_evaluations`
  MODIFY `evaluation_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `internship_interviews`
--
ALTER TABLE `internship_interviews`
  MODIFY `interview_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `internship_terminations`
--
ALTER TABLE `internship_terminations`
  MODIFY `termination_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `interviewers`
--
ALTER TABLE `interviewers`
  MODIFY `interviewer_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `interview_evaluations`
--
ALTER TABLE `interview_evaluations`
  MODIFY `evaluation_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `interview_slots`
--
ALTER TABLE `interview_slots`
  MODIFY `slot_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `leave_requests`
--
ALTER TABLE `leave_requests`
  MODIFY `leave_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `managers`
--
ALTER TABLE `managers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `overtime_requests`
--
ALTER TABLE `overtime_requests`
  MODIFY `overtime_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `student_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=199;

--
-- AUTO_INCREMENT for table `vacancies`
--
ALTER TABLE `vacancies`
  MODIFY `vacancy_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `applications`
--
ALTER TABLE `applications`
  ADD CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_app_slot` FOREIGN KEY (`interview_slot_id`) REFERENCES `interview_slots` (`slot_id`) ON DELETE SET NULL;

--
-- Constraints for table `application_education`
--
ALTER TABLE `application_education`
  ADD CONSTRAINT `application_education_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`application_id`) ON DELETE CASCADE;

--
-- Constraints for table `attendance_records`
--
ALTER TABLE `attendance_records`
  ADD CONSTRAINT `fk_att_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_att_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `industry_supervisors` (`supervisor_id`) ON DELETE CASCADE;

--
-- Constraints for table `industry_partners`
--
ALTER TABLE `industry_partners`
  ADD CONSTRAINT `industry_partners_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `industry_supervisors`
--
ALTER TABLE `industry_supervisors`
  ADD CONSTRAINT `industry_supervisors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `industry_supervisors_ibfk_2` FOREIGN KEY (`partner_id`) REFERENCES `industry_partners` (`partner_id`) ON DELETE SET NULL;

--
-- Constraints for table `internship_applications`
--
ALTER TABLE `internship_applications`
  ADD CONSTRAINT `fk_app_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `industry_supervisors` (`supervisor_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_ia_partner` FOREIGN KEY (`partner_id`) REFERENCES `industry_partners` (`partner_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ia_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ia_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`vacancy_id`) ON DELETE CASCADE;

--
-- Constraints for table `internship_evaluations`
--
ALTER TABLE `internship_evaluations`
  ADD CONSTRAINT `fk_eval_application` FOREIGN KEY (`internship_application_id`) REFERENCES `internship_applications` (`internship_application_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_eval_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `industry_supervisors` (`supervisor_id`);

--
-- Constraints for table `internship_interviews`
--
ALTER TABLE `internship_interviews`
  ADD CONSTRAINT `fk_ii_application` FOREIGN KEY (`internship_application_id`) REFERENCES `internship_applications` (`internship_application_id`) ON DELETE CASCADE;

--
-- Constraints for table `internship_terminations`
--
ALTER TABLE `internship_terminations`
  ADD CONSTRAINT `fk_term_application` FOREIGN KEY (`internship_application_id`) REFERENCES `internship_applications` (`internship_application_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_term_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `industry_supervisors` (`supervisor_id`);

--
-- Constraints for table `interviewers`
--
ALTER TABLE `interviewers`
  ADD CONSTRAINT `fk_interviewers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `interview_evaluations`
--
ALTER TABLE `interview_evaluations`
  ADD CONSTRAINT `fk_eval_app` FOREIGN KEY (`application_id`) REFERENCES `applications` (`application_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ie_interviewer_profile` FOREIGN KEY (`interviewer_id`) REFERENCES `interviewers` (`interviewer_id`) ON DELETE SET NULL;

--
-- Constraints for table `interview_slot_interviewers`
--
ALTER TABLE `interview_slot_interviewers`
  ADD CONSTRAINT `interview_slot_interviewers_ibfk_1` FOREIGN KEY (`slot_id`) REFERENCES `interview_slots` (`slot_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `interview_slot_interviewers_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD CONSTRAINT `fk_leave_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_leave_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `industry_supervisors` (`supervisor_id`) ON DELETE CASCADE;

--
-- Constraints for table `managers`
--
ALTER TABLE `managers`
  ADD CONSTRAINT `fk_managers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `overtime_requests`
--
ALTER TABLE `overtime_requests`
  ADD CONSTRAINT `fk_ot_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ot_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `industry_supervisors` (`supervisor_id`) ON DELETE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `fk_student_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`application_id`),
  ADD CONSTRAINT `fk_student_intake` FOREIGN KEY (`intake_id`) REFERENCES `intakes` (`intake_id`),
  ADD CONSTRAINT `fk_student_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `vacancies`
--
ALTER TABLE `vacancies`
  ADD CONSTRAINT `fk_vacancy_partner` FOREIGN KEY (`partner_id`) REFERENCES `industry_partners` (`partner_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
