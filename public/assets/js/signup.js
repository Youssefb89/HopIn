var hopinSignupUsers = [];

function getSuggestedAuthEmail(profile) {
  if (!profile) {
    return "";
  }

  var currentEmail = String(profile.email || "").trim().toLowerCase();

  if (currentEmail && !/@example\.com$/i.test(currentEmail)) {
    return currentEmail;
  }

  var slug = String(profile.full_name || "hopin-user")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

  return slug + "@hopin-demo.app";
}

function setSignupFeedback(message, type) {
  if (!message) {
    $("#signup-feedback").empty();
    return;
  }

  $("#signup-feedback").html(
    '<div class="alert alert-' + type + ' mb-0">' + hopinEscapeHtml(message) + "</div>"
  );
}

function fillSignupProfileEmail(profileId) {
  var profile = hopinSignupUsers.find(function (item) {
    return item.id === profileId;
  });

  $("#signup-email").val(getSuggestedAuthEmail(profile));
}

function renderSignupProfiles(users) {
  hopinSignupUsers = users || [];

  var options = ['<option value="">Select a profile</option>'].concat(
    hopinSignupUsers.map(function (user) {
      return (
        '<option value="' + hopinEscapeHtml(user.id) + '">' +
        hopinEscapeHtml(user.full_name) +
        " (" + hopinEscapeHtml(user.role) + ")" +
        "</option>"
      );
    })
  );

  $("#signup-profile-id").html(options.join(""));
}

$(function () {
  Promise.all([
    window.HopinAuth.waitForInit(),
    window.HopinSession.waitForUsers()
  ]).then(function (results) {
    renderSignupProfiles(results[1] || []);

    if (window.HopinAuth.getUser()) {
      setSignupFeedback("You are already signed in. Redirecting to the home page.", "success");
      window.setTimeout(function () {
        window.location.href = "/";
      }, 900);
    }
  });

  $("#signup-profile-id").on("change", function () {
    fillSignupProfileEmail($(this).val());
  });

  $(document).on("click", ".js-fill-signup-demo", function () {
    var profileName = $(this).data("profileName");
    var password = $(this).data("password");
    var matchedUser = hopinSignupUsers.find(function (user) {
      return user.full_name === profileName;
    });

    if (!matchedUser) {
      return;
    }

    $("#signup-profile-id").val(matchedUser.id);
    fillSignupProfileEmail(matchedUser.id);
    $("#signup-password").val(password);
    $("#signup-password-confirm").val(password);
  });

  $("#signup-form").on("submit", function (event) {
    event.preventDefault();
    setSignupFeedback("", "info");

    var profileId = $("#signup-profile-id").val();
    var email = $("#signup-email").val().trim();
    var password = $("#signup-password").val();
    var confirmPassword = $("#signup-password-confirm").val();

    if (!profileId) {
      setSignupFeedback("Choose a profile first.", "danger");
      return;
    }

    if (!email) {
      setSignupFeedback("The selected profile needs an email address before signup.", "danger");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSignupFeedback("Enter a valid email address for the auth account.", "danger");
      return;
    }

    if (password.length < 8) {
      setSignupFeedback("Password should be at least 8 characters long.", "danger");
      return;
    }

    if (password !== confirmPassword) {
      setSignupFeedback("Password and confirm password do not match.", "danger");
      return;
    }

    window.HopinAuth.signUpWithProfile(profileId, email, password)
      .then(function () {
        setSignupFeedback("Account created and linked successfully. Redirecting to home.", "success");
        window.setTimeout(function () {
          window.location.href = "/";
        }, 900);
      })
      .catch(function (error) {
        setSignupFeedback(error.message || "Could not create the account.", "danger");
      });
  });
});
