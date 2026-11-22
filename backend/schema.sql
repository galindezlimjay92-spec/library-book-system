-- Library Book System: database schema and sample data
-- Run this in a MySQL-compatible database (for example TiDB Cloud's SQL Editor)

CREATE DATABASE IF NOT EXISTS library_db;
USE library_db;

CREATE TABLE IF NOT EXISTS books (
  book_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  author VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  copies_available INT NOT NULL,
  date_added DATE NOT NULL,
  isbn VARCHAR(30) NOT NULL DEFAULT '',
  description TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS borrow_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(100) NOT NULL,
  student_name VARCHAR(150) NOT NULL,
  book_id INT NOT NULL,
  book_title VARCHAR(150) NOT NULL,
  request_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  due_date DATETIME NULL,
  return_date DATETIME NULL
);

-- Sample data
INSERT INTO books (title, author, category, copies_available, date_added, isbn, description) VALUES
('El Filibusterismo', 'Jose Rizal', 'Fiction', 4, '2026-10-01', '', NULL),
('Clean Code', 'Robert C. Martin', 'Computer Science', 3, '2026-10-02', '', NULL),
('Introduction to Programming', 'John Smith', 'Programming', 1, '2026-11-14', '', ''),
('Java Programming for Beginners', 'James Gosling', 'Programming', 1, '2026-11-14', '', ''),
('Python Crash Course', 'Eric Matthes', 'Programming', 1, '2026-11-14', '', '');