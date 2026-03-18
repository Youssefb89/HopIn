var hopinScheduleDays = [
  { key: "Monday", short: "Mon" },
  { key: "Tuesday", short: "Tue" },
  { key: "Wednesday", short: "Wed" },
  { key: "Thursday", short: "Thu" },
  { key: "Friday", short: "Fri" },
  { key: "Saturday", short: "Sat" },
  { key: "Sunday", short: "Sun" }
];

var currentProfileSchedules = [];
var currentVehicleRecord = null;

function formatRoleLabel(roleValue) {
  if (roleValue === "driver") {
    return "Driver";
  }

  if (roleValue === "both") {
    return "Rider & Driver";
  }

  return "Rider";
}

function setDesiredRole(roleValue) {
  var normalizedRole = roleValue === "driver" || roleValue === "both" ? roleValue : "rider";

  $("#profile-role-value").val(normalizedRole);

  $(".js-intent-option").removeClass("is-active");
  $('.js-intent-option[data-role="' + normalizedRole + '"]').addClass("is-active");
}

function getProfileQueryTab() {
  var params = new URLSearchParams(window.location.search);
  var tab = params.get("tab");

  return tab === "vehicle" ? "vehicle" : "profile";
}

function activateProfileTab(tab) {
  var activeTab = tab === "vehicle" ? "vehicle" : "profile";

  $(".js-profile-tab")
    .removeClass("btn-primary")
    .addClass("btn-outline-secondary");

  $('.js-profile-tab[data-tab="' + activeTab + '"]')
    .removeClass("btn-outline-secondary")
    .addClass("btn-primary");

  $(".js-profile-panel").addClass("d-none");
  $("#" + activeTab + "-tab-panel").removeClass("d-none");

  var url = new URL(window.location.href);
  url.searchParams.set("tab", activeTab);
  window.history.replaceState({}, "", url.toString());
}

function setProfileFeedback(message, type) {
  if (!message) {
    $("#profile-feedback").empty();
    return;
  }

  $("#profile-feedback").html(
    '<div class="alert alert-' + type + ' mb-0">' + message + "</div>"
  );
}

function updateProfileHeader(user) {
  var ratingText = user.rating_avg ? user.rating_avg + " ★" : "-";

  $("#profile-avatar").text(hopinGetInitials(user.full_name));
  $("#profile-header-name").text(user.full_name || "HopIn User");
  $("#profile-header-role").text(formatRoleLabel(user.role));
  $("#profile-stat-area").text(user.home_area || "-");
  $("#profile-stat-rating").text(ratingText);
  $("#profile-stat-role").text(formatRoleLabel(user.role || "rider"));
  $("#profile-rating").val(user.rating_avg ? user.rating_avg + " ★" : "No ratings yet");
}

function setScheduleDayActive(dayKey, shouldActivate) {
  $('.js-schedule-day[data-day="' + dayKey + '"]')
    .toggleClass("is-active", shouldActivate)
    .toggleClass("btn-primary", shouldActivate)
    .toggleClass("btn-outline-secondary", !shouldActivate);

  $('.schedule-row[data-day="' + dayKey + '"]').toggleClass("d-none", !shouldActivate);
}

function resetScheduleSection() {
  $("#schedule-location").val("");
  $("#schedule-destination").val("");

  hopinScheduleDays.forEach(function (day) {
    setScheduleDayActive(day.key, false);
    $('.js-schedule-time[data-day="' + day.key + '"]').val("");
    $('.js-schedule-return-time[data-day="' + day.key + '"]').val("");
  });
}

function fillScheduleSection(schedules) {
  resetScheduleSection();

  if (!schedules.length) {
    return;
  }

  $("#schedule-location").val(schedules[0].location || "");
  $("#schedule-destination").val(schedules[0].destination || "");

  schedules.forEach(function (schedule) {
    setScheduleDayActive(schedule.day_of_week, true);
    $('.js-schedule-time[data-day="' + schedule.day_of_week + '"]').val(
      schedule.departure_time ? String(schedule.departure_time).slice(0, 5) : ""
    );
    $('.js-schedule-return-time[data-day="' + schedule.day_of_week + '"]').val(
      schedule.return_time ? String(schedule.return_time).slice(0, 5) : ""
    );
  });
}

