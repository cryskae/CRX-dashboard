const state = {
  dashboard: null,
  photoPhaseFilter: "All",
  photoAreaFilter: "All",
  editingNoteId: null,
};

const elements = {
  projectHeadline: document.querySelector("#project-headline"),
  projectDescription: document.querySelector("#project-description"),
  projectLocation: document.querySelector("#project-location"),
  projectCode: document.querySelector("#project-code"),
  overviewCards: document.querySelector("#overview-cards"),
  partnerGrid: document.querySelector("#partner-grid"),
  keyDatesList: document.querySelector("#key-dates-list"),
  stagingList: document.querySelector("#staging-list"),
  scopeGrid: document.querySelector("#scope-grid"),
  scheduleSummary: document.querySelector("#schedule-summary"),
  scheduleNote: document.querySelector("#schedule-note"),
  timeline: document.querySelector("#timeline"),
  phaseFilters: document.querySelector("#phase-filters"),
  areaFilters: document.querySelector("#area-filters"),
  galleryGrid: document.querySelector("#gallery-grid"),
  galleryEmpty: document.querySelector("#gallery-empty"),
  progressList: document.querySelector("#progress-list"),
  updatesList: document.querySelector("#updates-list"),
  notesGrid: document.querySelector("#notes-grid"),
  authMessage: document.querySelector("#auth-message"),
  authCard: document.querySelector("#auth-card"),
  adminWorkspace: document.querySelector("#admin-workspace"),
  adminMessage: document.querySelector("#admin-message"),
  logoutButton: document.querySelector("#logout-button"),
  loginForm: document.querySelector("#login-form"),
  updateForm: document.querySelector("#update-form"),
  photoForm: document.querySelector("#photo-form"),
  progressForm: document.querySelector("#progress-form"),
  noteForm: document.querySelector("#note-form"),
  noteResetButton: document.querySelector("#note-reset-button"),
  adminNotesList: document.querySelector("#admin-notes-list"),
  adminUpdatesList: document.querySelector("#admin-updates-list"),
  adminPhotosList: document.querySelector("#admin-photos-list"),
  updateAreaSelect: document.querySelector("#update-area-select"),
  updatePhaseSelect: document.querySelector("#update-phase-select"),
  photoPhaseSelect: document.querySelector("#photo-phase-select"),
  photoAreaSelect: document.querySelector("#photo-area-select"),
  noteCategorySelect: document.querySelector("#note-category-select"),
  progressRing: document.querySelector("#hero-progress-ring"),
  progressValue: document.querySelector("#hero-progress-value"),
};

function formatDate(value) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.error || "Request failed.");
  }

  return payload;
}

function renderOverviewCards(cards) {
  elements.overviewCards.innerHTML = cards
    .map(
      (card) => `
        <article class="overview-card">
          <h3>${escapeHtml(card.title)}</h3>
          <strong>${escapeHtml(card.value)}</strong>
          <p>${escapeHtml(card.detail)}</p>
        </article>
      `
    )
    .join("");
}

function renderPartners(project) {
  const groups = [
    { heading: "Owner", value: project.owner },
    { heading: "Architect", value: project.architect },
    { heading: "Contractor", value: project.contractor },
  ];

  elements.partnerGrid.innerHTML = groups
    .map(
      ({ heading, value }) => `
        <article class="partner-card">
          <p class="section-label">${heading}</p>
          <h3>${escapeHtml(value.name)}</h3>
          ${value.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
        </article>
      `
    )
    .join("");
}

