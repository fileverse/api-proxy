class ThirdPartyService {
  constructor() {}

  async uniswap({ category, input1, input2 }) {
    if (category === 'v3') {
        console.log(category, input1, input2);
    }
    if (category === 'v3-raw') {
        console.log(category, input1, input2);      
    }
    return [{ id: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" }];
  }

  async aave({ category, input1, input2 }) {
    if (category === 'v2') {
        console.log(category, input1, input2);
    }
    if (category === 'v2-raw') {
        console.log(category, input1, input2);      
    }
    return [{ id: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" }];
  }

  async handler({ service, category, input1, input2 }) {
    let data = [];
    if (service === 'uniswap') {
        data = await this.uniswap({ category, input1, input2 });
    }
    if (service === 'aave') {
        data = await this.aave({ category, input1, input2 });
    }
    return {
      status: 200,
      data: data,
    };
  }
}

module.exports = new ThirdPartyService();
