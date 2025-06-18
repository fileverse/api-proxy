const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

class RateLimit {
  constructor() {
    this.rateLimit = 1000;
    this.resetTime = 1000;
  }
}

class ProxyService {
  async handler(targetUrl, method, headers, body) {
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
    return this.forwardRequest(targetUrl, method, headers, body);
  }

  async coingecko(targetUrl, method, headers, body) {
    const response = await axios({
      method,
      url: targetUrl,
      headers: {
        ...headers,
        "x-cg-demo-api-key": process.env.COINGECKO_API_KEY,
      },
      data: body,
    });
    return {
      status: response.status,
      headers: response.headers,
      data: response.data,
    };
  }

  async etherscan(targetUrl, method) {
    console.log("targetUrl", targetUrl);
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
        "Authorization": `Bearer ${process.env.SAFE_API_KEY}`,
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
}

module.exports = new ProxyService();