function renderSimpleList(target, items) {
  target.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderScope(scopeAreas) {
  elements.scopeGrid.innerHTML = scopeAreas
    .map(
      (area) => `
        <article class="scope-card">
          <div class="scope-meta">
            <span>${escapeHtml(area.sequence)}</span>
            <span>${escapeHtml(area.duration)}</span>
          </div>
          <h3>${escapeHtml(area.name)}</h3>
          <p>${escapeHtml(area.subtitle)}</p>
          <ul>
            ${area.tasks.map((task) => `<li>${escapeHtml(task)}</li>`).join("")}
          </ul>
        </article>
      `
    )
    .join("");
}

function renderSchedule(schedule) {
  elements.scheduleSummary.innerHTML = schedule.summaryCards
    .map(
      (card) => `
        <article class="schedule-card">
          <span>${escapeHtml(card.label)}</span>
          <strong>${escapeHtml(card.value)}</strong>
        </article>
      `
    )
    .join("");

  elements.scheduleNote.textContent = schedule.preconstructionNote;

  elements.timeline.innerHTML = schedule.timeline
    .map(
      (item) => `
        <article class="timeline-card">
          <span class="days">${escapeHtml(item.days)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <ul>
            ${item.items.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}
          </ul>
        </article>
      `
    )
    .join("");
}

function renderFilterGroup(target, values, activeValue, onClick) {
  target.innerHTML = "";
  ["All", ...values].forEach((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip${value === activeValue ? " active" : ""}`;
    button.textContent = value;
    button.addEventListener("click", () => onClick(value));
    target.appendChild(button);
  });
}

function getFilteredPhotos() {
  const photos = state.dashboard.photos || [];
  return photos.filter((photo) => {
    const phaseMatches =
      state.photoPhaseFilter === "All" || photo.phase === state.photoPhaseFilter;
    const areaMatches =
      state.photoAreaFilter === "All" || photo.area === state.photoAreaFilter;
    return phaseMatches && areaMatches;
  });
}

function renderGallery() {
  const filtered = getFilteredPhotos();

  elements.galleryGrid.innerHTML = filtered
    .map(
      (photo) => `
        <article class="gallery-card">
          <img src="${escapeHtml(photo.imageUrl)}" alt="${escapeHtml(photo.caption || photo.area)}" />
          <div class="gallery-body">
            <div class="gallery-tags">
              <span>${escapeHtml(photo.phase)}</span>
              <span>${escapeHtml(photo.area)}</span>
            </div>
            <h3>${escapeHtml(photo.caption || `${photo.phase} - ${photo.area}`)}</h3>
            <p>${escapeHtml(formatDate(photo.uploadedAt))}</p>
          </div>
        </article>
      `
    )
    .join("");

  elements.galleryEmpty.classList.toggle("hidden", filtered.length > 0);
}

function renderProgress(progress) {
  const entries = Object.entries(progress.areas);
  elements.progressList.innerHTML = entries
    .map(
      ([area, value]) => `
        <div class="progress-track">
          <header>
            <strong>${escapeHtml(area)}</strong>
            <span>${escapeHtml(`${value}%`)}</span>
          </header>
          <div class="bar-shell">
            <div class="bar-fill" style="width: ${value}%"></div>
          </div>
        </div>
      `
    )
    .join("");

  const circumference = 327;
  const offset = circumference - (progress.overall / 100) * circumference;
  elements.progressRing.style.strokeDashoffset = offset;
  elements.progressValue.textContent = `${progress.overall}%`;
}

function photoMap() {
  return new Map((state.dashboard.photos || []).map((photo) => [photo.id, photo]));
}

function renderUpdates() {
  const photos = photoMap();
  elements.updatesList.innerHTML = state.dashboard.updates
    .map((update) => {
      const linkedPhotos = (update.photoIds || [])
        .map((id) => photos.get(id))
        .filter(Boolean)
        .slice(0, 2);

      return `
        <article class="stack-card">
          <div class="stack-meta">
            <span>${escapeHtml(update.area)}</span>
            <span>${escapeHtml(formatDate(update.createdAt))}</span>
          </div>
          <h3>${escapeHtml(update.title)}</h3>
          <p>${escapeHtml(update.description)}</p>
          ${
            linkedPhotos.length
              ? `<div class="gallery-tags" style="margin-top: 12px;">
                  ${linkedPhotos
                    .map((photo) => `<span>${escapeHtml(photo.phase)}</span>`)
                    .join("")}
                </div>`
              : ""
          }
        </article>
      `;
    })
    .join("");
}

function renderNotes() {
  elements.notesGrid.innerHTML = state.dashboard.fieldNotes
    .map(
      (note) => `
        <article class="note-card">
          <div class="note-meta">
            <span class="note-category">${escapeHtml(note.category)}</span>
            <span>${escapeHtml(formatDate(note.createdAt))}</span>
          </div>
          <h3>${escapeHtml(note.title)}</h3>
          <p>${escapeHtml(note.note)}</p>
        </article>
      `
    )
    .join("");
}

function renderAdminLists() {
  elements.adminNotesList.innerHTML = state.dashboard.fieldNotes
    .map(
      (note) => `
        <article class="manage-item">
          <div class="manage-meta">
            <span>${escapeHtml(note.category)}</span>
            <span>${escapeHtml(formatDate(note.createdAt))}</span>
          </div>
          <h4>${escapeHtml(note.title)}</h4>
          <p>${escapeHtml(note.note)}</p>
          <div class="manage-actions">
            <button class="secondary-button" type="button" data-edit-note="${note.id}">Edit</button>
            <button class="danger-button" type="button" data-delete-note="${note.id}">Delete</button>
          </div>
        </article>
      `
    )
    .join("");

  elements.adminUpdatesList.innerHTML = state.dashboard.updates
    .map(
      (update) => `
        <article class="manage-item">
          <div class="manage-meta">
            <span>${escapeHtml(update.area)}</span>
            <span>${escapeHtml(formatDate(update.createdAt))}</span>
          </div>
          <h4>${escapeHtml(update.title)}</h4>
          <p>${escapeHtml(update.description)}</p>
          <div class="manage-actions">
            <button class="danger-button" type="button" data-delete-update="${update.id}">Delete Update</button>
          </div>
        </article>
      `
    )
    .join("");

  elements.adminPhotosList.innerHTML = state.dashboard.photos
    .slice(0, 8)
    .map(
      (photo) => `
        <article class="manage-item">
          <div class="manage-meta">
            <span>${escapeHtml(photo.phase)}</span>
            <span>${escapeHtml(photo.area)}</span>
          </div>
          <h4>${escapeHtml(photo.caption || `${photo.phase} - ${photo.area}`)}</h4>
          <p>${escapeHtml(formatDate(photo.uploadedAt))}</p>
          <div class="manage-actions">
            <button class="danger-button" type="button" data-delete-photo="${photo.id}">
              Delete Photo
            </button>
          </div>
        </article>
      `
    )
    .join("");
}

function setAdminVisible(visible) {
  elements.adminWorkspace.classList.toggle("hidden", !visible);
  elements.logoutButton.classList.toggle("hidden", !visible);
  elements.loginForm.classList.toggle("hidden", visible);
}

function populateSelect(select, values) {
  select.innerHTML = values
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join("");
}

function hydrateAdminForms() {
  const progress = state.dashboard.progress;
  elements.progressForm.elements.overall.value = progress.overall;
  elements.progressForm.elements.northDeck.value = progress.areas["North Deck"];
  elements.progressForm.elements.southCourtyard.value =
    progress.areas["South Courtyard"];
  elements.progressForm.elements.lobby.value = progress.areas.Lobby;
  elements.progressForm.elements.poolTerrace.value =
    progress.areas["Pool Terrace"];
}

function resetNoteForm() {
  state.editingNoteId = null;
  elements.noteForm.reset();
  elements.noteForm.elements.id.value = "";
  elements.noteResetButton.textContent = "Clear";
}

function bindManageActions() {
  document.querySelectorAll("[data-edit-note]").forEach((button) => {
    button.addEventListener("click", () => {
      const note = state.dashboard.fieldNotes.find(
        (entry) => entry.id === button.dataset.editNote
      );
      if (!note) {
        return;
      }

      state.editingNoteId = note.id;
      elements.noteForm.elements.id.value = note.id;
      elements.noteForm.elements.title.value = note.title;
      elements.noteForm.elements.category.value = note.category;
      elements.noteForm.elements.note.value = note.note;
      elements.noteResetButton.textContent = "Cancel Edit";
      window.location.hash = "#admin";
    });
  });

  document.querySelectorAll("[data-delete-note]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!window.confirm("Delete this field note?")) {
        return;
      }
      await submitDelete(`/api/admin/notes/${button.dataset.deleteNote}`);
    });
  });

  document.querySelectorAll("[data-delete-update]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!window.confirm("Delete this update and its linked uploaded photos?")) {
        return;
      }
      await submitDelete(`/api/admin/updates/${button.dataset.deleteUpdate}`);
    });
  });

  document.querySelectorAll("[data-delete-photo]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!window.confirm("Delete this photo?")) {
        return;
      }
      await submitDelete(`/api/admin/photos/${button.dataset.deletePhoto}`);
    });
  });
}

function renderDashboard() {
  const { project, scopeAreas, schedule, progress, options } = state.dashboard;

  elements.projectHeadline.textContent = project.headline;
  elements.projectDescription.textContent = project.description;
  elements.projectLocation.textContent = project.location;
  elements.projectCode.textContent = project.projectCode;

  renderOverviewCards(project.overviewCards);
  renderPartners(project);
  renderSimpleList(elements.keyDatesList, project.keyDates);
  renderSimpleList(elements.stagingList, project.staging);
  renderScope(scopeAreas);
  renderSchedule(schedule);
  renderProgress(progress);
  renderUpdates();
  renderNotes();

  renderFilterGroup(
    elements.phaseFilters,
    options.photoPhases,
    state.photoPhaseFilter,
    (value) => {
      state.photoPhaseFilter = value;
      renderDashboard();
    }
  );
  renderFilterGroup(
    elements.areaFilters,
    options.projectAreas,
    state.photoAreaFilter,
    (value) => {
      state.photoAreaFilter = value;
      renderDashboard();
    }
  );
  renderGallery();

  populateSelect(elements.updateAreaSelect, options.updateAreas);
  populateSelect(elements.updatePhaseSelect, options.photoPhases);
  populateSelect(elements.photoPhaseSelect, options.photoPhases);
  populateSelect(elements.photoAreaSelect, options.projectAreas);
  populateSelect(elements.noteCategorySelect, options.noteCategories);
  hydrateAdminForms();
  renderAdminLists();
  bindManageActions();
  setAdminVisible(state.dashboard.adminAuthenticated);
}

async function refreshDashboard(message = "") {
  state.dashboard = await request("/api/dashboard");
  renderDashboard();
  if (message) {
    elements.adminMessage.textContent = message;
  }
}

async function handleFormSubmit(form, url, successMessage, useFormData = false, method = "POST") {
  const payload = useFormData
    ? new FormData(form)
    : JSON.stringify(Object.fromEntries(new FormData(form).entries()));

  await request(url, {
    method,
    body: payload,
    headers: useFormData ? undefined : { "Content-Type": "application/json" },
  });

  form.reset();
  await refreshDashboard(successMessage);
}

async function submitDelete(url) {
  await request(url, { method: "DELETE" });
  await refreshDashboard("Changes saved.");
}

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.authMessage.textContent = "";

  try {
    await handleFormSubmit(
      elements.loginForm,
      "/api/admin/login",
      "Admin session active."
    );
    elements.authMessage.textContent = "Admin session active.";
  } catch (error) {
    elements.authMessage.textContent = error.message;
  }
});

elements.logoutButton.addEventListener("click", async () => {
  try {
    await request("/api/admin/logout", { method: "POST" });
    await refreshDashboard("Signed out.");
    elements.authMessage.textContent = "Signed out.";
  } catch (error) {
    elements.authMessage.textContent = error.message;
  }
});

elements.updateForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await handleFormSubmit(
      elements.updateForm,
      "/api/admin/updates",
      "Update published.",
      true
    );
  } catch (error) {
    elements.adminMessage.textContent = error.message;
  }
});

elements.photoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await handleFormSubmit(
      elements.photoForm,
      "/api/admin/photos",
      "Photos uploaded.",
      true
    );
  } catch (error) {
    elements.adminMessage.textContent = error.message;
  }
});

elements.progressForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await handleFormSubmit(
      elements.progressForm,
      "/api/admin/progress",
      "Progress updated."
    );
  } catch (error) {
    elements.adminMessage.textContent = error.message;
  }
});

elements.noteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const noteId = elements.noteForm.elements.id.value;

  try {
    if (noteId) {
      await handleFormSubmit(
        elements.noteForm,
        `/api/admin/notes/${noteId}`,
        "Field note updated.",
        false,
        "PUT"
      );
    } else {
      await handleFormSubmit(
        elements.noteForm,
        "/api/admin/notes",
        "Field note added."
      );
    }
    resetNoteForm();
  } catch (error) {
    elements.adminMessage.textContent = error.message;
  }
});

elements.noteResetButton.addEventListener("click", () => {
  resetNoteForm();
});

refreshDashboard().catch((error) => {
  elements.adminMessage.textContent = error.message;
});
