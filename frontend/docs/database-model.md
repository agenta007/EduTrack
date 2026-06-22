# Database Model

EduTrack uses **PostgreSQL** managed by **Hibernate / Spring Data JPA** with `ddl-auto=update` — the schema is generated and maintained automatically from the Java entity classes.

---

## Tables Overview

| Table | Description |
|-------|-------------|
| `roles` | Lookup table — five fixed roles |
| `users` | Every person in the system |
| `schools` | Educational institutions |
| `school_profiles` | Academic streams within a school |
| `school_term_configs` | Per-school grading period date boundaries |
| `school_schedule_entries` | Daily timetable slots (lectures, breaks, events) |
| `school_events` | Calendar events visible to students/parents |
| `classes` | Class groups (e.g. "10-A 2024/2025") |
| `subjects` | Global subject catalog |
| `teachers` | Extension of `users` for teacher-specific data |
| `teacher_qualifications` | Which subjects a teacher is qualified to teach |
| `students` | Extension of `users` for student-specific data |
| `schedules` | Who teaches what to whom, when |
| `grades` | Grades awarded to students |
| `absences` | Absence records per student per session |
| `complaints` | Behavioral complaints by teachers against students |

---

## Table Definitions

### `roles`

Lookup table seeded from the `RoleEnum` enum. Never changes at runtime.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGSERIAL | PK |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL — one of: `ADMIN`, `HEADMASTER`, `TEACHER`, `STUDENT`, `PARENT` |

---

### `users`

The central identity table. Every person — admin, headmaster, teacher, student, parent — has exactly one row here.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGSERIAL | PK |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL |
| `passwordhash` | VARCHAR(255) | NOT NULL (BCrypt) |
| `firstname` | VARCHAR(50) | NOT NULL |
| `lastname` | VARCHAR(50) | NOT NULL |
| `roleid` | BIGINT | FK → `roles.id`, NOT NULL |
| `profile_picture` | BYTEA | Nullable — raw image bytes |
| `profile_picture_type` | VARCHAR(50) | Nullable — MIME type (e.g. `image/jpeg`) |
| `bio` | VARCHAR(500) | Nullable |

A user's role determines which pages they can access and what data they can see or modify. The role is embedded in the JWT so the frontend can enforce it client-side without an extra API call.

---

### `schools`

Represents a physical school.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGSERIAL | PK |
| `name` | VARCHAR(150) | NOT NULL |
| `address` | TEXT | Nullable |
| `type` | VARCHAR(30) | Nullable — enum: `GENERAL`, `FOREIGN_LANGUAGE`, `MATHEMATICS`, `ART`, `SPORTS`, `PROFESSIONAL` |
| `directorid` | BIGINT | FK → `users.id` — nullable (headmaster can be assigned later) |
| `student_limit` | INTEGER | Nullable — NULL means unlimited enrollment |

The `directorid` column is a **one-to-one** link to a `users` row with role `HEADMASTER`. When the headmaster logs in, the backend resolves their school by matching `users.id = schools.directorid`.

---

### `school_profiles`

Academic profiles (streams/tracks) within a school, e.g. "English Profile", "Mathematics Profile". Students can be assigned to one.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGSERIAL | PK |
| `name` | VARCHAR(100) | NOT NULL |
| `schoolid` | BIGINT | FK → `schools.id`, NOT NULL |

**Relationship:** Many profiles → one school.

---

### `school_term_configs`

Per-school configuration of grading period boundaries. All dates are stored as `MM-dd` strings so they apply every year without needing a year component.

| Column | Type | Default |
|--------|------|---------|
| `schoolid` | BIGINT | PK, FK → `schools.id` (`@MapsId`) |
| `startdate` | VARCHAR | `09-15` — school year / term 1 start |
| `term2start` | VARCHAR | `02-01` — second term start |
| `elementaryend` | VARCHAR | `06-01` — end for grades 1–4 |
| `progymnasiumend` | VARCHAR | `06-15` — end for grades 5–7 |
| `gymnasiumend` | VARCHAR | `07-01` — end for grades 8–12 |

