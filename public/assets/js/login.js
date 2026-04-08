function setLoginFeedback(message, type) {
  if (!message) {
    $("#login-feedback").empty();
    return;
  }

  $("#login-feedback").html(
    '<div class="alert alert-' + type + ' mb-0">' + hopinEscapeHtml(message) + "</div>"
  );
}

$(function () {
  window.HopinAuth.waitForInit().then(function () {
    if (window.HopinAuth.getUser()) {
      setLoginFeedback("You are already signed in. Redirecting to the home page.", "success");
      window.setTimeout(function () {
        window.location.href = "/";
      }, 900);
    }
  });

  $(document).on("click", ".js-fill-login-demo", function () {
    $("#login-email").val($(this).data("email"));
    $("#login-password").val($(this).data("password"));
  });

  $("#login-form").on("submit", function (event) {
    event.preventDefault();
    setLoginFeedback("", "info");

    window.HopinAuth.signIn(
      $("#login-email").val().trim(),
      $("#login-password").val()
    )
      .then(function () {
        return window.HopinSession.refreshUsers();
      })
      .then(function () {
        if (!window.HopinAuth.getProfile()) {
          setLoginFeedback("Login worked, but this account does not have a HopIn profile yet.", "warning");
          return;
        }

        setLoginFeedback("Login successful. Redirecting to home.", "success");
        window.setTimeout(function () {
          window.location.href = "/";
        }, 700);
      })
      .catch(function (error) {
        setLoginFeedback(error.message || "Could not log in.", "danger");
      });
  });
});
