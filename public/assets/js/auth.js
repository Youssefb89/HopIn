var hopinAuthState = {
  config: null,
  client: null,
  initPromise: null,
  session: null,
  user: null,
  profile: null,
  subscription: null
};

function fetchHopinAuthConfig() {
  if (hopinAuthState.config) {
    return Promise.resolve(hopinAuthState.config);
  }

  return $.getJSON("/api/auth/config")
    .then(function (response) {
      hopinAuthState.config = response.data || {};
      return hopinAuthState.config;
    })
    .catch(function () {
      hopinAuthState.config = {
        auth_enabled: false,
        supabase_url: "",
        supabase_anon_key: ""
      };

      return hopinAuthState.config;
    });
}

function resolveHopinAuthProfile() {
  if (!hopinAuthState.user) {
    hopinAuthState.profile = null;
    return Promise.resolve(null);
  }

  var query = new URLSearchParams({
    authUserId: hopinAuthState.user.id,
    email: hopinAuthState.user.email || ""
  });

  return $.getJSON("/api/auth/profile-link?" + query.toString())
    .then(function (response) {
      hopinAuthState.profile = response.data || null;
      $(document).trigger("hopin:auth-changed", [hopinAuthState.user, hopinAuthState.profile]);
      return hopinAuthState.profile;
    })
    .catch(function () {
      hopinAuthState.profile = null;
      $(document).trigger("hopin:auth-changed", [hopinAuthState.user, null]);
      return null;
    });
}

function attachHopinAuthListener() {
  if (!hopinAuthState.client || hopinAuthState.subscription) {
    return;
  }

  var listener = hopinAuthState.client.auth.onAuthStateChange(function (event, session) {
    hopinAuthState.session = session || null;
    hopinAuthState.user = session ? session.user : null;
    resolveHopinAuthProfile();
  });

  hopinAuthState.subscription = listener.data || null;
}

function initHopinAuth() {
  if (hopinAuthState.initPromise) {
    return hopinAuthState.initPromise;
  }

  hopinAuthState.initPromise = fetchHopinAuthConfig().then(function (config) {
    if (
      !config.auth_enabled ||
      !config.supabase_url ||
      !config.supabase_anon_key ||
      !window.supabase ||
      typeof window.supabase.createClient !== "function"
    ) {
      return null;
    }

    hopinAuthState.client = window.supabase.createClient(
      config.supabase_url,
      config.supabase_anon_key
    );

    attachHopinAuthListener();

    return hopinAuthState.client.auth.getSession().then(function (result) {
      hopinAuthState.session = result.data ? result.data.session : null;
      hopinAuthState.user = hopinAuthState.session
        ? hopinAuthState.session.user
        : null;

      return resolveHopinAuthProfile();
    });
  });

  return hopinAuthState.initPromise;
}

function linkHopinProfile(profileId, authUserId, email) {
  return $.ajax({
    url: "/api/auth/link-profile",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      profile_id: profileId,
      auth_user_id: authUserId,
      email: email
    })
  }).then(function (response) {
    hopinAuthState.profile = response.data || null;
    $(document).trigger("hopin:auth-changed", [hopinAuthState.user, hopinAuthState.profile]);
    return hopinAuthState.profile;
  });
}

function syncHopinProfile(profilePayload) {
  return $.ajax({
    url: "/api/auth/sync-profile",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(profilePayload)
  }).then(function (response) {
    hopinAuthState.profile = response.data || null;
    $(document).trigger("hopin:auth-changed", [hopinAuthState.user, hopinAuthState.profile]);
    return hopinAuthState.profile;
  });
}

window.HopinAuth = {
  waitForInit: initHopinAuth,
  getConfig: function () {
    return hopinAuthState.config;
  },
  isEnabled: function () {
    return Boolean(
      hopinAuthState.config &&
      hopinAuthState.config.auth_enabled &&
      hopinAuthState.client
    );
  },
  getClient: function () {
    return hopinAuthState.client;
  },
  getSession: function () {
    return hopinAuthState.session;
  },
  getUser: function () {
    return hopinAuthState.user;
  },
  getProfile: function () {
    return hopinAuthState.profile;
  },
  signIn: async function (email, password) {
    await initHopinAuth();

    if (!hopinAuthState.client) {
      throw new Error("Supabase Auth is not configured.");
    }

    var result = await hopinAuthState.client.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (result.error) {
      throw result.error;
    }

    hopinAuthState.session = result.data.session || null;
    hopinAuthState.user = result.data.user || null;
    await resolveHopinAuthProfile();
    return result.data;
  },
  signUpStandard: async function (profilePayload, password) {
    await initHopinAuth();

    if (!hopinAuthState.client) {
      throw new Error("Supabase Auth is not configured.");
    }

    var result = await hopinAuthState.client.auth.signUp({
      email: profilePayload.email,
      password: password
    });

    if (result.error) {
      throw result.error;
    }

    hopinAuthState.session = result.data.session || null;
    hopinAuthState.user = result.data.user || null;

    if (result.data.user) {
      await syncHopinProfile({
        profile_id: profilePayload.profile_id || null,
        auth_user_id: result.data.user.id,
        full_name: profilePayload.full_name,
        email: result.data.user.email || profilePayload.email,
        role: profilePayload.role || "rider",
        phone: profilePayload.phone || null,
        home_area: profilePayload.home_area || null
      });
    }

    return result.data;
  },
  signOut: async function () {
    await initHopinAuth();

    if (!hopinAuthState.client) {
      return;
    }

    var result = await hopinAuthState.client.auth.signOut();

    if (result.error) {
      throw result.error;
    }

    hopinAuthState.session = null;
    hopinAuthState.user = null;
    hopinAuthState.profile = null;
    $(document).trigger("hopin:auth-changed", [null, null]);
  }
};

$(function () {
  initHopinAuth();
});
