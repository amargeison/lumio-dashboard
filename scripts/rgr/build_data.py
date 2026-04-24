"""Process RGR partner CSVs into a single JSON blob for the dashboard."""
import csv, json
from collections import defaultdict, Counter
from datetime import datetime

BASE = "/sessions/magical-great-wright/mnt/outputs/data"

# UK year group → US grade equivalent (label + numeric order for sorting)
YEAR_MAP = {
    "nursery":   ("Pre-K", 0),
    "reception": ("Kindergarten", 1),
    "year_1":    ("1st Grade", 2),
    "year_2":    ("2nd Grade", 3),
    "year_3":    ("3rd Grade", 4),
    "year_4":    ("4th Grade", 5),
    "year_5":    ("5th Grade", 6),
    "year_6":    ("6th Grade", 7),
}

def load(path):
    with open(path, encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))

overview  = load(f"{BASE}/2026-04-24T00-18_export overview.csv")
ls_summ   = load(f"{BASE}/2026-04-24T00-18_export LS.csv")
drl       = load(f"{BASE}/2026-04-24T00-19_export DRL.csv")
students  = load(f"{BASE}/2026-04-24T00-19_export st.csv")
a_prev    = load(f"{BASE}/2026-04-24T00-20_export LS assessments 2024_25.csv")
a_curr    = load(f"{BASE}/2026-04-24T00-20_export LS assessments CAY.csv")
training  = load(f"{BASE}/2026-04-24T00-21_export training.csv")

# ---------- Index by School OxEd ID ----------
ov_by_id   = {r["School OxEd ID"]: r for r in overview}
ls_by_id   = {r["School OxEd ID"]: r for r in ls_summ}
drl_by_id  = {r["School OxEd ID"]: r for r in drl}

st_by_sid  = defaultdict(list)
for r in students:
    st_by_sid[r["School OxEd ID"]].append(r)

# training keyed by school NAME (no School OxEd ID column)
tr_by_school = defaultdict(list)
for r in training:
    tr_by_school[r["School name"]].append(r)

# current-year assessments keyed by school id
acurr_by_sid = defaultdict(list)
for r in a_curr:
    acurr_by_sid[r["School OxEd ID"]].append(r)
aprev_by_sid = defaultdict(list)
for r in a_prev:
    aprev_by_sid[r["School OxEd ID"]].append(r)

# Assessments by student id for paired-score calc
by_student = defaultdict(list)
for r in a_curr + a_prev:
    by_student[r["Student OxEd ID"]].append(r)

TODAY = datetime(2026, 4, 24).date()

def days_since(dstr):
    if not dstr: return None
    try:
        return (TODAY - datetime.fromisoformat(dstr).date()).days
    except Exception:
        return None