function fillVehicleForm(vehicle) {
  currentVehicleRecord = vehicle || null;
  $("#vehicle-make").val(vehicle && vehicle.make ? vehicle.make : "");
  $("#vehicle-model").val(vehicle && vehicle.model ? vehicle.model : "");
  $("#vehicle-year").val(vehicle && vehicle.vehicle_year ? vehicle.vehicle_year : "");
  $("#vehicle-color").val(vehicle && vehicle.color ? vehicle.color : "");
  $("#vehicle-license-plate").val(vehicle && vehicle.license_plate ? vehicle.license_plate : "");
  $("#vehicle-seats-available").val(vehicle && vehicle.seats_available ? String(vehicle.seats_available) : "3");
}

function fillProfileForm(user) {
  $("#profile-full-name").val(user.full_name || "");
  $("#profile-email").val(user.email || "");
  setDesiredRole(user.role || "rider");
  $("#profile-phone").val(user.phone || "");
  $("#profile-home-area").val(user.home_area || "");
  $("#profile-commute-notes").val(user.commute_notes || "");
  updateProfileHeader(user);
}

function loadCurrentProfile() {
  return window.HopinSession.waitForCurrentUser().then(function (currentUser) {
    if (!currentUser) {
      setProfileFeedback("No users are available yet. Add profile rows in Supabase first.", "warning");
      return null;
    }

    return Promise.all([
      $.getJSON("/api/users/" + currentUser.id),
      $.getJSON("/api/schedules/" + currentUser.id),
      $.getJSON("/api/users/" + currentUser.id + "/vehicles")
    ])
      .then(function (responses) {
        var userResponse = responses[0];
        var scheduleResponse = responses[1];
        var vehicleResponse = responses[2];

        fillProfileForm(userResponse.data);
        currentProfileSchedules = scheduleResponse.data || [];
        fillScheduleSection(currentProfileSchedules);
        fillVehicleForm((vehicleResponse.data || [])[0] || null);
      })
      .catch(function () {
        setProfileFeedback("Could not load the selected user profile.", "danger");
      });
  });
}

function buildProfilePayload() {
  return {
    full_name: $("#profile-full-name").val(),
    email: $("#profile-email").val(),
    role: $("#profile-role-value").val(),
    phone: $("#profile-phone").val(),
    home_area: $("#profile-home-area").val(),
    commute_notes: $("#profile-commute-notes").val()
  };
}

function buildVehiclePayload() {
  return {
    make: $("#vehicle-make").val(),
    model: $("#vehicle-model").val(),
    vehicle_year: $("#vehicle-year").val() || null,
    color: $("#vehicle-color").val(),
    license_plate: $("#vehicle-license-plate").val(),
    seats_available: $("#vehicle-seats-available").val()
  };
}

function buildDesiredSchedules(userId) {
  var location = $("#schedule-location").val();
  var destination = $("#schedule-destination").val();
  var desiredSchedules = [];

  hopinScheduleDays.forEach(function (day) {
    var isActive = $('.js-schedule-day[data-day="' + day.key + '"]').hasClass("is-active");
    var departureTime = $('.js-schedule-time[data-day="' + day.key + '"]').val();
    var returnTime = $('.js-schedule-return-time[data-day="' + day.key + '"]').val();

    if (isActive && departureTime) {
      desiredSchedules.push({
        user_id: userId,
        day_of_week: day.key,
        departure_time: departureTime,
        return_time: returnTime || null,
        location: location || null,
        destination: destination || null
      });
    }
  });

  return desiredSchedules;
}

