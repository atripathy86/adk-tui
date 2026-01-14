import { adkClient } from "./src/sdk/client";

async function test() {
  console.log("Testing ADK Client connection...");
  try {
    const apps = await adkClient.listApps();
    console.log("Successfully fetched apps:", apps);
  } catch (e) {
    console.error("Failed to fetch apps:", e);
  }
}

test();
