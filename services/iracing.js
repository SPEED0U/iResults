const axios = require('axios');
const tough = require('tough-cookie');
const { writeFileSync } = require('fs');
const { createHash } = require('node:crypto');
const config = require('../data/config.json');

let iracingSession = {
  cookie: null,
  expiration: null,
};

let licenseDataCache = null;

async function authenticateIRacing() {
  try {
    const encodedPassword = createHash('sha256')
      .update(`${config.iracingPassword}${config.iracingEmail.toLowerCase()}`)
      .digest('base64');

    const response = await axios.post('https://members-ng.iracing.com/auth', {
      email: config.iracingEmail,
      password: encodedPassword,
    }, {
      headers: { 'Content-Type': 'application/json' },
    });

    const { authcode } = response.data;
    const authCookie = tough.Cookie.parse(response.headers['set-cookie'][0]).clone();
    authCookie.key = 'authtoken_members';
    authCookie.value = JSON.stringify({
      authtoken: {
        authcode,
        email: config.iracingEmail,
      },
    });

    writeFileSync('./data/authCookie.ini', authCookie.toString());
    console.log('[API] Successfully authenticated to iRacing.');

    iracingSession.cookie = authCookie.toString();
    iracingSession.expiration = Date.now() + 15 * 60 * 1000; // 15 minutes expiration
  } catch (error) {
    console.error('Error authenticating with iRacing API:', error.response?.data || error.message);
    iracingSession.cookie = null;
    iracingSession.expiration = null;
    throw error;
  }
}

async function fetchLicenseData() {
  try {
    if (!iracingSession.cookie || Date.now() > iracingSession.expiration) {
      console.log('[API] iRacing session expired or missing. Reauthenticating.');
      await authenticateIRacing();
    }

    const response = await axios.get(
      'https://members-ng.iracing.com/data/lookup/licenses',
      { headers: { Cookie: iracingSession.cookie } }
    );

    if (response.data.link) {
      const linkResponse = await axios.get(response.data.link);
      licenseDataCache = linkResponse.data;
    } else {
      licenseDataCache = response.data;
    }

    console.log('[API] License data successfully fetched and cached from iRacing.');
  } catch (error) {
    console.error('Error fetching license data:', error.response?.data || error.message);
    throw error;
  }
}

async function fetchCarInfo() {
  try {
    if (!iracingSession.cookie || Date.now() > iracingSession.expiration) {
      console.log('[API] Session expired or missing. Reauthenticating to iRacing.');
      await authenticateIRacing();
    }

    const response = await axios.get(
      'https://members-ng.iracing.com/data/car/get',
      { headers: { Cookie: iracingSession.cookie } }
    );

    if (response.data.link) {
      const linkResponse = await axios.get(response.data.link);
      return linkResponse.data;
    }

    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('[API] Unauthorized. Reauthenticating to iRacing.');
      await authenticateIRacing();
      return fetchCarInfo();
    }
    console.error('Error fetching car information:', error.response?.data || error.message);
    throw error;
  }
}

async function fetchLastRaceResults(customer_id) {
  try {
    if (!iracingSession.cookie || Date.now() > iracingSession.expiration) {
      console.log('[API] Session expired or missing. Reauthenticating to iRacing.');
      await authenticateIRacing();
    }

    const response = await axios.get(
      `https://members-ng.iracing.com/data/stats/member_recent_races?cust_id=${customer_id}`,
      { headers: { Cookie: iracingSession.cookie } }
    );

    if (response.data.link) {
      const linkResponse = await axios.get(response.data.link);
      return linkResponse.data;
    }

    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('[API] Unauthorized. Reauthenticating to iRacing.');
      await authenticateIRacing();
      return fetchLastRaceResults(customer_id);
    }
    console.error(`Error fetching race results for member ID ${customer_id}:`, error.response?.data || error.message);
    throw error;
  }
}

async function fetchMemberInfo(customer_id) {
  try {
    if (!iracingSession.cookie || Date.now() > iracingSession.expiration) {
      console.log('[API] Session expired or missing. Reauthenticating.');
      await authenticateIRacing();
    }

    const response = await axios.get(
      `https://members-ng.iracing.com/data/member/get?cust_ids=${customer_id}`,
      { headers: { Cookie: iracingSession.cookie } }
    );

    if (response.data.link) {
      const linkResponse = await axios.get(response.data.link);
      return linkResponse.data.members?.[0]?.display_name;
    }

    return response.data.members?.[0]?.display_name;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('[API] Unauthorized. Reauthenticating to iRacing.');
      await authenticateIRacing();
      return fetchMemberInfo(customer_id);
    }
    console.error('Error fetching member info:', error.response?.data || error.message);
    throw error;
  }
}

async function fetchSeriesInfo(series_id) {
  try {
    if (!iracingSession.cookie || Date.now() > iracingSession.expiration) {
      console.log('[API] Session expired or missing. Reauthenticating.');
      await authenticateIRacing();
    }

    const response = await axios.get(
      `https://members-ng.iracing.com/data/series/get`,
      { headers: { Cookie: iracingSession.cookie } }
    );

    if (response.data.link) {
      const linkResponse = await axios.get(response.data.link);
      return linkResponse.data.find(series => series.series_id === series_id);
    }

    return response.data.find(series => series.series_id === series_id);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('[API] Unauthorized. Reauthenticating to iRacing.');
      await authenticateIRacing();
      return fetchSeriesInfo(series_id);
    }
    console.error('Error fetching series info:', error.response?.data || error.message);
    throw error;
  }
}

function getGroupNameByLicenseId(licenseId) {
  if (!licenseDataCache) {
    console.warn('[API] License data cache is empty. Unable to get license group name.');
    return 'Unknown License Group';
  }

  for (const group of licenseDataCache) {
    const level = group.levels.find(level => level.license_id === licenseId);
    if (level) {
      return group.group_name;
    }
  }

  return 'Unknown License Group';
}

// Utility function to check if session is expired
function isSessionExpired() {
  return !iracingSession.cookie || Date.now() > iracingSession.expiration;
}

// Helper function to handle API responses with links
async function handleLinkedResponse(response) {
  if (response.data.link) {
    const linkResponse = await axios.get(response.data.link);
    return linkResponse.data;
  }
  return response.data;
}

// Generic API request handler with authentication and retry logic
async function makeAuthedRequest(url, options = {}) {
  try {
    if (isSessionExpired()) {
      console.log('[API] Session expired or missing. Reauthenticating.');
      await authenticateIRacing();
    }

    const response = await axios({
      url,
      headers: { Cookie: iracingSession.cookie },
      ...options
    });

    return handleLinkedResponse(response);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('[API] Unauthorized. Reauthenticating.');
      await authenticateIRacing();
      return makeAuthedRequest(url, options);
    }
    throw error;
  }
}

module.exports = {
  authenticateIRacing,
  fetchLicenseData,
  fetchCarInfo,
  fetchLastRaceResults,
  fetchMemberInfo,
  fetchSeriesInfo,
  getGroupNameByLicenseId,
  isSessionExpired,
  makeAuthedRequest,
  iracingSession
};