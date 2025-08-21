const axios = require("axios");
const ProxyService = require("../src/services/proxy");

jest.mock("axios");
const mockedAxios = axios;

describe("ProxyService", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = {
      ...originalEnv,
      COINGECKO_API_KEY: "test-coingecko-key",
      ETHERSCAN_API_KEY: "test-etherscan-key",
      BASESCAN_API_KEY: "test-basescan-key",
      GNOSISSCAN_API_KEY: "test-gnosisscan-key",
      FIREFLY_API_KEY: "test-firefly-key",
      NEYNAR_API_KEY: "test-neynar-key",
      SAFE_API_KEY: "test-safe-key",
      DUNE_SIM_API_KEY: "test-dune-key",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("getParsedURL", () => {
    it("should parse valid URL correctly", () => {
      const result = ProxyService.getParsedURL(
        "https://api.coingecko.com/api/v3/ping"
      );
      expect(result).toBeInstanceOf(URL);
      expect(result.origin).toBe("https://api.coingecko.com");
    });

    it("should return null for invalid URL", () => {
      const result = ProxyService.getParsedURL("invalid-url");
      expect(result).toBeNull();
    });
  });

  describe("handler", () => {
    it("should prevent API key leaks by rejecting malformed URLs that could expose sensitive data", async () => {
      // URLs that will actually fail URL constructor parsing
      const malformedUrls = [
        "not-a-url-at-all",
        "://missing-protocol",
        "http://",
        "malformed url with spaces",
        "just plain text",
      ];

      for (const malformedUrl of malformedUrls) {
        const result = await ProxyService.handler(malformedUrl, "GET");
        expect(result).toEqual({
          status: 400,
          headers: {},
          data: { error: "Invalid URL" },
        });

        // Critical: No network calls should be made with malformed URLs
        expect(mockedAxios).not.toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    it("should handle null and undefined URLs safely without API key exposure", async () => {
      const invalidInputs = [null, undefined, ""];

      for (const input of invalidInputs) {
        const result = await ProxyService.handler(input, "GET");
        expect(result).toEqual({
          status: 400,
          headers: {},
          data: { error: "Invalid URL" },
        });

        // Critical: No network calls should be made with invalid inputs
        expect(mockedAxios).not.toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    it("should protect API keys by only allowing requests to whitelisted domains", async () => {
      const mockResponse = {
        status: 200,
        headers: { "content-type": "application/json" },
        data: { message: "success" },
      };
      mockedAxios.mockResolvedValue(mockResponse);

      // Test that non-whitelisted domains don't get API keys injected
      const unauthorizedDomains = [
        "https://malicious-site.com/api/coingecko-proxy",
        "https://evil.com/steal?api=coingecko",
        "https://phishing-coingecko.com/api/v3/ping",
        "https://fake-etherscan.io/api",
        "https://attacker.com/proxy/etherscan",
      ];

      for (const domain of unauthorizedDomains) {
        await ProxyService.handler(domain, "GET");

        // Verify the request was forwarded without any API keys
        expect(mockedAxios).toHaveBeenCalledWith({
          method: "GET",
          url: domain,
          validateStatus: expect.any(Function),
        });

        // Critical: Ensure no API keys were added to headers or URL
        const lastCall =
          mockedAxios.mock.calls[mockedAxios.mock.calls.length - 1][0];
        expect(lastCall.headers).toBeUndefined();
        expect(lastCall.url).not.toContain("apiKey=");
        expect(lastCall.url).not.toContain("api-key");
        expect(lastCall.url).not.toContain("x-cg-demo-api-key");
        expect(lastCall.url).not.toContain("test-coingecko-key");
        expect(lastCall.url).not.toContain("test-etherscan-key");

        jest.clearAllMocks();
      }
    });

    it("should prevent dangerous protocols from being processed with API keys", async () => {
      const mockResponse = {
        status: 200,
        headers: { "content-type": "application/json" },
        data: { message: "forwarded" },
      };
      mockedAxios.mockResolvedValue(mockResponse);

      // These are valid URLs but dangerous protocols that should never get API keys
      const dangerousUrls = [
        "file:///etc/passwd",
        "ftp://malicious.com/steal-keys",
        "javascript:alert('xss')",
        "data:text/html,<script>alert('xss')</script>",
      ];

      for (const dangerousUrl of dangerousUrls) {
        await ProxyService.handler(dangerousUrl, "GET");

        // These get forwarded but without any API keys
        expect(mockedAxios).toHaveBeenCalledWith({
          method: "GET",
          url: dangerousUrl,
          validateStatus: expect.any(Function),
        });

        // Critical: No API keys should be injected for dangerous protocols
        const lastCall =
          mockedAxios.mock.calls[mockedAxios.mock.calls.length - 1][0];
        expect(lastCall.headers).toBeUndefined();

        jest.clearAllMocks();
      }
    });

    it("should forward request for non-allowed domains", async () => {
      const mockResponse = {
        status: 200,
        headers: { "content-type": "application/json" },
        data: { message: "success" },
      };
      mockedAxios.mockResolvedValue(mockResponse);

      const result = await ProxyService.handler(
        "https://example.com/api",
        "GET"
      );

      expect(mockedAxios).toHaveBeenCalledWith({
        method: "GET",
        url: "https://example.com/api",
        validateStatus: expect.any(Function),
      });
      expect(result).toEqual({
        status: 200,
        headers: { "content-type": "application/json" },
        data: { message: "success" },
      });
    });

    it("should inject API keys only for legitimate whitelisted domains", async () => {
      const mockResponse = {
        status: 200,
        headers: { "content-type": "application/json" },
        data: { success: true },
      };
      mockedAxios.mockResolvedValue(mockResponse);

      // Test legitimate domains get proper API key injection
      const legitimateRequests = [
        {
          url: "https://api.coingecko.com/api/v3/ping",
          expectedHeader: "x-cg-demo-api-key",
          expectedValue: "test-coingecko-key",
        },
        {
          url: "https://api.etherscan.io/api?module=account",
          expectedInUrl: "apiKey=test-etherscan-key",
        },
        {
          url: "https://api.neynar.com/v2/farcaster/user",
          expectedHeader: "x-api-key",
          expectedValue: "test-neynar-key",
        },
      ];

      for (const request of legitimateRequests) {
        await ProxyService.handler(request.url, "GET");

        const lastCall =
          mockedAxios.mock.calls[mockedAxios.mock.calls.length - 1][0];

        if (request.expectedHeader) {
          expect(lastCall.headers[request.expectedHeader]).toBe(
            request.expectedValue
          );
        }

        if (request.expectedInUrl) {
          expect(lastCall.url).toContain(request.expectedInUrl);
        }

        jest.clearAllMocks();
      }
    });
  });
});
