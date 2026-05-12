import React, { useCallback, useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import {
  APP_AUTHOR,
  APP_VERSION,
  todayKey,
  defaultTodayTemplates,
  defaultWeeklyPlan,
  timetableRows,
  defaultBlockData,
  defaultProfile,
  defaultProgress,
  defaultProgressOptions,
  defaultYearGoals,
  statuses,
  howOptions,
  normalizeParsedState,
  BACKUP_REMINDER_KEY,
  buildFullDayTasksFromWeeklyPlan,
  buildGentleDayTasksFromTemplates,
  mergeTodayTitlesFromTemplates,
  normalizeSavedTodayTasks,
} from "./constants";
import {
  hydrateAll,
  writeLocalStorageBundle,
  scheduleIndexedDbMirror,
  saveToIndexedDbNow,
} from "./persistence";

const EVIDENCE_TYPES = ["Photo", "Work sample", "Oral response", "Tutor note", "Observation note", "Video/audio note", "Project sample"];

const EVIDENCE_DEFAULT_DESCRIPTION = {
  Photo: "Photo evidence of hands-on, outdoor, practical or project-based learning.",
  "Work sample": "Dated work sample showing current skill level, support needed or progress over time.",
  "Oral response": "Oral response recorded as evidence due to reduced written load or supported communication needs.",
  "Tutor note": "Tutor feedback recorded to support monitoring of English, maths or curriculum progress.",
  "Observation note": "Parent observation recorded to track engagement, independence, confidence or skill development.",
  "Video/audio note": "Video or audio evidence recorded to capture oral response, performance, fluency or participation.",
  "Project sample": "Project sample recorded to show practical, creative, outdoor or real-world learning.",
};

function Card({ children, className = "" }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function GearIcon() {
  return (
    <svg className="gearIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function formatSavedAt(ts) {
  if (!ts) return "…";
  try {
    return new Date(ts).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "…";
  }
}

const PROFILE_FIELDS = [
  ["name", "Name"],
  ["yearLevel", "Year level"],
  ["age", "Age"],
  ["needs", "Learning needs"],
  ["strengths", "Strengths and preferences"],
  ["adjustments", "Helpful adjustments"],
  ["regulation", "Regulation supports"],
  ["literacy", "Literacy focus"],
  ["maths", "Maths focus"],
  ["social", "Social opportunities"],
];

async function exportLearningRecordsPdf(data, showToast) {
  const profile = data.profile || defaultProfile;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 42;
  const usableWidth = pageWidth - margin * 2;
  let y = margin;

  function addPageIfNeeded(extra = 40) {
    if (y + extra > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function writeLine(text = "", size = 10, style = "normal") {
    addPageIfNeeded(size + 10);
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.text(String(text), margin, y);
    y += size + 8;
  }

  function writeWrapped(text = "", size = 10, style = "normal") {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(String(text || ""), usableWidth);
    lines.forEach((line) => writeLine(line, size, style));
  }

  function section(title) {
    y += 8;
    addPageIfNeeded(34);
    doc.setDrawColor(210);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;
    writeLine(title, 14, "bold");
  }

  function field(label, value) {
    writeWrapped(`${label}: ${value || ""}`, 10, "normal");
  }

  doc.setProperties({ title: "EdTrak learning records", author: APP_AUTHOR });
  writeLine("EdTrak Learning Records", 20, "bold");
  writeLine(`Plan year: ${data.planYear || ""} — Generated ${new Date().toLocaleDateString()}`, 10);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(115, 115, 115);
  doc.text(`EdTrak v${APP_VERSION} · Developed by ${APP_AUTHOR} · © ${new Date().getFullYear()} ${APP_AUTHOR}`, margin, y);
  y += 14;
  doc.setTextColor(0, 0, 0);

  section("Learner profile");
  PROFILE_FIELDS.forEach(([key, label]) => field(label, profile[key]));

  const goals = { ...defaultYearGoals, ...(data.yearGoals || {}) };
  section("Year goals");
  Object.entries(goals).forEach(([key, value]) => field(key[0].toUpperCase() + key.slice(1), value));

  const plan = { ...defaultWeeklyPlan, ...(data.weeklyPlan || {}) };
  section("Weekly timetable");
  Object.keys(defaultWeeklyPlan).forEach((day) => {
    writeLine(day, 11, "bold");
    (plan[day] || []).forEach((item, index) => field(timetableRows[index] || `Block ${index + 1}`, item));
    y += 4;
  });

  const savedDays = Object.values(data.todayRecords || {}).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  section("Daily records");
  if (!savedDays.length) {
    writeLine("No daily records saved yet.");
  } else {
    savedDays.forEach((record) => {
      const completed =
        (record.tasks || [])
          .filter((task) => task.done && !task.hidden)
          .map((task) => task.title)
          .join(", ") || "No boxes ticked";
      writeLine(`${record.date} — ${record.rough ? "Gentle day" : "Full day"}`, 11, "bold");
      field("Completed areas", completed);
      y += 4;
    });
  }

  section("Weekly reflections");
  const reflections = data.weeklyReflections || [];
  if (!reflections.length) {
    writeLine("No weekly reflections saved yet.");
  } else {
    reflections.forEach((item) => {
      writeLine(item.date, 11, "bold");
      field("Worked", item.worked);
      field("Hard", item.hard);
      field("Enjoyed", item.enjoyed);
      field("Improved", item.improved);
      field("Repeat", item.repeat);
      field("Tutor", item.tutor);
      field("Next focus", item.focus);
      y += 6;
    });
  }

  section("Evidence notes");
  const evidenceItems = data.evidence || [];
  if (!evidenceItems.length) {
    writeLine("No evidence notes saved yet.");
  } else {
    evidenceItems.forEach((item) => {
      writeLine(`${item.date} — ${item.subject || "Evidence"}${item.block ? ` — ${item.block}` : ""}`, 11, "bold");
      field("Type", `${item.type || ""}${item.formal ? " — Formal sample" : ""}`);
      if (item.fileName) field("File", item.fileName);
      field("Description", item.description);

      if (item.photoDataUrl) {
        try {
          addPageIfNeeded(120);
          doc.addImage(item.photoDataUrl, "JPEG", margin, y, 120, 90);
          y += 100;
        } catch {
          field("Photo", "Photo attached, but it could not be embedded in the PDF.");
        }
      }
      y += 6;
    });
  }

  const creditYear = new Date().getFullYear();
  const lastPage = doc.getNumberOfPages();
  doc.setPage(lastPage);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  doc.text(`EdTrak v${APP_VERSION} · ${APP_AUTHOR} · © ${creditYear} · Personal home-education records.`, margin, pageHeight - 28, {
    maxWidth: usableWidth,
  });
  doc.setTextColor(0, 0, 0);

  const fileName = `edtrak-records-${todayKey()}.pdf`;
  const pdfBlob = doc.output("blob");

  const canUseNativeSave = typeof window.showSaveFilePicker === "function" && window.isSecureContext;

  if (canUseNativeSave) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "PDF document",
            accept: { "application/pdf": [".pdf"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(pdfBlob);
      await writable.close();
      showToast("PDF saved.");
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast(
    canUseNativeSave
      ? "PDF downloaded."
      : "PDF downloaded. For the system Save dialog, open EdTrak in Chrome or Edge over https:// or localhost.",
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("today");
  const [data, setData] = useState(null);
  const [storageReady, setStorageReady] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [toast, setToast] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dataRef = useRef(null);
  const settingsAreaRef = useRef(null);
  const quotaWarnedRef = useRef(false);
  dataRef.current = data;

  const showToast = useCallback((message, durationMs = 1800) => {
    setToast(message);
    window.setTimeout(() => setToast(""), durationMs);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void hydrateAll().then((result) => {
      if (cancelled) return;
      setData(result.state);
      setLastSavedAt(result.savedAt);
      setStorageReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!storageReady || data == null) return;
    const json = JSON.stringify(data);
    const savedAt = Date.now();
    try {
      writeLocalStorageBundle(json, savedAt);
      setSaveError(null);
      quotaWarnedRef.current = false;
    } catch (error) {
      const full =
        error?.code === 22 || error?.name === "QuotaExceededError" || String(error?.message || "").includes("quota");
      setSaveError(full ? "Device storage is full" : error?.message || "Could not save");
      if (!quotaWarnedRef.current) {
        quotaWarnedRef.current = true;
        showToast("Save failed — use the gear menu to download a JSON backup.", 5500);
      }
    }
    scheduleIndexedDbMirror(json, savedAt);
    setLastSavedAt(savedAt);
  }, [data, storageReady, showToast]);

  useEffect(() => {
    if (!storageReady) return;
    function flush() {
      const current = dataRef.current;
      if (current == null) return;
      const json = JSON.stringify(current);
      const savedAt = Date.now();
      void saveToIndexedDbNow(json, savedAt);
      try {
        writeLocalStorageBundle(json, savedAt);
        setSaveError(null);
      } catch (error) {
        const full =
          error?.code === 22 || error?.name === "QuotaExceededError" || String(error?.message || "").includes("quota");
        setSaveError(full ? "Device storage is full" : error?.message || "Could not save");
      }
      setLastSavedAt(savedAt);
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") flush();
    }
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", flush);
    };
  }, [storageReady]);

  /** At most one gentle nudge per ~7 days to download a JSON backup (skipped on very first open). */
  useEffect(() => {
    if (!storageReady) return;
    try {
      const raw = localStorage.getItem(BACKUP_REMINDER_KEY);
      const last = raw ? Number.parseInt(raw, 10) : 0;
      const now = Date.now();
      const weekMs = 7 * 24 * 60 * 60 * 1000;
      if (!Number.isFinite(last) || last <= 0) {
        localStorage.setItem(BACKUP_REMINDER_KEY, String(now));
        return;
      }
      if (now - last >= weekMs) {
        showToast("Reminder: use the gear menu → Data → Download to keep a JSON backup of your records. Once a week is a good habit.", 6500);
        localStorage.setItem(BACKUP_REMINDER_KEY, String(now));
      }
    } catch {
      /* ignore */
    }
  }, [storageReady, showToast]);

  useEffect(() => {
    if (!settingsOpen) return;
    function handlePointerDown(event) {
      if (settingsAreaRef.current && !settingsAreaRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [settingsOpen]);

  if (!storageReady || data == null) {
    return (
      <div className="app">
        <style>{styles}</style>
        <div className="loadingScreen" role="status">
          <p className="loadingTitle">EdTrak</p>
          <p className="loadingSub">Loading your saved data…</p>
        </div>
      </div>
    );
  }

  const tabs = [
    ["today", "Today"],
    ["week", "Week"],
    ["blocks", "Blocks"],
    ["evidence", "Evidence"],
    ["progress", "Progress"],
    ["profile", "Profile"],
    ["setup", "Setup"],
    ["readme", "Read me"],
  ];

  return (
    <div className="app">
      <style>{styles}</style>

      <header className="header">
        <div>
          <h1>EdTrak</h1>
        </div>

        <div className="settingsArea" ref={settingsAreaRef}>
          <div className="headerActions">
            <span
              className={`saveStatusText ${saveError ? "saveStatusTextError" : ""}`}
              title={
                saveError
                  ? `${saveError}. Your data is still in this session — use the gear menu to download a JSON backup.`
                  : `Last saved ${lastSavedAt ? formatSavedAt(lastSavedAt) : "—"}. A backup copy is also kept in this browser.`
              }
              aria-live="polite"
            >
              {saveError ? "Can't save" : "Saved"}
            </span>
            <button
              type="button"
              className="gearButton"
              onClick={() => setSettingsOpen(!settingsOpen)}
              aria-label="Open menu"
              aria-expanded={settingsOpen}
            >
              <GearIcon />
            </button>
          </div>

          {settingsOpen ? (
            <div className="settingsMenu">
              <GearMenuTopSection data={data} setData={setData} showToast={showToast} normalizeParsedState={normalizeParsedState} />
            </div>
          ) : null}
        </div>
      </header>

      <nav className="nav">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" className={activeTab === id ? "navButton active" : "navButton"} onClick={() => setActiveTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      <main className="main">
        {activeTab === "today" && <TodayTab data={data} setData={setData} showToast={showToast} />}
        {activeTab === "week" && <WeekTab data={data} setData={setData} showToast={showToast} />}
        {activeTab === "blocks" && <BlocksTab data={data} setData={setData} showToast={showToast} />}
        {activeTab === "evidence" && <EvidenceTab data={data} setData={setData} showToast={showToast} />}
        {activeTab === "progress" && <ProgressTab data={data} setData={setData} showToast={showToast} />}
        {activeTab === "profile" && <ProfileTab data={data} setData={setData} showToast={showToast} />}
        {activeTab === "setup" && <PlanSetupTab data={data} setData={setData} showToast={showToast} />}
        {activeTab === "readme" && <ReadmeTab />}
      </main>

      <footer className="appFooter">
        EdTrak v{APP_VERSION} · Developed by {APP_AUTHOR} · © {new Date().getFullYear()} {APP_AUTHOR}
      </footer>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}

function GearMenuTopSection({ data, setData, showToast, normalizeParsedState: normalize }) {
  const importInputRef = useRef(null);

  function exportJsonBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `edtrak-records-backup-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    try {
      localStorage.setItem(BACKUP_REMINDER_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    showToast("Backup file downloaded.", 2200);
  }

  function handleImportBackup(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        const next = normalize(parsed);
        if (!window.confirm("Replace all data in this browser with this backup? You cannot undo this.")) return;
        setData(next);
        showToast("Backup imported.", 2200);
      } catch {
        showToast("That file is not a valid EdTrak backup.", 3500);
      }
    };
    reader.readAsText(file);
  }

  function resetWeeklyTimetable() {
    if (!window.confirm("Reset the weekly timetable to the suggested default?")) return;
    setData({ ...data, weeklyPlan: defaultWeeklyPlan });
    showToast("Weekly timetable reset.");
  }

  function resetTodayTemplates() {
    if (!window.confirm("Reset Full day and Gentle day default cards to the originals? Future days only; saved days are unchanged.")) return;
    setData({ ...data, todayTemplates: defaultTodayTemplates });
    showToast("Today defaults reset.");
  }

  function resetPlanDraft() {
    if (
      !window.confirm(
        "Reset study blocks, year goals, and reflection dropdown presets to the built-in Year 2 draft? Your records, evidence, and profile stay as they are.",
      )
    )
      return;
    setData({
      ...data,
      blockData: defaultBlockData,
      yearGoals: defaultYearGoals,
      progressOptions: defaultProgressOptions,
    });
    showToast("Plan draft reset.");
  }

  return (
    <div className="settingsMenuTop">
      <p className="settingsMenuSectionLabel">Report</p>
      <button type="button" className="menuActionPrimary" onClick={() => void exportLearningRecordsPdf(data, showToast)}>
        Export PDF
      </button>

      <p className="settingsMenuSectionLabel settingsMenuSectionSpaced">Data</p>
      <div className="settingsMenuCard">
        <input ref={importInputRef} type="file" accept="application/json,.json" className="visuallyHidden" onChange={handleImportBackup} tabIndex={-1} />
        <div className="menuBackupGrid">
          <button type="button" className="menuActionSecondary" onClick={exportJsonBackup}>
            Download
          </button>
          <button type="button" className="menuActionSecondary" onClick={() => importInputRef.current?.click()}>
            Restore…
          </button>
        </div>
      </div>

      <p className="settingsMenuSectionLabel settingsMenuSectionSpaced">Reset to defaults</p>
      <div className="menuResetStack">
        <button type="button" className="menuActionSecondary menuResetFull" onClick={resetWeeklyTimetable}>
          Weekly timetable
        </button>
        <button type="button" className="menuActionSecondary menuResetFull" onClick={resetTodayTemplates}>
          Today card defaults
        </button>
        <button type="button" className="menuActionSecondary menuResetFull" onClick={resetPlanDraft}>
          Plan & reflection presets
        </button>
      </div>
    </div>
  );
}

function TodayTaskEvidencePanel({ task, date, data, setData, showToast }) {
  const subjectLabel = task.category || task.title || "English";

  const [draft, setDraft] = useState({
    type: "Observation note",
    description: EVIDENCE_DEFAULT_DESCRIPTION["Observation note"],
    formal: false,
    fileName: "",
    photoDataUrl: "",
  });

  function changeType(type) {
    setDraft((d) => ({
      ...d,
      type,
      description: EVIDENCE_DEFAULT_DESCRIPTION[type] || d.description,
      fileName: type === "Photo" ? d.fileName : "",
      photoDataUrl: type === "Photo" ? d.photoDataUrl : "",
    }));
  }

  function handlePhoto(event) {
    const input = event.currentTarget;
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const photoDataUrl = String(reader.result || "");
      setDraft((d) => ({
        ...d,
        type: "Photo",
        fileName: file.name,
        photoDataUrl,
      }));
      input.value = "";
    };
    reader.readAsDataURL(file);
  }

  function addEvidenceForTask() {
    setData({
      ...data,
      evidence: [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          date,
          subject: subjectLabel,
          block: "",
          type: draft.type,
          description: draft.description,
          formal: draft.formal,
          fileName: draft.fileName || "",
          photoDataUrl: draft.photoDataUrl || "",
        },
        ...(data.evidence || []),
      ],
    });
    showToast("Evidence saved.");
    setDraft({
      type: "Observation note",
      description: EVIDENCE_DEFAULT_DESCRIPTION["Observation note"],
      formal: false,
      fileName: "",
      photoDataUrl: "",
    });
  }

  return (
    <details className="noteDetails todayEvidenceAdd">
      <summary>Add evidence</summary>
      <div className="todayEvidenceForm">
        <label className="fieldLabel compactField">
          Type
          <select value={draft.type} onChange={(event) => changeType(event.target.value)}>
            {EVIDENCE_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        {draft.type === "Photo" ? (
          <div className="photoBox">
            <input type="file" accept="image/*" onChange={handlePhoto} />
            {draft.fileName ? <p className="smallHelp">Selected: {draft.fileName}</p> : <p className="smallHelp">Choose a photo from this device.</p>}
            {draft.photoDataUrl ? <img className="photoPreview" src={draft.photoDataUrl} alt="Evidence preview" /> : null}
          </div>
        ) : null}
        <label className="fieldLabel compactField">
          Description
          <textarea className="todayEvidenceTextarea" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
        </label>
        <label className="inlineCheck formalInline">
          <input type="checkbox" checked={draft.formal} onChange={(event) => setDraft({ ...draft, formal: event.target.checked })} />
          <span>Use as formal sample</span>
        </label>
        <button type="button" className="secondaryButton todayEvidenceSaveButton" onClick={addEvidenceForTask}>
          Add evidence
        </button>
      </div>
    </details>
  );
}

function TodayTab({ data, setData, showToast }) {
  const date = todayKey();
  const savedToday = data.todayRecords?.[date];
  const hasPersistedToday = Boolean(savedToday && Array.isArray(savedToday.tasks));

  const [rough, setRough] = useState(() => (hasPersistedToday ? Boolean(savedToday.rough) : false));
  const [tasks, setTasks] = useState(() =>
    hasPersistedToday
      ? mergeTodayTitlesFromTemplates(
          normalizeSavedTodayTasks(savedToday.tasks),
          data,
          Boolean(savedToday.rough),
        )
      : buildFullDayTasksFromWeeklyPlan(data),
  );

  const persistedSyncKey =
    savedToday && Array.isArray(savedToday.tasks)
      ? `${savedToday.savedAt ?? "legacy"}:${savedToday.tasks.length}:${savedToday.rough}`
      : "";

  /** Content key so template / week edits always re-merge into live cards (object refs alone can miss updates). */
  const livePlanTemplatesKey = JSON.stringify({
    w: data.weeklyPlan ?? null,
    t: data.todayTemplates ?? null,
  });

  /* When today's saved record appears or updates, sync mode from storage. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const rec = data.todayRecords?.[date];
    if (rec && Array.isArray(rec.tasks)) {
      setRough(Boolean(rec.rough));
    }
  }, [date, persistedSyncKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* Merge latest template/week labels into cards; saved rows keep done, notes, etc. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const rec = data.todayRecords?.[date];
    if (rec && Array.isArray(rec.tasks)) {
      setTasks(mergeTodayTitlesFromTemplates(normalizeSavedTodayTasks(rec.tasks), data, rough));
      return;
    }
    setTasks(rough ? buildGentleDayTasksFromTemplates(data) : buildFullDayTasksFromWeeklyPlan(data));
  }, [date, rough, livePlanTemplatesKey, persistedSyncKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function setDayMode(mode) {
    const nextRough = mode === "gentle";
    setRough(nextRough);
    setTasks(nextRough ? buildGentleDayTasksFromTemplates(data) : buildFullDayTasksFromWeeklyPlan(data));
  }

  function updateTask(index, patch) {
    setTasks(tasks.map((task, taskIndex) => (taskIndex === index ? { ...task, ...patch } : task)));
  }

  function saveToday() {
    const evidenceItems = tasks
      .filter((task) => task.evidence && !task.hidden)
      .map((task) => ({
        id: `${Date.now()}-${task.id}`,
        date,
        subject: task.category || task.title,
        block: "",
        type: "Observation note",
        description: task.note,
        formal: false,
      }));

    setData({
      ...data,
      todayRecords: {
        ...data.todayRecords,
        [date]: { date, rough, tasks, savedAt: new Date().toISOString() },
      },
      evidence: [...evidenceItems, ...(data.evidence || [])],
    });

    showToast("Saved. That’s enough for today.");
  }

  return (
    <div className="stack">
      <div className="topRow">
        <div className="tabHeader">
          <h2>Today</h2>
          <p className="muted">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <div className="modeSwitch" aria-label="Choose learning day mode">
          <button type="button" className={!rough ? "modeButton selected" : "modeButton"} onClick={() => setDayMode("full")}>
            Full day
          </button>
          <button type="button" className={rough ? "modeButton selected" : "modeButton"} onClick={() => setDayMode("gentle")}>
            Gentle day
          </button>
        </div>
      </div>

      <div className="taskGrid">
        {tasks.map((task, index) => (
          <Card key={task.id || `${task.title}-${index}`} className={task.hidden ? "taskCardMin" : ""}>
            {task.hidden ? (
              <div className="taskCollapsedRow">
                <label className="checkLabel">
                  <input type="checkbox" checked={task.done} onChange={(event) => updateTask(index, { done: event.target.checked })} />
                  <strong className="taskCollapsedTitle">{task.title}</strong>
                </label>
                <button type="button" className="taskRevealButton" onClick={() => updateTask(index, { hidden: false })}>
                  Show
                </button>
              </div>
            ) : (
              <>
                <div className="taskHeader">
                  <div className="taskTopLine">
                    <label className="checkLabel">
                      <input type="checkbox" checked={task.done} onChange={(event) => updateTask(index, { done: event.target.checked })} />
                      <strong>{task.title}</strong>
                    </label>
                    <button
                      type="button"
                      className="taskHideButton"
                      onClick={() => updateTask(index, { hidden: true })}
                      aria-label={`Hide ${task.title} card`}
                    >
                      Hide
                    </button>
                  </div>
                  <label className="inlineCheck taskEvidenceOption">
                    <input type="checkbox" checked={task.evidence} onChange={(event) => updateTask(index, { evidence: event.target.checked })} />
                    Save as evidence
                  </label>
                  <input
                    className="activityLine"
                    value={task.activity || ""}
                    onChange={(event) => updateTask(index, { activity: event.target.value })}
                    placeholder="What we did:"
                  />
                  <select value={task.how} onChange={(event) => updateTask(index, { how: event.target.value })}>
                    {howOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <details className="noteDetails">
                  <summary>Edit note</summary>
                  <textarea value={task.note || ""} onChange={(event) => updateTask(index, { note: event.target.value })} />
                </details>

                <TodayTaskEvidencePanel task={task} date={date} data={data} setData={setData} showToast={showToast} />
              </>
            )}
          </Card>
        ))}
      </div>

      <button type="button" className="primaryButton" onClick={saveToday}>
        Save Today
      </button>

      <TodayTemplateEditor data={data} setData={setData} showToast={showToast} />
    </div>
  );
}

function TodayTemplateEditor({ data, setData, showToast }) {
  const templates = {
    full: Array.isArray(data.todayTemplates?.full) ? data.todayTemplates.full : defaultTodayTemplates.full,
    gentle: Array.isArray(data.todayTemplates?.gentle) ? data.todayTemplates.gentle : defaultTodayTemplates.gentle,
  };

  function updateTemplate(mode, index, field, value) {
    const list = Array.isArray(templates[mode]) ? templates[mode] : [];
    const currentModeTasks = list.map((t, i) =>
      i === index ? { ...(t || {}), [field]: value } : { ...(t || {}) },
    );

    setData({
      ...data,
      todayTemplates: {
        ...templates,
        [mode]: currentModeTasks,
      },
    });
  }

  function resetTemplates() {
    setData({ ...data, todayTemplates: defaultTodayTemplates });
    showToast("Today defaults reset.");
  }

  return (
    <details className="templateEditor">
      <summary>Edit Today defaults</summary>
      <p className="smallHelp">
        Change the default cards for Full day and Gentle day. Updates apply to <strong>Today</strong> right away until you tap Save Today. For Full day, the{" "}
        <strong>first four card titles</strong> copy the <strong>Week</strong> timetable when that block has text — use this editor for the <strong>activity</strong> and{" "}
        <strong>note</strong> lines (and for titles when a timetable cell is empty). This will not rewrite days already saved.
      </p>

      <div className="templateGrid">
        <Card>
          <h3>Full day defaults</h3>
          {(Array.isArray(templates.full) ? templates.full : []).map((task, index) => (
            <div className="templateItem" key={task.id || index}>
              <input value={task.title || ""} onChange={(event) => updateTemplate("full", index, "title", event.target.value)} aria-label="Full day task title" />
              <input
                value={task.activity || ""}
                onChange={(event) => updateTemplate("full", index, "activity", event.target.value)}
                aria-label="Full day what we did line"
                placeholder="What we did:"
              />
              <textarea value={task.note || ""} onChange={(event) => updateTemplate("full", index, "note", event.target.value)} aria-label="Full day default note" />
            </div>
          ))}
        </Card>

        <Card>
          <h3>Gentle day defaults</h3>
          {(Array.isArray(templates.gentle) ? templates.gentle : []).map((task, index) => (
            <div className="templateItem" key={task.id || index}>
              <input value={task.title || ""} onChange={(event) => updateTemplate("gentle", index, "title", event.target.value)} aria-label="Gentle day task title" />
              <input
                value={task.activity || ""}
                onChange={(event) => updateTemplate("gentle", index, "activity", event.target.value)}
                aria-label="Gentle day what we did line"
                placeholder="What we did:"
              />
              <textarea value={task.note || ""} onChange={(event) => updateTemplate("gentle", index, "note", event.target.value)} aria-label="Gentle day default note" />
            </div>
          ))}
        </Card>
      </div>

      <button type="button" className="secondaryButton" onClick={resetTemplates}>
        Reset Today defaults
      </button>
    </details>
  );
}

function WeekTab({ data, setData }) {
  const savedDates = Object.keys(data.todayRecords || {});
  const plan = { ...defaultWeeklyPlan, ...(data.weeklyPlan || {}) };
  const days = Object.keys(defaultWeeklyPlan);

  function wasSavedThisWeek(day) {
    const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const now = new Date();
    const target = weekDays.indexOf(day);
    const current = now.getDay();
    const date = new Date(now);
    date.setDate(now.getDate() + (target - current));
    return savedDates.includes(date.toISOString().slice(0, 10));
  }

  function updateCell(day, rowIndex, value) {
    const nextPlan = { ...plan, [day]: [...(plan[day] || [])] };
    nextPlan[day][rowIndex] = value;
    setData({ ...data, weeklyPlan: nextPlan });
  }

  return (
    <div className="stack">
      <div className="tabHeader">
        <h2>Weekly Timetable</h2>
        <p className="muted">Editable. Today’s Full day pulls from this weekday until you save.</p>
      </div>

      <div className="timetableWrap">
        <table className="timetable">
          <thead>
            <tr>
              <th>Time</th>
              {days.map((day) => (
                <th key={day}>
                  <div>{day}</div>
                  {wasSavedThisWeek(day) ? <span className="pill">saved</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timetableRows.map((rowLabel, rowIndex) => (
              <tr key={rowLabel}>
                <td className="timeCell">{rowLabel}</td>
                {days.map((day) => (
                  <td key={`${day}-${rowIndex}`}>
                    <textarea
                      className="timetableInput"
                      value={(plan[day] || [])[rowIndex] || ""}
                      onChange={(event) => updateCell(day, rowIndex, event.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BlocksTab({ data, setData, showToast }) {
  const activeBlockData = data.blockData || defaultBlockData;
  const [block, setBlock] = useState(Object.keys(activeBlockData)[0] || "A");
  const currentBlock = activeBlockData[block] || {};

  function updateStatus(subject, value) {
    setData({ ...data, blockStatus: { ...(data.blockStatus || {}), [`${block}-${subject}`]: value } });
  }

  function updateNote(subject, value) {
    setData({ ...data, blockNotes: { ...(data.blockNotes || {}), [`${block}-${subject}`]: value } });
  }

  function updateBlockSubject(subject, index, value) {
    const nextBlockData = JSON.parse(JSON.stringify(activeBlockData));
    const row = nextBlockData[block]?.[subject];
    if (!row) return;
    const nextRow = [...row];
    nextRow[index] = value;
    nextBlockData[block][subject] = nextRow;
    setData({ ...data, blockData: nextBlockData });
  }

  return (
    <div className="stack">
      <div className="tabHeader">
        <h2>Study Blocks</h2>
        <p className="muted">The plan, kept visible and editable.</p>
      </div>

      <div className="blockButtons">
        {Object.keys(activeBlockData).map((item) => (
          <button key={item} type="button" className={block === item ? "blockButton selected" : "blockButton"} onClick={() => setBlock(item)}>
            Block {item}
          </button>
        ))}
      </div>

      <div className="gridTwo">
        {Object.entries(currentBlock).map(([subject, details]) => {
          const key = `${block}-${subject}`;
          const focusText = details?.[0] ?? "";
          const activitiesText = details?.[1] ?? "";
          return (
            <Card key={subject}>
              <h3>{subject}</h3>
              <label className="fieldLabel">
                Focus
                <textarea className="blockCardTextarea" value={focusText} onChange={(event) => updateBlockSubject(subject, 0, event.target.value)} />
              </label>
              <label className="fieldLabel">
                Activities
                <textarea className="blockCardTextarea" value={activitiesText} onChange={(event) => updateBlockSubject(subject, 1, event.target.value)} />
              </label>
              <select value={(data.blockStatus || {})[key] || "Not started"} onChange={(event) => updateStatus(subject, event.target.value)}>
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
              <details className="noteDetails compactNote">
                <summary>Optional note</summary>
                <textarea placeholder="Optional note" value={(data.blockNotes || {})[key] || ""} onChange={(event) => updateNote(subject, event.target.value)} />
              </details>
            </Card>
          );
        })}
      </div>

      <button type="button" className="primaryButton" onClick={() => showToast("Block progress saved.")}>
        Done
      </button>
    </div>
  );
}

function EvidenceTab({ data, setData, showToast }) {
  const [item, setItem] = useState({
    date: todayKey(),
    subject: "English",
    block: "",
    type: "Observation note",
    description: EVIDENCE_DEFAULT_DESCRIPTION["Observation note"],
    formal: false,
    fileName: "",
    photoDataUrl: "",
  });

  const subjects = ["English", "Mathematics", "Science", "HASS", "Arts", "Technologies", "HPE", "Japanese", "Wellbeing", "Project"];

  function changeType(type) {
    setItem({
      ...item,
      type,
      description: EVIDENCE_DEFAULT_DESCRIPTION[type] || item.description,
      fileName: type === "Photo" ? item.fileName : "",
      photoDataUrl: type === "Photo" ? item.photoDataUrl : "",
    });
  }

  function handlePhoto(event) {
    const input = event.currentTarget;
    const file = input.files && input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const photoDataUrl = String(reader.result || "");
      setItem((prev) => ({
        ...prev,
        type: "Photo",
        fileName: file.name,
        photoDataUrl,
      }));
      input.value = "";
    };
    reader.readAsDataURL(file);
  }

  function addEvidence() {
    setData({ ...data, evidence: [{ ...item, id: Date.now().toString() }, ...(data.evidence || [])] });
    showToast("Evidence note saved.");
  }

  function deleteEvidence(id) {
    setData({ ...data, evidence: (data.evidence || []).filter((evidence) => evidence.id !== id) });
    showToast("Evidence deleted.");
  }

  return (
    <div className="stack">
      <div className="tabHeader">
        <h2>Evidence</h2>
      </div>

      {(data.evidence || []).length === 0 ? (
        <Card>
          <p>No evidence yet. Open <strong>Add new evidence</strong> below when you need it.</p>
        </Card>
      ) : (
        (data.evidence || []).map((evidence) => (
          <Card key={evidence.id} className="evidenceCard">
            <button type="button" className="deleteButton" onClick={() => deleteEvidence(evidence.id)} aria-label="Delete evidence item">
              ×
            </button>
            <div className="between evidenceHeader">
              <p className="label">
                {evidence.date} · {evidence.subject} {evidence.block ? `· ${evidence.block}` : ""}
              </p>
              {evidence.formal ? <span className="pill">sample</span> : null}
            </div>
            <h3>{evidence.type}</h3>
            {evidence.photoDataUrl ? <img className="evidenceThumb" src={evidence.photoDataUrl} alt="Evidence" /> : null}
            {evidence.fileName ? <p className="smallHelp">File: {evidence.fileName}</p> : null}
            <p>{evidence.description}</p>
          </Card>
        ))
      )}

      <details className="templateEditor evidenceAddForm">
        <summary>Add new evidence</summary>
        <div className="evidenceAddFormFields">
          <div className="gridTwo">
            <input type="date" value={item.date} onChange={(event) => setItem({ ...item, date: event.target.value })} />
            <select value={item.subject} onChange={(event) => setItem({ ...item, subject: event.target.value })}>
              {subjects.map((subject) => (
                <option key={subject}>{subject}</option>
              ))}
            </select>
            <select value={item.block} onChange={(event) => setItem({ ...item, block: event.target.value })}>
              <option value="">No block selected</option>
              <option>Block A</option>
              <option>Block B</option>
              <option>Block C</option>
              <option>Block D</option>
            </select>
            <select value={item.type} onChange={(event) => changeType(event.target.value)}>
              {EVIDENCE_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </div>

          {item.type === "Photo" ? (
            <div className="photoBox">
              <input type="file" accept="image/*" onChange={handlePhoto} />
              {item.fileName ? <p className="smallHelp">Selected: {item.fileName}</p> : <p className="smallHelp">Choose a photo from this device.</p>}
              {item.photoDataUrl ? <img className="photoPreview" src={item.photoDataUrl} alt="Selected evidence preview" /> : null}
            </div>
          ) : null}

          <textarea value={item.description} onChange={(event) => setItem({ ...item, description: event.target.value })} />
          <label className="inlineCheck formalInline">
            <input type="checkbox" checked={item.formal} onChange={(event) => setItem({ ...item, formal: event.target.checked })} />
            <span>Use as formal sample</span>
          </label>
          <button type="button" className="primaryButton" onClick={addEvidence}>
            Add evidence
          </button>
        </div>
      </details>
    </div>
  );
}

function ProgressTab({ data, setData, showToast }) {
  const options = { ...defaultProgressOptions, ...(data.progressOptions || {}) };
  const [form, setForm] = useState(defaultProgress);
  const [customOpen, setCustomOpen] = useState({});
  const fields = [
    ["worked", "What worked this week?"],
    ["hard", "What was hard?"],
    ["enjoyed", "What did Fox enjoy?"],
    ["improved", "What improved?"],
    ["repeat", "What needs repeating?"],
    ["tutor", "Tutor notes"],
    ["focus", "Focus for next week"],
  ];

  function chooseProgress(key, value) {
    if (value === "Custom response") {
      setCustomOpen({ ...customOpen, [key]: true });
      return;
    }

    setForm({ ...form, [key]: value });
    setCustomOpen({ ...customOpen, [key]: false });
  }

  function save() {
    setData({
      ...data,
      weeklyReflections: [{ ...form, id: Date.now().toString(), date: todayKey() }, ...(data.weeklyReflections || [])],
    });
    showToast("Weekly reflection saved.");
  }

  function deleteReflection(reflection, index) {
    const list = data.weeklyReflections || [];
    const next =
      reflection.id != null && reflection.id !== ""
        ? list.filter((r) => r.id !== reflection.id)
        : list.filter((_, i) => i !== index);
    setData({ ...data, weeklyReflections: next });
    showToast("Reflection removed.");
  }

  return (
    <div className="stack">
      <div className="tabHeader">
        <h2>Progress</h2>
        <p className="muted">Quick dropdowns. Choose the closest fit, then tweak only if needed.</p>
      </div>

      <Card>
        <div className="progressGrid">
          {fields.map(([key, label]) => (
            <label key={key} className="fieldLabel compactField">
              {label}
              <select value={(options[key] || []).includes(form[key]) ? form[key] : "Custom response"} onChange={(event) => chooseProgress(key, event.target.value)}>
                {(options[key] || ["Custom response"]).map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              {customOpen[key] || !(options[key] || []).includes(form[key]) ? <textarea value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /> : null}
            </label>
          ))}
        </div>
        <button type="button" className="primaryButton" onClick={save}>
          Save weekly reflection
        </button>
      </Card>

      <ProgressPresetsEditor data={data} setData={setData} />

      {(data.weeklyReflections || []).map((reflection, index) => (
        <Card key={reflection.id || `reflection-${index}`} className="reflectionCard">
          <button type="button" className="deleteButton" onClick={() => deleteReflection(reflection, index)} aria-label="Delete reflection">
            ×
          </button>
          <p className="label">{reflection.date}</p>
          <p>
            <strong>Worked:</strong> {reflection.worked}
          </p>
          <p>
            <strong>Hard:</strong> {reflection.hard}
          </p>
          <p>
            <strong>Enjoyed:</strong> {reflection.enjoyed}
          </p>
          <p>
            <strong>Improved:</strong> {reflection.improved}
          </p>
          <p>
            <strong>Repeat:</strong> {reflection.repeat}
          </p>
          <p>
            <strong>Tutor:</strong> {reflection.tutor}
          </p>
          <p>
            <strong>Next focus:</strong> {reflection.focus}
          </p>
        </Card>
      ))}
    </div>
  );
}

function ProgressPresetsEditor({ data, setData }) {
  const options = { ...defaultProgressOptions, ...(data.progressOptions || {}) };

  function updateProgressOption(group, index, value) {
    const nextOptions = JSON.parse(JSON.stringify(options));
    nextOptions[group][index] = value;
    setData({ ...data, progressOptions: nextOptions });
  }

  return (
    <Card>
      <details className="noteDetails progressPresetsDetails">
        <summary>Edit reflection choices</summary>
        <p className="smallHelp">Edit the preset lines in each list. Keep “Custom response” as the last option.</p>
        {Object.entries(options).map(([group, list]) => (
          <details className="settingsDetails" key={group}>
            <summary>{group[0].toUpperCase() + group.slice(1)}</summary>
            {list.map((value, index) => (
              <input key={`${group}-${index}`} className="optionInput" value={value} onChange={(event) => updateProgressOption(group, index, event.target.value)} />
            ))}
          </details>
        ))}
      </details>
    </Card>
  );
}

function ReadmeTab() {
  return (
    <div className="stack readMeTab">
      <div className="tabHeader">
        <h2>Read me</h2>
      </div>

      <Card>
        <h3>Gear menu</h3>
        <p>
          <strong>Export PDF</strong> — it's good to do weekly. It downloads one file with profile, goals, week plan, saved days, reflections, and evidence. Saves to your device.
        </p>
        <p>
          <strong>Download</strong> / <strong>Restore…</strong> — full backup of your data. Download often and keep the file somewhere safe. It restores data.
        </p>
        <p>
          About <strong>once a week</strong> you may see a short reminder to download. Doing a download resets that. It’s a prompt, not a cloud backup.
        </p>
        <p>
          <strong>Reset to defaults</strong> — puts starter text back for that area only (you confirm). Your saved days, evidence, and profile are not wiped by these.
        </p>
      </Card>

      <Card>
        <h3>Today</h3>
        <p>
          Fill the cards, then <strong>Save Today</strong>. Tick <strong>Save as evidence</strong> if you want that note copied to Evidence when you save.
        </p>
        <p>
          <strong>Full day</strong> vs <strong>Gentle day</strong> swaps the card set. The big tick = “we did this today” and is what the PDF lists as completed. <strong>Hide</strong> shrinks a card; it
          won’t count as completed or go to evidence on save until you show it again.
        </p>
        <p className="smallHelp muted">
          On Full day, the first four cards match <strong>today’s column</strong> in Week when those cells have text; the rest follow your Today defaults.
        </p>
      </Card>

      <Card>
        <h3>Your data</h3>
        <p>
          It lives <strong>in this browser</strong>. <strong>Saved</strong> means it wrote OK. PDF and Download are the only things that leave your device as files you choose.
        </p>
      </Card>

      <Card>
        <h3>Week</h3>
        <p>Your week-at-a-glance. It fills in the first four Full-day cards for that weekday and goes in the PDF.</p>
      </Card>

      <Card>
        <h3>Evidence</h3>
        <p>Saved items are listed first. Open <strong>Add new evidence</strong> when you need the form, or add from each Today card.</p>
      </Card>

      <Card>
        <h3>Progress</h3>
        <p>Weekly reflection. Saved entries show in the PDF; you can delete old ones on that tab.</p>
      </Card>

      <Card>
        <h3>Blocks &amp; Setup</h3>
        <p>
          <strong>Blocks</strong> — track the current block. <strong>Setup</strong> — goals, block text, year, archives. <strong>Start new year</strong> downloads a copy and clears that year’s days,
          evidence, and reflections in the app.
        </p>
      </Card>

      <Card>
        <h3>Profile</h3>
        <p>Learner info for the PDF. Tap save when you change it.</p>
      </Card>
    </div>
  );
}

function PlanSetupTab({ data, setData, showToast }) {
  const [block, setBlock] = useState(Object.keys(data.blockData || defaultBlockData)[0] || "A");
  const activeBlockData = data.blockData || defaultBlockData;
  const goals = { ...defaultYearGoals, ...(data.yearGoals || {}) };
  const blockSubjects = activeBlockData[block] || {};

  function updatePlanYear(value) {
    setData({ ...data, planYear: value });
  }

  function updateGoal(key, value) {
    setData({ ...data, yearGoals: { ...goals, [key]: value } });
  }

  function updateBlockSubject(subject, index, value) {
    const nextBlockData = JSON.parse(JSON.stringify(activeBlockData));
    nextBlockData[block][subject][index] = value;
    setData({ ...data, blockData: nextBlockData });
  }

  function startNewYear() {
    if (
      !window.confirm(
        "Start a new learning year?\n\n" +
          "• A backup file of the year you are closing will download to this device.\n" +
          "• Daily records, evidence, weekly reflections, and block progress will be cleared in the app (the file and in-app Archives still keep a copy of that year).\n" +
          "• Plan year will advance by one year; your profile, blocks, and goals stay until you edit them.\n\n" +
          "Are you sure you want to continue?",
      )
    ) {
      return;
    }

    const archive = {
      id: Date.now().toString(),
      label: `Archived ${data.planYear || "learning year"}`,
      createdAt: new Date().toISOString(),
      todayRecords: data.todayRecords || {},
      evidence: data.evidence || [],
      weeklyReflections: data.weeklyReflections || [],
      blockStatus: data.blockStatus || {},
      blockNotes: data.blockNotes || {},
      profile: data.profile || defaultProfile,
      weeklyPlan: data.weeklyPlan || defaultWeeklyPlan,
      todayTemplates: data.todayTemplates || defaultTodayTemplates,
      blockData: activeBlockData,
      yearGoals: goals,
      planYear: data.planYear || "",
    };

    const filePayload = {
      format: "edtrak-year-archive",
      version: 1,
      exportedAt: new Date().toISOString(),
      archive,
    };
    const blob = new Blob([JSON.stringify(filePayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const yearSlug = String(archive.planYear || "year").replace(/[/\\?%*:|"<>]/g, "-");
    link.download = `edtrak-year-archive-${yearSlug}-${todayKey()}.json`;
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setData({
      ...data,
      archives: [archive, ...(data.archives || [])],
      todayRecords: {},
      evidence: [],
      weeklyReflections: [],
      blockStatus: {},
      blockNotes: {},
      planYear: String(Number(data.planYear || new Date().getFullYear()) + 1),
    });
    showToast("Year archived — backup file saved. New year started.");
  }

  return (
    <div className="stack">
      <div className="planSetupHeaderRow">
        <div className="tabHeader">
          <h2>Plan Setup</h2>
          <p className="muted">Use this at the start of each year.</p>
        </div>
        <button type="button" className="secondaryButton planSetupYearButton" onClick={startNewYear}>
          Start new year
        </button>
      </div>

      <Card>
        <label className="fieldLabel">
          Plan year
          <input value={data.planYear || ""} onChange={(event) => updatePlanYear(event.target.value)} />
        </label>
        <div className="gridTwo">
          {Object.entries(goals).map(([key, value]) => (
            <label key={key} className="fieldLabel">
              {key[0].toUpperCase() + key.slice(1)} goal
              <textarea value={value} onChange={(event) => updateGoal(key, event.target.value)} />
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <div className="between">
          <div>
            <h3>Edit Study Blocks</h3>
            <p className="muted">These feed the Blocks tab and future reports.</p>
          </div>
          <select className="smallSelect" value={block} onChange={(event) => setBlock(event.target.value)}>
            {Object.keys(activeBlockData).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="setupSubjectGrid">
          {Object.entries(blockSubjects).map(([subject, details]) => (
            <div className="setupSubject" key={subject}>
              <h3>{subject}</h3>
              <label className="fieldLabel">
                Focus
                <textarea value={details[0]} onChange={(event) => updateBlockSubject(subject, 0, event.target.value)} />
              </label>
              <label className="fieldLabel">
                Activities
                <textarea value={details[1]} onChange={(event) => updateBlockSubject(subject, 1, event.target.value)} />
              </label>
            </div>
          ))}
        </div>
      </Card>

      <Card className="darkCard">
        <h3>Year archives</h3>
        <p>{(data.archives || []).length ? `${data.archives.length} archived learning year(s) saved.` : "No archived years yet."}</p>
      </Card>
    </div>
  );
}

function ProfileTab({ data, setData, showToast }) {
  const profile = data.profile || defaultProfile;

  function updateProfile(key, value) {
    setData({ ...data, profile: { ...profile, [key]: value } });
  }

  return (
    <div className="stack">
      <div className="tabHeader">
        <h2>Profile</h2>
      </div>

      <Card>
        {PROFILE_FIELDS.map(([key, label]) => (
          <label key={key} className="fieldLabel">
            {label}
            {key === "name" || key === "yearLevel" || key === "age" ? (
              <input value={profile[key]} onChange={(event) => updateProfile(key, event.target.value)} />
            ) : (
              <textarea value={profile[key]} onChange={(event) => updateProfile(key, event.target.value)} />
            )}
          </label>
        ))}
        <button type="button" className="primaryButton" onClick={() => showToast("Profile saved.")}>
          Save profile
        </button>
      </Card>
    </div>
  );
}

const styles = `
  * { box-sizing: border-box; }
  html {
    scrollbar-gutter: stable;
  }
  body { margin: 0; }
  .printOnly { display: none; }
  .app {
    min-height: 100vh;
    background: #fff7ed;
    color: #1c1917;
    color-scheme: light;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    padding-bottom: 18px;
  }
  .app h1,
  .app h2 {
    color: #1c1917;
  }
  .header {
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px;
    background: rgba(255, 247, 237, 0.94);
    border-bottom: 1px solid #fed7aa;
  }
  .header h1 { margin: 0; font-size: 28px; line-height: 1.05; }
  .settingsArea { position: relative; margin-left: auto; }
  .headerActions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 10px;
    flex-shrink: 0;
  }
  .saveStatusText {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: #15803d;
    line-height: 1;
    white-space: nowrap;
    cursor: default;
  }
  .saveStatusTextError {
    color: #b91c1c;
    font-weight: 900;
  }
  .gearButton {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 1px solid #fed7aa;
    border-radius: 14px;
    background: white;
    color: #9a3412;
    padding: 0;
    cursor: pointer;
    box-shadow: 0 8px 22px rgba(124, 45, 18, 0.06);
  }
  .gearButton:hover { color: #7c2d12; background: #fffbeb; }
  .gearIcon {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
  }
  .settingsMenu {
    position: absolute;
    right: 0;
    top: 48px;
    width: min(92vw, 360px);
    max-height: 78vh;
    overflow: auto;
    z-index: 80;
    background: #fffdfb;
    border: 1px solid rgba(253, 230, 200, 0.95);
    border-radius: 16px;
    padding: 14px 14px 16px;
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.8) inset,
      0 24px 48px -12px rgba(28, 25, 23, 0.12),
      0 12px 24px -8px rgba(124, 45, 18, 0.08);
  }
  .settingsMenuTop {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .settingsMenuSectionLabel {
    margin: 0 0 8px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #a8a29e;
  }
  .settingsMenuSectionSpaced {
    margin-top: 18px;
  }
  .settingsMenuCard {
    margin-top: 0;
    padding: 12px;
    background: linear-gradient(165deg, #fffaf5 0%, #f5f5f4 100%);
    border: 1px solid rgba(254, 215, 170, 0.45);
    border-radius: 12px;
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset;
  }
  .menuActionPrimary {
    width: 100%;
    border: none;
    border-radius: 11px;
    padding: 11px 14px;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.02em;
    cursor: pointer;
    color: #fafaf9;
    background: linear-gradient(180deg, #292524 0%, #1c1917 100%);
    box-shadow: 0 1px 2px rgba(28, 25, 23, 0.15);
    transition: filter 0.15s ease, transform 0.1s ease;
  }
  .menuActionPrimary:hover {
    filter: brightness(1.06);
  }
  .menuActionPrimary:active {
    transform: scale(0.99);
  }
  .menuBackupGrid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .menuActionSecondary {
    border: 1px solid #e7e5e4;
    border-radius: 10px;
    padding: 9px 10px;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.01em;
    cursor: pointer;
    color: #44403c;
    background: #ffffff;
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .menuActionSecondary:hover {
    background: #fafaf9;
    border-color: #d6d3d1;
  }
  .menuActionSecondary:active {
    background: #f5f5f4;
  }
  .menuResetStack {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .menuResetFull {
    width: 100%;
    text-align: center;
  }
  .progressPresetsDetails > summary {
    font-weight: 800;
    color: #c2410c;
  }
  .loadingScreen {
    min-height: 100vh;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 8px;
    background: #fff7ed;
    color: #1c1917;
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    padding: 24px;
  }
  .loadingTitle { margin: 0; font-size: 22px; font-weight: 900; }
  .loadingSub { margin: 0; color: #78716c; font-size: 14px; }
  .visuallyHidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .settingsButtonRow { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .main {
    max-width: 920px;
    width: 100%;
    margin: 0 auto;
    padding: 12px;
    box-sizing: border-box;
  }
  .appFooter {
    max-width: 920px;
    width: 100%;
    margin: 0 auto;
    padding: 14px 16px 20px;
    text-align: center;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: #a8a29e;
    line-height: 1.35;
    box-sizing: border-box;
  }
  .stack { display: grid; gap: 10px; }
  h2 { margin: 0; font-size: 22px; }
  h3 { margin: 0 0 6px; font-size: 16px; }
  p { line-height: 1.35; margin-top: 6px; margin-bottom: 6px; }
  .muted { margin: 4px 0 0; color: #78716c; }
  .card {
    background: white;
    border: 1px solid #fed7aa;
    border-radius: 18px;
    padding: 10px 12px;
    box-shadow: 0 8px 22px rgba(124, 45, 18, 0.06);
  }
  .softCard { background: #fffbeb; }
  .darkCard { background: #1c1917; color: white; }
  .topRow, .between { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .gridTwo { display: grid; gap: 12px; }
  .taskGrid { display: grid; gap: 10px; align-items: start; }
  .templateEditor { background: white; border: 1px solid #fed7aa; border-radius: 18px; padding: 10px 12px; }
  .templateEditor > summary { cursor: pointer; color: #c2410c; font-weight: 900; }
  .evidenceAddFormFields {
    display: grid;
    gap: 10px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed rgba(253, 186, 116, 0.5);
  }
  .templateGrid { display: grid; gap: 10px; margin: 10px 0; }
  .templateItem { border-top: 1px solid #fed7aa; padding-top: 8px; margin-top: 8px; display: grid; gap: 6px; }
  .settingsPanel { display: grid; gap: 10px; }
  .settingsPanel h3 { margin: 0; }
  .settingsHeaderLine { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .settingsSelect { max-width: 110px; }
  .settingsDetails { background: white; border: 1px solid #fed7aa; border-radius: 14px; padding: 8px 10px; }
  .settingsDetails summary { cursor: pointer; color: #c2410c; font-weight: 900; }
  .settingsDetails textarea { min-height: 52px; }
  .compactAction { width: fit-content; }
  .templateItem textarea { min-height: 48px; margin-top: 0; }
  .setupSubjectGrid { display: grid; gap: 10px; margin-top: 10px; }
  .setupSubject { border-top: 1px solid #fed7aa; padding-top: 10px; }
  .smallSelect { max-width: 130px; }
  .optionInput { margin-top: 6px; }
  .taskHeader { display: grid; gap: 8px; }
  .taskTopLine {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }
  .taskTopLine > .checkLabel {
    flex: 1;
    min-width: 0;
  }
  .taskTopLine .checkLabel strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .taskHideButton {
    border: 0;
    padding: 0;
    margin: 0;
    background: transparent;
    font: inherit;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.02em;
    color: #a8a29e;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .taskHideButton:hover { color: #78716c; }
  .taskCardMin {
    padding: 6px 10px;
    align-self: start;
  }
  .taskCollapsedRow {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 0;
    width: 100%;
  }
  .taskCollapsedRow .checkLabel {
    min-width: 0;
    flex: 1;
    flex-wrap: nowrap;
  }
  .taskCollapsedTitle {
    display: block;
    min-width: 0;
    font-size: 15px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .taskRevealButton {
    border: 0;
    padding: 4px 0;
    background: transparent;
    font: inherit;
    font-size: 12px;
    font-weight: 800;
    color: #c2410c;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .taskRevealButton:hover { color: #9a3412; }
  .activityLine { font-size: 13px; padding: 7px 9px; border-radius: 12px; background: #fff7ed; }
  .checkLabel { display: flex; gap: 8px; align-items: center; min-width: 0; }
  .checkLabel input { width: 18px; height: 18px; margin-top: 2px; }
  .checkLabel small { display: block; color: #78716c; margin-top: 1px; font-size: 12px; }
  .inlineCheck { display: flex; gap: 6px; align-items: center; margin-top: 6px; font-weight: 700; color: #57534e; font-size: 12px; }
  .inlineCheck input { width: 16px; height: 16px; flex: 0 0 auto; margin: 0; }
  .taskEvidenceOption { margin-top: 0; margin-bottom: 0; }
  .formalInline { width: fit-content; white-space: nowrap; }
  input, select, textarea {
    width: 100%;
    border: 1px solid #fed7aa;
    border-radius: 16px;
    background: #fffaf5;
    color: #1c1917;
    padding: 8px 10px;
    font: inherit;
  }
  textarea { min-height: 56px; margin-top: 8px; resize: none; }
  .noteDetails { margin-top: 6px; }
  .noteDetails summary { cursor: pointer; font-weight: 800; color: #c2410c; font-size: 12px; }
  .compactNote textarea { min-height: 48px; }
  .todayEvidenceAdd { margin-top: 8px; }
  .todayEvidenceAdd > summary {
    cursor: pointer;
    font-weight: 800;
    color: #c2410c;
    font-size: 12px;
  }
  .todayEvidenceForm {
    display: grid;
    gap: 8px;
    margin-top: 8px;
    padding-top: 6px;
    border-top: 1px dashed rgba(253, 186, 116, 0.55);
  }
  .todayEvidenceTextarea { min-height: 64px; }
  .todayEvidenceSaveButton { width: 100%; margin-top: 2px; }
  .blockCardTextarea { min-height: 72px; }
  .fieldLabel { display: block; font-weight: 800; color: #44403c; margin-bottom: 9px; font-size: 13px; }
  .fieldLabel input, .fieldLabel textarea, .fieldLabel select { margin-top: 6px; font-weight: 400; color: #1c1917; }
  .compactField { margin-bottom: 0; }
  .progressGrid { display: grid; gap: 9px; margin-bottom: 12px; }
  .photoBox { margin-top: 10px; padding: 10px; border-radius: 16px; background: #fff7ed; border: 1px dashed #fdba74; }
  .evidenceCard,
  .reflectionCard { position: relative; padding-right: 40px; }
  .deleteButton {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    border: 0;
    border-radius: 999px;
    background: #fee2e2;
    color: #991b1b;
    font-size: 18px;
    font-weight: 900;
    line-height: 1;
    cursor: pointer;
  }
  .deleteButton:hover { background: #fecaca; }
  .evidenceHeader { padding-right: 8px; }
  .photoPreview { display: block; max-width: 180px; max-height: 120px; object-fit: cover; border-radius: 14px; margin-top: 8px; border: 1px solid #fed7aa; }
  .evidenceThumb { display: block; width: 120px; max-height: 90px; object-fit: cover; border-radius: 12px; margin: 8px 0; border: 1px solid #fed7aa; }
  .primaryButton, .secondaryButton, .blockButton, .lightButton, .printButton, .modeButton {
    border: 0;
    border-radius: 18px;
    padding: 10px 13px;
    font: inherit;
    font-weight: 900;
    cursor: pointer;
  }
  .primaryButton { width: 100%; background: #1c1917; color: white; }
  .secondaryButton { background: #fde68a; color: #78350f; }
  .modeSwitch { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: 18px; background: #ffedd5; border: 1px solid #fed7aa; min-width: 210px; }
  .modeButton { background: transparent; color: #9a3412; padding: 8px 10px; border-radius: 14px; font-size: 13px; }
  .modeButton.selected { background: #1c1917; color: white; }
  .modeButton:disabled { opacity: 0.55; cursor: not-allowed; }
  .lightButton { background: white; color: #1c1917; margin-top: 8px; }
  .printButton { background: #1c1917; color: white; white-space: nowrap; align-self: flex-start; }
  .printReadyCard { display: flex; align-items: center; justify-content: space-between; gap: 12px; border-color: #f59e0b; background: #fffbeb; }
  .printActions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
  .backupDetails { margin-top: 10px; color: #e7e5e4; }
  .backupDetails summary { cursor: pointer; font-weight: 900; }
  .backupDetails p { color: #d6d3d1; font-size: 13px; }
  .blockButtons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .blockButton { background: white; color: #44403c; border: 1px solid #fed7aa; }
  .blockButton.selected { background: #1c1917; color: white; }
  .miniList { display: grid; gap: 8px; }
  .miniList div { background: #fff7ed; border-radius: 12px; padding: 7px 9px; font-weight: 700; font-size: 13px; }
  .tabHeader {
    text-align: left;
    width: 100%;
  }
  .tabHeader h2 { margin: 0; }
  .tabHeader .muted { margin: 6px 0 0; }
  .topRow .tabHeader {
    flex: 1;
    min-width: 0;
  }
  .planSetupHeaderRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    width: 100%;
  }
  .planSetupHeaderRow .tabHeader {
    flex: 1;
    min-width: min(100%, 16rem);
  }
  .planSetupYearButton {
    flex-shrink: 0;
    white-space: nowrap;
  }
  .timetableWrap { overflow-x: auto; border: 1px solid #fed7aa; border-radius: 18px; background: white; box-shadow: 0 8px 22px rgba(124, 45, 18, 0.06); scrollbar-width: thin; scrollbar-color: #f59e0b #fff7ed; }
  .timetableWrap::-webkit-scrollbar { height: 5px; }
  .timetableWrap::-webkit-scrollbar-track { background: #fff7ed; border-radius: 999px; }
  .timetableWrap::-webkit-scrollbar-thumb { background: #f59e0b; border-radius: 999px; }
  .timetableWrap::-webkit-scrollbar-thumb:hover { background: #d97706; }
  .timetable { width: 100%; min-width: 760px; border-collapse: collapse; table-layout: fixed; }
  .timetable th, .timetable td { border-right: 1px solid #fed7aa; border-bottom: 1px solid #fed7aa; padding: 7px; vertical-align: top; }
  .timetable th:last-child, .timetable td:last-child { border-right: 0; }
  .timetable tr:last-child td { border-bottom: 0; }
  .timetable th { background: #ffedd5; color: #7c2d12; font-size: 13px; text-align: left; }
  .timetable th:first-child, .timeCell { width: 78px; }
  .timeCell { background: #fff7ed; color: #9a3412; font-size: 12px; font-weight: 900; }
  .timetableInput { min-height: 52px; margin: 0; border: 0; border-radius: 12px; background: #fffaf5; padding: 7px; font-size: 13px; line-height: 1.25; resize: none; overflow: hidden; }
  .smallHelp { color: #78716c; font-size: 13px; margin-top: 0; }
  .pill { background: #dcfce7; color: #166534; border-radius: 999px; padding: 4px 10px; font-weight: 900; font-size: 12px; white-space: nowrap; }
  .label { margin: 8px 0 3px; color: #c2410c; font-size: 12px; font-weight: 900; }
  .nav {
    position: sticky;
    top: 68px;
    z-index: 10;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 3px;
    max-width: 920px;
    margin: 0 auto;
    padding: 5px 12px;
    background: rgba(255, 247, 237, 0.94);
    border-bottom: 1px solid #fed7aa;
  }
  .navButton {
    border: 0;
    background: transparent;
    border-radius: 12px;
    padding: 6px 4px;
    color: #78716c;
    font-size: 11px;
    font-weight: 900;
    cursor: pointer;
  }
  .navButton.active { background: #ffedd5; color: #c2410c; }
  .toast {
    position: fixed;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%);
    width: min(92vw, 380px);
    background: #1c1917;
    color: white;
    text-align: center;
    border-radius: 22px;
    padding: 14px 18px;
    font-weight: 900;
    z-index: 20;
  }
  @media (max-width: 360px) {
    .menuBackupGrid { grid-template-columns: 1fr; }
  }
  @media (min-width: 760px) {
    .app { padding-bottom: 18px; }
    .header { padding: 12px 24px; }
    .settingsMenu { width: 380px; }
    .gridTwo { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .taskGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; }
    .setupSubjectGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .taskHeader { grid-template-columns: 1fr; align-items: start; }
    .taskHeader select { font-size: 13px; }
    .nav {
      top: 59px;
      max-width: 920px;
      border-bottom: 1px solid #fed7aa;
      grid-template-columns: repeat(8, 1fr);
    }
    .navButton { font-size: 12px; padding: 6px 8px; }
    .toast { bottom: 24px; }
  }
`;

export default App;
