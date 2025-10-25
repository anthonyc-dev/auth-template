const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function testRefreshToken() {
  try {
    console.log("🧪 Testing Refresh Token Flow...\n");

    // Step 1: Login to get tokens
    console.log("1. Logging in...");
    const loginResponse = await axios.post(
      `${BASE_URL}/auth/login`,
      {
        email: "test1@gmail.com", // Replace with actual email
        password: "Test@123", // Replace with actual password
      },
      {
        withCredentials: true,
      }
    );

    console.log("✅ Login successful");
    console.log(
      "Access Token:",
      loginResponse.data.accessToken ? "Present" : "Missing"
    );
    console.log(
      "Cookies:",
      loginResponse.headers["set-cookie"] ? "Present" : "Missing"
    );

    // Step 2: Test debug cookies endpoint
    console.log("\n2. Testing debug cookies endpoint...");
    const debugResponse = await axios.get(`${BASE_URL}/auth/debug-cookies`, {
      withCredentials: true,
      headers: {
        Cookie: loginResponse.headers["set-cookie"]?.join("; ") || "",
      },
    });

    console.log("✅ Debug endpoint response:");
    console.log(JSON.stringify(debugResponse.data, null, 2));

    // Step 3: Test refresh token
    console.log("\n3. Testing refresh token...");
    const refreshResponse = await axios.post(
      `${BASE_URL}/auth/refresh-token`,
      {},
      {
        withCredentials: true,
        headers: {
          Cookie: loginResponse.headers["set-cookie"]?.join("; ") || "",
        },
      }
    );

    console.log("✅ Refresh token successful");
    console.log(
      "New Access Token:",
      refreshResponse.data.accessToken ? "Present" : "Missing"
    );
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    console.error("Status:", error.response?.status);
    console.error("Headers:", error.response?.headers);
  }
}

// Run the test
testRefreshToken();
