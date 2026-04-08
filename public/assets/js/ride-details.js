function getRideDetailContext() {
  var params = new URLSearchParams(window.location.search);

  return {
    rideId: params.get("id"),
    openRequestId: params.get("openRequestId")
  };
}

function getRideStageIndex(status) {
  if (status === "completed") {
    return 4;
  }

  if (status === "in_progress") {
    return 3;
  }

  if (status === "accepted" || status === "full") {
    return 2;
  }

  return 1;
}

function getRequestStatusSummary(status, actorName) {
  if (status === "accepted") {
    return "Your request has been accepted" + (actorName ? " by " + actorName : "") + ".";
  }

  if (status === "declined") {
    return "Your request was declined" + (actorName ? " by " + actorName : "") + ".";
  }

  if (status === "requested") {
    return "Your request is still waiting for a driver response.";
  }

  if (status === "ignored") {
    return "Your request was ignored for now.";
  }

  if (status === "cancelled") {
    return "This request was cancelled and is no longer active.";
  }

  return "";
}

function setRideDetailFeedback(message, type) {
  if (!message) {
    $("#ride-detail-feedback").empty();
    return;
  }

  $("#ride-detail-feedback").html(
    '<div class="alert alert-' + type + ' mb-0">' + message + "</div>"
  );
}

function updateRideStage(status) {
  var stageIndex = getRideStageIndex(status);

  $(".ride-stage").removeClass("is-active");

  $(".ride-stage").each(function (index) {
    if (index < stageIndex) {
      $(this).addClass("is-active");
    }
  });
}

function getVehicleLabel(vehicle) {
  if (!vehicle) {
    return "Vehicle details will appear here";
  }

  return [
    vehicle.vehicle_year,
    vehicle.make,
    vehicle.model,
    "-",
    vehicle.color
  ].filter(Boolean).join(" ");
}

function setDetailHeader(title, status, backHref, backLabel) {
  $("#ride-detail-status")
    .attr("class", "status-badge status-" + (status || "open"))
    .text((status || "open").replace(/_/g, " "));

  $(".page-title").first().text(title);
  $("#ride-details-back-link").attr("href", backHref).text(backLabel);
  updateRideStage(status || "open");
}

function renderPersonCard(title, name, subtitle, location, rating) {
  return (
    '<section class="content-card">' +
    '<h2 class="section-title mb-3">' + hopinEscapeHtml(title) + "</h2>" +
    '<div class="person-summary detail-person-summary">' +
    '<div class="person-copy">' +
    "<strong>" + hopinEscapeHtml(name) + "</strong>" +
    (rating ? '<div class="rating-line">' + hopinEscapeHtml(rating) + "</div>" : "") +
    '<div class="ride-meta mt-2">' + hopinEscapeHtml(subtitle) + "</div>" +
    '<div class="ride-meta mt-2">' + hopinEscapeHtml(location) + "</div>" +
    "</div>" +
    '<div class="avatar-badge">' + hopinEscapeHtml(hopinGetInitials(name)) + "</div>" +
    "</div>" +
    "</section>"
  );
}

function renderMapCard(origin, destination, rideDate, rideTime) {
  return (
    '<div class="map-placeholder detail-map mb-4 static-route-map">' +
    '<div id="ride-detail-map-canvas" class="leaflet-map-canvas detail-leaflet-map"></div>' +
    '<div class="detail-map-meta">' +
    '<div class="find-map-route-item">' +
    '<div><strong>' + hopinEscapeHtml(origin) + '</strong> to <strong>' + hopinEscapeHtml(destination) + "</strong></div>" +
    '<div class="ride-meta">' + hopinEscapeHtml(hopinFormatDateLabel(rideDate)) + " | " + hopinEscapeHtml(hopinFormatTimeLabel(rideTime)) + "</div>" +
    "</div>" +
    "</div>" +
    "</div>"
  );
}

var rideDetailLeafletMap = null;
var rideDetailLeafletLayers = [];

function resetRideDetailMap() {
  if (rideDetailLeafletMap) {
    rideDetailLeafletMap.remove();
    rideDetailLeafletMap = null;
  }

  rideDetailLeafletLayers = [];
}

function clearRideDetailMapLayers() {
  if (!rideDetailLeafletMap || !rideDetailLeafletLayers.length) {
    return;
  }

  rideDetailLeafletLayers.forEach(function (layer) {
    rideDetailLeafletMap.removeLayer(layer);
  });

  rideDetailLeafletLayers = [];
}

