var findRideState = {
  rides: [],
  filteredRides: [],
  view: "list",
  map: null,
  mapLayers: []
};

function formatDriverVehicle(ride) {
  if (!ride.vehicle_label) {
    return "Vehicle details coming soon";
  }

  return ride.vehicle_label;
}

function renderFindRideCard(ride) {
  return (
    '<article class="list-card">' +
    '<div class="journey-topline">' +
    '<span class="city-chip">City</span>' +
    '<span class="ride-meta">' + hopinEscapeHtml(hopinFormatDateLabel(ride.ride_date)) + "</span>" +
    "</div>" +
    '<div class="ride-card-grid">' +
    '<div class="ride-card-main">' +
    '<div class="route-stack">' +
    '<div class="route-stop">' +
    '<span class="route-dot origin"></span>' +
    '<div class="route-copy">' +
    '<strong>' + hopinEscapeHtml(ride.origin) + "</strong>" +
    '<div class="ride-meta mt-1">' + hopinEscapeHtml(hopinFormatTimeLabel(ride.ride_time)) + "</div>" +
    "</div>" +
    "</div>" +
    '<div class="route-stop">' +
    '<span class="route-dot destination"></span>' +
    '<div class="route-copy">' +
    '<strong>' + hopinEscapeHtml(ride.destination) + "</strong>" +
    "</div>" +
    "</div>" +
    "</div>" +
    '<div class="card-detail-row">' +
    '<span class="card-detail-item">' + hopinEscapeHtml(ride.seats_available + (ride.seats_available === 1 ? " seat available" : " seats available")) + "</span>" +
    '<span class="card-detail-item">' + hopinEscapeHtml(ride.notes || "Shared campus commute") + "</span>" +
    "</div>" +
    "</div>" +
    '<div class="ride-card-side">' +
    '<div class="person-summary">' +
    '<div class="person-copy">' +
    "<strong>" + hopinEscapeHtml(ride.driver_name) + "</strong>" +
    '<div class="rating-line">Rating ' + hopinEscapeHtml(ride.driver_rating) + "</div>" +
    '<div class="ride-meta mt-2">' + hopinEscapeHtml(formatDriverVehicle(ride)) + "</div>" +
    "</div>" +
    '<div class="avatar-badge">' + hopinEscapeHtml(hopinGetInitials(ride.driver_name)) + "</div>" +
    "</div>" +
    "</div>" +
    "</div>" +
    '<div class="ride-card-footer">' +
    '<div class="ride-meta">' + hopinEscapeHtml(ride.driver_home_area) + "</div>" +
    '<div class="card-actions">' +
    '<a class="btn btn-outline-primary btn-sm" href="/ride-details?id=' + ride.id + '">View Details</a>' +
    "</div>" +
    "</div>" +
    "</article>"
  );
}

function clearFindRideMapLayers() {
  if (!findRideState.mapLayers.length) {
    return;
  }

  findRideState.mapLayers.forEach(function (layer) {
    if (findRideState.map && layer) {
      findRideState.map.removeLayer(layer);
    }
  });

  findRideState.mapLayers = [];
}

function ensureFindRideMap() {
  if (findRideState.map || typeof L === "undefined") {
    return;
  }

  findRideState.map = L.map("find-map-canvas", {
    zoomControl: true,
    attributionControl: true
  }).setView([50.4452, -104.6189], 11);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(findRideState.map);
}

