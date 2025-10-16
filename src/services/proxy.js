const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const ALLOWED_DOMAINS = [
  "https://api.coingecko.com",
  "https://api.etherscan.io",
  "https://api.basescan.org",
  "https://api.gnosisscan.io",
  "https://openapi.firefly.land",
  "https://api.neynar.com",
  "https://api.safe.global",
  "https://api.sim.dune.com",
];

class ProxyService {
  async handler(targetUrl, method, headers, body) {
    const parsedURL = this.getParsedURL(targetUrl);
    if (!parsedURL) {
      return {
        status: 400,
        headers: {},
        data: {
          error: "Invalid URL",
        },
      };
    }

    if (!ALLOWED_DOMAINS.includes(parsedURL.origin)) {
      return this.forwardRequest(targetUrl, method);
    }

    if (targetUrl.includes("https://api.coingecko.com")) {
      return this.coingecko(targetUrl, method);
    }
    if (targetUrl.includes("https://api.etherscan.io")) {
      return this.etherscan(targetUrl, method);
    }
    if (targetUrl.includes("https://api.basescan.org")) {
      return this.basescan(targetUrl, method);
    }
    if (targetUrl.includes("https://api.gnosisscan.io")) {
      return this.gnosisscan(targetUrl, method);
    }
    if (targetUrl.includes("https://openapi.firefly.land")) {
      return this.firefly(targetUrl, method);
    }
    if (targetUrl.includes("https://api.neynar.com")) {
      return this.neynar(targetUrl, method);
    }
    if (targetUrl.includes("https://api.safe.global")) {
      return this.safe(targetUrl, method);
    }
    if (targetUrl.includes("https://api.sim.dune.com")) {
      return this.dunesim(targetUrl, method);
    }
    return {
      status: 400,
      headers: {},
      data: {
        error: "Invalid Request",
      },
    };
  }

  async coingecko(targetUrl, method, headers, body) {
    const _headers = {
      ...headers,
    };
    if (process.env.COINGECKO_KEY_TYPE === "pro") {
      headers["x_cg_pro_api_key"] = process.env.COINGECKO_API_KEY;
    } else {
      headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
    }
    const response = await axios({
      method,
      url: targetUrl,
      headers: _headers,
      data: body,
    });
    return {
      status: response.status,
      headers: response.headers,
      data: response.data,
    };
  }

  async etherscan(targetUrl, method) {
    const response = await axios({
      method,
      url: `${targetUrl}&apiKey=${process.env.ETHERSCAN_API_KEY}`,
    });
    return {
      status: response.status,
      headers: response.headers,
      data: response.data,
    };
  }

  async basescan(targetUrl, method) {
    const response = await axios({
      method,
      url: `${targetUrl}&apiKey=${process.env.BASESCAN_API_KEY}`,
    });
    return {
      status: response.status,
      headers: response.headers,
      data: response.data,
    };
  }

  async gnosisscan(targetUrl, method) {
    const response = await axios({
      method,
      url: `${targetUrl}&apiKey=${process.env.GNOSISSCAN_API_KEY}`,
    });
    return {
      status: response.status,
      headers: response.headers,
      data: response.data,
    };
  }

  async firefly(targetUrl, method) {
    const response = await axios({
      method,
      url: `${targetUrl}`,
      headers: {
        "x-api-key": process.env.FIREFLY_API_KEY,
      },
    });
    return {
      status: response.status,
      headers: response.headers,
      data: response.data,
    };
  }

  async dunesim(targetUrl, method) {
    try {
      const response = await axios({
        method,
        url: `${targetUrl}`,
        headers: {
          "X-Sim-Api-Key": process.env.DUNE_SIM_API_KEY,
        },
      });
      return {
        status: response.status,
        headers: response.headers,
        data: response.data,
      };
    } catch (error) {
      return {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data,
      };
    }
  }

  async neynar(targetUrl, method) {
    const response = await axios({
      method,
      url: `${targetUrl}`,
      headers: {
        "x-api-key": process.env.NEYNAR_API_KEY,
      },
    });
    return {
      status: response.status,
      headers: response.headers,
      data: response.data,
    };
  }
  async safe(targetUrl, method) {
    const response = await axios({
      method,
      url: targetUrl,
      headers: {
        Authorization: `Bearer ${process.env.SAFE_API_KEY}`,
      },
    });
    return {
      status: response.status,
      data: response.data,
    };
  }

  async forwardRequest(targetUrl, method) {
    try {
      const response = await axios({
        method,
        url: targetUrl,
        validateStatus: () => true,
      });
      return {
        status: response.status,
        headers: response.headers,
        data: response.data,
      };
    } catch (error) {
      console.error("Proxy forward error:", error);
      throw new Error("Failed to forward request to target API");
    }
  }

  getParsedURL(targetUrl) {
    try {
      return new URL(targetUrl);
    } catch (err) {
      console.log("Invalid URL:", targetUrl);
      return null;
    }
  }
}

module.exports = new ProxyService();
