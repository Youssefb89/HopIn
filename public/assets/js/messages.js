var messageState = {
  conversations: [],
  selectedConversation: null
};

function getMessageQueryValue(name) {
  var params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function setMessagesFeedback(message, type) {
  if (!message) {
    $("#messages-feedback").empty();
    return;
  }

  $("#messages-feedback").html(
    '<div class="alert alert-' + type + ' mb-0">' + message + "</div>"
  );
}

function getCurrentMessageUser() {
  return window.HopinSession.getCurrentUser();
}

function getCurrentMessageUserId() {
  return window.HopinSession.getCurrentUserId();
}

function getConversationQueryMatch(conversation) {
  var bookingRequestId = getMessageQueryValue("bookingRequestId");
  var openRideRequestId = getMessageQueryValue("openRideRequestId");

  if (bookingRequestId && conversation.booking_request_id === bookingRequestId) {
    return true;
  }

  if (openRideRequestId && conversation.open_ride_request_id === openRideRequestId) {
    return true;
  }

  return false;
}

function renderConversationList() {
  if (!messageState.conversations.length) {
    $("#messages-conversation-list").html(
      '<div class="empty-state">No chats are unlocked yet. Accepted rides will appear here automatically.</div>'
    );
    return;
  }

  $("#messages-conversation-list").html(
    messageState.conversations.map(function (conversation) {
      var activeClass =
        messageState.selectedConversation &&
        messageState.selectedConversation.id === conversation.id
          ? " is-active"
          : "";

      return (
        '<button class="conversation-card message-conversation-card' + activeClass + '" type="button" data-conversation-id="' + hopinEscapeHtml(conversation.id) + '">' +
        '<div class="d-flex justify-content-between align-items-start gap-3">' +
        '<div>' +
        '<strong>' + hopinEscapeHtml(conversation.partner_name) + "</strong>" +
        '<div class="ride-meta mt-1">' + hopinEscapeHtml(conversation.partner_role) + "</div>" +
        '<div class="mt-2">' + hopinEscapeHtml(conversation.origin) + " to " + hopinEscapeHtml(conversation.destination) + "</div>" +
        '<div class="ride-meta mt-2">' + hopinEscapeHtml(hopinFormatDateLabel(conversation.ride_date)) + " | " + hopinEscapeHtml(hopinFormatTimeLabel(conversation.ride_time)) + "</div>" +
        "</div>" +
        '<span class="status-badge status-' + hopinEscapeHtml(conversation.status) + '">' + hopinEscapeHtml(conversation.status.replace(/_/g, " ")) + "</span>" +
        "</div>" +
        "</button>"
      );
    }).join("")
  );
}

function renderThreadHeader(conversation) {
  if (!conversation) {
    $("#messages-thread-header").html(
      '<div class="empty-state">Choose a conversation from the left to open the chat.</div>'
    );
    $("#message-compose-form").addClass("d-none-soft");
    return;
  }

  $("#messages-thread-header").html(
    '<div class="d-flex justify-content-between gap-3 flex-wrap align-items-start">' +
    '<div>' +
    '<h2 class="section-title mb-1">' + hopinEscapeHtml(conversation.partner_name) + "</h2>" +
    '<p class="placeholder-note mb-0">' + hopinEscapeHtml(conversation.helper_text) + "</p>" +
    '<div class="ride-meta mt-2">' + hopinEscapeHtml(conversation.origin) + " to " + hopinEscapeHtml(conversation.destination) + " | " + hopinEscapeHtml(hopinFormatDateLabel(conversation.ride_date)) + " | " + hopinEscapeHtml(hopinFormatTimeLabel(conversation.ride_time)) + "</div>" +
    "</div>" +
    '<span class="status-badge status-' + hopinEscapeHtml(conversation.status) + '">' + hopinEscapeHtml(conversation.status.replace(/_/g, " ")) + "</span>" +
    "</div>"
  );

  $("#message-compose-form").removeClass("d-none-soft");
}

function renderMessageThread(messages) {
  var currentUserId = getCurrentMessageUserId();

  if (!messages.length) {
    $("#messages-thread-body").html(
      '<div class="empty-state">No messages yet. Start the conversation here.</div>'
    );
    return;
  }

  $("#messages-thread-body").html(
    messages.map(function (message) {
      var isMine = message.sender_id === currentUserId;
      var bubbleClass = isMine ? " message-bubble-mine" : " message-bubble-other";

      return (
        '<div class="message-row' + (isMine ? " is-mine" : "") + '">' +
        '<div class="message-bubble' + bubbleClass + '">' +
        '<div>' + hopinEscapeHtml(message.content) + "</div>" +
        '<div class="message-meta">' + hopinEscapeHtml(new Date(message.created_at).toLocaleString("en-CA")) + "</div>" +
        "</div>" +
        "</div>"
      );
    }).join("")
  );

  var threadBody = document.getElementById("messages-thread-body");

  if (threadBody) {
    threadBody.scrollTop = threadBody.scrollHeight;
  }
}

function loadConversationMessages() {
  if (!messageState.selectedConversation) {
    renderThreadHeader(null);
    $("#messages-thread-body").html(
      '<div class="empty-state">Choose a conversation from the left to open the chat.</div>'
    );
    return;
  }

  renderThreadHeader(messageState.selectedConversation);
  $("#messages-thread-body").html('<div class="detail-loading">Loading messages...</div>');

  $.getJSON("/api/messages", {
    booking_request_id: messageState.selectedConversation.booking_request_id || "",
    open_ride_request_id: messageState.selectedConversation.open_ride_request_id || "",
    current_user_id: getCurrentMessageUserId()
  })
    .done(function (response) {
      renderMessageThread(response.data || []);
    })
    .fail(function (xhr) {
      var message = "Could not load this conversation.";

      if (xhr && xhr.responseJSON && xhr.responseJSON.message) {
        message = xhr.responseJSON.message;
      }

      $("#messages-thread-body").html(
        '<div class="empty-state">' + hopinEscapeHtml(message) + "</div>"
      );
    });
}

function selectConversationById(conversationId) {
  messageState.selectedConversation = messageState.conversations.find(function (conversation) {
    return conversation.id === conversationId;
  }) || null;

  renderConversationList();
  loadConversationMessages();
}

function loadConversations() {
  var userId = getCurrentMessageUserId();
  var currentUser = getCurrentMessageUser();
  var currentName = currentUser && currentUser.full_name ? currentUser.full_name : "Current user";

  $("#messages-hero-copy").text(
    currentName + " can only chat on rides that were already accepted."
  );

  if (!userId) {
    $("#messages-conversation-list").html(
      '<div class="empty-state">Choose a current user from the navbar to open messages.</div>'
    );
    renderThreadHeader(null);
    return;
  }

  $.getJSON("/api/messages/conversations", {
    userId: userId
  })
    .done(function (response) {
      messageState.conversations = response.data || [];

      if (!messageState.conversations.length) {
        renderConversationList();
        renderThreadHeader(null);
        $("#messages-thread-body").html(
          '<div class="empty-state">Accepted rides will unlock chats here.</div>'
        );
        return;
      }

      var matchedConversation = messageState.conversations.find(getConversationQueryMatch);
      messageState.selectedConversation = matchedConversation || messageState.conversations[0];
      renderConversationList();
      loadConversationMessages();
    })
    .fail(function () {
      $("#messages-conversation-list").html(
        '<div class="empty-state">Could not load conversations right now.</div>'
      );
      renderThreadHeader(null);
    });
}

function sendMessage() {
  if (!messageState.selectedConversation) {
    setMessagesFeedback("Choose a conversation first.", "warning");
    return;
  }

  var $input = $("#message-compose-input");
  var content = ($input.val() || "").trim();

  if (!content) {
    setMessagesFeedback("Write a message before sending.", "warning");
    return;
  }

  $.ajax({
    url: "/api/messages",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      sender_id: getCurrentMessageUserId(),
      receiver_id: messageState.selectedConversation.partner_id,
      booking_request_id: messageState.selectedConversation.booking_request_id || null,
      open_ride_request_id: messageState.selectedConversation.open_ride_request_id || null,
      content: content
    })
  })
    .done(function () {
      setMessagesFeedback("Message sent.", "success");
      $input.val("");
      loadConversationMessages();
    })
    .fail(function (xhr) {
      var message = "Could not send this message.";

      if (xhr && xhr.responseJSON && xhr.responseJSON.message) {
        message = xhr.responseJSON.message;
      }

      setMessagesFeedback(message, "danger");
    });
}

$(function () {
  window.HopinSession.waitForCurrentUser().then(function () {
    loadConversations();
  });

  $(document).on("click", ".message-conversation-card", function () {
    selectConversationById($(this).data("conversation-id"));
  });

  $(document).on("submit", "#message-compose-form", function (event) {
    event.preventDefault();
    sendMessage();
  });

  $(document).on("hopin:user-changed", function () {
    setMessagesFeedback("");
    loadConversations();
  });
});
