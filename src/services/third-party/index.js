class ThirdPartyService {
  constructor() {}

  async uniswap({ graphType, category, input1, input2 }) {
    if (graphType === 'v3') {
        console.log(category, input1, input2);
    }
    if (graphType === 'v3-raw') {
        console.log(category, input1, input2);      
    }
    return [];
  }

  async aave({ graphType, category, input1, input2 }) {
    if (graphType === 'v2') {
        console.log(graphType, category, input1, input2);
    }
    if (graphType === 'v2-raw') {
        console.log(graphType, category, input1, input2);
    }
    return [];
  }

  async handler({ service, graphType, category, input1, input2 }) {
    console.log(service, graphType, category, input1, input2);
    let data = [];
    if (service === 'uniswap') {
        data = await this.uniswap({ graphType, category, input1, input2 });
    }
    if (service === 'aave') {
        data = await this.aave({ graphType, category, input1, input2 });
    }
    console.log(data);
    return {
      status: 200,
      data: data,
    };
  }
}

module.exports = new ThirdPartyService();