function renderFindRideMap() {
  ensureFindRideMap();

  if (!findRideState.map) {
    return;
  }

  clearFindRideMapLayers();

  if (!findRideState.filteredRides.length) {
    $("#find-map-summary").html(
      '<div class="empty-state">No rides match those filters right now.</div>'
    );
    findRideState.map.setView([50.4452, -104.6189], 11);
    return;
  }

  var visibleRides = findRideState.filteredRides.slice(0, 8);
  var bounds = [];
  var accentColors = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#0ea5e9", "#8b5cf6"];

  visibleRides.forEach(function (ride, index) {
    var routeLatLng = hopinGetRouteLatLng(ride.origin, ride.destination, ride.id);
    var accentColor = accentColors[index % accentColors.length];
    var line = L.polyline([routeLatLng.origin, routeLatLng.destination], {
      color: accentColor,
      weight: 4,
      opacity: 0.85
    }).bindPopup(
      "<strong>" + hopinEscapeHtml(ride.origin) + "</strong> to <strong>" + hopinEscapeHtml(ride.destination) + "</strong><br>" +
      hopinEscapeHtml(ride.driver_name) + " | " +
      hopinEscapeHtml(hopinFormatDateLabel(ride.ride_date)) + " | " +
      hopinEscapeHtml(hopinFormatTimeLabel(ride.ride_time))
    );
    var originMarker = L.circleMarker(routeLatLng.origin, {
      radius: 7,
      color: "#ffffff",
      weight: 2,
      fillColor: accentColor,
      fillOpacity: 1
    }).bindTooltip(ride.origin, { direction: "top" });
    var destinationMarker = L.circleMarker(routeLatLng.destination, {
      radius: 7,
      color: "#ffffff",
      weight: 2,
      fillColor: "#111827",
      fillOpacity: 1
    }).bindTooltip(ride.destination, { direction: "top" });

    line.addTo(findRideState.map);
    originMarker.addTo(findRideState.map);
    destinationMarker.addTo(findRideState.map);

    findRideState.mapLayers.push(line, originMarker, destinationMarker);
    bounds.push(routeLatLng.origin, routeLatLng.destination);
  });

  if (bounds.length) {
    findRideState.map.fitBounds(bounds, {
      padding: [36, 36]
    });
  }

  $("#find-map-summary").html(
    '<div class="find-map-route-list">' +
    findRideState.filteredRides.map(function (ride) {
      return (
        '<div class="find-map-route-item">' +
        '<div><strong>' + hopinEscapeHtml(ride.origin) + '</strong> to <strong>' + hopinEscapeHtml(ride.destination) + "</strong></div>" +
        '<div class="ride-meta">' + hopinEscapeHtml(hopinFormatDateLabel(ride.ride_date)) + " | " + hopinEscapeHtml(hopinFormatTimeLabel(ride.ride_time)) + "</div>" +
        "</div>"
      );
    }).join("") +
    "</div>"
  );
}

function updateFindRideCount() {
  var count = findRideState.filteredRides.length;
  $("#ride-results-count").text(count + (count === 1 ? " ride found" : " rides found"));
}

function renderFindRideList() {
  updateFindRideCount();

  if (!findRideState.filteredRides.length) {
    $("#find-ride-results").html(
      '<div class="empty-state">No rides match those filters right now.</div>'
    );
    return;
  }

  $("#find-ride-results").html(
    findRideState.filteredRides.map(function (ride) {
      return renderFindRideCard(ride);
    }).join("")
  );
}

function applyFindRideFilters() {
  var searchTerm = ($("#ride-search-input").val() || "").trim().toLowerCase();
  var fromValue = ($('[name="from"]').val() || "").trim().toLowerCase();
  var toValue = ($('[name="to"]').val() || "").trim().toLowerCase();
  var dateValue = $('[name="date"]').val();
  var seatsValue = $('[name="seats"]').val();

  findRideState.filteredRides = findRideState.rides.filter(function (ride) {
    var matchesSearch = !searchTerm ||
      ride.origin.toLowerCase().includes(searchTerm) ||
      ride.destination.toLowerCase().includes(searchTerm) ||
      ride.driver_name.toLowerCase().includes(searchTerm);

    var matchesFrom = !fromValue || ride.origin.toLowerCase().includes(fromValue);
    var matchesTo = !toValue || ride.destination.toLowerCase().includes(toValue);
    var matchesDate = !dateValue || ride.ride_date === dateValue;
    var matchesSeats = !seatsValue || Number(ride.seats_available) >= Number(seatsValue);
    var isVisibleStatus = ride.status !== "completed" && ride.status !== "cancelled";

    return matchesSearch && matchesFrom && matchesTo && matchesDate && matchesSeats && isVisibleStatus;
  });

  renderFindRideList();
  renderFindRideMap();
}

