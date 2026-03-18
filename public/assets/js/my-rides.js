var currentRideView = "rider";
var pendingRideAction = "";

function getRideQueryValue(name) {
  var params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function getCurrentRideUser() {
  return window.HopinSession.getCurrentUser();
}

function normalizeRideViewForRole(view, role) {
  if (role === "driver") {
    return "driver";
  }

  if (role === "rider") {
    return "rider";
  }

  return view === "driver" ? "driver" : "rider";
}

function getBlockedRideViewMessage(role) {
  if (role === "driver") {
    return "Driver-only profiles can only use Driver View.";
  }

  if (role === "rider") {
    return "Rider-only profiles can only use Rider View.";
  }

  return "";
}

function setMyRidesFeedback(message, type) {
  if (!message) {
    $("#my-rides-feedback").empty();
    return;
  }

  $("#my-rides-feedback").html(
    '<div class="alert alert-' + type + ' mb-0">' + message + "</div>"
  );
}

function getCurrentRideUserId() {
  return window.HopinSession.getCurrentUserId();
}

function getRideStatusBadge(status) {
  var safeStatus = status || "open";
  return (
    '<span class="status-badge status-' +
    safeStatus +
    '">' +
    hopinEscapeHtml(safeStatus.replace(/_/g, " ")) +
    "</span>"
  );
}

function getRideEmptyState(message) {
  return '<div class="empty-state">' + hopinEscapeHtml(message) + "</div>";
}

function getRideDetailHref(item) {
  if (item.ride_details && item.ride_details.id) {
    return "/ride-details?id=" + item.ride_details.id;
  }

  if (item.driver_id) {
    return "/ride-details?id=" + item.id;
  }

  return "/ride-details?openRequestId=" + item.id;
}

function getRideAvatarHtml(name) {
  return '<div class="avatar-badge">' + hopinEscapeHtml(hopinGetInitials(name)) + "</div>";
}

function getJourneyTopLine(label, rideDate) {
  return (
    '<div class="journey-topline">' +
    '<span class="city-chip">' + hopinEscapeHtml(label) + "</span>" +
    '<span class="ride-meta">' + hopinEscapeHtml(hopinFormatDateLabel(rideDate)) + "</span>" +
    "</div>"
  );
}

function getPersonSummary(name, meta, rating) {
  var safeName = name || "HopIn User";
  var summaryHtml =
    '<div class="person-summary">' +
    '<div class="person-copy">' +
    "<strong>" + hopinEscapeHtml(safeName) + "</strong>";

  if (rating) {
    summaryHtml += '<div class="rating-line">' + hopinEscapeHtml(rating) + "</div>";
  }

  if (meta) {
    summaryHtml += '<div class="ride-meta mt-2">' + hopinEscapeHtml(meta) + "</div>";
  }

  summaryHtml += "</div>" + getRideAvatarHtml(safeName) + "</div>";

  return summaryHtml;
}

function renderJourneyCard(options) {
  return (
    '<div class="list-card">' +
    getJourneyTopLine(options.label, options.rideDate) +
    '<div class="ride-card-grid">' +
    '<div class="ride-card-main">' +
    '<div class="route-stack">' +
    '<div class="route-stop">' +
    '<span class="route-dot origin"></span>' +
    '<div class="route-copy">' +
    '<strong>' + hopinEscapeHtml(options.origin) + "</strong>" +
    '<div class="ride-meta mt-1">' + hopinEscapeHtml(hopinFormatTimeLabel(options.rideTime)) + "</div>" +
    "</div>" +
    "</div>" +
    '<div class="route-stop">' +
    '<span class="route-dot destination"></span>' +
    '<div class="route-copy">' +
    '<strong>' + hopinEscapeHtml(options.destination) + "</strong>" +
    "</div>" +
    "</div>" +
    "</div>" +
    (options.detailsHtml ? '<div class="card-detail-row">' + options.detailsHtml + "</div>" : "") +
    (options.note ? '<p class="placeholder-note mt-3 mb-0">' + hopinEscapeHtml(options.note) + "</p>" : "") +
    "</div>" +
    '<div class="ride-card-side">' +
    options.personHtml +
    '<div class="mt-3">' + getRideStatusBadge(options.status) + "</div>" +
    "</div>" +
    "</div>" +
    '<div class="ride-card-footer">' +
    '<div class="ride-meta">' + hopinEscapeHtml(options.footerText) + "</div>" +
    '<div class="card-actions">' + options.buttonsHtml + "</div>" +
    "</div>" +
    "</div>"
  );
}

function getRidePersonInfo(item, source) {
  if (currentRideView === "rider") {
    if (item.driver_details) {
      return {
        name: item.driver_details.full_name,
        meta: item.driver_details.home_area || "Driver",
        rating: item.driver_details.rating_avg ? "Rating " + item.driver_details.rating_avg : ""
      };
    }

    if (item.accepted_driver_details) {
      return {
        name: item.accepted_driver_details.full_name,
        meta: item.accepted_driver_details.home_area || "Driver",
        rating: item.accepted_driver_details.rating_avg ? "Rating " + item.accepted_driver_details.rating_avg : ""
      };
    }

    return {
      name: "Driver",
      meta: source.vehicle_id ? "Posted ride" : "Waiting for driver",
      rating: ""
    };
  }

  if (item.rider_details) {
    return {
      name: item.rider_details.full_name,
      meta: item.rider_details.home_area || "Rider",
      rating: item.rider_details.rating_avg ? "Rating " + item.rider_details.rating_avg : ""
    };
  }

  return {
    name: "You",
    meta: source.vehicle_id ? "Your posted ride" : "Driver view",
    rating: ""
  };
}

function renderRideCard(item, typeLabel) {
  var source = item.ride_details || item;
  var seatText = source.seats_available !== undefined
    ? (source.seats_available === 1 ? "1 seat available" : source.seats_available + " seats available")
    : (source.seats_needed === 1 ? "1 seat needed" : source.seats_needed + " seats needed");
  var details = ['<span class="card-detail-item">' + hopinEscapeHtml(seatText) + "</span>"];
  var personInfo = getRidePersonInfo(item, source);
  var footerText = currentRideView === "driver"
    ? "Manage this ride from My Requests when riders respond."
    : "Keep an eye on timing and meeting point details.";

  if (item.seats_requested) {
    details.push(
      '<span class="card-detail-item">' +
      hopinEscapeHtml(item.seats_requested + (item.seats_requested === 1 ? " seat booked" : " seats booked")) +
      "</span>"
    );
  }

  return renderJourneyCard({
    label: typeLabel,
    rideDate: source.ride_date,
    rideTime: source.ride_time,
    origin: source.origin || "Origin pending",
    destination: source.destination || "Destination pending",
    detailsHtml: details.join(""),
    note: source.notes || "",
    personHtml: getPersonSummary(personInfo.name, personInfo.meta, personInfo.rating),
    status: item.status || source.status || "open",
    footerText: footerText,
    buttonsHtml:
      '<a class="btn btn-outline-primary btn-sm" href="' + getRideDetailHref(item) + '">View Details</a>'
  });
}

function renderRideSection(title, description, itemsHtml) {
  return (
    '<section class="content-card">' +
    '<h2 class="section-title mb-1">' + hopinEscapeHtml(title) + "</h2>" +
    '<p class="placeholder-note">' + hopinEscapeHtml(description) + "</p>" +
    '<div class="section-stack">' + itemsHtml + "</div>" +
    "</section>"
  );
}

function renderRiderActionPanel() {
  return (
    '<section class="content-card">' +
    '<div class="action-strip">' +
    "<div>" +
    '<h2 class="section-title mb-1">Rider actions</h2>' +
    '<p class="placeholder-note mb-0">Request a new ride here, then track its pending status on My Requests.</p>' +
    "</div>" +
    '<div class="d-flex gap-2 flex-wrap">' +
    '<button class="btn btn-primary js-toggle-ride-action" data-action="request" type="button">Request a Ride</button>' +
    '<a class="btn btn-outline-secondary" href="/my-requests?view=rider">Open My Requests</a>' +
    "</div>" +
    "</div>" +
    '<div id="rider-action-form" class="d-none-soft mt-4">' +
    '<form id="my-rides-request-form" class="row g-3">' +
    '<div class="col-md-6"><label class="form-label">From</label><input class="form-control" name="origin" type="text" placeholder="Harbour Landing" required></div>' +
    '<div class="col-md-6"><label class="form-label">To</label><input class="form-control" name="destination" type="text" placeholder="University of Regina" required></div>' +
    '<div class="col-md-4"><label class="form-label">Date</label><input class="form-control" name="ride_date" type="date" required></div>' +
    '<div class="col-md-4"><label class="form-label">Time</label><input class="form-control" name="ride_time" type="time" required></div>' +
    '<div class="col-md-4"><label class="form-label">Seats Needed</label><select class="form-select" name="seats_needed"><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></div>' +
    '<div class="col-12"><label class="form-label">Notes</label><textarea class="form-control" name="notes" rows="3" placeholder="Need to arrive before class starts"></textarea></div>' +
    '<div class="col-12"><button class="btn btn-primary" type="submit">Post Request</button></div>' +
    "</form>" +
    "</div>" +
    "</section>"
  );
}

function renderDriverActionPanel() {
  return (
    '<section class="content-card">' +
    '<div class="action-strip">' +
    "<div>" +
    '<h2 class="section-title mb-1">Driver actions</h2>' +
    '<p class="placeholder-note mb-0">Post a new ride here, then review incoming rider requests on My Requests.</p>' +
    "</div>" +
    '<div class="d-flex gap-2 flex-wrap">' +
    '<button class="btn btn-primary js-toggle-ride-action" data-action="post" type="button">Post a Ride</button>' +
    '<a class="btn btn-outline-secondary" href="/my-requests?view=driver">Open My Requests</a>' +
    "</div>" +
    "</div>" +
    '<div id="driver-action-form" class="d-none-soft mt-4">' +
    '<form id="my-rides-post-form" class="row g-3">' +
    '<div class="col-md-6"><label class="form-label">Pickup / From</label><input class="form-control" name="origin" type="text" placeholder="Albert Street & 25th Ave" required></div>' +
    '<div class="col-md-6"><label class="form-label">Drop-off / To</label><input class="form-control" name="destination" type="text" placeholder="University of Regina" required></div>' +
    '<div class="col-md-4"><label class="form-label">Date</label><input class="form-control" name="ride_date" type="date" required></div>' +
    '<div class="col-md-4"><label class="form-label">Time</label><input class="form-control" name="ride_time" type="time" required></div>' +
    '<div class="col-md-4"><label class="form-label">Vehicle</label><select class="form-select" name="vehicle_id" id="my-rides-vehicle-select"><option value="">Loading vehicles...</option></select></div>' +
    '<div class="col-md-6"><label class="form-label">Seats Available</label><select class="form-select" name="seats_available"><option value="1">1</option><option value="2">2</option><option value="3" selected>3</option><option value="4">4</option></select></div>' +
    '<div class="col-md-6"><label class="form-label">Status</label><input class="form-control" type="text" value="open" disabled></div>' +
    '<div class="col-12"><label class="form-label">Notes</label><textarea class="form-control" name="notes" rows="3" placeholder="Smoke-free ride, please be ready on time"></textarea></div>' +
    '<div class="col-12"><button class="btn btn-primary" type="submit">Post Ride</button></div>' +
    "</form>" +
    "</div>" +
    "</section>"
  );
}

function renderMyRides(data) {
  var html = "";

  if (currentRideView === "rider") {
    var upcomingBookedRides = data.upcoming_booked_rides || [];
    var acceptedOpenRideRequests = data.accepted_open_ride_requests || [];

    $("#my-rides-actions").html(renderRiderActionPanel());

    html += renderRideSection(
      "Upcoming Rides from Existing Bookings",
      "These are rides where your booking request was accepted.",
      upcomingBookedRides.length
        ? upcomingBookedRides.map(function (item) {
            return renderRideCard(item, "Accepted booking");
          }).join("")
        : getRideEmptyState("No accepted booking requests yet.")
    );

    html += renderRideSection(
      "Accepted Open Ride Requests",
      "These are rider requests that a driver accepted for you.",
      acceptedOpenRideRequests.length
        ? acceptedOpenRideRequests.map(function (item) {
            return renderRideCard(item, "Accepted rider request");
          }).join("")
        : getRideEmptyState("No driver has accepted your open ride requests yet.")
    );
  } else {
    var upcomingPostedRides = data.upcoming_posted_rides || [];
    var acceptedRiderRequests = data.accepted_rider_requests || [];

    $("#my-rides-actions").html(renderDriverActionPanel());

    html += renderRideSection(
      "Upcoming Posted Rides",
      "These are active rides you posted as a driver.",
      upcomingPostedRides.length
        ? upcomingPostedRides.map(function (item) {
            return renderRideCard(item, "Posted ride");
          }).join("")
        : getRideEmptyState("You have no active posted rides.")
    );

    html += renderRideSection(
      "Accepted Rider Requests",
      "These are open rider requests that you accepted.",
      acceptedRiderRequests.length
        ? acceptedRiderRequests.map(function (item) {
            return renderRideCard(item, "Accepted rider request");
          }).join("")
        : getRideEmptyState("You have not accepted any rider requests yet.")
    );
  }

  $("#my-rides-content").html(html);

  if (currentRideView === "driver") {
    loadMyRideVehicles();
  }

  openRequestedActionPanel();
}

function loadMyRides() {
  var currentUserId = getCurrentRideUserId();
  var currentUser = getCurrentRideUser();
  var role = currentUser && currentUser.role ? currentUser.role : "rider";
  var allowedView = normalizeRideViewForRole(currentRideView, role);

  if (allowedView !== currentRideView) {
    currentRideView = allowedView;
    setMyRidesFeedback(getBlockedRideViewMessage(role), "secondary");
  } else if (!pendingRideAction) {
    setMyRidesFeedback("");
  }

  if (!currentUserId) {
    $("#my-rides-content").html(
      getRideEmptyState("Choose a current user from the navbar to load this page.")
    );
    return;
  }

  $.getJSON("/api/my-rides", {
    userId: currentUserId,
    view: currentRideView
  })
    .done(function (response) {
      renderMyRides(response.data);
    })
    .fail(function () {
      $("#my-rides-content").html(
        getRideEmptyState("Could not load rides. Please try again.")
      );
    });
}

function loadMyRideVehicles() {
  var currentUserId = getCurrentRideUserId();

  if (!currentUserId) {
    $("#my-rides-vehicle-select").html('<option value="">Choose a user first</option>');
    return;
  }

  $.getJSON("/api/users/" + currentUserId + "/vehicles")
    .done(function (response) {
      var vehicles = response.data || [];
      var optionsHtml = '<option value="">Select a vehicle</option>';

      if (vehicles.length) {
        optionsHtml = vehicles.map(function (vehicle) {
          var label =
            vehicle.make +
            " " +
            vehicle.model +
            (vehicle.vehicle_year ? " (" + vehicle.vehicle_year + ")" : "");

          return '<option value="' + vehicle.id + '">' + hopinEscapeHtml(label) + "</option>";
        }).join("");
      } else {
        optionsHtml = '<option value="">Add a vehicle in Profile first</option>';
      }

      $("#my-rides-vehicle-select").html(optionsHtml);
    })
    .fail(function () {
      $("#my-rides-vehicle-select").html('<option value="">Could not load vehicles</option>');
    });
}

function submitRideRequest(formData) {
  formData.rider_id = getCurrentRideUserId();

  $.ajax({
    url: "/api/open-ride-requests",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(formData)
  })
    .done(function () {
      setMyRidesFeedback(
        'Ride request posted. You can track its pending status on <a href="/my-requests?view=rider">My Requests</a>.',
        "success"
      );
      $("#my-rides-request-form")[0].reset();
      $("#rider-action-form").slideUp(150);
      pendingRideAction = "";
      loadMyRides();
    })
    .fail(function () {
      setMyRidesFeedback("Could not post the ride request.", "danger");
    });
}

function submitPostedRide(formData) {
  if (!formData.vehicle_id) {
    setMyRidesFeedback(
      'Add a vehicle first from <a href="/profile-settings?tab=vehicle">Profile -> My Vehicle</a> before posting a ride.',
      "warning"
    );
    return;
  }

  formData.driver_id = getCurrentRideUserId();

  $.ajax({
    url: "/api/rides",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(formData)
  })
    .done(function () {
      setMyRidesFeedback(
        'Ride posted successfully. You can review incoming requests on <a href="/my-requests?view=driver">My Requests</a>.',
        "success"
      );
      $("#my-rides-post-form")[0].reset();
      $("#driver-action-form").slideUp(150);
      pendingRideAction = "";
      loadMyRides();
    })
    .fail(function (xhr) {
      var message = "Could not post the ride.";

      if (xhr.responseJSON && xhr.responseJSON.message) {
        message = xhr.responseJSON.message;
      }

      setMyRidesFeedback(message, "danger");
    });
}

function updateRideToggleButtons() {
  var currentUser = getCurrentRideUser();
  var role = currentUser && currentUser.role ? currentUser.role : "rider";

  $(".js-view-switch")
    .removeClass("btn-primary")
    .addClass("btn-light")
    .prop("disabled", false);

  if (role === "rider") {
    $('.js-view-switch[data-view="driver"]').prop("disabled", true);
  }

  if (role === "driver") {
    $('.js-view-switch[data-view="rider"]').prop("disabled", true);
  }

  $('.js-view-switch[data-view="' + currentRideView + '"]')
    .removeClass("btn-light")
    .addClass("btn-primary");
}

function openRequestedActionPanel() {
  if (pendingRideAction === "request" && currentRideView === "rider") {
    $("#rider-action-form").show();
  }

  if (pendingRideAction === "post" && currentRideView === "driver") {
    $("#driver-action-form").show();
  }
}

$(function () {
  currentRideView = getRideQueryValue("view") || "rider";
  pendingRideAction = getRideQueryValue("action") || "";

  window.HopinSession.waitForCurrentUser().then(function () {
    var currentUser = getCurrentRideUser();
    var role = currentUser && currentUser.role ? currentUser.role : "rider";
    currentRideView = normalizeRideViewForRole(currentRideView, role);
    updateRideToggleButtons();
    loadMyRides();
  });

  $(document).on("click", ".js-view-switch", function () {
    var requestedView = $(this).data("view");
    var currentUser = getCurrentRideUser();
    var role = currentUser && currentUser.role ? currentUser.role : "rider";
    var nextView = normalizeRideViewForRole(requestedView, role);

    if (nextView !== requestedView) {
      setMyRidesFeedback(getBlockedRideViewMessage(role), "secondary");
    }

    currentRideView = nextView;
    pendingRideAction = "";
    updateRideToggleButtons();
    loadMyRides();
  });

  $(document).on("click", ".js-toggle-ride-action", function () {
    var action = $(this).data("action");

    if (action === "request") {
      $("#rider-action-form").slideToggle(150);
    }

    if (action === "post") {
      $("#driver-action-form").slideToggle(150);
    }
  });

  $(document).on("submit", "#my-rides-request-form", function (event) {
    event.preventDefault();

    var formData = {
      origin: $(this).find('[name="origin"]').val(),
      destination: $(this).find('[name="destination"]').val(),
      ride_date: $(this).find('[name="ride_date"]').val(),
      ride_time: $(this).find('[name="ride_time"]').val(),
      seats_needed: $(this).find('[name="seats_needed"]').val(),
      notes: $(this).find('[name="notes"]').val()
    };

    submitRideRequest(formData);
  });

  $(document).on("submit", "#my-rides-post-form", function (event) {
    event.preventDefault();

    var formData = {
      vehicle_id: $(this).find('[name="vehicle_id"]').val() || null,
      origin: $(this).find('[name="origin"]').val(),
      destination: $(this).find('[name="destination"]').val(),
      ride_date: $(this).find('[name="ride_date"]').val(),
      ride_time: $(this).find('[name="ride_time"]').val(),
      seats_available: $(this).find('[name="seats_available"]').val(),
      notes: $(this).find('[name="notes"]').val()
    };

    submitPostedRide(formData);
  });

  $(document).on("hopin:user-changed", function () {
    var currentUser = getCurrentRideUser();
    var role = currentUser && currentUser.role ? currentUser.role : "rider";
    currentRideView = normalizeRideViewForRole(currentRideView, role);
    pendingRideAction = "";
    loadMyRides();
  });
});