# ---------- School-level enrichment ----------
schools = []
for r in overview:
    sid = r["School OxEd ID"]
    name_full = r["School name"]
    # strip trailing "(code)" for display only
    disp_name = name_full.split(" (")[0] if " (" in name_full else name_full
    code = name_full.rsplit("(",1)[1].rstrip(")") if "(" in name_full else ""

    ls = ls_by_id.get(sid, {})
    dr = drl_by_id.get(sid, {})
    trs = tr_by_school.get(name_full, [])
    assess_cy = acurr_by_sid.get(sid, [])
    assess_py = aprev_by_sid.get(sid, [])

    total_assess   = int(ls.get("Total assessments") or 0)
    assess_cy_n    = int(ls.get("Assessments current school year") or 0)
    red   = int(ls.get("Red") or 0)
    amber = int(ls.get("Amber") or 0)
    green = int(ls.get("Green") or 0)
    last_assess = ls.get("Most recent LS assessment date") or ""

    teachers_invited = len(trs)
    teachers_fully   = sum(1 for t in trs if t["Fully trained"] == "true")
    # Course completion counts
    course_counts = {c: Counter(t[c] for t in trs) for c in
                     ["C1: Language Fundamentals Status",
                      "C2: NELI Intervention Status",
                      "C3: NELI Intervention Part 2 Status",
                      "C4: Whole Class Status",
                      "Support Hub Status"]}

    has_drl = bool(dr.get("Date of last visit"))
    wc_milestone = dr.get("Whole Class last milestone achieved") or ""
    ps_milestone = dr.get("Preschool last milestone achieved") or ""
    last_drl = dr.get("Date of last visit") or ""

    portal_access  = r.get("Latest portal access") or ""
    uploaded_bool  = r.get("Uploaded students?") == "true"
    accessed_bool  = r.get("Accessed portal?") == "true"

    days_assess = days_since(last_assess)
    days_portal = days_since(portal_access)

    # --- RAG engagement rating ---
    # Green: assessments this year AND ≥1 fully trained teacher AND portal accessed in last 30d
    # Red:   no current-year assessments AND no completed training
    # Amber: everything else
    has_training_complete = teachers_fully >= 1
    portal_recent = days_portal is not None and days_portal <= 30
    if assess_cy_n == 0 and teachers_fully == 0 and sum(
        1 for t in trs for c in ["C1: Language Fundamentals Status","C2: NELI Intervention Status",
                                  "C3: NELI Intervention Part 2 Status","C4: Whole Class Status"]
        if t[c] == "Completed") == 0:
        engagement = "red"
    elif assess_cy_n > 0 and has_training_complete and portal_recent:
        engagement = "green"
    else:
        engagement = "amber"

    # --- programme phase ---
    # Phase 1 Assessment → 2 PD/Training → 3 Whole-Class → 4 Intervention
    phase = 0
    phase_labels = []
    if assess_cy_n > 0:
        phase = max(phase, 1); phase_labels.append("Assessment")
    if any(t["C1: Language Fundamentals Status"] == "Completed" for t in trs):
        phase = max(phase, 2); phase_labels.append("PD: Language Fundamentals")
    if any(t["C4: Whole Class Status"] == "Completed" for t in trs) or wc_milestone:
        phase = max(phase, 3); phase_labels.append("Whole-Class")
    if any(t["C2: NELI Intervention Status"] == "Completed" for t in trs):
        phase = max(phase, 4); phase_labels.append("NELI Intervention")

    # --- next action recommendation ---
    if assess_cy_n == 0 and teachers_invited == 0:
        next_action = "Kick-off call: no activity yet. Schedule onboarding."
    elif assess_cy_n == 0:
        next_action = "Prompt school to run LanguageScreen assessments."
    elif teachers_fully == 0:
        next_action = "Encourage teachers to complete C1 Language Fundamentals."
    elif not has_drl:
        next_action = "Introduce the Digital Resource Library (DRL)."
    elif days_portal and days_portal > 30:
        next_action = f"Re-engage: portal dormant {days_portal} days."
    else:
        next_action = "On track — maintain cadence."

    schools.append({
        "id": sid,
        "name": disp_name,
        "code": code,
        "state": r.get("State") or "—",
        "students": int(r.get("Students") or 0),
        "classes": int(r.get("Classes") or 0),
        "uploaded": uploaded_bool,
        "accessed": accessed_bool,
        "portalAccess": portal_access,
        "daysSincePortal": days_portal,
        "lastAssessmentDate": last_assess,
        "daysSinceAssessment": days_assess,
        "totalAssessments": total_assess,
        "assessmentsCY": assess_cy_n,
        "red": red, "amber": amber, "green": green,
        "teachersInvited": teachers_invited,
        "teachersFullyTrained": teachers_fully,
        "courseCounts": {k: dict(v) for k,v in course_counts.items()},
        "hasDRL": has_drl,
        "wcMilestone": wc_milestone,
        "psMilestone": ps_milestone,
        "lastDRL": last_drl,
        "engagement": engagement,
        "phase": phase,
        "phaseLabels": phase_labels,
        "nextAction": next_action,
    })

# ---------- Teachers (training) ----------
teachers = []
for t in training:
    teachers.append({
        "name": t["Name"],
        "school": t["School name"].split(" (")[0] if " (" in t["School name"] else t["School name"],
        "schoolFull": t["School name"],
        "email": t["Email address"],
        "fullyTrained": t["Fully trained"] == "true",
        "invitedDate": t["Invited date"],
        "lastVisit": t["Date of last visit"],
        "c1": t["C1: Language Fundamentals Status"] or "Not started",
        "c2": t["C2: NELI Intervention Status"] or "Not started",
        "c3": t["C3: NELI Intervention Part 2 Status"] or "Not started",
        "c4": t["C4: Whole Class Status"] or "Not started",
        "supportHub": t["Support Hub Status"] or "Not started",
        "c1Progress": t.get("C1 Progress") or "",
        "c2Progress": t.get("C2 Progress") or "",
        "c3Progress": t.get("C3 Progress") or "",
        "c4Progress": t.get("C4 Progress") or "",
    })

