const messageModel = require("../models/messageModel");
const rideRequestModel = require("../models/rideRequestModel");

function ensureAcceptedAndAllowedParticipants(messageData, conversation) {
  if (!conversation || conversation.status !== "accepted") {
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

    if (!bookingRequest || bookingRequest.status !== "accepted") {
      throw new Error("Messages are only available after a booking request is accepted.");
    }
  }

  if (filters.open_ride_request_id) {
    const openRideRequest = await rideRequestModel.getOpenRideRequestById(
      filters.open_ride_request_id
    );

    if (!openRideRequest || openRideRequest.status !== "accepted") {
      throw new Error("Messages are only available after an open ride request is accepted.");
    }
  }

  return messageModel.getByConversation(filters);
};