**Relationship:** Exactly one config per school (`@MapsId` — shares PK with `schools`).

---

### `school_schedule_entries`

The school's daily timetable — time slots displayed as the front-desk bell schedule. Separate from the academic class schedule.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGSERIAL | PK |
| `schoolid` | BIGINT | FK → `schools.id`, NOT NULL |
| `type` | VARCHAR(20) | NOT NULL — `LECTURE`, `BREAK`, `SPECIAL_EVENT` |
| `label` | VARCHAR(100) | NOT NULL — display name (e.g. "First Break") |
| `start_time` | TIME | NOT NULL |
| `end_time` | TIME | NOT NULL |
| `event_date` | DATE | Nullable — only for `SPECIAL_EVENT` |
| `sort_order` | INTEGER | NOT NULL — display ordering |

**Relationship:** Many entries → one school.

---

### `school_events`

Calendar events visible to students and parents. Scope is controlled by which fields are null:

| `schoolid` | `classid` | Scope |
|------------|-----------|-------|
| NULL | NULL | System-wide (e.g. national holiday) |
| set | NULL | Applies to the whole school |
| set | set | Applies to one specific class only |

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGSERIAL | PK |
| `title` | VARCHAR(150) | NOT NULL |
| `description` | VARCHAR(500) | Nullable |
| `date` | DATE | NOT NULL |
| `type` | VARCHAR(20) | NOT NULL — `TEST`, `HOLIDAY`, `MEETING`, `OTHER` |
| `schoolid` | BIGINT | FK → `schools.id` — nullable |
| `classid` | BIGINT | FK → `classes.id` — nullable |
| `created_by` | BIGINT | FK → `users.id` — who created the event |
| `created_at` | TIMESTAMP | Auto-set on insert |

---

### `classes`

A class group (homeroom) within a school for a specific school year.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGSERIAL | PK |
| `name` | VARCHAR(20) | NOT NULL — e.g. `10-A` |
| `schoolyear` | VARCHAR(9) | NOT NULL — format `2024/2025` |
| `schoolid` | BIGINT | FK → `schools.id`, NOT NULL |

**Relationship:** Many classes → one school.

---

### `subjects`

Global catalog of subjects, shared across all schools. Not owned by any school.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGSERIAL | PK |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL — e.g. `Mathematics`, `Biology` |

---

### `teachers`

Extends `users` with teacher-specific fields. Uses a **shared primary key** (`@MapsId`) — the `id` in `teachers` is identical to the `id` in `users`.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGINT | PK (= `users.id`) |
| `userid` | BIGINT | FK → `users.id`, `@MapsId` |
| `schoolid` | BIGINT | FK → `schools.id` — nullable (teacher may be unassigned) |
| `salary` | DECIMAL(10,2) | Nullable — monthly gross in BGN |

**Relationship:** One teacher → one school (nullable). One teacher → many subjects via `teacher_qualifications`.

---

### `teacher_qualifications`

Join table for the many-to-many relationship between teachers and subjects.

| Column | Type | Constraints |
|--------|------|-------------|
| `teacherid` | BIGINT | PK, FK → `teachers.id` |
| `subjectid` | BIGINT | PK, FK → `subjects.id` |

---

### `students`

Extends `users` with student-specific fields. Also uses a **shared primary key** (`@MapsId`).

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGINT | PK (= `users.id`) |
| `userid` | BIGINT | FK → `users.id`, `@MapsId` |
| `schoolid` | BIGINT | FK → `schools.id` — nullable (not yet enrolled) |
| `classid` | BIGINT | FK → `classes.id` — nullable (enrolled in school but no class yet) |
| `profileid` | BIGINT | FK → `school_profiles.id` — nullable |
| `parentid` | BIGINT | FK → `users.id` — nullable, must be a user with role `PARENT` |