# ---------- Assessments — flattened, codenames only ----------
def pack_assess(r, year):
    yg = r["Year group"]
    ylabel, yorder = YEAR_MAP.get(yg, (yg, 99))
    return {
        "year": year,
        "codename": r["Codename"],
        "schoolId": r["School OxEd ID"],
        "schoolName": r["School"].split(" (")[0] if " (" in r["School"] else r["School"],
        "yearGroup": yg,
        "grade": ylabel,
        "gradeOrder": yorder,
        "ageMonths": int(r["Age (months)"] or 0),
        "assessmentDate": r["Assessment date"],
        "assessmentIndex": int(r["Assessment index"] or 0),
        "rag": r["RAG"],
        "total": int(r["Total score"] or 0),
        "ev": int(r["EV score"] or 0),
        "rv": int(r["RV score"] or 0),
        "lc": int(r["LC score"] or 0),
        "sr": int(r["SR score"] or 0),
        "gender": r.get("Gender") or "unknown",
        "studentId": r["Student OxEd ID"],
    }

assessments = [pack_assess(r, "2024-25") for r in a_prev] + \
              [pack_assess(r, "2025-26") for r in a_curr]

# ---------- Student→paired assessment (assessment 1 → 2 delta) ----------
paired = []
for sid, rs in by_student.items():
    rs_sorted = sorted(rs, key=lambda r: (r["Academic year"], int(r["Assessment index"] or 0)))
    # group by academic year
    by_y = defaultdict(list)
    for r in rs_sorted:
        by_y[r["Academic year"]].append(r)
    for y, lst in by_y.items():
        if len(lst) >= 2:
            a, b = lst[0], lst[-1]
            paired.append({
                "studentId": sid,
                "codename": a["Codename"],
                "year": y,
                "schoolName": (a["School"].split(" (")[0] if " (" in a["School"] else a["School"]),
                "first": int(a["Total score"] or 0),
                "last": int(b["Total score"] or 0),
                "delta": int(b["Total score"] or 0) - int(a["Total score"] or 0),
            })

# ---------- Aggregate KPIs ----------
def kpi():
    total_schools = len(schools)
    active = sum(1 for s in schools if s["engagement"] != "red")
    red = sum(1 for s in schools if s["engagement"] == "red")
    amber = sum(1 for s in schools if s["engagement"] == "amber")
    green = sum(1 for s in schools if s["engagement"] == "green")
    students_total = sum(s["students"] for s in schools)
    classes_total  = sum(s["classes"] for s in schools)
    assessments_total = sum(s["totalAssessments"] for s in schools)
    assessments_cy    = sum(s["assessmentsCY"] for s in schools)
    teachers_total    = len(teachers)
    teachers_trained  = sum(1 for t in teachers if t["fullyTrained"])
    rag_r = sum(s["red"] for s in schools)
    rag_a = sum(s["amber"] for s in schools)
    rag_g = sum(s["green"] for s in schools)
    drl_schools = sum(1 for s in schools if s["hasDRL"])
    uploaded = sum(1 for s in schools if s["uploaded"])
    accessed = sum(1 for s in schools if s["accessed"])
    return dict(
        totalSchools=total_schools, active=active, red=red, amber=amber, green=green,
        studentsTotal=students_total, classesTotal=classes_total,
        assessmentsTotal=assessments_total, assessmentsCY=assessments_cy,
        teachersTotal=teachers_total, teachersTrained=teachers_trained,
        ragR=rag_r, ragA=rag_a, ragG=rag_g,
        drlSchools=drl_schools, uploadedSchools=uploaded, accessedSchools=accessed,
    )

payload = {
    "generatedAt": "2026-04-24",
    "partner": {
        "name": "Really Great Reading",
        "shortName": "RGR",
        "accountManager": "TEL TED US Team",
        "schoolsUnderManagement": len(schools),
    },
    "kpi": kpi(),
    "schools": schools,
    "teachers": teachers,
    "assessments": assessments,
    "pairedAssessments": paired,
    "yearMap": {k: v[0] for k,v in YEAR_MAP.items()},
}

out = "/sessions/magical-great-wright/mnt/outputs/data.json"
with open(out, "w") as f:
    json.dump(payload, f, separators=(",",":"))
print(f"wrote {out}: {len(open(out).read()):,} bytes")
print(f"  schools={len(schools)} teachers={len(teachers)} assessments={len(assessments)} paired={len(paired)}")
print(f"  KPI: {payload['kpi']}")

# also log the engagement breakdown for sanity
eng_ct = Counter(s["engagement"] for s in schools)
print(f"  engagement: {eng_ct}")
phase_ct = Counter(s["phase"] for s in schools)
print(f"  phase: {phase_ct}")
