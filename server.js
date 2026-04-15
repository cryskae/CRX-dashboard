const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const session = require("express-session");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST =
  process.env.HOST ||
  (process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === "production"
    ? "0.0.0.0"
    : "127.0.0.1");
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "storage");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "data.json");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "crx-admin";
const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD || "crx-manager";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "crx-dashboard-session-secret";

const PHOTO_PHASES = ["Before", "During", "After"];
const PROJECT_AREAS = [
  "General",
  "North Deck",
  "South Courtyard",
  "Lobby",
  "Pool Terrace",
];
const NOTE_CATEGORIES = [
  "Observation",
  "Issue",
  "RFI",
  "Daily Log",
  "Weather Delay",
  "Inspection",
];
const UPDATE_AREAS = [
  "General / Overall",
  "North Deck",
  "South Courtyard",
  "Lobby",
  "Pool Terrace",
  "Pre-Construction",
  "Closeout",
];

const seedData = {
  project: {
    name: "CRX Coastal Renewal Dashboard",
    headline: "Hospitality Site Refresh & Exterior Restoration",
    location: "CRX Signature Property | Sand Key District, Clearwater, FL",
    projectCode: "CRX-2026-0415",
    description:
      "A live owner-facing dashboard for tracking CRX construction progress, logistics, photo documentation, and field activity across one active renovation program.",
    owner: {
      name: "CRX Hospitality Group",
      lines: [
        "Owner Representative: Capital Projects Division",
        "Clearwater, Florida",
        "projects@crx.example",
      ],
    },
    architect: {
      name: "Axis Studio Collaborative",
      lines: [
        "Lead Designer: Lena Morales",
        "Tampa, Florida",
        "design@axis-studio.example",
      ],
    },
    contractor: {
      name: "Harborline Construction Services",
      lines: [
        "Senior PM: Carson Reed",
        "Lic. CGC-2049918",
        "operations@harborline.example",
      ],
    },
    overviewCards: [
      {
        title: "Estimated Work Days",
        value: "42",
        detail: "35 active days + 7 weather buffer",
      },
      {
        title: "Work Hours",
        value: "7-5 PM",
        detail: "Weekdays with controlled Saturday access",
      },
      {
        title: "Active Work Areas",
        value: "4",
        detail: "Deck, courtyard, lobby, and pool terrace",
      },
      {
        title: "Staging Zone",
        value: "East Lot",
        detail: "Screened laydown yard with secured access",
      },
      {
        title: "Finish Package",
        value: "CRX Spec",
        detail: "Pavers, lighting, signage, and landscape reset",
      },
      {
        title: "Project Status",
        value: "Live",
        detail: "Dashboard synced from the admin panel",
      },
    ],
    keyDates: [
      "Mobilization begins within 5 calendar days of notice to proceed",
      "Quiet-hours coordination required around guest check-in windows",
      "Daily cleanup and pedestrian path protection remain active throughout the project",
      "Final turnover includes punch completion, asset photos, and maintenance handoff",
    ],
    staging: [
      "Temporary staging, dumpster, and delivery gate positioned in the east parking lot",
      "Portable washout and covered material storage kept behind screened fencing",
      "Guest circulation protected with barricades, lighting, and directional signage",
    ],
  },
  scopeAreas: [
    {
      id: "north-deck",
      name: "North Deck",
      subtitle: "Arrival edge, planters, guardrail refinishing",
      duration: "6 days",
      sequence: "Phase 1",
      tasks: [
        "Demolish damaged edge pavers and reset bedding plane",
        "Repair guardrail anchors and spot-prime metal surfaces",
        "Install new linear drainage components at the deck transition",
        "Reset architectural lighting and final joint sealant",
      ],
    },
    {
      id: "south-courtyard",
      name: "South Courtyard",
      subtitle: "Landscape refresh, hardscape leveling, irrigation fixes",
      duration: "9 days",
      sequence: "Phase 2",
      tasks: [
        "Selective demolition of unstable hardscape panels",
        "Coordinate irrigation valve relocation before finish work",
        "Regrade planting beds and reinforce root-zone protections",
        "Install replacement pavers, furnishings, and signage",
      ],
    },
    {
      id: "lobby",
      name: "Lobby",
      subtitle: "Entry finishes, ceiling patch, branded arrival touchpoints",
      duration: "7 days",
      sequence: "Phase 3",
      tasks: [
        "Protect occupied entry path during phased demolition",
        "Patch damaged gypsum and ceiling framing at entry soffit",
        "Install new CRX signage band and directional graphics",
        "Coordinate final punch with operations and front-desk team",
      ],
    },
    {
      id: "pool-terrace",
      name: "Pool Terrace",
      subtitle: "Tile replacement, shade structure touch-up, safety surfacing",
      duration: "13 days",
      sequence: "Phase 4",
      tasks: [
        "Remove failed terrace tile and replace waterproofing at isolated areas",
        "Refinish shade structure steel and tighten exposed connections",
        "Install anti-slip walking surface at guest circulation routes",
        "Restore furnishings and complete turnover photography",
      ],
    },
  ],
  schedule: {
    summaryCards: [
      { label: "Contract Window", value: "60 Days" },
      { label: "Estimated Work Days", value: "35" },
      { label: "Weather Buffer", value: "7 Days" },
      { label: "Projected Calendar", value: "~9 Weeks" },
    ],
    preconstructionNote:
      "Two weeks of procurement and subcontractor coordination are built in between award and field mobilization.",
    timeline: [
      {
        title: "Pre-Construction",
        days: "Week 0",
        items: [
          "Submittals, procurement, guest-notice plan, and mobilization logistics",
        ],
      },
      {
        title: "North Deck",
        days: "Week 1-2",
        items: ["Drainage corrections, edge reset, rail prep, finish sealants"],
      },
      {
        title: "South Courtyard",
        days: "Week 3-4",
        items: ["Hardscape reset, irrigation coordination, planting restoration"],
      },
      {
        title: "Lobby",
        days: "Week 5-6",
        items: ["Entry finish work, signage install, and lighting punch"],
      },
      {
        title: "Pool Terrace",
        days: "Week 7-8",
        items: ["Tile replacement, steel touch-up, walking-surface upgrades"],
      },
      {
        title: "Closeout",
        days: "Week 9",
        items: ["Final inspections, punch, photo archive, handoff package"],
      },
    ],
  },
  progress: {
    overall: 38,
    areas: {
      "North Deck": 70,
      "South Courtyard": 45,
      Lobby: 25,
      "Pool Terrace": 10,
    },
  },
  options: {
    photoPhases: PHOTO_PHASES,
    projectAreas: PROJECT_AREAS,
    noteCategories: NOTE_CATEGORIES,
    updateAreas: UPDATE_AREAS,
  },
  photos: [
    {
      id: "seed-photo-1",
      phase: "Before",
      area: "North Deck",
      caption: "Existing paver settlement and rail staining before mobilization.",
      imageUrl: "/assets/gallery/north-deck-before.svg",
      uploadedAt: "2026-04-10T13:15:00.000Z",
      isSeed: true,
    },
    {
      id: "seed-photo-2",
      phase: "During",
      area: "South Courtyard",
      caption: "Courtyard excavation and protection measures installed.",
      imageUrl: "/assets/gallery/south-courtyard-during.svg",
      uploadedAt: "2026-04-11T15:45:00.000Z",
      isSeed: true,
    },
    {
      id: "seed-photo-3",
      phase: "During",
      area: "Lobby",
      caption: "CRX branded arrival wall mock-up under review in the lobby.",
      imageUrl: "/assets/gallery/lobby-during.svg",
      uploadedAt: "2026-04-12T17:05:00.000Z",
      isSeed: true,
    },
    {
      id: "seed-photo-4",
      phase: "After",
      area: "Pool Terrace",
      caption: "Rendered finish target for the renewed terrace edge and seating zone.",
      imageUrl: "/assets/gallery/pool-terrace-after.svg",
      uploadedAt: "2026-04-13T09:20:00.000Z",
      isSeed: true,
    },
  ],
  updates: [
    {
      id: "seed-update-1",
      title: "North Deck drainage rough-in completed",
      area: "North Deck",
      description:
        "The crew completed trench prep, set the new linear drain sections, and reopened the safe guest path before end of day.",
      createdAt: "2026-04-11T21:10:00.000Z",
      photoIds: ["seed-photo-1"],
    },
    {
      id: "seed-update-2",
      title: "Courtyard demolition shifted into active production",
      area: "South Courtyard",
      description:
        "Selective demolition started on the south courtyard, irrigation conflicts were documented, and the revised restoration sequence was approved for the next work window.",
      createdAt: "2026-04-12T19:30:00.000Z",
      photoIds: ["seed-photo-2"],
    },
  ],
  fieldNotes: [
    {
      id: "seed-note-1",
      title: "Guest circulation maintained",
      category: "Daily Log",
      note: "Temporary wayfinding remained clear during delivery windows. No guest access incidents reported.",
      createdAt: "2026-04-11T18:00:00.000Z",
    },
    {
      id: "seed-note-2",
      title: "Irrigation conflict flagged in courtyard",
      category: "Observation",
      note: "The south courtyard demo uncovered an irrigation line deviation from the latest survey. Team photographed the condition and folded it into the next coordination meeting.",
      createdAt: "2026-04-12T20:00:00.000Z",
    },
  ],
};

