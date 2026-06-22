-- 0. Изчистване на старата база данни
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS school_schedule_entries, Absences, Grades, Schedules, Teacher_Qualifications, Subjects, Parent_Student, Students, Teachers, Classes, Schools, Users, Roles;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Потребители и Роли
CREATE TABLE Roles (
                       Id INT AUTO_INCREMENT PRIMARY KEY,
                       Name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Users (
                       Id INT AUTO_INCREMENT PRIMARY KEY,
                       Email VARCHAR(100) NOT NULL UNIQUE,
                       PasswordHash VARCHAR(255) NOT NULL,
                       FirstName VARCHAR(50) NOT NULL,
                       LastName VARCHAR(50) NOT NULL,
                       RoleId INT NOT NULL,
                       Bio    VARCHAR(500),
                       FOREIGN KEY (RoleId) REFERENCES Roles(Id) ON DELETE RESTRICT
);

-- 2. Училищна инфраструктура
CREATE TABLE Schools (
                         Id INT AUTO_INCREMENT PRIMARY KEY,
                         Name VARCHAR(150) NOT NULL,
                         Address TEXT,
                         DirectorId INT,
                         FOREIGN KEY (DirectorId) REFERENCES Users(Id) ON DELETE SET NULL
);

CREATE TABLE Classes (
                         Id INT AUTO_INCREMENT PRIMARY KEY,
                         Name VARCHAR(20) NOT NULL,
                         SchoolYear VARCHAR(9) NOT NULL,
                         SchoolId INT NOT NULL,
                         FOREIGN KEY (SchoolId) REFERENCES Schools(Id) ON DELETE CASCADE
);

-- 3. Специфични профили и връзки
CREATE TABLE Teachers (
                          UserId   INT            PRIMARY KEY,
                          SchoolId INT,
                          Salary   DECIMAL(10,2),
                          FOREIGN KEY (UserId)   REFERENCES Users(Id)   ON DELETE CASCADE,
                          FOREIGN KEY (SchoolId) REFERENCES Schools(Id) ON DELETE CASCADE
);

CREATE TABLE Students (
                          UserId   INT PRIMARY KEY,
                          SchoolId INT,
                          ClassId  INT,
                          FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
                          FOREIGN KEY (SchoolId) REFERENCES Schools(Id) ON DELETE CASCADE,
                          FOREIGN KEY (ClassId) REFERENCES Classes(Id) ON DELETE SET NULL
);

CREATE TABLE Parent_Student (
                                ParentId INT NOT NULL,
                                StudentId INT NOT NULL,
                                PRIMARY KEY (ParentId, StudentId),
                                FOREIGN KEY (ParentId) REFERENCES Users(Id) ON DELETE CASCADE,
                                FOREIGN KEY (StudentId) REFERENCES Students(UserId) ON DELETE CASCADE
);

-- 4. Учебен процес (Програма и Предмети)
CREATE TABLE Subjects (
                          Id INT AUTO_INCREMENT PRIMARY KEY,
                          Name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE Teacher_Qualifications (
                                        TeacherId INT NOT NULL,
                                        SubjectId INT NOT NULL,
                                        PRIMARY KEY (TeacherId, SubjectId),
                                        FOREIGN KEY (TeacherId) REFERENCES Teachers(UserId) ON DELETE CASCADE,
                                        FOREIGN KEY (SubjectId) REFERENCES Subjects(Id) ON DELETE CASCADE
);

CREATE TABLE Schedules (
                           Id        INT  AUTO_INCREMENT PRIMARY KEY,
                           SchoolId  INT  NOT NULL,
                           ClassId   INT  NOT NULL,
                           SubjectId INT  NOT NULL,
                           TeacherId INT  NOT NULL,
                           Term      INT  NOT NULL CHECK (Term IN (1, 2)),
                           DayOfWeek INT  NOT NULL CHECK (DayOfWeek BETWEEN 1 AND 5),
                           StartTime TIME NOT NULL,
                           EndTime   TIME NOT NULL,
                           FOREIGN KEY (SchoolId)  REFERENCES Schools(Id)      ON DELETE CASCADE,
                           FOREIGN KEY (ClassId)   REFERENCES Classes(Id)      ON DELETE CASCADE,
                           FOREIGN KEY (SubjectId) REFERENCES Subjects(Id)     ON DELETE CASCADE,
                           FOREIGN KEY (TeacherId) REFERENCES Teachers(UserId) ON DELETE CASCADE
);

-- 5. Оценяване и Отсъствия
CREATE TABLE Grades (
                        Id INT AUTO_INCREMENT PRIMARY KEY,
                        StudentId INT NOT NULL,
                        ScheduleId INT NOT NULL,
                        Value DECIMAL(3,2) NOT NULL CHECK (Value IN (2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6)),
                        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (StudentId) REFERENCES Students(UserId) ON DELETE CASCADE,
                        FOREIGN KEY (ScheduleId) REFERENCES Schedules(Id) ON DELETE CASCADE
);

CREATE TABLE Absences (
                          Id INT AUTO_INCREMENT PRIMARY KEY,
                          StudentId INT NOT NULL,
                          ScheduleId INT NOT NULL,
                          Date DATE NOT NULL,
                          IsExcused BOOLEAN DEFAULT FALSE,
                          FOREIGN KEY (StudentId) REFERENCES Students(UserId) ON DELETE CASCADE,
                          FOREIGN KEY (ScheduleId) REFERENCES Schedules(Id) ON DELETE CASCADE
);

-- 6. Дневен график и специални събития
CREATE TABLE school_schedule_entries (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    schoolid   INT          NOT NULL,
    type       VARCHAR(20)  NOT NULL CHECK (type IN ('LECTURE', 'BREAK', 'SPECIAL_EVENT')),
    label      VARCHAR(100) NOT NULL,
    start_time TIME         NOT NULL,
    end_time   TIME         NOT NULL,
    event_date DATE,
    sort_order INT          NOT NULL DEFAULT 0,
    FOREIGN KEY (schoolid) REFERENCES Schools(Id) ON DELETE CASCADE
);