var currentRequestView = "rider";

function getQueryValue(name) {
  var params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function getCurrentRequestUser() {
  return window.HopinSession.getCurrentUser();
}

function normalizeRequestViewForRole(view, role) {
  if (role === "driver") {
    return "driver";
  }

  if (role === "rider") {
    return "rider";
  }

  return view === "driver" ? "driver" : "rider";
}

function getBlockedRequestViewMessage(role) {
  if (role === "driver") {
    return "Driver-only profiles can only use Driver View.";
  }

  if (role === "rider") {
    return "Rider-only profiles can only use Rider View.";
  }

  return "";
}

function setRequestFeedback(message, type) {
  if (!message) {
    $("#requests-feedback").empty();
    return;
  }

  $("#requests-feedback").html(
    '<div class="alert alert-' + type + ' mb-0">' + message + "</div>"
  );
}

function getCurrentRequestUserId() {
  return window.HopinSession.getCurrentUserId();
}

function getStatusBadge(status) {
  var safeStatus = status || "open";
  return (
    '<span class="status-badge status-' +
    safeStatus +
    '">' +
    hopinEscapeHtml(safeStatus.replace(/_/g, " ")) +
    "</span>"
  );
}

function getEmptyState(message) {
  return '<div class="empty-state">' + hopinEscapeHtml(message) + "</div>";
}

function renderSection(title, description, itemsHtml) {
  return (
    '<section class="content-card">' +
    '<h2 class="section-title mb-1">' + hopinEscapeHtml(title) + "</h2>" +
    '<p class="placeholder-note">' + hopinEscapeHtml(description) + "</p>" +
    '<div class="section-stack">' + itemsHtml + "</div>" +
    "</section>"
  );
}

function renderUpdateItems(items) {
  return items.map(function (item) {
    return (
      '<div class="info-panel">' +
      '<div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">' +
      '<div>' +
      '<strong>' + hopinEscapeHtml(item.message) + "</strong>" +
      '<div class="ride-meta mt-2">' +
      hopinEscapeHtml((item.status || "").replace(/_/g, " ")) +
      "</div>" +
      "</div>" +
      '<a class="btn btn-outline-primary btn-sm" href="' +
      hopinEscapeHtml(item.detail_url || "/my-requests?view=rider") +
      '">View Details</a>' +
      "</div>" +
      "</div>"
    );
  }).join("");
}

function renderRequestShortcut(view) {
  var href = view === "driver"
    ? "/my-rides?view=driver&action=post"
    : "/my-rides?view=rider&action=request";
  var label = view === "driver" ? "Post a Ride" : "Request a Ride";
  var description = view === "driver"
    ? "Need to offer a new ride? Start it from My Rides in driver view."
    : "Need a new ride? Start it from My Rides in rider view.";

  return (
    '<section class="content-card request-shortcut">' +
    '<div class="action-strip">' +
    "<div>" +
    '<h2 class="section-title mb-1">Quick action</h2>' +
    '<p class="placeholder-note mb-0">' + hopinEscapeHtml(description) + "</p>" +
    "</div>" +
    '<a class="btn btn-primary" href="' + href + '">' + label + "</a>" +
    "</div>" +
    "</section>"
  );
}

function getRequestAvatarHtml(name) {
  return '<div class="avatar-badge">' + hopinEscapeHtml(hopinGetInitials(name)) + "</div>";
}

function getRequestTopLine(label, rideDate) {
  return (
    '<div class="journey-topline">' +
    '<span class="city-chip">' + hopinEscapeHtml(label) + "</span>" +
    '<span class="ride-meta">' + hopinEscapeHtml(hopinFormatDateLabel(rideDate)) + "</span>" +
    "</div>"
  );
}

function renderRequestCard(options) {
  return (
    '<div class="list-card">' +
    getRequestTopLine(options.label, options.rideDate) +
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
    '<div class="card-detail-row">' + options.detailItems + "</div>" +
    (options.note ? '<p class="placeholder-note mt-3 mb-0">' + hopinEscapeHtml(options.note) + "</p>" : "") +
    "</div>" +
    '<div class="ride-card-side">' +
    '<div class="person-summary">' +
    '<div class="person-copy">' +
    "<strong>" + hopinEscapeHtml(options.personName) + "</strong>" +
    (options.personRating ? '<div class="rating-line">' + hopinEscapeHtml(options.personRating) + "</div>" : "") +
    (options.personMeta ? '<div class="ride-meta mt-2">' + hopinEscapeHtml(options.personMeta) + "</div>" : "") +
    "</div>" +
    getRequestAvatarHtml(options.personName) +
    "</div>" +
    '<div class="mt-3">' + getStatusBadge(options.status) + "</div>" +
    "</div>" +
    "</div>" +
    '<div class="ride-card-footer">' +
    '<div class="ride-meta">' + hopinEscapeHtml(options.footerText) + "</div>" +
    '<div class="card-actions">' + options.buttonsHtml + "</div>" +
    "</div>" +
    "</div>"
  );
}

function renderBookingRequestCard(item, showActions) {
  var ride = item.ride_details || {};
  var personName = showActions
    ? (item.rider_details && item.rider_details.full_name) || item.rider_id
    : (item.driver_details && item.driver_details.full_name) || ride.driver_id || "Driver";
  var personMeta = showActions
    ? (item.rider_details && item.rider_details.home_area) || "Rider"
    : (item.driver_details && item.driver_details.home_area) || "Driver";
  var personRatingSource = showActions ? item.rider_details : item.driver_details;
  var buttons = [
    '<a class="btn btn-outline-primary btn-sm" href="/ride-details?id=' + (ride.id || item.ride_id) + '">View Details</a>'
  ];

  if (showActions && item.status === "requested") {
    buttons.push(
      '<button class="btn btn-sm btn-success js-booking-status" data-id="' + item.id + '" data-status="accepted" type="button">Accept</button>'
    );
    buttons.push(
      '<button class="btn btn-sm btn-outline-danger js-booking-status" data-id="' + item.id + '" data-status="declined" type="button">Decline</button>'
    );
    buttons.push(
      '<button class="btn btn-sm btn-outline-secondary js-booking-status" data-id="' + item.id + '" data-status="ignored" type="button">Ignore</button>'
    );
  }

  if (!showActions && (item.status === "requested" || item.status === "accepted")) {
    buttons.push(
      '<button class="btn btn-sm btn-outline-danger js-cancel-booking-request" data-id="' + item.id + '" type="button">Cancel Request</button>'
    );
  }

  return renderRequestCard({
    label: "Existing ride request",
    rideDate: ride.ride_date,
    rideTime: ride.ride_time,
    origin: ride.origin || "Origin pending",
    destination: ride.destination || "Destination pending",
    detailItems:
      '<span class="card-detail-item">' + hopinEscapeHtml(item.seats_requested + (item.seats_requested === 1 ? " seat requested" : " seats requested")) + "</span>" +
      '<span class="card-detail-item">' + hopinEscapeHtml(showActions ? "Booking on your posted ride" : "Your request on a posted ride") + "</span>",
    note: item.message || "",
    personName: personName,
    personMeta: personMeta,
    personRating: personRatingSource && personRatingSource.rating_avg ? "Rating " + personRatingSource.rating_avg : "",
    status: item.status,
    footerText: showActions ? "Review this rider's request and choose a response." : "Wait for the driver response here.",
    buttonsHtml: buttons.join("")
  });
}

function renderOpenRideRequestCard(item, showActions) {
  var personName = showActions
    ? (item.rider_details && item.rider_details.full_name) || item.rider_id
    : (item.accepted_driver_details && item.accepted_driver_details.full_name) || "Waiting for driver";
  var personMeta = showActions
    ? (item.rider_details && item.rider_details.home_area) || "Rider"
    : (item.accepted_driver_details && item.accepted_driver_details.home_area) || "Still open";
  var personRatingSource = showActions ? item.rider_details : item.accepted_driver_details;
  var buttons = [
    '<a class="btn btn-outline-primary btn-sm" href="/ride-details?openRequestId=' + item.id + '">View Details</a>'
  ];

  if (showActions && item.status === "open") {
    buttons.push(
      '<button class="btn btn-sm btn-success js-open-request-accept" data-id="' + item.id + '" type="button">Accept</button>'
    );
    buttons.push(
      '<button class="btn btn-sm btn-outline-danger js-open-request-decline" data-id="' + item.id + '" type="button">Decline</button>'
    );
    buttons.push(
      '<button class="btn btn-sm btn-outline-secondary js-open-request-ignore" data-id="' + item.id + '" type="button">Ignore</button>'
    );
  }

  if (!showActions && (item.status === "open" || item.status === "accepted")) {
    buttons.push(
      '<button class="btn btn-sm btn-outline-danger js-cancel-open-request" data-id="' + item.id + '" type="button">Cancel Request</button>'
    );
  }

  return renderRequestCard({
    label: "Open rider request",
    rideDate: item.ride_date,
    rideTime: item.ride_time,
    origin: item.origin,
    destination: item.destination,
    detailItems:
      '<span class="card-detail-item">' + hopinEscapeHtml(item.seats_needed + (item.seats_needed === 1 ? " seat needed" : " seats needed")) + "</span>" +
      '<span class="card-detail-item">' + hopinEscapeHtml(showActions ? "Request waiting for a driver" : "Track this open request here") + "</span>",
    note: item.notes || "",
    personName: personName,
    personMeta: personMeta,
    personRating: personRatingSource && personRatingSource.rating_avg ? "Rating " + personRatingSource.rating_avg : "",
    status: item.status,
    footerText: showActions ? "Accept this route if it fits your commute." : "Accepted requests move into My Rides automatically.",
    buttonsHtml: buttons.join("")
  });
}

function renderMyRequests(data) {
  var html = "";

  if (currentRequestView === "rider") {
    var sentBookingRequests = data.sent_booking_requests || [];
    var myOpenRideRequests = data.my_open_ride_requests || [];
    var riderUpdates = data.rider_updates || [];

    html += renderRequestShortcut("rider");

    if (riderUpdates.length) {
      html += renderSection(
        "Recent Request Updates",
        "These updates are shown as text so your active request cards stay cleaner.",
        renderUpdateItems(riderUpdates)
      );
    }

    html += renderSection(
      "Requests I Sent for Existing Rides",
      "These are booking requests you sent on rides posted by drivers.",
      sentBookingRequests.length
        ? sentBookingRequests.map(function (item) {
            return renderBookingRequestCard(item, false);
          }).join("")
        : getEmptyState("You have not sent any booking requests yet.")
    );

    html += renderSection(
      "My Open Ride Requests",
      "These are brand new ride requests you posted for any driver to accept.",
      myOpenRideRequests.length
        ? myOpenRideRequests.map(function (item) {
            return renderOpenRideRequestCard(item, false);
          }).join("")
        : getEmptyState("You have not posted any open ride requests yet.")
    );
  } else {
    var requestsOnMyRides = data.requests_on_my_rides || [];
    var riderOpenRequests = data.rider_open_requests || [];
    var driverUpdates = data.driver_updates || [];

    html += renderRequestShortcut("driver");

    if (driverUpdates.length) {
      html += renderSection(
        "Recent Rider Updates",
        "These updates let you know when a rider cancels after you already matched or reviewed their request.",
        renderUpdateItems(driverUpdates)
      );
    }

    html += renderSection(
      "Requests on My Posted Rides",
      "These are rider requests to join rides you already posted.",
      requestsOnMyRides.length
        ? requestsOnMyRides.map(function (item) {
            return renderBookingRequestCard(item, true);
          }).join("")
        : getEmptyState("No riders have requested your posted rides yet.")
    );

    html += renderSection(
      "Open Rider Requests",
      "These are brand new requests posted by riders for drivers to accept.",
      riderOpenRequests.length
        ? riderOpenRequests.map(function (item) {
            return renderOpenRideRequestCard(item, true);
          }).join("")
        : getEmptyState("No open rider requests are available right now.")
    );
  }

  $("#my-requests-content").html(html);
}

function loadMyRequests() {
  var userId = getCurrentRequestUserId();
  var currentUser = getCurrentRequestUser();
  var role = currentUser && currentUser.role ? currentUser.role : "rider";
  var allowedView = normalizeRequestViewForRole(currentRequestView, role);

  if (allowedView !== currentRequestView) {
    currentRequestView = allowedView;
    setRequestFeedback(getBlockedRequestViewMessage(role), "secondary");
  } else {
    setRequestFeedback("");
  }

  if (!userId) {
    $("#my-requests-content").html(
      getEmptyState("Choose a current user from the navbar to load requests.")
    );
    return;
  }

  $.getJSON("/api/my-requests", {
    userId: userId,
    view: currentRequestView
  })
    .done(function (response) {
      renderMyRequests(response.data);
    })
    .fail(function () {
      $("#my-requests-content").html(
        getEmptyState("Could not load requests. Please try again.")
      );
    });
}

function updateRequestToggleButtons() {
  var currentUser = getCurrentRequestUser();
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

  $('.js-view-switch[data-view="' + currentRequestView + '"]')
    .removeClass("btn-light")
    .addClass("btn-primary");
}

function patchBookingRequestStatus(requestId, status) {
  $.ajax({
    url: "/api/booking-requests/" + requestId + "/status",
    method: "PATCH",
    contentType: "application/json",
    data: JSON.stringify({
      status: status,
      actor_user_id: getCurrentRequestUserId()
    })
  })
    .done(function (response) {
      var request = response.data || {};
      var ride = request.ride_details || {};
      var routeLabel =
        (ride.origin || "Origin") + " to " + (ride.destination || "Destination");
      var message = "Booking request updated to " + status + ".";

      if (status === "accepted") {
        message = "Booking request accepted for " + routeLabel + ".";
      }

      if (status === "declined") {
        message = "Booking request declined for " + routeLabel + ".";
      }

      if (status === "cancelled") {
        message = "Booking request cancelled for " + routeLabel + ".";
      }

      loadMyRequests();
      setRequestFeedback(message, "success");
    })
    .fail(function (xhr) {
      var message = "Could not update the booking request.";

      if (xhr && xhr.responseJSON && xhr.responseJSON.message) {
        message = xhr.responseJSON.message;
      }

      setRequestFeedback(message, "danger");
    });
}

function patchOpenRideRequestStatus(requestId, status) {
  var payload = {
    status: status,
    actor_user_id: getCurrentRequestUserId()
  };

  if (status === "accepted" || status === "declined") {
    payload.accepted_driver_id = getCurrentRequestUserId();
  }

  $.ajax({
    url: "/api/open-ride-requests/" + requestId + "/status",
    method: "PATCH",
    contentType: "application/json",
    data: JSON.stringify(payload)
  })
    .done(function (response) {
      var request = response.data || {};
      var routeLabel =
        (request.origin || "Origin") + " to " + (request.destination || "Destination");
      var message = "Open rider request updated.";

      if (status === "accepted") {
        message = "Open rider request accepted for " + routeLabel + ".";
      }

      if (status === "declined") {
        message = "Open rider request declined for " + routeLabel + ".";
      }

      if (status === "cancelled") {
        message = "Open rider request cancelled for " + routeLabel + ".";
      }

      loadMyRequests();
      setRequestFeedback(message, "success");
    })
    .fail(function (xhr) {
      var message = "Could not update the open rider request.";

      if (xhr && xhr.responseJSON && xhr.responseJSON.message) {
        message = xhr.responseJSON.message;
      }

      setRequestFeedback(message, "danger");
    });
}

$(function () {
  currentRequestView = getQueryValue("view") || "rider";
  window.HopinSession.waitForCurrentUser().then(function () {
    var currentUser = getCurrentRequestUser();
    var role = currentUser && currentUser.role ? currentUser.role : "rider";
    currentRequestView = normalizeRequestViewForRole(currentRequestView, role);
    updateRequestToggleButtons();
    loadMyRequests();
  });

  $(document).on("click", ".js-view-switch", function () {
    var requestedView = $(this).data("view");
    var currentUser = getCurrentRequestUser();
    var role = currentUser && currentUser.role ? currentUser.role : "rider";
    var nextView = normalizeRequestViewForRole(requestedView, role);

    if (nextView !== requestedView) {
      setRequestFeedback(getBlockedRequestViewMessage(role), "secondary");
    }

    currentRequestView = nextView;
    updateRequestToggleButtons();
    loadMyRequests();
  });

  $(document).on("click", ".js-booking-status", function () {
    patchBookingRequestStatus($(this).data("id"), $(this).data("status"));
  });

  $(document).on("click", ".js-open-request-accept", function () {
    patchOpenRideRequestStatus($(this).data("id"), "accepted");
  });

  $(document).on("click", ".js-open-request-decline", function () {
    patchOpenRideRequestStatus($(this).data("id"), "declined");
  });

  $(document).on("click", ".js-open-request-ignore", function () {
    $(this).closest(".list-card").fadeOut(150);
    setRequestFeedback(
      "Ignored on this screen only. The request stays open for other drivers.",
      "secondary"
    );
  });

  $(document).on("click", ".js-cancel-booking-request", function () {
    patchBookingRequestStatus($(this).data("id"), "cancelled");
  });

  $(document).on("click", ".js-cancel-open-request", function () {
    patchOpenRideRequestStatus($(this).data("id"), "cancelled");
  });

  $(document).on("hopin:user-changed", function () {
    var currentUser = getCurrentRequestUser();
    var role = currentUser && currentUser.role ? currentUser.role : "rider";
    currentRequestView = normalizeRequestViewForRole(currentRequestView, role);
    loadMyRequests();
  });
});
