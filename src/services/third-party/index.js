const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

class ThirdPartyService {
  constructor() {}
  async fetchUniPoolsGraph(url, input1, input2) {
    try {
        const response = await axios.post(
          url,
          {
            query: `
                query {
                    pools(where: { token0: "${input1}", token1: "${input2}" }, orderBy: volumeUSD, orderDirection: desc) {
                        collectedFeesUSD
                        feeTier
                        liquidity
                        liquidityProviderCount
                        totalValueLockedUSD
                        totalValueLockedToken1
                        totalValueLockedToken0
                        txCount
                        volumeUSD
                        feesUSD
                    }
                }
            `,
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
          }
        );
    
        if (response.data && response.data.errors) {
          throw new Error(`GraphQL Errors: ${JSON.stringify(response.data.errors)}`);
        }
        console.log(response.data.data.pools)
    
        return response.data && response.data.data && response.data.data.pools;
      } catch (error) {
        throw new Error(`GraphQL request failed: ${error.message}`);
      }
  }

  async fetchUniTokens(url, input1) {
    try {
        const response = await axios.post(
          url,
          {
            query: `
                query {
                    tokens(where: { symbol: "${input1}" }, orderBy: totalValueLockedUSD, orderDirection: desc) {
                        id
                        symbol
                        name
                        decimals
                        totalSupply
                        volume
                        volumeUSD
                        untrackedVolumeUSD
                        feesUSD
                        txCount
                        poolCount
                        totalValueLocked
                        totalValueLockedUSD
                    }
                }
            `,
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
          }
        );
    
        if (response.data && response.data.errors) {
          throw new Error(`GraphQL Errors: ${JSON.stringify(response.data.errors)}`);
        }
        console.log(response.data.data.tokens)
    
        return response.data && response.data.data && response.data.data.tokens;
      } catch (error) {
        throw new Error(`GraphQL request failed: ${error.message}`);
      }
  }

  async aavev2(category, input1, input2) {
    console.log(category, input1, input2)
    return [];
  }

  async uniswapv3(category, input1, input2) {
    let data = [];
    if (category === 'markets') {
        data = await this.fetchUniPoolsGraph(process.env.UNISWAP_SUBGRAPH_URL, input1, input2);
    } else if (category === 'tokens') {
        data = await this.fetchUniTokens(process.env.UNISWAP_SUBGRAPH_URL, input1);
        console.log(data);
    }
    return data;
  }

  async uniswap({ graphType, category, input1, input2 }) {
    if (graphType === 'v3') {
        return this.uniswapv3(category, input1, input2);
    }
    if (graphType === 'v3-raw') {
        return this.uniswapv3(category, input1, input2);
    }
    return [];
  }

  async aave({ graphType, category, input1, input2 }) {
    if (graphType === 'v2') {
        return this.aavev2(category, input1, input2);
    }
    if (graphType === 'v2-raw') {
        return this.aavev2(category, input1, input2);
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
