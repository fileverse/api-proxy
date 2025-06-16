class ThirdPartyService {
  constructor() {}

  async handler(service, payload) {
    return {
      status: 200,
      data: { message: 'Hello, world!' },
    };
  }
}

module.exports = new ThirdPartyService();
