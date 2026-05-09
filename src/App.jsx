import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import {
  STORAGE_KEY,
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
  loadState,
} from "./constants";

function Card({ children, className = "" }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function App() {
  const [activeTab, setActiveTab] = useState("today");
  const [data, setData] = useState(loadState);
  const [toast, setToast] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }

  const tabs = [
    ["today", "Today"],
    ["week", "Week"],
    ["blocks", "Blocks"],
    ["evidence", "Evidence"],
    ["progress", "Progress"],
    ["profile", "Profile"],
    ["setup", "Setup"],
  ];

  return (
    <div className="app">
      <style>{styles}</style>

      <header className="header">
        <div>
          <p className="eyebrow">Home education helper</p>
          <h1>EdTrak</h1>
        </div>

        <div className="settingsArea">
          <button
            type="button"
            className="gearButton"
            onClick={() => setSettingsOpen(!settingsOpen)}
            aria-label="Open settings menu"
            aria-expanded={settingsOpen}
          >
            Settings
          </button>

          {settingsOpen ? (
            <div className="settingsMenu">
              <ContextSettings activeTab={activeTab} data={data} setData={setData} showToast={showToast} />
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
      </main>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}

function ContextSettings({ activeTab, data, setData, showToast }) {
  function exportJsonBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `edtrak-records-backup-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (activeTab === "today") return <TodayTemplateEditor data={data} setData={setData} showToast={showToast} />;
  if (activeTab === "week") return <WeekSettings data={data} setData={setData} showToast={showToast} />;
  if (activeTab === "blocks") return <BlockTextSettings data={data} setData={setData} showToast={showToast} />;
  if (activeTab === "progress") return <ProgressOptionsSettings data={data} setData={setData} showToast={showToast} />;
  if (activeTab === "setup") return <SetupSettings data={data} setData={setData} showToast={showToast} />;
  if (activeTab === "profile") {
    return (
      <div className="settingsPanel">
        <h3>Profile settings</h3>
        <p className="smallHelp">Use this only if you need to move or back up the app data.</p>
        <button type="button" className="secondaryButton compactAction" onClick={exportJsonBackup}>
          Download backup file
        </button>
      </div>
    );
  }
  return (
    <div className="settingsPanel">
      <h3>Settings</h3>
      <p className="smallHelp">No extra settings for this tab yet.</p>
    </div>
  );
}

function WeekSettings({ data, setData, showToast }) {
  function resetWeek() {
    setData({ ...data, weeklyPlan: defaultWeeklyPlan });
    showToast("Weekly timetable reset.");
  }

  return (
    <div className="settingsPanel">
      <h3>Weekly timetable settings</h3>
      <p className="smallHelp">Reset the timetable back to the original suggested weekly rhythm.</p>
      <button type="button" className="secondaryButton compactAction" onClick={resetWeek}>
        Reset timetable
      </button>
    </div>
  );
}

function BlockTextSettings({ data, setData }) {
  const activeBlockData = data.blockData || defaultBlockData;
  const [block, setBlock] = useState(Object.keys(activeBlockData)[0] || "A");
  const blockSubjects = activeBlockData[block] || {};

  function updateBlockSubject(subject, index, value) {
    const nextBlockData = JSON.parse(JSON.stringify(activeBlockData));
    nextBlockData[block][subject][index] = value;
    setData({ ...data, blockData: nextBlockData });
  }

  return (
    <div className="settingsPanel">
      <div className="settingsHeaderLine">
        <h3>Edit block text</h3>
        <select className="settingsSelect" value={block} onChange={(event) => setBlock(event.target.value)}>
          {Object.keys(activeBlockData).map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <p className="smallHelp">These choices feed the Study Blocks cards.</p>
      {Object.entries(blockSubjects).map(([subject, details]) => (
        <details className="settingsDetails" key={subject}>
          <summary>{subject}</summary>
          <label className="fieldLabel">
            Focus
            <textarea value={details[0]} onChange={(event) => updateBlockSubject(subject, 0, event.target.value)} />
          </label>
          <label className="fieldLabel">
            Activities
            <textarea value={details[1]} onChange={(event) => updateBlockSubject(subject, 1, event.target.value)} />
          </label>
        </details>
      ))}
    </div>
  );
}

function ProgressOptionsSettings({ data, setData }) {
  const options = { ...defaultProgressOptions, ...(data.progressOptions || {}) };

  function updateProgressOption(group, index, value) {
    const nextOptions = JSON.parse(JSON.stringify(options));
    nextOptions[group][index] = value;
    setData({ ...data, progressOptions: nextOptions });
  }

  return (
    <div className="settingsPanel">
      <h3>Edit progress choices</h3>
      <p className="smallHelp">These feed the Progress tab dropdowns. Keep “Custom response” as the final choice.</p>
      {Object.entries(options).map(([group, list]) => (
        <details className="settingsDetails" key={group}>
          <summary>{group[0].toUpperCase() + group.slice(1)}</summary>
          {list.map((value, index) => (
            <input key={`${group}-${index}`} className="optionInput" value={value} onChange={(event) => updateProgressOption(group, index, event.target.value)} />
          ))}
        </details>
      ))}
    </div>
  );
}

function SetupSettings({ data, setData, showToast }) {
  function resetEditablePlan() {
    setData({ ...data, blockData: defaultBlockData, yearGoals: defaultYearGoals, progressOptions: defaultProgressOptions });
    showToast("Editable plan reset.");
  }

  return (
    <div className="settingsPanel">
      <h3>Setup settings</h3>
      <p className="smallHelp">Reset the editable plan text back to the original Year 2 draft.</p>
      <button type="button" className="secondaryButton compactAction" onClick={resetEditablePlan}>
        Reset editable plan text
      </button>
    </div>
  );
}

function TodayTab({ data, setData, showToast }) {
  const date = todayKey();
  const saved = data.todayRecords[date];
  const templates = {
    full: Array.isArray(data.todayTemplates?.full) ? data.todayTemplates.full : defaultTodayTemplates.full,
    gentle: Array.isArray(data.todayTemplates?.gentle) ? data.todayTemplates.gentle : defaultTodayTemplates.gentle,
  };
  const [rough, setRough] = useState(Boolean(saved?.rough));
  const [tasks, setTasks] = useState(
    Array.isArray(saved?.tasks)
      ? saved.tasks.map((task) => ({ ...task, activity: task.activity || "", done: Boolean(task.done), how: task.how || "Smooth", evidence: Boolean(task.evidence) }))
      : templates.full.map((task) => ({ ...task, activity: task.activity || "", done: true, how: "Smooth", evidence: false })),
  );

  function setDayMode(mode) {
    const nextRough = mode === "gentle";
    setRough(nextRough);
    const currentTemplates = {
      full: Array.isArray(data.todayTemplates?.full) ? data.todayTemplates.full : defaultTodayTemplates.full,
      gentle: Array.isArray(data.todayTemplates?.gentle) ? data.todayTemplates.gentle : defaultTodayTemplates.gentle,
    };
    const list = nextRough ? currentTemplates.gentle : currentTemplates.full;
    setTasks(list.map((task) => ({ ...task, activity: task.activity || "", done: true, how: "Smooth", evidence: false })));
  }

  function updateTask(index, patch) {
    setTasks(tasks.map((task, taskIndex) => (taskIndex === index ? { ...task, ...patch } : task)));
  }

  function saveToday() {
    const evidenceItems = tasks
      .filter((task) => task.evidence)
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
        <div>
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

      {rough ? (
        <Card className="softCard">
          <h3>Reduced-load day</h3>
          <p>Still learning. Just gentler.</p>
        </Card>
      ) : null}

      <div className="taskGrid">
        {tasks.map((task, index) => (
          <Card key={task.id || `${task.title}-${index}`}>
            <div className="taskHeader">
              <div className="taskTopLine">
                <label className="checkLabel">
                  <input type="checkbox" checked={task.done} onChange={(event) => updateTask(index, { done: event.target.checked })} />
                  <strong>{task.title}</strong>
                </label>
                <label className="inlineCheck evidenceInline">
                  <input type="checkbox" checked={task.evidence} onChange={(event) => updateTask(index, { evidence: event.target.checked })} />
                  Save note as evidence
                </label>
              </div>
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
          </Card>
        ))}
      </div>

      <button type="button" className="primaryButton" onClick={saveToday}>
        Save Today
      </button>
    </div>
  );
}

function TodayTemplateEditor({ data, setData, showToast }) {
  const templates = {
    full: Array.isArray(data.todayTemplates?.full) ? data.todayTemplates.full : defaultTodayTemplates.full,
    gentle: Array.isArray(data.todayTemplates?.gentle) ? data.todayTemplates.gentle : defaultTodayTemplates.gentle,
  };

  function updateTemplate(mode, index, field, value) {
    const currentModeTasks = [...(Array.isArray(templates[mode]) ? templates[mode] : [])];
    currentModeTasks[index] = { ...(currentModeTasks[index] || {}), [field]: value };

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
      <p className="smallHelp">Change the default cards for future Full day and Gentle day records. This will not rewrite days already saved.</p>

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
      <div className="topRow">
        <div>
          <h2>Weekly Timetable</h2>
          <p className="muted">Editable. Change any box and it saves automatically.</p>
        </div>
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

      <p className="smallHelp">Tip: keep each box short — one main learning block only. Missed days are fine.</p>
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

  return (
    <div className="stack">
      <div>
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
          return (
            <Card key={subject}>
              <h3>{subject}</h3>
              <p className="label">Focus</p>
              <p>{details[0]}</p>
              <p className="label">Activities</p>
              <p>{details[1]}</p>
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
    description: "Parent observation recorded to track engagement, independence, confidence or skill development.",
    formal: false,
    fileName: "",
    photoDataUrl: "",
  });

  const types = ["Photo", "Work sample", "Oral response", "Tutor note", "Observation note", "Video/audio note", "Project sample"];
  const subjects = ["English", "Mathematics", "Science", "HASS", "Arts", "Technologies", "HPE", "Japanese", "Wellbeing", "Project"];

  const defaultDescriptionsByType = {
    Photo: "Photo evidence of hands-on, outdoor, practical or project-based learning.",
    "Work sample": "Dated work sample showing current skill level, support needed or progress over time.",
    "Oral response": "Oral response recorded as evidence due to reduced written load or supported communication needs.",
    "Tutor note": "Tutor feedback recorded to support monitoring of English, maths or curriculum progress.",
    "Observation note": "Parent observation recorded to track engagement, independence, confidence or skill development.",
    "Video/audio note": "Video or audio evidence recorded to capture oral response, performance, fluency or participation.",
    "Project sample": "Project sample recorded to show practical, creative, outdoor or real-world learning.",
  };

  function changeType(type) {
    setItem({
      ...item,
      type,
      description: defaultDescriptionsByType[type] || item.description,
      fileName: type === "Photo" ? item.fileName : "",
      photoDataUrl: type === "Photo" ? item.photoDataUrl : "",
    });
  }

  function handlePhoto(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setItem({
        ...item,
        type: "Photo",
        fileName: file.name,
        photoDataUrl: String(reader.result || ""),
      });
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
      <div>
        <h2>Evidence</h2>
        <p className="muted">Quick proof without the paperwork headache.</p>
      </div>

      <Card>
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
            {types.map((type) => (
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
      </Card>

      {(data.evidence || []).length === 0 ? (
        <Card>
          <p>No evidence yet. Add a note when it is useful.</p>
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

  return (
    <div className="stack">
      <div>
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

      {(data.weeklyReflections || []).map((reflection) => (
        <Card key={reflection.id}>
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

function PlanSetupTab({ data, setData, showToast }) {
  const [block, setBlock] = useState(Object.keys(data.blockData || defaultBlockData)[0] || "A");
  const activeBlockData = data.blockData || defaultBlockData;
  const goals = { ...defaultYearGoals, ...(data.yearGoals || {}) };
  const options = data.progressOptions || defaultProgressOptions;
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

  function updateProgressOption(group, index, value) {
    const nextOptions = JSON.parse(JSON.stringify(options));
    nextOptions[group][index] = value;
    setData({ ...data, progressOptions: nextOptions });
  }

  function startNewYear() {
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
    showToast("Current year archived. New year started.");
  }

  return (
    <div className="stack">
      <div className="topRow">
        <div>
          <h2>Plan Setup</h2>
          <p className="muted">Use this at the start of each year. No code editing needed.</p>
        </div>
        <button type="button" className="secondaryButton" onClick={startNewYear}>
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

  const fields = [
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

  function updateProfile(key, value) {
    setData({ ...data, profile: { ...profile, [key]: value } });
  }

  async function exportPdfReport() {
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

    doc.setProperties({ title: "EdTrak learning records" });
    writeLine("EdTrak Learning Records", 20, "bold");
    writeLine(`Plan year: ${data.planYear || ""} — Generated ${new Date().toLocaleDateString()}`, 10);

    section("Learner profile");
    fields.forEach(([key, label]) => field(label, profile[key]));

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
        const completed = (record.tasks || []).filter((task) => task.done).map((task) => task.title).join(", ") || "No boxes ticked";
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

  return (
    <div className="stack">
      <div className="topRow exportTopRow">
        <div>
          <h2>Profile</h2>
          <p className="muted">The supports page. Keep everyone consistent.</p>
        </div>
        <button type="button" className="printButton" onClick={() => void exportPdfReport()}>
          Export PDF
        </button>
      </div>

      <Card>
        {fields.map(([key, label]) => (
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
  body { margin: 0; }
  .printOnly { display: none; }
  .app {
    min-height: 100vh;
    background: #fff7ed;
    color: #1c1917;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    padding-bottom: 18px;
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
  .gearButton {
    min-width: 38px;
    height: 38px;
    border: 1px solid #fed7aa;
    border-radius: 14px;
    background: white;
    color: #9a3412;
    font-size: 12px;
    font-weight: 900;
    line-height: 1;
    padding: 0 10px;
    cursor: pointer;
    box-shadow: 0 8px 22px rgba(124, 45, 18, 0.06);
  }
  .settingsMenu {
    position: absolute;
    right: 0;
    top: 46px;
    width: min(92vw, 430px);
    max-height: 78vh;
    overflow: auto;
    z-index: 80;
    background: #fff7ed;
    border: 1px solid #fed7aa;
    border-radius: 20px;
    padding: 10px;
    box-shadow: 0 20px 50px rgba(124, 45, 18, 0.18);
  }
  .eyebrow { margin: 0 0 4px; color: #c2410c; font-weight: 700; font-size: 13px; }
  .main { max-width: 920px; margin: 0 auto; padding: 12px; }
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
  .taskGrid { display: grid; gap: 10px; }
  .templateEditor { background: white; border: 1px solid #fed7aa; border-radius: 18px; padding: 10px 12px; }
  .templateEditor > summary { cursor: pointer; color: #c2410c; font-weight: 900; }
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
  .nav { grid-template-columns: repeat(7, 1fr); }
  .taskHeader { display: grid; gap: 8px; }
  .taskTopLine { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .activityLine { font-size: 13px; padding: 7px 9px; border-radius: 12px; background: #fff7ed; }
  .checkLabel { display: flex; gap: 8px; align-items: center; min-width: 0; }
  .checkLabel input { width: 18px; height: 18px; margin-top: 2px; }
  .checkLabel small { display: block; color: #78716c; margin-top: 1px; font-size: 12px; }
  .inlineCheck { display: flex; gap: 6px; align-items: center; margin-top: 6px; font-weight: 700; color: #57534e; font-size: 12px; }
  .inlineCheck input { width: 16px; height: 16px; flex: 0 0 auto; margin: 0; }
  .evidenceInline { margin-top: 0; white-space: nowrap; flex-shrink: 0; }
  .formalInline { width: fit-content; white-space: nowrap; }
  input, select, textarea {
    width: 100%;
    border: 1px solid #fed7aa;
    border-radius: 16px;
    background: #fffaf5;
    padding: 8px 10px;
    font: inherit;
  }
  textarea { min-height: 56px; margin-top: 8px; resize: none; }
  .noteDetails { margin-top: 6px; }
  .noteDetails summary { cursor: pointer; font-weight: 800; color: #c2410c; font-size: 12px; }
  .compactNote textarea { min-height: 48px; }
  .fieldLabel { display: block; font-weight: 800; color: #44403c; margin-bottom: 9px; font-size: 13px; }
  .fieldLabel input, .fieldLabel textarea, .fieldLabel select { margin-top: 6px; font-weight: 400; color: #1c1917; }
  .compactField { margin-bottom: 0; }
  .progressGrid { display: grid; gap: 9px; margin-bottom: 12px; }
  .photoBox { margin-top: 10px; padding: 10px; border-radius: 16px; background: #fff7ed; border: 1px dashed #fdba74; }
  .evidenceCard { position: relative; padding-right: 40px; }
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
  .lightButton { background: white; color: #1c1917; margin-top: 8px; }
  .printButton { background: #1c1917; color: white; white-space: nowrap; align-self: flex-start; }
  .printReadyCard { display: flex; align-items: center; justify-content: space-between; gap: 12px; border-color: #f59e0b; background: #fffbeb; }
  .printActions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
  .exportTopRow { align-items: flex-start; }
  .backupDetails { margin-top: 10px; color: #e7e5e4; }
  .backupDetails summary { cursor: pointer; font-weight: 900; }
  .backupDetails p { color: #d6d3d1; font-size: 13px; }
  .blockButtons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .blockButton { background: white; color: #44403c; border: 1px solid #fed7aa; }
  .blockButton.selected { background: #1c1917; color: white; }
  .miniList { display: grid; gap: 8px; }
  .miniList div { background: #fff7ed; border-radius: 12px; padding: 7px 9px; font-weight: 700; font-size: 13px; }
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
    grid-template-columns: repeat(7, 1fr);
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
  @media (min-width: 760px) {
    .app { padding-bottom: 18px; }
    .header { padding: 12px 24px; }
    .settingsMenu { width: 430px; }
    .gridTwo { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .taskGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .setupSubjectGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .taskHeader { grid-template-columns: 1fr; align-items: start; }
    .taskHeader select { font-size: 13px; }
    .nav {
      top: 59px;
      max-width: 920px;
      border-bottom: 1px solid #fed7aa;
    }
    .navButton { font-size: 12px; padding: 6px 8px; }
    .toast { bottom: 24px; }
  }
`;

export default App;
