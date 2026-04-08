var hopinSignupUsers = [];

function setSignupFeedback(message, type) {
  if (!message) {
    $("#signup-feedback").empty();
    return;
  }

  $("#signup-feedback").html(
    '<div class="alert alert-' + type + ' mb-0">' + hopinEscapeHtml(message) + "</div>"
  );
}

function findSignupUserByName(name) {
  return hopinSignupUsers.find(function (user) {
    return user.full_name === name;
  }) || null;
}

function fillSignupDemo(profileName, email, password) {
  var matchedUser = findSignupUserByName(profileName);

  $("#signup-profile-id").val(matchedUser ? matchedUser.id : "");
  $("#signup-full-name").val(profileName);
  $("#signup-email").val(email);
  $("#signup-password").val(password);
  $("#signup-password-confirm").val(password);

  if (matchedUser) {
    $("#signup-role").val(matchedUser.role || "rider");
    $("#signup-home-area").val(matchedUser.home_area || "");
  }
}

$(function () {
  Promise.all([
    window.HopinAuth.waitForInit(),
    window.HopinSession.waitForUsers()
  ]).then(function (results) {
    hopinSignupUsers = results[1] || [];

    if (window.HopinAuth.getUser()) {
      setSignupFeedback("You are already signed in. Redirecting to the home page.", "success");
      window.setTimeout(function () {
        window.location.href = "/";
      }, 900);
    }
  });

  $(document).on("click", ".js-fill-signup-demo", function () {
    fillSignupDemo(
      $(this).data("profileName"),
      $(this).data("email"),
      $(this).data("password")
    );
  });

  $("#signup-form").on("submit", function (event) {
    event.preventDefault();
    setSignupFeedback("", "info");

    var profileId = $("#signup-profile-id").val() || null;
    var fullName = $("#signup-full-name").val().trim();
    var email = $("#signup-email").val().trim().toLowerCase();
    var password = $("#signup-password").val();
    var confirmPassword = $("#signup-password-confirm").val();
    var role = $("#signup-role").val();
    var homeArea = $("#signup-home-area").val().trim();

    if (!fullName) {
      setSignupFeedback("Full name is required.", "danger");
      return;
    }

    if (!email) {
      setSignupFeedback("Email is required.", "danger");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSignupFeedback("Enter a valid email address.", "danger");
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

    window.HopinAuth.signUpStandard({
      profile_id: profileId,
      full_name: fullName,
      email: email,
      role: role,
      home_area: homeArea
    }, password)
      .then(function () {
        return window.HopinSession.refreshUsers();
      })
      .then(function () {
        setSignupFeedback("Account created successfully. Redirecting to home.", "success");
        window.setTimeout(function () {
          window.location.href = "/";
        }, 900);
      })
      .catch(function (error) {
        setSignupFeedback(error.message || "Could not create the account.", "danger");
      });
  });
});