**Enrollment states:**
- `schoolid = NULL` → user has STUDENT role but is not enrolled anywhere
- `schoolid = X, classid = NULL` → enrolled in school but not assigned to a class
- `schoolid = X, classid = Y` → fully enrolled

---

### `schedules`

The academic schedule — the binding of teacher + subject + class + time slot. Grades and absences are always recorded against a specific schedule entry.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGSERIAL | PK |
| `schoolid` | BIGINT | FK → `schools.id`, NOT NULL |
| `classid` | BIGINT | FK → `classes.id`, NOT NULL |
| `subjectid` | BIGINT | FK → `subjects.id`, NOT NULL |
| `teacherid` | BIGINT | FK → `teachers.id`, NOT NULL |
| `term` | INTEGER | NOT NULL — `1` or `2` |
| `dayofweek` | INTEGER | NOT NULL — `1` (Mon) through `5` (Fri) |
| `starttime` | TIME | NOT NULL |
| `endtime` | TIME | NOT NULL |
| `lecture_type` | VARCHAR(20) | Default `STANDARD` — `STANDARD`, `SIP`, `EXTRACURRICULAR` |
| `track_attendance` | BOOLEAN | Default `true` — false allowed for `EXTRACURRICULAR` |

**Lecture types:**
- `STANDARD` — the whole class attends together
- `SIP` — Специализирани Избираеми Предмети; mixed students from parallel classes
- `EXTRACURRICULAR` — optional; attendance tracking can be disabled

---

### `grades`

A grade awarded to a student for a specific schedule entry (subject session).

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGSERIAL | PK |
| `studentid` | BIGINT | FK → `students.id`, NOT NULL |
| `scheduleid` | BIGINT | FK → `schedules.id`, NOT NULL |
| `value` | DECIMAL(3,2) | NOT NULL — range `2.00` (fail) to `6.00` (excellent) |
| `createdat` | TIMESTAMP | Auto-set on insert |

**Grading scale (Bulgarian):**

| Value | Label |
|-------|-------|
| 5.50 – 6.00 | Excellent |
| 5.00 – 5.49 | Very Good |
| 4.00 – 4.99 | Good |
| 3.00 – 3.99 | Satisfactory |
| 2.00 – 2.99 | Fail |

---

### `absences`

A recorded absence from a schedule session on a specific date.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGSERIAL | PK |
| `studentid` | BIGINT | FK → `students.id`, NOT NULL |
| `scheduleid` | BIGINT | FK → `schedules.id`, NOT NULL |
| `date` | DATE | NOT NULL |
| `isexcused` | BOOLEAN | Default `false` — updated to `true` when excused |

---

### `complaints`

A behavioral complaint written by a teacher about a student, in the context of a schedule session.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGSERIAL | PK |
| `studentid` | BIGINT | FK → `students.id`, NOT NULL |
| `scheduleid` | BIGINT | FK → `schedules.id`, NOT NULL |
| `description` | VARCHAR(500) | NOT NULL |
| `date` | DATE | NOT NULL |

---

## Relationships