function ensureStorage() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2));
  }
}

function readDb() {
  ensureStorage();
  const raw = fs.readFileSync(DB_FILE, "utf8");
  const parsed = JSON.parse(raw);

  return {
    ...seedData,
    ...parsed,
    project: { ...seedData.project, ...(parsed.project || {}) },
    schedule: { ...seedData.schedule, ...(parsed.schedule || {}) },
    progress: {
      ...seedData.progress,
      ...(parsed.progress || {}),
      areas: {
        ...seedData.progress.areas,
        ...((parsed.progress && parsed.progress.areas) || {}),
      },
    },
    options: {
      ...seedData.options,
      ...(parsed.options || {}),
    },
    scopeAreas: parsed.scopeAreas || seedData.scopeAreas,
    photos: parsed.photos || seedData.photos,
    updates: parsed.updates || seedData.updates,
    fieldNotes: parsed.fieldNotes || seedData.fieldNotes,
  };
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function buildPhotoRecord(file, phase, area, caption) {
  return {
    id: crypto.randomUUID(),
    phase,
    area,
    caption: caption || "",
    imageUrl: `/uploads/${file.filename}`,
    uploadedAt: new Date().toISOString(),
    isSeed: false,
  };
}

function deleteUploadedFileIfOwned(photo) {
  if (!photo || photo.isSeed) {
    return;
  }

  const filename = path.basename(photo.imageUrl || "");
  const absolute = path.join(UPLOAD_DIR, filename);
  if (absolute.startsWith(UPLOAD_DIR) && fs.existsSync(absolute)) {
    fs.unlinkSync(absolute);
  }
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    ensureStorage();
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image uploads are allowed."));
      return;
    }
    cb(null, true);
  },
});

