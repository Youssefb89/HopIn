var HOPIN_CURRENT_USER_KEY = "hopinCurrentUserId";
var hopinSessionState = {
  users: [],
  currentUser: null,
  usersPromise: null,
  authLocked: false
};

function loadSharedComponents() {
  return new Promise(function (resolve) {
    var $navbarSlot = $("#navbar-slot");

    if (!$navbarSlot.length) {
      resolve();
      return;
    }

    $navbarSlot.load("/components/navbar.html", function () {
      var currentPage = $("body").data("page");

      if (currentPage) {
        $('[data-nav="' + currentPage + '"]').addClass("active");
      }

      resolve();
    });
  });
}

function getStoredHopinCurrentUserId() {
  return window.localStorage.getItem(HOPIN_CURRENT_USER_KEY);
}

function setStoredHopinCurrentUserId(userId) {
  if (!userId) {
    window.localStorage.removeItem(HOPIN_CURRENT_USER_KEY);
    return;
  }

  window.localStorage.setItem(HOPIN_CURRENT_USER_KEY, userId);
}

function fetchHopinUsers() {
  if (hopinSessionState.usersPromise) {
    return hopinSessionState.usersPromise;
  }

  hopinSessionState.usersPromise = $.getJSON("/api/users")
    .then(function (response) {
      hopinSessionState.users = response.data || [];
      return hopinSessionState.users;
    })
    .catch(function () {
      hopinSessionState.users = [];
      return [];
    });

  return hopinSessionState.usersPromise;
}

function refreshHopinUsers() {
  hopinSessionState.usersPromise = null;
  return fetchHopinUsers();
}

function findHopinUserById(userId) {
  return hopinSessionState.users.find(function (user) {
    return user.id === userId;
  }) || null;
}

function setHopinCurrentUser(userId, shouldReload) {
  if (hopinSessionState.authLocked) {
    return hopinSessionState.currentUser;
  }

  var matchedUser = findHopinUserById(userId);

  if (!matchedUser) {
    return null;
  }

  hopinSessionState.currentUser = matchedUser;
  setStoredHopinCurrentUserId(matchedUser.id);
  renderHopinUserSwitcher();
  $(document).trigger("hopin:user-changed", [matchedUser]);

  if (shouldReload) {
    window.location.reload();
  }

  return matchedUser;
}

function ensureHopinCurrentUser() {
  var authReady = window.HopinAuth && window.HopinAuth.waitForInit
    ? window.HopinAuth.waitForInit().catch(function () {
      return null;
    })
    : Promise.resolve();

  return authReady.then(function () {
    return fetchHopinUsers();
  }).then(function (users) {
    var authProfile = window.HopinAuth && window.HopinAuth.getProfile
      ? window.HopinAuth.getProfile()
      : null;

    if (!users.length) {
      hopinSessionState.currentUser = null;
      hopinSessionState.authLocked = false;
      renderHopinUserSwitcher();
      renderHopinAuthControls();
      return null;
    }

    if (authProfile) {
      var linkedUser = findHopinUserById(authProfile.id);

      if (linkedUser) {
        hopinSessionState.currentUser = linkedUser;
        hopinSessionState.authLocked = true;
        setStoredHopinCurrentUserId(linkedUser.id);
        renderHopinUserSwitcher();
        renderHopinAuthControls();
        return linkedUser;
      }
    }

    var storedUserId = getStoredHopinCurrentUserId();
    var nextUser = findHopinUserById(storedUserId) || users[0];

    hopinSessionState.currentUser = nextUser;
    hopinSessionState.authLocked = false;
    setStoredHopinCurrentUserId(nextUser.id);
    renderHopinUserSwitcher();
    renderHopinAuthControls();
    return nextUser;
  });
}

function renderHopinUserSwitcher() {
  var $select = $("#current-user-select");
  var $role = $("#current-user-role");

  if (!$select.length) {
    return;
  }

  if (!hopinSessionState.users.length) {
    $select.html('<option value="">No users yet</option>').prop("disabled", true);
    $role.text("Add profiles in Supabase to switch users.");
    return;
  }

  if (hopinSessionState.authLocked && hopinSessionState.currentUser) {
    $select.html(
      '<option value="' + hopinEscapeHtml(hopinSessionState.currentUser.id) + '">' +
      hopinEscapeHtml(hopinSessionState.currentUser.full_name) +
      "</option>"
    ).prop("disabled", true);

    $role.text("Locked to the signed-in profile.");
    return;
  }

  var optionsHtml = hopinSessionState.users.map(function (user) {
    var selected = hopinSessionState.currentUser && user.id === hopinSessionState.currentUser.id
      ? ' selected'
      : "";

    return (
      '<option value="' + hopinEscapeHtml(user.id) + '"' + selected + ">" +
      hopinEscapeHtml(user.full_name) +
      "</option>"
    );
  }).join("");

  $select.html(optionsHtml).prop("disabled", false);

  if (hopinSessionState.currentUser) {
    $role.text(
      hopinSessionState.currentUser.role + " | " +
      (hopinSessionState.currentUser.home_area || "Profile active")
    );
  } else {
    $role.text("Choose a user");
  }
}

