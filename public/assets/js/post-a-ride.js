function getPostRideCurrentUserId() {
  return window.HopinSession.getCurrentUserId();
}

function setPostRideFeedback(message, type) {
  if (!message) {
    $("#post-ride-feedback").empty();
    return;
  }

  $("#post-ride-feedback").html(
    '<div class="alert alert-' + type + ' mb-0">' + message + "</div>"
  );
}

function renderPostRideSuccess(ride) {
  $("#post-ride-success").html(
    '<div class="success-panel">' +
    '<div class="mini-label">Ride posted</div>' +
    '<h3 class="mt-2 mb-2">' + ride.origin + " to " + ride.destination + "</h3>" +
    '<p class="mb-2">' + ride.ride_date + " at " + ride.ride_time + "</p>" +
    '<p class="placeholder-note mb-3">Your ride is now available for riders to request.</p>' +
    '<div class="d-flex flex-wrap gap-2">' +
    '<a class="btn btn-sm btn-primary" href="/my-rides?view=driver">View My Rides</a>' +
    '<a class="btn btn-sm btn-outline-primary" href="/find-ride">Go to Find Ride</a>' +
    "</div>" +
    "</div>"
  );
}

function loadDriverVehicles() {
  var currentUserId = getPostRideCurrentUserId();

  if (!currentUserId) {
    $("#vehicle-select").html('<option value="">Choose a current user first</option>');
    return;
  }

  $.getJSON("/api/users/" + currentUserId + "/vehicles")
    .done(function (response) {
      var vehicles = response.data || [];
      var optionsHtml = '<option value="">No vehicle selected</option>';

      if (vehicles.length) {
        optionsHtml = vehicles.map(function (vehicle) {
          var label =
            vehicle.make +
            " " +
            vehicle.model +
            (vehicle.vehicle_year ? " (" + vehicle.vehicle_year + ")" : "");

          return '<option value="' + vehicle.id + '">' + label + "</option>";
        }).join("");
      }

      $("#vehicle-select").html(optionsHtml);
    })
    .fail(function () {
      $("#vehicle-select").html('<option value="">Could not load vehicles</option>');
    });
}

function submitRide(formData) {
  formData.driver_id = getPostRideCurrentUserId();

  $.ajax({
    url: "/api/rides",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(formData)
  })
    .done(function (response) {
      setPostRideFeedback("Ride posted successfully.", "success");
      renderPostRideSuccess(response.data);
      $("#post-ride-form")[0].reset();
      loadDriverVehicles();
    })
    .fail(function (xhr) {
      var message = "Could not post the ride.";

      if (xhr.responseJSON && xhr.responseJSON.message) {
        message = xhr.responseJSON.message;
      }

      setPostRideFeedback(message, "danger");
    });
}

$(function () {
  window.HopinSession.waitForCurrentUser().then(function () {
    loadDriverVehicles();
  });

  $(document).on("submit", "#post-ride-form", function (event) {
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

    setPostRideFeedback("");
    $("#post-ride-success").empty();
    submitRide(formData);
  });

  $(document).on("hopin:user-changed", function () {
    setPostRideFeedback("");
    $("#post-ride-success").empty();
    loadDriverVehicles();
  });
});
