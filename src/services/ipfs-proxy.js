const dotenv = require("dotenv");

dotenv.config();

const ALLOWED_SOURCE_APPS_MAP = {
  ddoc: "ddoc",
  dsheet: "dsheet",
};

const validateSourceApp = (sourceApp) => {
  if (!ALLOWED_SOURCE_APPS_MAP[sourceApp])
    throw new Error("Source app is not allowed");
};

const getAllowedGatewayUrls = (sourceApp) => {
  if (sourceApp === ALLOWED_SOURCE_APPS_MAP.ddoc) {
    return process.env.ALLOWED_DDOCS_GATEWAY.split(",");
  }
  if (sourceApp === ALLOWED_SOURCE_APPS_MAP.dsheet) {
    return process.env.ALLOWED_DSHEETS_GATEWAY.split(",");
  }
  return [];
};

const validateTargetUrl = (targetUrl, sourceApp) => {
  const parsedURL = new URL(targetUrl);
  const allowedGatewayUrls = getAllowedGatewayUrls(sourceApp);

  const ipfsHash = parsedURL.pathname.split("/").pop();
  const targetUrls = allowedGatewayUrls.map(
    (gateway) => `${gateway}/ipfs/${ipfsHash}`
  );
  return targetUrls;
};

const fetchFromMultipleUrls = async (targetUrls) => {
  for (const targetUrl of targetUrls) {
    try {
      const response = await fetch(targetUrl);
      if (response.status === 200) {
        return response;
      }
    } catch (error) {
      console.error(`Error fetching from ${targetUrl}:`, error);
    }
  }
  throw new Error("All requests failed");
};

const forwardIPFSRequest = async (targetUrl, sourceApp) => {
  validateSourceApp(sourceApp);
  const validatedTargetUrls = validateTargetUrl(targetUrl, sourceApp);

  const response = await fetchFromMultipleUrls(validatedTargetUrls);

  // Filter out problematic headers that shouldn't be forwarded
  const skipHeaders = new Set([
    "content-encoding",
    "transfer-encoding",
    "connection",
    "keep-alive",
    "upgrade",
    "proxy-authorization",
    "proxy-authenticate",
    "te",
    "trailers",
  ]);

  const headers = {};
  response.headers.forEach((value, key) => {
    if (!skipHeaders.has(key.toLowerCase())) {
      headers[key] = value;
    }
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  // For JSON, get as text to preserve encoding
  // For binary, get as buffer to preserve binary data
  const data = isJson
    ? await response.text()
    : Buffer.from(await response.arrayBuffer());

  return {
    status: response.status,
    headers: headers,
    data: data,
    isJson: isJson,
  };
};

module.exports = {
  forwardIPFSRequest,
};
