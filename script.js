const locateData = [
  {
    ticketId: "LOC-4582",
    address: "123 Utility Ave, Denver, CO",
    scheduledDate: "2024-07-12",
    status: "scheduled",
    contact: "Jamie Rivera",
    coordinates: [39.7392, -104.9903],
  },
  {
    ticketId: "LOC-4610",
    address: "512 Meadow St, Fort Collins, CO",
    scheduledDate: "2024-07-10",
    status: "in-progress",
    contact: "Aria Patel",
    coordinates: [40.5853, -105.0844],
  },
  {
    ticketId: "LOC-4561",
    address: "81 Lakeside Rd, Boulder, CO",
    scheduledDate: "2024-07-08",
    status: "completed",
    contact: "Dylan Chen",
    coordinates: [40.015, -105.2705],
  },
  {
    ticketId: "LOC-4550",
    address: "940 Pine Ridge Dr, Colorado Springs, CO",
    scheduledDate: "2024-07-09",
    status: "delayed",
    contact: "Morgan Lee",
    coordinates: [38.8339, -104.8214],
  },
];

const locateTable = document.getElementById("locateTable");
const statusFilter = document.getElementById("statusFilter");
const searchInput = document.getElementById("searchInput");
const visibleCount = document.getElementById("visibleCount");
const form = document.getElementById("locateForm");

const totalCountEl = document.getElementById("totalCount");
const inProgressCountEl = document.getElementById("inProgressCount");
const completedCountEl = document.getElementById("completedCount");
const delayedCountEl = document.getElementById("delayedCount");

let map;
let markers = [];

function initMap() {
  map = L.map("map", {
    zoomControl: false,
  }).setView([39.5, -105.5], 7);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a> contributors",
  }).addTo(map);

  updateMapMarkers(locateData);
}

function updateMapMarkers(data) {
  markers.forEach((marker) => marker.remove());
  markers = [];

  data.forEach((locate) => {
    if (!locate.coordinates) return;

    const marker = L.circleMarker(locate.coordinates, {
      radius: 10,
      weight: 2,
      color: getStatusColor(locate.status),
      fillColor: getStatusColor(locate.status),
      fillOpacity: 0.6,
    }).addTo(map);

    marker.bindPopup(
      `<strong>${locate.ticketId}</strong><br>${locate.address}<br>Status: ${formatStatus(
        locate.status
      )}`
    );

    markers.push(marker);
  });

  const bounds = L.latLngBounds(markers.map((marker) => marker.getLatLng()));
  if (markers.length > 1) {
    map.fitBounds(bounds.pad(0.2));
  } else if (markers.length === 1) {
    map.setView(bounds.getCenter(), 11);
  }
}

function renderTable(data) {
  locateTable.innerHTML = "";

  const fragment = document.createDocumentFragment();

  data.forEach((locate) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${locate.ticketId}</td>
      <td>${locate.address}</td>
      <td>${formatDate(locate.scheduledDate)}</td>
      <td><span class="status status--${locate.status}">${formatStatus(locate.status)}</span></td>
      <td>${locate.contact}</td>
    `;

    fragment.appendChild(row);
  });

  locateTable.appendChild(fragment);
  visibleCount.textContent = `${data.length} ${data.length === 1 ? "result" : "results"}`;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatStatus(status) {
  return status
    .replace("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusColor(status) {
  const colors = {
    scheduled: "#818cf8",
    "in-progress": "#facc15",
    completed: "#22c55e",
    delayed: "#f97316",
  };
  return colors[status] || "#3b82f6";
}

function updateStats() {
  totalCountEl.textContent = locateData.length;
  inProgressCountEl.textContent = locateData.filter(
    (item) => item.status === "in-progress"
  ).length;
  completedCountEl.textContent = locateData.filter(
    (item) => item.status === "completed"
  ).length;
  delayedCountEl.textContent = locateData.filter((item) => item.status === "delayed").length;
}

function applyFilters() {
  const statusValue = statusFilter.value;
  const searchValue = searchInput.value.trim().toLowerCase();

  const filtered = locateData.filter((locate) => {
    const matchesStatus = statusValue === "all" || locate.status === statusValue;
    const matchesSearch =
      locate.ticketId.toLowerCase().includes(searchValue) ||
      locate.address.toLowerCase().includes(searchValue);
    return matchesStatus && matchesSearch;
  });

  renderTable(filtered);
  updateMapMarkers(filtered);
}

function handleFormSubmit(event) {
  event.preventDefault();

  const formData = new FormData(form);
  const newLocate = {
    ticketId: formData.get("ticketId").trim(),
    address: formData.get("address").trim(),
    scheduledDate: formData.get("scheduledDate"),
    status: formData.get("status"),
    contact: formData.get("contact").trim(),
    coordinates: null,
  };

  locateData.unshift(newLocate);
  updateStats();
  applyFilters();
  form.reset();
}

statusFilter.addEventListener("change", applyFilters);
searchInput.addEventListener("input", applyFilters);
form.addEventListener("submit", handleFormSubmit);

document.addEventListener("DOMContentLoaded", () => {
  updateStats();
  renderTable(locateData);
  initMap();
});