```
┌──────────┐       ┌──────────────────────────────────────────────────┐
│  roles   │ 1───N │                     users                        │
│  id      │       │  id · email · passwordhash · firstname           │
│  name    │       │  lastname · roleid · profile_picture · bio       │
└──────────┘       └───────────┬──────────────────┬───────────────────┘
                               │ 1                │ 1
                    ┌──────────┘                  └──────────────────┐
                    │ N (directorid)                                  │ @MapsId
              ┌─────▼──────┐                       ┌────────────────▼──────────┐
              │  schools   │                        │         teachers          │
              │  id · name │                        │  id · userid · schoolid   │
              │  type      │                        │  salary                   │
              │  directorid│                        └─────────────┬─────────────┘
              │  limit     │                                      │ N:M
              └─────┬──────┘                            ┌─────────▼──────────┐
                    │ 1                                 │teacher_qualifications│
       ┌────────────┼────────────────────────────────── │teacherid · subjectid │
       │            │                                    └─────────────────────┘
       │ N          │ N                                           │ N
┌──────▼────────┐  ┌▼───────────────────────┐           ┌───────▼────────┐
│school_profiles│  │       classes           │           │    subjects    │
│ id · name     │  │ id · name · schoolyear  │           │ id · name      │
│ schoolid      │  │ schoolid                │           └────────────────┘
└──────┬────────┘  └──────────┬─────────────┘
       │                      │ 1                   (subjects also referenced by schedules)
       │ N (profileid)        │ N (classid)
       │                      │
       └──────────────┬───────┘
                      │ @MapsId
               ┌──────▼──────────────────────────────────┐
               │                students                  │
               │  id · userid · schoolid · classid        │
               │  profileid · parentid                    │
               └──────────────┬──────────────────────────┘
                              │ N
               ┌──────────────┼──────────────────────────────────┐
               │              │                                  │
┌──────────────▼──┐  ┌────────▼─────────────────────────┐   ┌───▼────────────────┐
│    schedules    │  │           grades                  │   │     absences       │
│ id · schoolid   │  │  id · studentid · scheduleid      │   │ id · studentid     │
│ classid         │  │  value (2.00-6.00) · createdat    │   │ scheduleid · date  │
│ subjectid       │  └───────────────────────────────────┘   │ isexcused          │
│ teacherid       │                                           └────────────────────┘
│ term (1/2)      │
│ dayofweek (1-5) │  ┌───────────────────────────────────┐
│ starttime       ◄──│         complaints                │
│ endtime         │  │  id · studentid · scheduleid      │
│ lecture_type    │  │  description · date               │
│ track_attendance│  └───────────────────────────────────┘
└─────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                         school_events                                │
│  id · title · description · date · type                             │
│  schoolid (nullable) · classid (nullable) · created_by · created_at │
│                                                                      │
│  Scope rules:                                                        │
│    schoolid=NULL  classid=NULL  →  system-wide                       │
│    schoolid=X     classid=NULL  →  school-wide                       │
│    schoolid=X     classid=Y     →  class-specific                    │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                     school_schedule_entries                          │
│  id · schoolid · type · label · start_time · end_time               │
│  event_date (only for SPECIAL_EVENT) · sort_order                   │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                        school_term_configs                           │
│  schoolid (PK = school.id) · startdate · term2start                 │
│  elementaryend · progymnasiumend · gymnasiumend                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### Shared Primary Keys (`@MapsId`)

`teachers`, `students`, and `school_term_configs` share their PK with the parent entity:

```
users.id = teachers.id = teachers.userid
users.id = students.id = students.userid
schools.id = school_term_configs.id = school_term_configs.schoolid
```

This means:
- No extra join needed to get from teacher → user or student → user — they are the same row ID.
- Spring Data JPA calls `merge()` (not `persist()`) when the entity has a non-null id. For new teachers/students, you must call `userRepository.save(user)` first to get the generated id, then build the teacher/student **without** setting `.id()` in the builder so that `isNew()` returns true and JPA calls `persist()`.

### `schedules` as the Join Point

Grades, absences, and complaints all reference `schedules.id`, not the class or subject directly. This means:

- A grade always knows which subject it was for, which teacher gave it, and which term it belongs to — just by following `schedule`.
- Filtering grades by subject = filter by `schedule.subjectid`.
- Filtering grades by teacher = filter by `schedule.teacherid`.
- Filtering by term = filter by `schedule.term`.

### Student Enrollment States

A user with role `STUDENT` exists in `users` but may not be in `students` at all (no row), or may be in `students` with `schoolid = NULL`. The three meaningful states:

| `students` row exists | `schoolid` | `classid` | Meaning |
|---|---|---|---|
| No | — | — | User has STUDENT role, never enrolled |
| Yes | NULL | NULL | STUDENT role, not enrolled in any school |
| Yes | X | NULL | Enrolled in school X, no class assigned |
| Yes | X | Y | Fully enrolled in school X, class Y |