function syncSchedules(userId) {
  var existingByDay = {};
  var desiredSchedules = buildDesiredSchedules(userId);
  var requests = [];

  currentProfileSchedules.forEach(function (schedule) {
    existingByDay[schedule.day_of_week] = schedule;
  });

  desiredSchedules.forEach(function (scheduleData) {
    var existingSchedule = existingByDay[scheduleData.day_of_week];

    if (existingSchedule) {
      requests.push(
        $.ajax({
          url: "/api/schedules/" + existingSchedule.id,
          method: "PUT",
          contentType: "application/json",
          data: JSON.stringify(scheduleData)
        })
      );
    } else {
      requests.push(
        $.ajax({
          url: "/api/schedules",
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify(scheduleData)
        })
      );
    }
  });

  currentProfileSchedules.forEach(function (schedule) {
    var stillExists = desiredSchedules.some(function (scheduleData) {
      return scheduleData.day_of_week === schedule.day_of_week;
    });

    if (!stillExists) {
      requests.push(
        $.ajax({
          url: "/api/schedules/" + schedule.id,
          method: "DELETE"
        })
      );
    }
  });

  return Promise.all(requests);
}

function saveCurrentProfile() {
  var currentUserId = window.HopinSession.getCurrentUserId();

  if (!currentUserId) {
    setProfileFeedback("Choose a current user first.", "warning");
    return;
  }

  $.ajax({
    url: "/api/users/" + currentUserId,
    method: "PUT",
    contentType: "application/json",
    data: JSON.stringify(buildProfilePayload())
  })
    .then(function (response) {
      return syncSchedules(currentUserId).then(function () {
        return response;
      });
    })
    .then(function (response) {
      setProfileFeedback("Profile and commute schedule saved to the database.", "success");
      fillProfileForm(response.data);
      return window.HopinSession.refreshUsers().then(function () {
        window.HopinSession.setCurrentUser(currentUserId, false);
        return loadCurrentProfile();
      });
    })
    .catch(function (xhr) {
      var message = "Could not save the profile.";

      if (xhr && xhr.responseJSON && xhr.responseJSON.message) {
        message = xhr.responseJSON.message;
      }

      setProfileFeedback(message, "danger");
    });
}

function saveVehicle() {
  var currentUserId = window.HopinSession.getCurrentUserId();
  var payload = buildVehiclePayload();
  var request;

  if (!currentUserId) {
    setProfileFeedback("Choose a current user first.", "warning");
    return;
  }

  if (!payload.make || !payload.model) {
    setProfileFeedback("Vehicle make and model are required.", "warning");
    return;
  }

  if (currentVehicleRecord && currentVehicleRecord.id) {
    request = $.ajax({
      url: "/api/users/" + currentUserId + "/vehicles/" + currentVehicleRecord.id,
      method: "PUT",
      contentType: "application/json",
      data: JSON.stringify(payload)
    });
  } else {
    request = $.ajax({
      url: "/api/users/" + currentUserId + "/vehicles",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(payload)
    });
  }

  request
    .done(function () {
      setProfileFeedback("Vehicle saved to the database.", "success");
      loadCurrentProfile();
    })
    .fail(function (xhr) {
      var message = "Could not save the vehicle.";

      if (xhr.responseJSON && xhr.responseJSON.message) {
        message = xhr.responseJSON.message;
      }

      setProfileFeedback(message, "danger");
    });
}

$(function () {
  activateProfileTab(getProfileQueryTab());
  loadCurrentProfile();

  hopinScheduleDays.forEach(function (day) {
    $('.js-schedule-day[data-day="' + day.key + '"]').addClass("btn-outline-secondary");
  });

  setDesiredRole("rider");

  $(document).on("click", ".js-profile-tab", function () {
    activateProfileTab($(this).data("tab"));
  });

  $(document).on("click", ".js-schedule-day", function () {
    var dayKey = $(this).data("day");
    var nextState = !$(this).hasClass("is-active");

    setScheduleDayActive(dayKey, nextState);

    if (!nextState) {
      $('.js-schedule-time[data-day="' + dayKey + '"]').val("");
      $('.js-schedule-return-time[data-day="' + dayKey + '"]').val("");
    }
  });

  $(document).on("click", ".js-intent-option", function () {
    setDesiredRole($(this).data("role"));
  });

  $(document).on("submit", "#profile-settings-form", function (event) {
    event.preventDefault();
    saveCurrentProfile();
  });

  $(document).on("submit", "#vehicle-settings-form", function (event) {
    event.preventDefault();
    saveVehicle();
  });

  $(document).on("hopin:user-changed", function () {
    setProfileFeedback("");
    loadCurrentProfile();
  });
});
