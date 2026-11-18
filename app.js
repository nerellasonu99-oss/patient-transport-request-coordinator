// This demo keeps its data in this browser only; use fictional references and practical notes.
const STORAGE_KEY = "careRouteTransportRequests";
const drivers = [
  { id: "driver-amy", name: "Amy Chen" },
  { id: "driver-jordan", name: "Jordan Lee" },
  { id: "driver-sam", name: "Sam Rivera" }
];
const vehicles = [
  { id: "vehicle-van-12", name: "Accessible Van 12" },
  { id: "vehicle-car-08", name: "Transport Car 08" },
  { id: "vehicle-van-21", name: "Accessible Van 21" }
];
const statuses = ["Requested", "Confirmed", "In transit", "Completed", "Cancelled"];
const activeStatuses = ["Requested", "Confirmed", "In transit"];

const elements = {
  view: document.getElementById("view-select"),
  date: document.getElementById("today-date"),
  form: document.getElementById("request-form"),
  notice: document.getElementById("notice"),
  search: document.getElementById("search-input"),
  filter: document.getElementById("status-filter"),
  schedule: document.getElementById("schedule"),
  visibleCount: document.getElementById("visible-count"),
  countAll: document.getElementById("count-all"),
  countActive: document.getElementById("count-active"),
  countCompleted: document.getElementById("count-completed"),
  countToday: document.getElementById("count-today")
};

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDateString(date);
}

function makeHistoryEntry(message) {
  return { message, at: new Date().toISOString() };
}

function makeSampleRequests() {
  return [
    {
      id: "sample-1042", patientReference: "PT-1042", pickup: "North Clinic · Main Entrance",
      dropoff: "Riverside Health Centre", date: dateOffset(0), time: "09:15",
      mobility: "Wheelchair", notes: "Please allow extra boarding time.", driverId: "driver-amy",
      vehicleId: "vehicle-van-12", status: "Confirmed",
      history: [makeHistoryEntry("Request created · Requested"), makeHistoryEntry("Assigned to Amy Chen · Confirmed")]
    },
    {
      id: "sample-1088", patientReference: "PT-1088", pickup: "Westside Community Clinic",
      dropoff: "Maple Day Unit", date: dateOffset(0), time: "11:40",
      mobility: "Walking assistance", notes: "", driverId: "driver-jordan",
      vehicleId: "vehicle-car-08", status: "In transit",
      history: [makeHistoryEntry("Request created · Requested"), makeHistoryEntry("Assigned to Jordan Lee · Confirmed"), makeHistoryEntry("Status changed to In transit")]
    },
    {
      id: "sample-1103", patientReference: "PT-1103", pickup: "Oak Street Clinic",
      dropoff: "Harbor Rehabilitation Centre", date: dateOffset(1), time: "14:00",
      mobility: "Independent", notes: "", driverId: "", vehicleId: "", status: "Requested",
      history: [makeHistoryEntry("Request created · Requested")]
    },
    {
      id: "sample-1120", patientReference: "PT-1120", pickup: "Central Medical Pavilion",
      dropoff: "Meadowbrook Health Centre", date: dateOffset(-1), time: "10:20",
      mobility: "Wheelchair", notes: "", driverId: "driver-sam",
      vehicleId: "vehicle-van-21", status: "Completed",
      history: [makeHistoryEntry("Request created · Requested"), makeHistoryEntry("Assigned to Sam Rivera · Confirmed"), makeHistoryEntry("Status changed to Completed")]
    }
  ];
}

function loadRequests() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return makeSampleRequests();
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error("Saved requests must be a list.");
    return parsed;
  } catch (error) {
    showNotice(`Saved requests could not be loaded (${error.message}). The sample schedule is shown for this session.`, true);
    return makeSampleRequests();
  }
}

let requests = loadRequests();
let activeView = "dispatcher";

function showNotice(message, isError) {
  elements.notice.textContent = message;
  elements.notice.classList.toggle("notice-error", Boolean(isError));
  elements.notice.hidden = false;
}

function saveRequests(successMessage) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    if (successMessage) showNotice(successMessage, false);
    return true;
  } catch (error) {
    showNotice(`Changes are visible, but could not be saved in this browser (${error.message}).`, true);
    return false;
  }
}

function displayDate(dateString) {
  if (!dateString) return "Date not set";
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(date);
}

function displayTimestamp(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function getDriverName(driverId) {
  const driver = drivers.find((item) => item.id === driverId);
  return driver ? driver.name : "";
}

function getVehicleName(vehicleId) {
  const vehicle = vehicles.find((item) => item.id === vehicleId);
  return vehicle ? vehicle.name : "";
}

function addOption(select, value, label, selected) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  option.selected = selected;
  select.append(option);
}

