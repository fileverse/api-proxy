const axios = require('axios');
const dotenv = require('dotenv');
const { TALLY_QUERY, TALLY_PROPOSAL_QUERY } = require('../../constants/index.js')
const { flattenObject } = require('../../utils/flattenObject.js');
const { formatQuorum } = require('../../utils/formatQuorum.js');
const {
    getDateFromTimeAgo,
    getCoingeckoHistoricalDataById,
    getDuneSimTokenInfo,
    getValidChainIds,
    currentDate,
    normaliseString,
    validateCurrencySymbol
} = require('../../utils/price-helpers.js')

const {
    getBalanceViaDune,
    getBlocksNumberByTimeAgo,
    getEthersScanTxList
} = require('../../utils/wallet-helpers.js')
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

  async fetchAavePoolsGraph(url, input1, input2) {
    try {
        const response = await axios.post(
          url,
          {
            query: `
              query {
                markets(where: { inputToken: "${input1}" }, orderBy: totalValueLockedUSD, orderDirection: desc) {
                  _vToken {
                    id
                    name
                    symbol
                  }
                  id
                  name
                  isActive
                  canBorrowFrom
                  canIsolate
                  maximumLTV
                  canUseAsCollateral
                  liquidationThreshold
                  liquidationPenalty
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
        console.log(response.data.data.markets)
    
        const { markets } = response.data && response.data.data;
        const data = markets.map(market => {
            return {
                id: market.id,
                name: market.name,
                isActive: market.isActive,
                tokenName: market._vToken.name,
                tokenSymbol: market._vToken.symbol,
                canBorrowFrom: market.canBorrowFrom,
                canUseAsCollateral: market.canUseAsCollateral,
                maximumLTV: market.maximumLTV,
                totalValueLockedUSD: market.totalValueLockedUSD,
                canIsolate: market.canIsolate,
                liquidationThreshold: market.liquidationThreshold,
                liquidationPenalty: market.liquidationPenalty,
            }
        })
        return data;
      } catch (error) {
        throw new Error(`GraphQL request failed: ${error.message}`);
      }
  }

  async fetchAaveTokens(url, input1) {
    try {
        const response = await axios.post(
          url,
          {
            query: `
              query {
                tokens(where: { symbol: "${input1}" }, orderBy: lastPriceUSD, orderDirection: desc) {
                  id
                  name
                  symbol
                  decimals
                  lastPriceBlockNumber
                  lastPriceUSD
                  type
                  _market {
                    id
                    protocol {
                      id
                      name
                    }
                    name
                    isActive
                  }
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
   
        const { tokens } = response.data && response.data.data;
        const data = tokens.map(token => {
            return {
                id: token.id,
                name: token.name,
                symbol: token.symbol,
                decimals: token.decimals,
                lastPriceUSD: token.lastPriceUSD,
                lastPriceBlockNumber: token.lastPriceBlockNumber,
                type: token.type,
                marketId: token._market.id,
                marketName: token._market.name,
                marketIsActive: token._market.isActive,
                marketProtocolId: token._market.protocol.id,
                marketProtocolName: token._market.protocol.name,
            }
        })
        return data;
      } catch (error) {
        throw new Error(`GraphQL request failed: ${error.message}`);
      }
  }


  async fetchTallyOrg(slug) {
    const variables = {input: {slug}}
    try {
      const response = await axios.post('https://api.tally.xyz/query', {
        query: TALLY_QUERY ,
        variables,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': process.env.TALLY_API_KEY
        }
      })
      return response.data.data

    } catch (error) {
      throw new Error(`GraphQL request failed: ${error.message}`);
    }
  }
  async fetchProposals(orgId) {
    const variables = {input: { filters: { organizationId: orgId } }}
    try {
      const response = await axios.post('https://api.tally.xyz/query', {
        query: TALLY_PROPOSAL_QUERY,
        variables,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': process.env.TALLY_API_KEY
        }
      })
      const proposalNodes = response.data.data?.proposals?.nodes

      if(proposalNodes){
        return proposalNodes.map((proposal) => {
          if(proposal.quorum){
            proposal.quorum = formatQuorum(proposal.quorum, proposal.governor?.token?.decimals);
          }
          if(proposal.voteStats.length > 0){
              // sum stats for "for" and "abstain" votes
              // abstain is included if countingMode is "quorum=for,abstain"
              const includeAbstain = /quorum=for,abstain/i.test(
                proposal.governor?.parameters?.countingMode || ""
              );
              const decimals = proposal.governor?.token?.decimals
              const initalReducerValue = decimals ? 0n : 0;

              const votes = proposal.voteStats
              .filter(stat => stat.type === "for" || (includeAbstain && stat.type === "abstain"))
              .reduce((sum, x) => {
                const value = decimals ? BigInt(x.votesCount ?? 0) : Number(x.votesCount) ?? 0
                return sum + value
              }, initalReducerValue);
              proposal.voteStats = formatQuorum(votes, proposal.governor?.token?.decimals);
          }
          delete proposal.governor;
          return flattenObject(proposal)
        })
      }
      return []
    } catch (error) {
      throw new Error(`GraphQL request failed: ${error.message}`);
    }
  }

  async aavev2(category, input1, input2) {
    let data = [];
    if (category === 'markets') {
        data = await this.fetchAavePoolsGraph(process.env.AAVE_SUBGRAPH_URL, input1, input2);
    } else if (category === 'tokens') {
        data = await this.fetchAaveTokens(process.env.AAVE_SUBGRAPH_URL, input1);
    }
    return data;
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
  async tally(operationName, slug){
    if(operationName === 'organization'){
      const response =  await this.fetchTallyOrg(slug)
      if(response?.organization){
        return [flattenObject(response?.organization)]
      }
      return []
    }

    if(['proposal', 'proposals' ].includes(operationName)){
      const response =  await this.fetchTallyOrg(slug)
      if(response?.organization){
        const orgId = response.organization.id
        return await this.fetchProposals(orgId)
      }
      return []
    }

    return []
  }



  async price(params){
    let { coin, time, token, chain } = params

    if(token){
      if(!chain){
        throw new Error('chain is required for querying token price')
      }
      const data = await getDuneSimTokenInfo(token, chain, time)
      return data
    }

    if(coin) {

      const invalidSymbols = await validateCurrencySymbol(coin)
      

      if(invalidSymbols.length){
        throw new Error(`Invalid symbols: ${invalidSymbols?.join(',') || 'undefined'}`) 
      }

      if(time){
        time = getDateFromTimeAgo(time)
      } else {
        time = [currentDate()]
      }
      const result =  []
      const symbols = coin.split(',')

      for(const symbol of symbols){
        for(let date of time){
          const data = await getCoingeckoHistoricalDataById(symbol, date)
          result.push(data)
        }

      }
      return result
    }
    throw new Error('Invalid Request')
  }

  async wallet(params){
    let { query, addresses, chains, time } = params
    const validChains = await getValidChainIds(chains)
    if(query === 'balance'){
      const data = []
      addresses = normaliseString(addresses)
      const addressesList = addresses.split(',')

      for(const address of addressesList){
        const result = await getBalanceViaDune(address, validChains, time)
        data.push(...result)
      }

      return data
    } else if(query === 'txns'){
      const data = []
      const timeFrames = time?.split(',')
      if(!timeFrames?.length){
        const chainList = validChains.split(',')
        for(let chainId of chainList){
          const { startBlock, endBlock } = await getBlocksNumberByTimeAgo('latest', chainId)
          const result = await getEthersScanTxList(addresses, { startBlock, endBlock }, chainId)
          data.push(...result)
        }
      } else {
        for(const timeFrame of timeFrames){
          const chainList = validChains.split(',')
          for(let chainItem of chainList){
            const { startBlock, endBlock } = await getBlocksNumberByTimeAgo(timeFrame, chainItem)
            const result = await getEthersScanTxList(addresses, { startBlock, endBlock }, chainItem)
            for(let resultData of result){
              data.push({chain: chainItem, ...resultData})
            }
          }
        }
      }

      return data
    }
  }

  async handler({ service, graphType, category, input1, input2, ...rest }) {
    if(service === 'price'){
      try {
              return  {
                status: 200,
                data: await this.price(rest),
              }
      } catch (error) {
        return {
                status: 400,
                data: {
                  message: error.message || 'An Unexpected error occurred'
                }
              }
      }
    }
    if(service === 'wallet'){
        try {
          return {
            status: 200,
            data: await this.wallet(rest),
          }
        } catch (error) {
            return {
              status: 400,
              data: {
                message: error.message || 'An Unexpected error occurred'
              }
            }
        }
    }
    if(service === 'tally'){
      return {
        status: 200,
        data: await this.tally(input1, input2),
      };
    }
    if (!category || !graphType) {
      return {
        data: { error: 'graphType and category are required' }, 
        status: 400
      };
    }    
    
    let data = [];
    if (service === 'uniswap') {
        data = await this.uniswap({ graphType, category, input1, input2 });
    } else if (service === 'aave') {
        data = await this.aave({ graphType, category, input1, input2 });
    }
    
    return {
      status: 200,
      data: data,
    };
  }
}

module.exports = new ThirdPartyService();