app.set("trust proxy", 1);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: SESSION_SECRET,
    proxy: true,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);
app.use("/uploads", express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, "public")));

function requireAdmin(req, res, next) {
  if (req.session.role !== "admin") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

function requireManager(req, res, next) {
  if (!req.session.role || !["admin", "manager"].includes(req.session.role)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

function sanitizeProgressValue(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

function splitLines(value) {
  return String(value || "")
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseJsonField(value, fieldName) {
  try {
    return JSON.parse(String(value || "[]"));
  } catch (error) {
    throw new Error(`Invalid JSON provided for ${fieldName}.`);
  }
}

function ensureArrayOfObjects(value, fieldName) {
  if (!Array.isArray(value) || value.some((item) => !item || typeof item !== "object")) {
    throw new Error(`${fieldName} must be a JSON array of objects.`);
  }
  return value;
}

function ensureArrayOfStrings(value, fieldName) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${fieldName} must be a list of strings.`);
  }
  return value;
}

function normalizeScopeAreas(scopeAreas) {
  return ensureArrayOfObjects(scopeAreas, "scope areas").map((area, index) => ({
    id:
      String(area.id || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || `scope-area-${index + 1}`,
    name: String(area.name || `Area ${index + 1}`),
    subtitle: String(area.subtitle || ""),
    duration: String(area.duration || ""),
    sequence: String(area.sequence || ""),
    tasks: ensureArrayOfStrings(area.tasks || [], `scope area ${index + 1} tasks`),
  }));
}

function normalizeSummaryCards(summaryCards) {
  return ensureArrayOfObjects(summaryCards, "schedule summary cards").map((card) => ({
    label: String(card.label || ""),
    value: String(card.value || ""),
  }));
}

function normalizeTimeline(timeline) {
  return ensureArrayOfObjects(timeline, "schedule timeline").map((item, index) => ({
    title: String(item.title || `Step ${index + 1}`),
    days: String(item.days || ""),
    items: ensureArrayOfStrings(item.items || [], `timeline item ${index + 1} list`),
  }));
}

function normalizeOverviewCards(cards) {
  return ensureArrayOfObjects(cards, "overview cards").map((card) => ({
    title: String(card.title || ""),
    value: String(card.value || ""),
    detail: String(card.detail || ""),
  }));
}

function normalizeOptions(options) {
  return {
    photoPhases: ensureArrayOfStrings(options.photoPhases || [], "photo phases"),
    projectAreas: ensureArrayOfStrings(options.projectAreas || [], "project areas"),
    noteCategories: ensureArrayOfStrings(options.noteCategories || [], "note categories"),
    updateAreas: ensureArrayOfStrings(options.updateAreas || [], "update areas"),
  };
}

function normalizeProgressAreas(progressAreas) {
  if (!progressAreas || typeof progressAreas !== "object" || Array.isArray(progressAreas)) {
    throw new Error("Progress areas must be a JSON object of label-to-percent values.");
  }

  return Object.fromEntries(
    Object.entries(progressAreas).map(([key, value]) => [key, sanitizeProgressValue(value)])
  );
}

app.get("/api/dashboard", (req, res) => {
  const db = readDb();
  res.json({
    ...db,
    adminAuthenticated: Boolean(req.session.isAdmin),
    currentUserRole: req.session.role || null,
  });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.post("/api/admin/login", (req, res) => {
  const password = String(req.body.password || "");
  const role = String(req.body.role || "").toLowerCase();

  if (role === "admin" && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    req.session.role = "admin";
    res.json({ success: true, role: "admin" });
    return;
  }

  if (role === "manager" && password === MANAGER_PASSWORD) {
    req.session.isAdmin = false;
    req.session.role = "manager";
    res.json({ success: true, role: "manager" });
    return;
  }

  res.status(401).json({ error: "Incorrect login or password." });
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.post(
  "/api/admin/updates",
  requireManager,
  upload.array("photos", 5),
  (req, res) => {
    const db = readDb();
    const { title, area, description, phase } = req.body;

    if (!title || !area || !description) {
      res.status(400).json({ error: "Title, area, and description are required." });
      return;
    }

    const files = Array.isArray(req.files) ? req.files : [];
    const newPhotos = files.map((file) =>
      buildPhotoRecord(file, phase || "During", area, title)
    );

    db.photos.unshift(...newPhotos);
    db.updates.unshift({
      id: crypto.randomUUID(),
      title: String(title),
      area: String(area),
      description: String(description),
      createdAt: new Date().toISOString(),
      photoIds: newPhotos.map((photo) => photo.id),
    });

    writeDb(db);
    res.json({ success: true });
  }
);

app.delete("/api/admin/updates/:id", requireManager, (req, res) => {
  const db = readDb();
  const update = db.updates.find((entry) => entry.id === req.params.id);

  if (!update) {
    res.status(404).json({ error: "Update not found." });
    return;
  }

  const linkedIds = new Set(update.photoIds || []);
  const photosToRemove = db.photos.filter((photo) => linkedIds.has(photo.id));
  photosToRemove.forEach(deleteUploadedFileIfOwned);

  db.photos = db.photos.filter((photo) => !linkedIds.has(photo.id));
  db.updates = db.updates.filter((entry) => entry.id !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});

app.post(
  "/api/admin/photos",
  requireManager,
  upload.array("photos", 5),
  (req, res) => {
    const { phase, area, caption } = req.body;
    if (!phase || !area) {
      res.status(400).json({ error: "Phase and area are required." });
      return;
    }

    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
      res.status(400).json({ error: "Select at least one photo." });
      return;
    }

    const db = readDb();
    const photos = files.map((file) => buildPhotoRecord(file, phase, area, caption));
    db.photos.unshift(...photos);
    writeDb(db);
    res.json({ success: true });
  }
);

app.delete("/api/admin/photos/:id", requireManager, (req, res) => {
  const db = readDb();
  const photo = db.photos.find((entry) => entry.id === req.params.id);

  if (!photo) {
    res.status(404).json({ error: "Photo not found." });
    return;
  }

  deleteUploadedFileIfOwned(photo);
  db.photos = db.photos.filter((entry) => entry.id !== req.params.id);
  db.updates = db.updates.map((update) => ({
    ...update,
    photoIds: (update.photoIds || []).filter((id) => id !== req.params.id),
  }));
  writeDb(db);
  res.json({ success: true });
});

app.post("/api/admin/progress", requireManager, (req, res) => {
  const db = readDb();
  const currentAreas = Object.keys(db.progress.areas || {});
  const nextAreas = Object.fromEntries(
    currentAreas.map((area) => [area, sanitizeProgressValue(req.body[area])])
  );

  db.progress = {
    overall: sanitizeProgressValue(req.body.overall),
    areas: nextAreas,
  };
  writeDb(db);
  res.json({ success: true });
});

app.post("/api/admin/project-template", requireAdmin, (req, res) => {
  try {
    const db = readDb();

    const overviewCards = normalizeOverviewCards(
      parseJsonField(req.body.overviewCardsJson, "overview cards")
    );
    const scopeAreas = normalizeScopeAreas(
      parseJsonField(req.body.scopeAreasJson, "scope areas")
    );
    const summaryCards = normalizeSummaryCards(
      parseJsonField(req.body.scheduleSummaryJson, "schedule summary")
    );
    const timeline = normalizeTimeline(
      parseJsonField(req.body.timelineJson, "schedule timeline")
    );
    const progressAreas = normalizeProgressAreas(
      parseJsonField(req.body.progressAreasJson, "progress areas")
    );
    const options = normalizeOptions({
      photoPhases: splitLines(req.body.photoPhases),
      projectAreas: splitLines(req.body.projectAreas),
      noteCategories: splitLines(req.body.noteCategories),
      updateAreas: splitLines(req.body.updateAreas),
    });

    db.project = {
      name: String(req.body.projectName || ""),
      headline: String(req.body.headline || ""),
      location: String(req.body.location || ""),
      projectCode: String(req.body.projectCode || ""),
      description: String(req.body.description || ""),
      owner: {
        name: String(req.body.ownerName || ""),
        lines: splitLines(req.body.ownerLines),
      },
      architect: {
        name: String(req.body.architectName || ""),
        lines: splitLines(req.body.architectLines),
      },
      contractor: {
        name: String(req.body.contractorName || ""),
        lines: splitLines(req.body.contractorLines),
      },
      overviewCards,
      keyDates: splitLines(req.body.keyDates),
      staging: splitLines(req.body.staging),
    };

    db.scopeAreas = scopeAreas;
    db.schedule = {
      summaryCards,
      preconstructionNote: String(req.body.preconstructionNote || ""),
      timeline,
    };
    db.progress = {
      overall: sanitizeProgressValue(req.body.overall),
      areas: progressAreas,
    };
    db.options = options;

    writeDb(db);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message || "Unable to save template." });
  }
});

app.post("/api/admin/notes", requireManager, (req, res) => {
  const { title, category, note } = req.body;

  if (!title || !category || !note) {
    res.status(400).json({ error: "Title, category, and note are required." });
    return;
  }

  const db = readDb();
  db.fieldNotes.unshift({
    id: crypto.randomUUID(),
    title: String(title),
    category: String(category),
    note: String(note),
    createdAt: new Date().toISOString(),
  });
  writeDb(db);
  res.json({ success: true });
});

app.put("/api/admin/notes/:id", requireManager, (req, res) => {
  const { title, category, note } = req.body;
  const db = readDb();
  const current = db.fieldNotes.find((entry) => entry.id === req.params.id);

  if (!current) {
    res.status(404).json({ error: "Field note not found." });
    return;
  }

  current.title = String(title || current.title);
  current.category = String(category || current.category);
  current.note = String(note || current.note);
  writeDb(db);
  res.json({ success: true });
});

app.delete("/api/admin/notes/:id", requireManager, (req, res) => {
  const db = readDb();
  db.fieldNotes = db.fieldNotes.filter((entry) => entry.id !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err) {
    res.status(400).json({ error: err.message || "Request failed." });
    return;
  }
  next();
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

ensureStorage();

app.listen(PORT, HOST, () => {
  console.log(`CRX dashboard running on http://${HOST}:${PORT}`);
});