async function enrichRideData(rides) {
  return Promise.all(rides.map(async function (ride) {
    var driver = null;
    var vehicles = [];

    try {
      var driverResponse = await $.getJSON("/api/users/" + ride.driver_id);
      driver = driverResponse.data || null;
    } catch (error) {
      driver = null;
    }

    try {
      var vehicleResponse = await $.getJSON("/api/users/" + ride.driver_id + "/vehicles");
      vehicles = vehicleResponse.data || [];
    } catch (error) {
      vehicles = [];
    }

    var matchedVehicle = vehicles.find(function (vehicle) {
      return vehicle.id === ride.vehicle_id;
    }) || vehicles[0] || null;

    return {
      id: ride.id,
      driver_id: ride.driver_id,
      origin: ride.origin,
      destination: ride.destination,
      ride_date: ride.ride_date,
      ride_time: ride.ride_time,
      seats_available: ride.seats_available,
      notes: ride.notes || "",
      status: ride.status,
      driver_name: driver && driver.full_name ? driver.full_name : "Driver",
      driver_rating: driver && driver.rating_avg ? String(driver.rating_avg) : "-",
      driver_home_area: driver && driver.home_area ? driver.home_area : "Regina",
      vehicle_label: matchedVehicle
        ? [matchedVehicle.vehicle_year, matchedVehicle.make, matchedVehicle.model, "-", matchedVehicle.color].filter(Boolean).join(" ")
        : ""
    };
  }));
}

async function loadFindRides() {
  $("#find-ride-results").html(
    '<div class="detail-loading">Loading rides...</div>'
  );

  try {
    var response = await $.getJSON("/api/rides");
    var rides = response.data || [];
    findRideState.rides = await enrichRideData(rides);
    applyFindRideFilters();
  } catch (error) {
    $("#find-ride-results").html(
      '<div class="empty-state">Could not load rides right now.</div>'
    );
  }
}

function updateFindRideViewButtons() {
  $(".js-find-view").removeClass("active btn-primary").addClass("btn-light");
  $('.js-find-view[data-view="' + findRideState.view + '"]')
    .addClass("active btn-primary")
    .removeClass("btn-light");
}

function applyFindRideView() {
  updateFindRideViewButtons();

  if (findRideState.view === "map") {
    $("#find-map-panel").removeClass("d-none-soft");
    $("#find-ride-results").addClass("d-none-soft");
    renderFindRideMap();

    window.setTimeout(function () {
      if (findRideState.map) {
        findRideState.map.invalidateSize();
      }
    }, 80);

    return;
  }

  $("#find-map-panel").addClass("d-none-soft");
  $("#find-ride-results").removeClass("d-none-soft");
}

$(function () {
  loadFindRides();
  applyFindRideView();

  $(document).on("input", "#ride-search-input", function () {
    applyFindRideFilters();
  });

  $(document).on("click", "#toggle-filter-panel", function () {
    $("#find-filter-panel").toggleClass("d-none-soft");
  });

  $(document).on("submit", "#ride-filter-form", function (event) {
    event.preventDefault();
    applyFindRideFilters();
  });

  $(document).on("click", "#clear-ride-filters", function () {
    $("#ride-filter-form")[0].reset();
    $("#ride-search-input").val("");
    applyFindRideFilters();
  });

  $(document).on("click", ".js-find-view", function () {
    findRideState.view = $(this).data("view");
    applyFindRideView();
  });
});