function addViewOptions() {
  drivers.forEach((driver) => addOption(elements.view, driver.id, `Driver · ${driver.name}`, false));
}

function getVisibleRequests() {
  const query = elements.search.value.trim().toLowerCase();
  const selectedStatus = elements.filter.value;
  return requests
    .filter((request) => activeView === "dispatcher" || request.driverId === activeView)
    .filter((request) => selectedStatus === "all" || request.status === selectedStatus)
    .filter((request) => {
      if (!query) return true;
      return [request.patientReference, request.pickup, request.dropoff].some((value) => String(value || "").toLowerCase().includes(query));
    })
    .sort((first, second) => `${first.date} ${first.time}`.localeCompare(`${second.date} ${second.time}`));
}

function updateSummary() {
  elements.countAll.textContent = requests.length;
  elements.countActive.textContent = requests.filter((request) => activeStatuses.includes(request.status)).length;
  elements.countCompleted.textContent = requests.filter((request) => request.status === "Completed").length;
  elements.countToday.textContent = requests.filter((request) => request.date === localDateString(new Date())).length;
}

function makeMetaChip(text) {
  const chip = document.createElement("span");
  chip.className = "meta-chip";
  chip.textContent = text;
  return chip;
}

function makeAssignmentSelect(request, label, items, selectedId, changeHandler) {
  const wrapper = document.createElement("label");
  wrapper.textContent = label;
  const select = document.createElement("select");
  select.setAttribute("aria-label", `${label} for ${request.patientReference}`);
  addOption(select, "", `Select ${label.toLowerCase()}`, !selectedId);
  items.forEach((item) => addOption(select, item.id, item.name, selectedId === item.id));
  select.addEventListener("change", (event) => changeHandler(request, event.target.value));
  wrapper.append(select);
  return wrapper;
}

function makeAssignmentControls(request) {
  const controls = document.createElement("div");
  controls.className = "assignment-controls";
  controls.append(
    makeAssignmentSelect(request, "Driver", drivers, request.driverId, assignDriver),
    makeAssignmentSelect(request, "Vehicle", vehicles, request.vehicleId, assignVehicle)
  );
  return controls;
}

function makeDriverStatusControls(request) {
  const controls = document.createElement("div");
  controls.className = "driver-status-controls";
  const label = document.createElement("label");
  label.textContent = "Update trip status";
  label.htmlFor = `status-${request.id}`;
  const select = document.createElement("select");
  select.className = "driver-status-select";
  select.id = `status-${request.id}`;
  select.setAttribute("aria-label", `Update status for ${request.patientReference}`);
  statuses.filter((status) => status !== "Requested").forEach((status) => addOption(select, status, status, request.status === status));
  select.value = request.status === "Requested" ? "Confirmed" : request.status;
  select.addEventListener("change", () => changeStatus(request, select.value));
  controls.append(label, select);
  return controls;
}

function makeHistory(request) {
  const details = document.createElement("details");
  details.className = "request-history";
  const summary = document.createElement("summary");
  summary.textContent = `Activity history (${request.history.length})`;
  const list = document.createElement("ul");
  list.className = "history-list";
  request.history.slice().reverse().forEach((entry) => {
    const item = document.createElement("li");
    const message = document.createElement("span");
    const time = document.createElement("time");
    message.textContent = entry.message;
    time.dateTime = entry.at;
    time.textContent = displayTimestamp(entry.at);
    item.append(message, time);
    list.append(item);
  });
  details.append(summary, list);
  return details;
}

function makeRequestCard(request) {
  const card = document.createElement("article");
  card.className = "request-card";

  const top = document.createElement("div");
  top.className = "request-top";
  const requestInfo = document.createElement("div");
  const reference = document.createElement("h3");
  reference.className = "request-reference";
  reference.textContent = request.patientReference;
  const dateTime = document.createElement("p");
  dateTime.className = "request-datetime";
  dateTime.textContent = `${displayDate(request.date)} · ${request.time}`;
  requestInfo.append(reference, dateTime);

  const badge = document.createElement("span");
  badge.className = `status-badge status-${request.status.toLowerCase().replaceAll(" ", "-")}`;
  badge.textContent = request.status;
  top.append(requestInfo, badge);

  const route = document.createElement("div");
  route.className = "route";
  const track = document.createElement("span");
  track.className = "route-track";
  track.setAttribute("aria-hidden", "true");
  const pickupPoint = document.createElement("span");
  pickupPoint.className = "route-point";
  const dropoffPoint = document.createElement("span");
  dropoffPoint.className = "route-point";
  track.append(pickupPoint, dropoffPoint);
  const locations = document.createElement("div");
  [request.pickup, request.dropoff].forEach((location, index) => {
    const line = document.createElement("span");
    line.className = "route-label";
    const hint = document.createElement("small");
    hint.textContent = index === 0 ? "Pickup" : "Drop-off";
    line.append(hint, document.createTextNode(location));
    locations.append(line);
  });
  route.append(track, locations);

  const meta = document.createElement("div");
  meta.className = "request-meta";
  meta.append(makeMetaChip(`Mobility · ${request.mobility}`));
  meta.append(makeMetaChip(`Driver · ${getDriverName(request.driverId) || "Unassigned"}`));
  meta.append(makeMetaChip(`Vehicle · ${getVehicleName(request.vehicleId) || "Unassigned"}`));
  if (request.notes) meta.append(makeMetaChip(`Note · ${request.notes}`));

  card.append(top, route, meta);
  if (activeView === "dispatcher") card.append(makeAssignmentControls(request));
  else card.append(makeDriverStatusControls(request));
  card.append(makeHistory(request));
  return card;
}

