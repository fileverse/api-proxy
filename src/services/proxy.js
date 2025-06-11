const axios = require('axios');

class ProxyService {
  async forwardRequest(targetUrl, method, headers, body) {
    try {
      // Remove proxy-specific headers
      const cleanHeaders = { ...headers };
      delete cleanHeaders.host;
      delete cleanHeaders['content-length'];
      delete cleanHeaders['target-url'];

      const response = await axios({
        method,
        url: targetUrl,
        headers: cleanHeaders,
        data: body,
        validateStatus: () => true // Accept all status codes
      });

      return {
        status: response.status,
        headers: response.headers,
        data: response.data
      };
    } catch (error) {
      console.error('Proxy forward error:', error);
      throw new Error('Failed to forward request to target API');
    }
  }
}

module.exports = new ProxyService(); 