function ensureRideDetailMap() {
  var container = document.getElementById("ride-detail-map-canvas");

  if (
    rideDetailLeafletMap &&
    (!container || rideDetailLeafletMap.getContainer() !== container)
  ) {
    resetRideDetailMap();
  }

  if (rideDetailLeafletMap || typeof L === "undefined") {
    return;
  }

  rideDetailLeafletMap = L.map("ride-detail-map-canvas", {
    zoomControl: true,
    attributionControl: true
  }).setView([50.4452, -104.6189], 12);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(rideDetailLeafletMap);
}

function renderRideDetailMap(origin, destination, rideSeed) {
  ensureRideDetailMap();

  if (!rideDetailLeafletMap) {
    return;
  }

  clearRideDetailMapLayers();

  var routeLatLng = hopinGetRouteLatLng(origin, destination, rideSeed || origin + ":" + destination);
  var polyline = L.polyline([routeLatLng.origin, routeLatLng.destination], {
    color: "#2563eb",
    weight: 5,
    opacity: 0.88
  }).addTo(rideDetailLeafletMap);
  var originMarker = L.circleMarker(routeLatLng.origin, {
    radius: 8,
    color: "#ffffff",
    weight: 2,
    fillColor: "#10b981",
    fillOpacity: 1
  }).bindTooltip(origin, { direction: "top" }).addTo(rideDetailLeafletMap);
  var destinationMarker = L.circleMarker(routeLatLng.destination, {
    radius: 8,
    color: "#ffffff",
    weight: 2,
    fillColor: "#1d4ed8",
    fillOpacity: 1
  }).bindTooltip(destination, { direction: "top" }).addTo(rideDetailLeafletMap);

  rideDetailLeafletLayers = [polyline, originMarker, destinationMarker];

  rideDetailLeafletMap.fitBounds([routeLatLng.origin, routeLatLng.destination], {
    padding: [32, 32]
  });

  window.setTimeout(function () {
    if (rideDetailLeafletMap) {
      rideDetailLeafletMap.invalidateSize();
    }
  }, 60);
}

function getRideActionState(ride, currentUser, existingBookingRequest) {
  if (!currentUser) {
    return {
      mode: "disabled",
      message: "Choose a current user from the navbar before requesting a ride."
    };
  }

  if (currentUser.id === ride.driver_id) {
    return {
      mode: "owner"
    };
  }

  if (currentUser.role === "driver") {
    return {
      mode: "disabled",
      message: "Driver-only profiles cannot request rides."
    };
  }

  if (existingBookingRequest) {
    return {
      mode: "existing",
      status: existingBookingRequest.status
    };
  }

  if (["full", "cancelled", "completed"].includes(ride.status)) {
    return {
      mode: "disabled",
      message: "This ride is not accepting requests right now."
    };
  }

  return {
    mode: "request"
  };
}

function renderRideActionButtons(ride, actionState) {
  if (actionState.mode === "owner") {
    return (
      '<a class="btn btn-primary" href="/my-rides?view=driver">View in My Rides</a>' +
      '<button class="btn btn-outline-secondary" type="button" disabled>This is your ride</button>'
    );
  }

  if (actionState.mode === "existing") {
    if (actionState.status === "accepted") {
      return (
        '<a class="btn btn-primary" href="/my-rides?view=rider">View in My Rides</a>' +
        '<a class="btn btn-outline-secondary" href="/my-requests?view=rider">Open My Requests</a>'
      );
    }

    if (
      actionState.status === "declined" ||
      actionState.status === "ignored" ||
      actionState.status === "cancelled"
    ) {
      return (
        '<button class="btn btn-outline-secondary" type="button" disabled>Request Closed</button>' +
        '<a class="btn btn-primary" href="/my-requests?view=rider">Open My Requests</a>'
      );
    }

    return (
      '<button class="btn btn-outline-secondary" type="button" disabled>Request Pending</button>' +
      '<a class="btn btn-primary" href="/my-requests?view=rider">Open My Requests</a>'
    );
  }

  if (actionState.mode === "disabled") {
    return (
      '<button class="btn btn-outline-secondary" type="button" disabled>' +
      hopinEscapeHtml(actionState.message) +
      "</button>"
    );
  }

  return (
    '<button class="btn btn-primary js-request-ride" data-ride-id="' + ride.id + '" type="button">Request This Ride</button>' +
    '<button class="btn btn-outline-secondary" type="button" disabled>Messages unlock after acceptance</button>'
  );
}

