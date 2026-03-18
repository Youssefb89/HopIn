const db = require("../config/db");

let mockMessages = [];

exports.create = async (messageData) => {
  if (!db) {
    const newMessage = {
      id: `message-${Date.now()}`,
      ...messageData,
      created_at: new Date().toISOString()
    };

    mockMessages.push(newMessage);
    return newMessage;
  }

  const { data, error } = await db
    .from("messages")
    .insert([messageData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

exports.getByConversation = async (filters) => {
  if (!db) {
    return mockMessages.filter((item) => {
      if (filters.booking_request_id) {
        return item.booking_request_id === filters.booking_request_id;
      }

      if (filters.open_ride_request_id) {
        return item.open_ride_request_id === filters.open_ride_request_id;
      }

      return false;
    });
  }

  let query = db.from("messages").select("*");

  if (filters.booking_request_id) {
    query = query.eq("booking_request_id", filters.booking_request_id);
  }

  if (filters.open_ride_request_id) {
    query = query.eq("open_ride_request_id", filters.open_ride_request_id);
  }

  const { data, error } = await query.order("created_at");

  if (error) {
    throw error;
  }

  return data || [];
};
