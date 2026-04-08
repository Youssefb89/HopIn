const db = require("../config/db");

let mockUsers = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    auth_user_id: null,
    full_name: "Alex Thompson",
    email: "alex@example.com",
    role: "driver",
    phone: "(306) 555-0101",
    home_area: "Albert Park",
    commute_notes: "Weekdays before 8 AM",
    rating_avg: 4.8
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    auth_user_id: null,
    full_name: "Priya Sharma",
    email: "priya@example.com",
    role: "driver",
    phone: "(306) 555-0140",
    home_area: "Normanview",
    commute_notes: "Late morning commute",
    rating_avg: 4.9
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    auth_user_id: null,
    full_name: "Jordan Lee",
    email: "jordan@example.com",
    role: "driver",
    phone: "(306) 555-0175",
    home_area: "Harbour Landing",
    commute_notes: "Afternoon campus runs",
    rating_avg: 4.5
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    auth_user_id: null,
    full_name: "Mohammed Al-Hassan",
    email: "mohammed@example.com",
    role: "driver",
    phone: "(306) 555-0188",
    home_area: "Lakeview",
    commute_notes: "Mid afternoon commute",
    rating_avg: 5.0
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    auth_user_id: null,
    full_name: "Jamie Lee",
    email: "jamie@example.com",
    role: "rider",
    phone: "(306) 555-0102",
    home_area: "Downtown",
    commute_notes: "Morning classes",
    rating_avg: 0
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    auth_user_id: null,
    full_name: "Sarah Kim",
    email: "sarah@example.com",
    role: "rider",
    phone: "(306) 555-0103",
    home_area: "Uplands",
    commute_notes: "Flexible afternoons",
    rating_avg: 4.5
  },
  {
    id: "88888888-8888-4888-8888-888888888888",
    auth_user_id: null,
    full_name: "Taylor Brooks",
    email: "taylor@example.com",
    role: "rider",
    phone: "(306) 555-0117",
    home_area: "Harbour Landing",
    commute_notes: "Morning labs",
    rating_avg: 4.6
  },
  {
    id: "99999999-9999-4999-8999-999999999999",
    auth_user_id: null,
    full_name: "Noah Patel",
    email: "noah@example.com",
    role: "rider",
    phone: "(306) 555-0128",
    home_area: "Whitmore Park",
    commute_notes: "Afternoon classes",
    rating_avg: 4.4
  }
];

exports.getAll = async () => {
  if (!db) {
    return [...mockUsers].sort((firstUser, secondUser) => {
      return firstUser.full_name.localeCompare(secondUser.full_name);
    });
  }

  const { data, error } = await db
    .from("profiles")
    .select("*")
    .order("full_name");

  if (error) {
    throw error;
  }

  return data || [];
};

exports.getById = async (userId) => {
  if (!db) {
    return mockUsers.find((item) => item.id === userId) || null;
  }

  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

exports.getByEmail = async (email) => {
  if (!email) {
    return null;
  }

  if (!db) {
    return mockUsers.find((item) => item.email === email) || null;
  }

  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
};

exports.getByAuthUserId = async (authUserId) => {
  if (!authUserId) {
    return null;
  }

  if (!db) {
    return mockUsers.find((item) => item.auth_user_id === authUserId) || null;
  }

  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
};

exports.create = async (userData) => {
  if (!db) {
    const newUser = {
      id: userData.id || `mock-user-${Date.now()}`,
      auth_user_id: userData.auth_user_id || null,
      full_name: userData.full_name,
      email: userData.email || null,
      role: userData.role || "rider",
      phone: userData.phone || null,
      home_area: userData.home_area || null,
      commute_notes: userData.commute_notes || null,
      rating_avg: Number(userData.rating_avg || 0)
    };

    mockUsers.push(newUser);
    return newUser;
  }

  const { data, error } = await db
    .from("profiles")
    .insert([userData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

exports.update = async (userId, updates) => {
  if (!db) {
    const index = mockUsers.findIndex((item) => item.id === userId);

    if (index === -1) {
      throw new Error("User not found.");
    }

    mockUsers[index] = {
      ...mockUsers[index],
      ...updates
    };

    return mockUsers[index];
  }

  const { data, error } = await db
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};