function render() {
  updateSummary();
  const visibleRequests = getVisibleRequests();
  elements.schedule.replaceChildren();
  elements.visibleCount.textContent = `${visibleRequests.length} ${visibleRequests.length === 1 ? "request" : "requests"}`;
  if (visibleRequests.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const icon = document.createElement("span");
    icon.className = "empty-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = activeView === "dispatcher" ? "＋" : "✓";
    const heading = document.createElement("h3");
    const description = document.createElement("p");
    if (activeView !== "dispatcher" && !requests.some((request) => request.driverId === activeView)) {
      heading.textContent = "No trips assigned yet";
      description.textContent = "Assigned transport requests will appear here.";
    } else if (elements.search.value || elements.filter.value !== "all") {
      heading.textContent = "No requests match";
      description.textContent = "Try changing the search text or status filter.";
    } else {
      heading.textContent = "No transport requests";
      description.textContent = "Create a request to add the first journey to the schedule.";
    }
    empty.append(icon, heading, description);
    elements.schedule.append(empty);
    return;
  }
  visibleRequests.forEach((request) => elements.schedule.append(makeRequestCard(request)));
}

function recordStatusChange(request, status, message) {
  if (request.status === status) return false;
  request.status = status;
  request.history.push(makeHistoryEntry(message || `Status changed to ${status}`));
  return true;
}

function assignDriver(request, driverId) {
  if (request.driverId === driverId) return;
  const oldDriver = getDriverName(request.driverId);
  request.driverId = driverId;
  const newDriver = getDriverName(driverId);
  if (driverId) {
    request.history.push(makeHistoryEntry(`Assigned to ${newDriver}`));
    if (request.status === "Requested") recordStatusChange(request, "Confirmed", `Status changed to Confirmed · Assigned to ${newDriver}`);
  } else if (oldDriver) {
    request.history.push(makeHistoryEntry(`Driver assignment removed · ${oldDriver}`));
  }
  saveRequests(driverId ? `${request.patientReference} assigned to ${newDriver}${request.status === "Confirmed" ? " and confirmed" : ""}.` : `Driver assignment removed from ${request.patientReference}.`);
  render();
}

function assignVehicle(request, vehicleId) {
  if (request.vehicleId === vehicleId) return;
  const oldVehicle = getVehicleName(request.vehicleId);
  request.vehicleId = vehicleId;
  const newVehicle = getVehicleName(vehicleId);
  if (vehicleId) request.history.push(makeHistoryEntry(`Vehicle assigned · ${newVehicle}`));
  else if (oldVehicle) request.history.push(makeHistoryEntry(`Vehicle assignment removed · ${oldVehicle}`));
  saveRequests(vehicleId ? `${newVehicle} assigned to ${request.patientReference}.` : `Vehicle assignment removed from ${request.patientReference}.`);
  render();
}

function changeStatus(request, status) {
  if (!statuses.includes(status) || !recordStatusChange(request, status)) return;
  saveRequests(`${request.patientReference} status updated to ${status}.`);
  render();
}