function renderRouteCard(origin, destination, rideDate, rideTime, detailItems) {
  return (
    '<section class="content-card mb-4">' +
    '<div class="journey-topline">' +
    '<span class="city-chip">City</span>' +
    '<span class="ride-meta">' + hopinEscapeHtml(hopinFormatDateLabel(rideDate)) + "</span>" +
    "</div>" +
    '<div class="route-stack">' +
    '<div class="route-stop">' +
    '<span class="route-dot origin"></span>' +
    '<div class="route-copy">' +
    '<strong>' + hopinEscapeHtml(origin) + "</strong>" +
    '<div class="ride-meta mt-1">' + hopinEscapeHtml(hopinFormatTimeLabel(rideTime)) + "</div>" +
    "</div>" +
    "</div>" +
    '<div class="route-stop">' +
    '<span class="route-dot destination"></span>' +
    '<div class="route-copy">' +
    '<strong>' + hopinEscapeHtml(destination) + "</strong>" +
    "</div>" +
    "</div>" +
    "</div>" +
    '<div class="card-detail-row">' + detailItems + "</div>" +
    "</section>"
  );
}

function renderRideDetails(ride, driver, vehicle, currentUser, existingBookingRequest) {
  var driverName = driver && driver.full_name ? driver.full_name : "Driver";
  var driverRating = driver && driver.rating_avg ? "Rating " + driver.rating_avg : "";
  var seatsText = ride.seats_available === 1 ? "1 seat available" : ride.seats_available + " seats available";
  var notesText = ride.notes || "No additional ride notes yet.";
  var actionState = getRideActionState(ride, currentUser, existingBookingRequest);
  var displayStatus = existingBookingRequest ? existingBookingRequest.status : ride.status;
  var requestSummary = existingBookingRequest
    ? getRequestStatusSummary(existingBookingRequest.status, driverName)
    : "";

  setDetailHeader("Ride Details", displayStatus, "/find-ride", "\u2190 Back to Find Ride");
  setRideDetailFeedback("");
  resetRideDetailMap();

  $("#ride-detail-content").html(
    renderMapCard(ride.origin, ride.destination, ride.ride_date, ride.ride_time) +
    '<div class="ride-detail-grid">' +
    '<div>' +
    renderRouteCard(
      ride.origin,
      ride.destination,
      ride.ride_date,
      ride.ride_time,
      '<span class="card-detail-item">' + hopinEscapeHtml(seatsText) + "</span>" +
      '<span class="card-detail-item">Free shared ride</span>' +
      (requestSummary
        ? '<span class="card-detail-item">' + hopinEscapeHtml(requestSummary) + "</span>"
        : "")
    ) +
    '<section class="content-card mb-4">' +
    '<h2 class="section-title mb-3">Ride Notes</h2>' +
    '<p class="mb-0">' + hopinEscapeHtml(notesText) + "</p>" +
    "</section>" +
    "</div>" +
    '<div>' +
    renderPersonCard(
      "Driver",
      driverName,
      getVehicleLabel(vehicle),
      driver && driver.home_area ? driver.home_area : "Regina",
      driverRating
    ) +
    '<div class="ride-detail-actions mt-3">' +
    renderRideActionButtons(ride, actionState) +
    "</div>" +
    "</div>" +
    "</div>"
  );

  renderRideDetailMap(ride.origin, ride.destination, ride.id);
}

function renderOpenRequestDetails(request, rider, driver) {
  var riderName = rider && rider.full_name ? rider.full_name : "Rider";
  var riderSubtitle = request.seats_needed === 1
    ? "1 seat needed"
    : request.seats_needed + " seats needed";
  var notesText = request.notes || "No additional request notes yet.";
  var acceptedDriverName = driver && driver.full_name ? driver.full_name : "Waiting for driver";
  var acceptedDriverRating = driver && driver.rating_avg ? "Rating " + driver.rating_avg : "";
  var driverResponseSubtitle = "No driver accepted yet";

  if (request.status === "accepted") {
    driverResponseSubtitle = "Accepted this rider request";
  }

  if (request.status === "declined") {
    driverResponseSubtitle = "Declined this rider request";
  }

  setDetailHeader(
    "Ride Request Details",
    request.status,
    "/my-requests?view=rider",
    "\u2190 Back to My Requests"
  );
  resetRideDetailMap();

  $("#ride-detail-content").html(
    renderMapCard(request.origin, request.destination, request.ride_date, request.ride_time) +
    '<div class="ride-detail-grid">' +
    '<div>' +
    renderRouteCard(
      request.origin,
      request.destination,
      request.ride_date,
      request.ride_time,
      '<span class="card-detail-item">' + hopinEscapeHtml(riderSubtitle) + "</span>" +
      '<span class="card-detail-item">Open rider request</span>'
    ) +
    '<section class="content-card mb-4">' +
    '<h2 class="section-title mb-3">Request Notes</h2>' +
    '<p class="mb-0">' + hopinEscapeHtml(notesText) + "</p>" +
    "</section>" +
    "</div>" +
    '<div>' +
    renderPersonCard(
      "Requested By",
      riderName,
      rider && rider.commute_notes ? rider.commute_notes : "Campus commuter",
      rider && rider.home_area ? rider.home_area : "Regina",
      rider && rider.rating_avg ? "Rating " + rider.rating_avg : ""
    ) +
    renderPersonCard(
      "Driver Response",
      acceptedDriverName,
      driver && driver.commute_notes ? driver.commute_notes : driverResponseSubtitle,
      driver && driver.home_area ? driver.home_area : "Pending",
      acceptedDriverRating
    ) +
    '<div class="ride-detail-actions mt-3">' +
    '<a class="btn btn-primary" href="/my-requests?view=rider">Open My Requests</a>' +
    '<a class="btn btn-outline-secondary" href="/my-rides?view=rider">Open My Rides</a>' +
    "</div>" +
    "</div>" +
    "</div>"
  );

  renderRideDetailMap(request.origin, request.destination, request.id);
}

