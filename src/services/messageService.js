const messageModel = require("../models/messageModel");
const rideRequestModel = require("../models/rideRequestModel");

function isUnlockedConversation(conversation) {
  return conversation && conversation.status === "accepted";
}

function ensureAcceptedAndAllowedParticipants(messageData, conversation) {
  if (!isUnlockedConversation(conversation)) {
    throw new Error("Messages are only allowed after a request has been accepted.");
  }

  let allowedUserIds = [];

  if (messageData.booking_request_id) {
    allowedUserIds = [
      conversation.rider_id,
      conversation.ride_details ? conversation.ride_details.driver_id : null
    ].filter(Boolean);
  }

  if (messageData.open_ride_request_id) {
    allowedUserIds = [
      conversation.rider_id,
      conversation.accepted_driver_id
    ].filter(Boolean);
  }

  const senderAllowed = allowedUserIds.includes(messageData.sender_id);
  const receiverAllowed = allowedUserIds.includes(messageData.receiver_id);

  if (!senderAllowed || !receiverAllowed) {
    throw new Error("Only the accepted rider and driver can send messages.");
  }
}

function buildBookingConversation(item, userId) {
  const ride = item.ride_details || {};
  const isRider = item.rider_id === userId;
  const partner = isRider ? item.driver_details : item.rider_details;

  return {
    id: `booking:${item.id}`,
    type: "booking_request",
    booking_request_id: item.id,
    open_ride_request_id: null,
    ride_id: ride.id || null,
    partner_id: partner ? partner.id : null,
    partner_name: partner && partner.full_name ? partner.full_name : "HopIn User",
    partner_role: isRider ? "Driver" : "Rider",
    origin: ride.origin || "Origin pending",
    destination: ride.destination || "Destination pending",
    ride_date: ride.ride_date || null,
    ride_time: ride.ride_time || null,
    status: item.status,
    updated_at: item.updated_at || item.created_at || null,
    helper_text: isRider
      ? "Chat with the driver about this accepted ride."
      : "Chat with the rider for this accepted booking."
  };
}

function buildOpenRideConversation(item, userId) {
  const isRider = item.rider_id === userId;
  const partner = isRider ? item.accepted_driver_details : item.rider_details;

  return {
    id: `open:${item.id}`,
    type: "open_ride_request",
    booking_request_id: null,
    open_ride_request_id: item.id,
    ride_id: null,
    partner_id: partner ? partner.id : null,
    partner_name: partner && partner.full_name ? partner.full_name : "HopIn User",
    partner_role: isRider ? "Driver" : "Rider",
    origin: item.origin || "Origin pending",
    destination: item.destination || "Destination pending",
    ride_date: item.ride_date || null,
    ride_time: item.ride_time || null,
    status: item.status,
    updated_at: item.updated_at || item.created_at || null,
    helper_text: isRider
      ? "Chat with the driver who accepted your ride request."
      : "Chat with the rider whose request you accepted."
  };
}

exports.createMessage = async (messageData) => {
  const payload = {
    sender_id: messageData.sender_id,
    receiver_id: messageData.receiver_id,
    booking_request_id: messageData.booking_request_id || null,
    open_ride_request_id: messageData.open_ride_request_id || null,
    content: messageData.content
  };

  if (!payload.sender_id || !payload.receiver_id || !payload.content) {
    throw new Error("sender_id, receiver_id, and content are required.");
  }

  if (!payload.booking_request_id && !payload.open_ride_request_id) {
    throw new Error(
      "booking_request_id or open_ride_request_id is required to start the chat."
    );
  }

  if (payload.booking_request_id) {
    const bookingRequest = await rideRequestModel.getBookingRequestById(
      payload.booking_request_id
    );
    ensureAcceptedAndAllowedParticipants(payload, bookingRequest);
  }

  if (payload.open_ride_request_id) {
    const openRideRequest = await rideRequestModel.getOpenRideRequestById(
      payload.open_ride_request_id
    );
    ensureAcceptedAndAllowedParticipants(payload, openRideRequest);
  }

  return messageModel.create(payload);
};

exports.getMessages = async (filters) => {
  if (!filters.booking_request_id && !filters.open_ride_request_id) {
    throw new Error(
      "booking_request_id or open_ride_request_id is required to load messages."
    );
  }

  if (filters.booking_request_id) {
    const bookingRequest = await rideRequestModel.getBookingRequestById(
      filters.booking_request_id
    );

    if (!isUnlockedConversation(bookingRequest)) {
      throw new Error("Messages are only available after a booking request is accepted.");
    }

    if (filters.current_user_id) {
      ensureAcceptedAndAllowedParticipants(
        {
          sender_id: filters.current_user_id,
          receiver_id: filters.current_user_id,
          booking_request_id: filters.booking_request_id
        },
        bookingRequest
      );
    }
  }

  if (filters.open_ride_request_id) {
    const openRideRequest = await rideRequestModel.getOpenRideRequestById(
      filters.open_ride_request_id
    );

    if (!isUnlockedConversation(openRideRequest)) {
      throw new Error("Messages are only available after an open ride request is accepted.");
    }

    if (filters.current_user_id) {
      ensureAcceptedAndAllowedParticipants(
        {
          sender_id: filters.current_user_id,
          receiver_id: filters.current_user_id,
          open_ride_request_id: filters.open_ride_request_id
        },
        openRideRequest
      );
    }
  }

  return messageModel.getByConversation(filters);
};

exports.getConversationsForUser = async (userId) => {
  if (!userId) {
    throw new Error("userId is required.");
  }

  const riderBookingRequests = await rideRequestModel.getBookingRequestsByRider(userId);
  const driverBookingRequests = await rideRequestModel.getIncomingBookingRequestsForDriver(userId);
  const riderOpenRequests = await rideRequestModel.getOpenRideRequests({ riderId: userId });
  const driverOpenRequests = await rideRequestModel.getIncomingOpenRideRequestsForDriver(userId);
  const conversationsById = {};

  riderBookingRequests
    .filter(isUnlockedConversation)
    .forEach((item) => {
      conversationsById[`booking:${item.id}`] = buildBookingConversation(item, userId);
    });

  driverBookingRequests
    .filter(isUnlockedConversation)
    .forEach((item) => {
      conversationsById[`booking:${item.id}`] = buildBookingConversation(item, userId);
    });

  riderOpenRequests
    .filter(isUnlockedConversation)
    .forEach((item) => {
      conversationsById[`open:${item.id}`] = buildOpenRideConversation(item, userId);
    });

  driverOpenRequests
    .filter((item) => isUnlockedConversation(item) && item.accepted_driver_id === userId)
    .forEach((item) => {
      conversationsById[`open:${item.id}`] = buildOpenRideConversation(item, userId);
    });

  return Object.values(conversationsById).sort((firstItem, secondItem) => {
    const firstDate = new Date(firstItem.updated_at || 0).getTime();
    const secondDate = new Date(secondItem.updated_at || 0).getTime();
    return secondDate - firstDate;
  });
};
