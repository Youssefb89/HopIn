var HOPIN_CURRENT_USER_KEY = "hopinCurrentUserId";
var hopinSessionState = {
  users: [],
  currentUser: null,
  usersPromise: null
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
  return fetchHopinUsers().then(function (users) {
    if (!users.length) {
      hopinSessionState.currentUser = null;
      renderHopinUserSwitcher();
      return null;
    }

    var storedUserId = getStoredHopinCurrentUserId();
    var nextUser = findHopinUserById(storedUserId) || users[0];

    hopinSessionState.currentUser = nextUser;
    setStoredHopinCurrentUserId(nextUser.id);
    renderHopinUserSwitcher();
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

$(function () {
  Promise.all([loadSharedComponents(), ensureHopinCurrentUser()]).then(function () {
    renderHopinUserSwitcher();
  });

  $(document).on("change", "#current-user-select", function () {
    window.HopinSession.setCurrentUser($(this).val(), true);
  });
});
