import subprocess, os

# Get all endpoints
out = subprocess.check_output(
    "grep -rhn '@Mapping\|GetMapping\|PostMapping\|PutMapping\|DeleteMapping\|PatchMapping' "
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/ --include='*.java' 2>/dev/null | cat -n",
    shell=True
).decode()

endpoints = []
for line in out.strip().split('\n'):
    if not line.strip():
        continue
    # Format: "68:@PostMapping" or "68:    @PostMapping"
    parts = line.strip().split(':', 1)
    if len(parts) < 2:
        continue
    ann = parts[1].strip()
    endpoints.append(ann)

# Now we need to pair them up with controllers and paths
# Re-parse with full context
endpoints = []
for fpath in [
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/AuthController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/UserController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/ProfileController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/TeacherController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/StudentController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/ParentController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/ClassController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/SubjectController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/GradeController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/AbsenceController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/ScheduleController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/ComplaintController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/SchoolController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/SchoolEventController.java",
]:
    base = os.path.basename(fpath).replace('.java', '.jsx')
    lines = open(fpath).readlines()
    controller_name = ''
    request_mapping = ''
    for i, line in enumerate(lines):
        stripped = line.strip()
        m = stripped.lstrip('@')
        if m.startswith('RestController') or m.startswith('Controller'):
            controller_name = stripped.replace('@', '').replace('Controller', '')
        if '@RequestMapping' in line:
            val = ''
            for c in stripped:
                if c in ('"', "'"):
                    val += c
                    break
                if c.isalpha() or c.isupper():
                    break
                val += c
            for c in stripped:
                if val and c in ('"', "'"):
                    val += c
                    break
            request_mapping = val.strip(", =' ")

endpoints = []
for fpath in [
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/AuthController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/UserController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/ProfileController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/TeacherController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/StudentController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/ParentController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/ClassController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/SubjectController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/GradeController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/AbsenceController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/ScheduleController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/ComplaintController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/SchoolController.java",
    "/home/neo/EduTrack/backend/e-journal/src/main/java/com/edutrack/e_journal/controller/SchoolEventController.java",
]:
    base = os.path.basename(fpath).replace('.java', '.jsx')
    # Map controller names to frontend pages
    ctrl_map = {
        'AuthController': 'Login',
        'UserController': 'ViewUsers',
        'ProfileController': 'Profile',
        'TeacherController': 'ViewTeachers',
        'StudentController': 'ViewStudents',
        'ParentController': 'ViewParents',
        'ClassController': 'ClassStudents',
        'SubjectController': 'ViewSubjects',
        'GradeController': 'ClassGrades',
        'AbsenceController': 'ClassAbsences',
        'ScheduleController': 'ClassSchedule',
        'ComplaintController': 'ClassComplaints',
        'SchoolController': 'HeadmasterSchool',
        'SchoolEventController': 'SchoolEvents',
    }
    page_name = ctrl_map.get(os.path.basename(fpath).replace('.java', ''), 'Unknown')

    lines = open(fpath).readlines()
    request_mapping = ''
    for line in lines:
        stripped = line.strip()
        if '@RequestMapping' in stripped:
            val = stripped
            for i, c in enumerate(stripped):
                if c in ('"', "'"):
                    start = i
                    break
            for i, c in enumerate(stripped[start+1:], start+1):
                if c in ('"', "'"):
                    end = i
                    break
            request_mapping = stripped[start+1:end]
            break

    # Find endpoints
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        http_methods = ('@GetMapping', '@PostMapping', '@PutMapping', '@DeleteMapping', '@PatchMapping')
        matched = ''
        for method in http_methods:
            if method in line:
                matched = method.lstrip('@')
                break
        if matched:
            # Next line might have the path
            path = ''
            if '{' in line:
                for c in line:
                    if c in ('"', "'"):
                        s = line.index(c)
                        e = line.index(c, s+1)
                        path = line[s+1:e]
                        break
            elif '"' in line:
                s = line.index('"')
                e = line.index('"', s+1)
                path = line[s+1:e]
            else:
                s = line.index('"')
                e = line.index('"', s+1)
                path = line[s+1:e]

            full_path = request_mapping + (('/' + path) if path else '')
            endpoints.append((matched, full_path, page_name, os.path.basename(fpath).replace('.java', '.tsx')))
        i += 1

html = f"""<!DOCTYPE html>
<html>
<head>
<style>
body {{ font-family: Arial, sans-serif; margin: 20px; }}
table {{ border-collapse: collapse; width: 100%; }}
th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
th {{ background-color: #4CAF50; color: white; }}
tr:nth-child(even) {{ background-color: #f2f2f2; }}
.GET {{ color: blue; font-weight: bold; }}
.POST {{ color: green; font-weight: bold; }}
.PUT {{ color: orange; font-weight: bold; }}
.DELETE {{ color: red; font-weight: bold; }}
.PATCH {{ color: purple; font-weight: bold; }}
</style>
</head>
<body>
<h2>API Endpoints Table</h2>
<table>
<tr><th>#</th><th>HTTP Method</th><th>Full Endpoint</th><th>Relevant JSX</th><th>Backend Java File</th></tr>
"""

for i, (method, path, page, backend) in enumerate(endpoints, 1):
    html += f"""<tr>
<td>{i}</td>
<td class="{method}">{method}</td>
<td>{path}</td>
<td><code>{page}.jsx</code></td>
<td>{backend}</td>
</tr>\n"""

html += """</table>
</body>
</html>"""

with open('/tmp/api_table.html', 'w') as f:
    f.write(html)
print(f"Written {len(endpoints)} rows")

