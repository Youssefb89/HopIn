const userModel = require("../models/userModel");

exports.getPublicConfig = async () => {
  return {
    auth_enabled: Boolean(
      process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
    ),
    supabase_url: process.env.SUPABASE_URL || "",
    supabase_anon_key: process.env.SUPABASE_ANON_KEY || ""
  };
};

exports.getLinkedProfile = async (authUserId, email) => {
  let profile = null;

  if (authUserId) {
    profile = await userModel.getByAuthUserId(authUserId);
  }

  if (!profile && email) {
    profile = await userModel.getByEmail(email);
  }

  return profile;
};

exports.linkProfile = async (profileId, authUserId, email) => {
  if (!profileId) {
    throw new Error("Profile id is required.");
  }

  if (!authUserId) {
    throw new Error("Auth user id is required.");
  }

  const profile = await userModel.getById(profileId);

  if (!profile) {
    throw new Error("Profile not found.");
  }

  if (profile.auth_user_id && profile.auth_user_id !== authUserId) {
    throw new Error("This profile is already linked to another auth account.");
  }

  const linkedProfile = await userModel.getByAuthUserId(authUserId);

  if (linkedProfile && linkedProfile.id !== profileId) {
    throw new Error("This auth account is already linked to another profile.");
  }

  if (email) {
    const existingEmailProfile = await userModel.getByEmail(email);

    if (existingEmailProfile && existingEmailProfile.id !== profileId) {
      throw new Error("That email is already being used by another profile.");
    }
  }

  return userModel.update(profileId, {
    auth_user_id: authUserId,
    email: email || profile.email || null
  });
};

exports.syncProfileForAuth = async (profileData) => {
  if (!profileData.auth_user_id) {
    throw new Error("Auth user id is required.");
  }

  if (!profileData.email) {
    throw new Error("Email is required.");
  }

  if (!profileData.full_name) {
    throw new Error("Full name is required.");
  }

  let profile = null;

  if (profileData.profile_id) {
    profile = await userModel.getById(profileData.profile_id);

    if (!profile) {
      throw new Error("Selected profile was not found.");
    }

    if (profile.auth_user_id && profile.auth_user_id !== profileData.auth_user_id) {
      throw new Error("That profile is already linked to another auth account.");
    }
  }

  if (!profile) {
    profile = await userModel.getByAuthUserId(profileData.auth_user_id);
  }

  if (!profile) {
    profile = await userModel.getByEmail(profileData.email);
  }

  if (profile) {
    if (profile.auth_user_id && profile.auth_user_id !== profileData.auth_user_id) {
      throw new Error("That email is already linked to another auth account.");
    }

    return userModel.update(profile.id, {
      auth_user_id: profileData.auth_user_id,
      email: profileData.email,
      full_name: profileData.full_name,
      role: profileData.role || profile.role || "rider",
      phone: profileData.phone || profile.phone || null,
      home_area: profileData.home_area || profile.home_area || null
    });
  }

  return userModel.create({
    auth_user_id: profileData.auth_user_id,
    full_name: profileData.full_name,
    email: profileData.email,
    role: profileData.role || "rider",
    phone: profileData.phone || null,
    home_area: profileData.home_area || null,
    commute_notes: profileData.commute_notes || null,
    rating_avg: 0
  });
};
