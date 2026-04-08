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