async function loadRideDetails() {
  var context = getRideDetailContext();

  try {
    if (!context.openRequestId && !context.rideId) {
      $("#ride-detail-content").html(
        '<div class="detail-error">Choose a ride first to see its details.</div>'
      );
      return;
    }

    if (context.openRequestId) {
      var requestResponse = await $.getJSON("/api/open-ride-requests/" + context.openRequestId);
      var request = requestResponse.data;
      var rider = null;
      var driver = null;

      if (request.rider_details) {
        rider = request.rider_details;
      } else {
        try {
          var riderResponse = await $.getJSON("/api/users/" + request.rider_id);
          rider = riderResponse.data || null;
        } catch (error) {
          rider = null;
        }
      }

      if (request.accepted_driver_details) {
        driver = request.accepted_driver_details;
      } else if (request.accepted_driver_id) {
        try {
          var driverResponse = await $.getJSON("/api/users/" + request.accepted_driver_id);
          driver = driverResponse.data || null;
        } catch (error) {
          driver = null;
        }
      }

      renderOpenRequestDetails(request, rider, driver);
      return;
    }

    var rideId = context.rideId;
    var rideResponse = await $.getJSON("/api/rides/" + rideId);
    var ride = rideResponse.data;
    var currentUser = await window.HopinSession.waitForCurrentUser();
    var driver = null;
    var vehicles = [];
    var existingBookingRequest = null;

    try {
      var rideDriverResponse = await $.getJSON("/api/users/" + ride.driver_id);
      driver = rideDriverResponse.data || null;
    } catch (error) {
      driver = null;
    }

    try {
      var vehicleResponse = await $.getJSON("/api/users/" + ride.driver_id + "/vehicles");
      vehicles = vehicleResponse.data || [];
    } catch (error) {
      vehicles = [];
    }

    if (currentUser && currentUser.id !== ride.driver_id) {
      try {
        var requestResponse = await $.getJSON("/api/rides/" + ride.id + "/booking-requests", {
          riderId: currentUser.id
        });
        existingBookingRequest = (requestResponse.data || [])[0] || null;
      } catch (error) {
        existingBookingRequest = null;
      }
    }

    var vehicle = vehicles.find(function (item) {
      return item.id === ride.vehicle_id;
    }) || vehicles[0] || null;

    renderRideDetails(ride, driver, vehicle, currentUser, existingBookingRequest);
  } catch (error) {
    $("#ride-detail-content").html(
      '<div class="detail-error">Could not load this detail view right now.</div>'
    );
  }
}

$(function () {
  loadRideDetails();

  $(document).on("click", ".js-request-ride", function () {
    var rideId = $(this).data("ride-id");
    var currentUserId = window.HopinSession.getCurrentUserId();

    if (!currentUserId) {
      setRideDetailFeedback("Choose a current user from the navbar before requesting a ride.", "warning");
      return;
    }

    $(this).prop("disabled", true).text("Sending...");

    $.ajax({
      url: "/api/rides/" + rideId + "/booking-requests",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        rider_id: currentUserId,
        seats_requested: 1
      })
    })
      .done(function () {
        setRideDetailFeedback("Ride request sent. Redirecting to My Requests...", "success");

        setTimeout(function () {
          window.location.href = "/my-requests?view=rider";
        }, 700);
      })
      .fail(function (xhr) {
        var message = "Could not send the ride request.";

        if (xhr && xhr.responseJSON && xhr.responseJSON.message) {
          message = xhr.responseJSON.message;
        }

        setRideDetailFeedback(message, "danger");
        loadRideDetails();
      });
  });
});