function renderHopinAuthControls() {
  var $statusLabel = $("#auth-status-label");
  var $statusMeta = $("#auth-status-meta");
  var $loginLink = $("#auth-login-link");
  var $signupLink = $("#auth-signup-link");
  var $logoutButton = $("#auth-logout-button");
  var authUser = window.HopinAuth && window.HopinAuth.getUser
    ? window.HopinAuth.getUser()
    : null;
  var authProfile = window.HopinAuth && window.HopinAuth.getProfile
    ? window.HopinAuth.getProfile()
    : null;

  if (!$statusLabel.length) {
    return;
  }

  if (authUser) {
    $statusLabel.text("Signed In");
    $statusMeta.text(
      (authProfile ? authProfile.full_name : authUser.email || "Account") +
      " | " +
      (authUser.email || "Auth active")
    );
    $loginLink.addClass("d-none-soft");
    $signupLink.addClass("d-none-soft");
    $logoutButton.removeClass("d-none-soft");
    return;
  }

  $statusLabel.text("Account");
  $statusMeta.text("Use login/signup or keep testing with the profile switcher.");
  $loginLink.removeClass("d-none-soft");
  $signupLink.removeClass("d-none-soft");
  $logoutButton.addClass("d-none-soft");
}

window.HopinSession = {
  waitForUsers: fetchHopinUsers,
  refreshUsers: refreshHopinUsers,
  waitForCurrentUser: ensureHopinCurrentUser,
  getUsers: function () {
    return hopinSessionState.users;
  },
  getCurrentUser: function () {
    return hopinSessionState.currentUser;
  },
  getCurrentUserId: function () {
    return hopinSessionState.currentUser
      ? hopinSessionState.currentUser.id
      : getStoredHopinCurrentUserId();
  },
  isAuthLocked: function () {
    return hopinSessionState.authLocked;
  },
  setCurrentUser: function (userId, shouldReload) {
    return fetchHopinUsers().then(function () {
      return setHopinCurrentUser(userId, shouldReload);
    });
  }
};

function hopinEscapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function hopinFormatDateLabel(dateValue) {
  if (!dateValue) {
    return "Date soon";
  }

  var parsedDate = new Date(dateValue + "T12:00:00");

  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return parsedDate.toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function hopinFormatTimeLabel(timeValue) {
  if (!timeValue) {
    return "Time soon";
  }

  var parsedDate = new Date("2000-01-01T" + timeValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return timeValue;
  }

  return parsedDate.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit"
  });
}

function hopinGetInitials(name) {
  var parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "H";
  }

  return parts
    .slice(0, 2)
    .map(function (part) {
      return part.charAt(0).toUpperCase();
    })
    .join("");
}

function hopinGetScheduledDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) {
    return null;
  }

  var normalizedTime = String(timeValue).slice(0, 8);
  var parsedDate = new Date(dateValue + "T" + normalizedTime);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function hopinHasScheduledTimePassed(dateValue, timeValue) {
  var scheduledDate = hopinGetScheduledDateTime(dateValue, timeValue);

  if (!scheduledDate) {
    return false;
  }

  return scheduledDate.getTime() <= Date.now();
}

function hopinHashText(value) {
  var text = String(value || "");
  var hash = 0;
  var index = 0;

  for (index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function hopinGetStaticMapPoint(seed, variant) {
  var hash = hopinHashText(seed + ":" + variant);
  var left = 12 + (hash % 72);
  var top = 16 + (Math.floor(hash / 13) % 58);

  return {
    left: left,
    top: top
  };
}

function hopinGetStaticLatLng(seed, variant) {
  var hash = hopinHashText(seed + ":" + variant);
  var latBase = 50.4452;
  var lngBase = -104.6189;
  var latOffset = ((hash % 1800) / 10000) - 0.09;
  var lngOffset = ((Math.floor(hash / 7) % 2200) / 10000) - 0.11;

  return [latBase + latOffset, lngBase + lngOffset];
}

function hopinGetRouteLatLng(origin, destination, rideSeed) {
  var originLatLng = hopinGetStaticLatLng(
    String(rideSeed || "") + ":" + String(origin || ""),
    "origin"
  );
  var destinationLatLng = hopinGetStaticLatLng(
    String(rideSeed || "") + ":" + String(destination || ""),
    "destination"
  );
  var latGap = Math.abs(originLatLng[0] - destinationLatLng[0]);
  var lngGap = Math.abs(originLatLng[1] - destinationLatLng[1]);

  if (latGap < 0.01 && lngGap < 0.01) {
    destinationLatLng = [
      destinationLatLng[0] + 0.018,
      destinationLatLng[1] - 0.022
    ];
  }

  return {
    origin: originLatLng,
    destination: destinationLatLng
  };
}

$(function () {
  Promise.all([loadSharedComponents(), window.HopinAuth ? window.HopinAuth.waitForInit() : Promise.resolve(), ensureHopinCurrentUser()]).then(function () {
    renderHopinUserSwitcher();
    renderHopinAuthControls();
  });

  $(document).on("change", "#current-user-select", function () {
    window.HopinSession.setCurrentUser($(this).val(), true);
  });

  $(document).on("click", "#auth-logout-button", function () {
    if (!window.HopinAuth) {
      return;
    }

    window.HopinAuth.signOut()
      .then(function () {
        hopinSessionState.authLocked = false;
        return ensureHopinCurrentUser();
      })
      .then(function () {
        if (window.location.pathname === "/login" || window.location.pathname === "/signup") {
          window.location.href = "/";
        }
      })
      .catch(function (error) {
        window.alert(error.message || "Could not sign out.");
      });
  });

  $(document).on("hopin:auth-changed", function () {
    ensureHopinCurrentUser().then(function () {
      renderHopinUserSwitcher();
      renderHopinAuthControls();
    });
  });
});
