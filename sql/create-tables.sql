-- THIS IS NOW DEPRECATED, INSTEAD HIBERNATE GENERATES TABLES
--
--
-- =============================================================
-- EduTrack — Create Tables (PostgreSQL)
-- =============================================================

-- Drop in reverse dependency order
DROP TABLE IF EXISTS school_schedule_entries CASCADE;
DROP TABLE IF EXISTS Complaints          CASCADE;
DROP TABLE IF EXISTS Absences            CASCADE;
DROP TABLE IF EXISTS Grades              CASCADE;
DROP TABLE IF EXISTS Schedules           CASCADE;
DROP TABLE IF EXISTS Teacher_Qualifications CASCADE;
DROP TABLE IF EXISTS Subjects            CASCADE;
DROP TABLE IF EXISTS Students            CASCADE;
DROP TABLE IF EXISTS Teachers            CASCADE;
DROP TABLE IF EXISTS Classes             CASCADE;
DROP TABLE IF EXISTS Schools             CASCADE;
DROP TABLE IF EXISTS Users               CASCADE;
DROP TABLE IF EXISTS Roles               CASCADE;

-- -------------------------------------------------------------
-- 1. Roles
-- -------------------------------------------------------------
CREATE TABLE Roles (
    Id   SERIAL PRIMARY KEY,
    Name VARCHAR(50) NOT NULL UNIQUE
);

-- -------------------------------------------------------------
-- 2. Users
-- -------------------------------------------------------------
CREATE TABLE Users (
    Id           SERIAL PRIMARY KEY,
    Email        VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    FirstName    VARCHAR(50)  NOT NULL,
    LastName     VARCHAR(50)  NOT NULL,
    RoleId       INT          NOT NULL,
    Bio          VARCHAR(500),
    FOREIGN KEY (RoleId) REFERENCES Roles(Id) ON DELETE RESTRICT
);

-- -------------------------------------------------------------
-- 3. Schools
-- -------------------------------------------------------------
CREATE TABLE Schools (
    Id         SERIAL PRIMARY KEY,
    Name       VARCHAR(150) NOT NULL,
    Address    TEXT,
    DirectorId INT,
    FOREIGN KEY (DirectorId) REFERENCES Users(Id) ON DELETE SET NULL
);

-- -------------------------------------------------------------
-- 4. Classes
-- -------------------------------------------------------------
CREATE TABLE Classes (
    Id         SERIAL PRIMARY KEY,
    Name       VARCHAR(20) NOT NULL,
    SchoolYear VARCHAR(9)  NOT NULL,
    SchoolId   INT         NOT NULL,
    FOREIGN KEY (SchoolId) REFERENCES Schools(Id) ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- 5. Teachers
-- -------------------------------------------------------------
CREATE TABLE Teachers (
    UserId   INT            PRIMARY KEY,
    SchoolId INT,
    Salary   DECIMAL(10,2),
    FOREIGN KEY (UserId)   REFERENCES Users(Id)   ON DELETE CASCADE,
    FOREIGN KEY (SchoolId) REFERENCES Schools(Id)  ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- 6. Students
-- -------------------------------------------------------------
CREATE TABLE Students (
    UserId   INT PRIMARY KEY,
    SchoolId INT,
    ClassId  INT,
    ParentId INT,
    FOREIGN KEY (UserId)   REFERENCES Users(Id)    ON DELETE CASCADE,
    FOREIGN KEY (SchoolId) REFERENCES Schools(Id)  ON DELETE CASCADE,
    FOREIGN KEY (ClassId)  REFERENCES Classes(Id)  ON DELETE SET NULL,
    FOREIGN KEY (ParentId) REFERENCES Users(Id)    ON DELETE SET NULL
);

-- -------------------------------------------------------------
-- 8. Subjects
-- -------------------------------------------------------------
CREATE TABLE Subjects (
    Id   SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL UNIQUE
);

-- -------------------------------------------------------------
-- 9. Teacher_Qualifications
-- -------------------------------------------------------------
CREATE TABLE Teacher_Qualifications (
    TeacherId INT NOT NULL,
    SubjectId INT NOT NULL,
    PRIMARY KEY (TeacherId, SubjectId),
    FOREIGN KEY (TeacherId) REFERENCES Teachers(UserId) ON DELETE CASCADE,
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id)    ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- 10. Schedules
-- -------------------------------------------------------------
CREATE TABLE Schedules (
    Id        SERIAL PRIMARY KEY,
    SchoolId  INT NOT NULL,
    ClassId   INT NOT NULL,
    SubjectId INT NOT NULL,
    TeacherId INT NOT NULL,
    Term      INT  NOT NULL CHECK (Term IN (1, 2)),
    DayOfWeek INT  NOT NULL CHECK (DayOfWeek BETWEEN 1 AND 5),  -- 1=Mon … 5=Fri
    StartTime        TIME         NOT NULL,
    EndTime          TIME         NOT NULL,
    lecture_type     VARCHAR(20)  NOT NULL DEFAULT 'STANDARD',
    track_attendance BOOLEAN      NOT NULL DEFAULT TRUE,
    FOREIGN KEY (SchoolId)  REFERENCES Schools(Id)       ON DELETE CASCADE,
    FOREIGN KEY (ClassId)   REFERENCES Classes(Id)       ON DELETE CASCADE,
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id)      ON DELETE CASCADE,
    FOREIGN KEY (TeacherId) REFERENCES Teachers(UserId)  ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- 11. Grades
-- -------------------------------------------------------------
CREATE TABLE Grades (
    Id         SERIAL PRIMARY KEY,
    StudentId  INT            NOT NULL,
    ScheduleId INT            NOT NULL,
    Value      DECIMAL(3, 2)  NOT NULL CHECK (Value IN (2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6)),
    CreatedAt  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId)  REFERENCES Students(UserId)  ON DELETE CASCADE,
    FOREIGN KEY (ScheduleId) REFERENCES Schedules(Id)     ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- 12. Absences
-- -------------------------------------------------------------
CREATE TABLE Absences (
    Id         SERIAL PRIMARY KEY,
    StudentId  INT     NOT NULL,
    ScheduleId INT     NOT NULL,
    Date       DATE    NOT NULL,
    IsExcused  BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (StudentId)  REFERENCES Students(UserId)  ON DELETE CASCADE,
    FOREIGN KEY (ScheduleId) REFERENCES Schedules(Id)     ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- 13. Complaints
-- -------------------------------------------------------------
CREATE TABLE Complaints (
    Id          SERIAL PRIMARY KEY,
    StudentId   INT          NOT NULL,
    ScheduleId  INT          NOT NULL,
    Description VARCHAR(500) NOT NULL,
    Date        DATE         NOT NULL,
    FOREIGN KEY (StudentId)  REFERENCES Students(UserId)  ON DELETE CASCADE,
    FOREIGN KEY (ScheduleId) REFERENCES Schedules(Id)     ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- 14. School_Schedule_Entries  (daily timetable + special events)
-- -------------------------------------------------------------
CREATE TABLE school_schedule_entries (
    id         SERIAL PRIMARY KEY,
    schoolid   INT          NOT NULL,
    type       VARCHAR(20)  NOT NULL CHECK (type IN ('LECTURE', 'BREAK', 'SPECIAL_EVENT')),
    label      VARCHAR(100) NOT NULL,
    start_time TIME         NOT NULL,
    end_time   TIME         NOT NULL,
    event_date DATE,                  -- only for SPECIAL_EVENT
    sort_order INT          NOT NULL DEFAULT 0,
    FOREIGN KEY (schoolid) REFERENCES Schools(Id) ON DELETE CASCADE
);
