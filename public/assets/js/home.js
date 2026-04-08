function renderHomeRideCard(ride) {
  return (
    '<article class="ride-card">' +
    '<div class="ride-card-grid">' +
    '<div class="ride-card-main">' +
    '<div class="mini-label mb-2">Regina | ' + hopinEscapeHtml(hopinFormatDateLabel(ride.ride_date)) + "</div>" +
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
    '<span class="card-detail-item">' + hopinEscapeHtml(ride.notes || "Shared commute ride") + "</span>" +
    "</div>" +
    "</div>" +
    '<div class="ride-card-side">' +
    '<span class="status-badge status-' + hopinEscapeHtml(ride.status || "open") + '">' + hopinEscapeHtml((ride.status || "open").replace(/_/g, " ")) + "</span>" +
    '<div class="mt-3"><a class="btn btn-outline-primary btn-sm" href="/ride-details?id=' + ride.id + '">View Details</a></div>' +
    "</div>" +
    "</div>" +
    "</article>"
  );
}

function loadHomeRides() {
  $.getJSON("/api/rides")
    .done(function (response) {
      var rides = (response.data || []).filter(function (ride) {
        return ride.status !== "completed" && ride.status !== "cancelled";
      });

      if (!rides.length) {
        $("#home-rides-list").html(
          '<div class="empty-state">No rides have been posted yet. Once you add rides to Supabase, they will appear here.</div>'
        );
        return;
      }

      $("#home-rides-list").html(
        rides.slice(0, 2).map(function (ride) {
          return renderHomeRideCard(ride);
        }).join("")
      );
    })
    .fail(function () {
      $("#home-rides-list").html(
        '<div class="empty-state">Could not load rides right now.</div>'
      );
    });
}

$(function () {
  loadHomeRides();
});