function handleCreateRequest(event) {
  event.preventDefault();
  if (!elements.form.reportValidity()) return;

  const formData = new FormData(elements.form);
  const request = {
    id: `request-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    patientReference: String(formData.get("patientReference")).trim(),
    pickup: String(formData.get("pickup")).trim(),
    dropoff: String(formData.get("dropoff")).trim(),
    date: String(formData.get("date")),
    time: String(formData.get("time")),
    mobility: String(formData.get("mobility")),
    notes: String(formData.get("notes")).trim(),
    driverId: "",
    vehicleId: "",
    status: "Requested",
    history: [makeHistoryEntry("Request created · Requested")]
  };
  if (!request.patientReference || !request.pickup || !request.dropoff || !request.date || !request.time || !request.mobility) {
    showNotice("Please complete all required fields before adding the request.", true);
    return;
  }
  requests.push(request);
  saveRequests(`Request ${request.patientReference} added to the schedule.`);
  elements.form.reset();
  document.getElementById("travel-date").min = localDateString(new Date());
  document.getElementById("travel-date").value = localDateString(new Date());
  render();
  document.getElementById("schedule-heading").focus();
}

elements.date.textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());
document.getElementById("travel-date").min = localDateString(new Date());
document.getElementById("travel-date").value = localDateString(new Date());
addViewOptions();
elements.form.addEventListener("submit", handleCreateRequest);

// ── 3D Custom Dropdown ────────────────────────────────────────────────────────
(function setup3dDropdown() {
  const picker    = document.getElementById("view-picker-3d");
  const panel     = document.getElementById("vp3d-panel");
  const inner     = panel ? panel.querySelector(".vp3d-inner") : null;
  const labelEl   = document.getElementById("view-picker-label");
  const roleIcon  = document.getElementById("view-role-icon");
  const nativeSel = document.getElementById("view-select");

  if (!picker || !panel || !inner) return;

  // ── Teleport panel to <body> so position:fixed has no transform ancestor ──
  document.body.appendChild(panel);

  // Build option list from drivers + dispatcher
  var allOptions = [
    { value: "dispatcher", label: "Dispatcher", icon: "D" }
  ].concat(drivers.map(function(d) {
    return { value: d.id, label: "Driver \u00b7 " + d.name, icon: d.name.charAt(0) };
  }));

  // Also populate native select for compatibility
  if (nativeSel) {
    nativeSel.innerHTML = "";
    allOptions.forEach(function(opt) {
      var o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      nativeSel.appendChild(o);
    });
  }

  var currentValue = "dispatcher";

  function renderOptions() {
    inner.innerHTML = "";
    allOptions.forEach(function(opt, idx) {
      if (idx === 1) {
        var div = document.createElement("div");
        div.className = "vp3d-divider";
        inner.appendChild(div);
      }

      var el = document.createElement("div");
      el.className = "vp3d-option" + (opt.value === currentValue ? " vp3d-active" : "");
      el.setAttribute("role", "option");
      el.setAttribute("aria-selected", opt.value === currentValue ? "true" : "false");
      el.dataset.value = opt.value;
      el.style.transitionDelay = (idx * 48) + "ms";

      var dot = document.createElement("span");
      dot.className = "vp3d-option-dot";

      var text = document.createElement("span");
      text.textContent = opt.label;

      el.appendChild(dot);
      el.appendChild(text);

      el.addEventListener("mousedown", function(e) {
        e.preventDefault();
        selectOption(opt.value, opt.label, opt.icon);
        close();
      });

      inner.appendChild(el);
    });
  }

  function selectOption(value, label, icon) {
    currentValue = value;
    activeView = value;
    if (labelEl)  labelEl.textContent = label;
    if (roleIcon) roleIcon.textContent = icon;
    if (nativeSel) nativeSel.value = value;
    renderOptions();
    render();
  }

  function positionPanel() {
    var rect = picker.getBoundingClientRect();
    panel.style.top   = (rect.bottom + 8) + "px";
    panel.style.left  = rect.left + "px";
    panel.style.right = "auto";
  }

  function open() {
    renderOptions();
    positionPanel();
    picker.setAttribute("aria-expanded", "true");
    // Use rAF so the position is applied before the class triggers transition
    requestAnimationFrame(function() {
      panel.classList.add("vp3d-open");
    });
  }

  function close() {
    picker.setAttribute("aria-expanded", "false");
    panel.classList.remove("vp3d-open");
  }

  function toggle() {
    if (panel.classList.contains("vp3d-open")) close();
    else open();
  }

  picker.addEventListener("click", function(e) {
    e.stopPropagation();
    toggle();
  });

  picker.addEventListener("keydown", function(e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    if (e.key === "Escape") close();
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      var idx = allOptions.findIndex(function(o) { return o.value === currentValue; });
      var next = e.key === "ArrowDown"
        ? Math.min(idx + 1, allOptions.length - 1)
        : Math.max(idx - 1, 0);
      var opt = allOptions[next];
      if (opt) selectOption(opt.value, opt.label, opt.icon);
      open();
    }
  });

  document.addEventListener("click", function(e) {
    if (!picker.contains(e.target) && !panel.contains(e.target)) close();
  });

  // Reposition on scroll/resize
  window.addEventListener("resize", function() {
    if (panel.classList.contains("vp3d-open")) positionPanel();
  });

  renderOptions();
})();

elements.search.addEventListener("input", render);
elements.filter.addEventListener("change", render);
render();
