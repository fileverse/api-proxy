const axios = require('axios');
const dotenv = require('dotenv');
const { normaliseString } = require('../utils/price-helpers');
const { formatTimestamp, usdFormatter, numberFormatter, formatByDecimals } = require('./formatters');
dotenv.config();  
  
  async function getBalanceViaDune(address, chains, time){
    try {
          let url = `https://api.sim.dune.com/v1/evm/balances/${address}?chain_ids=${chains}`

          if (time) {
              url += `&historical_prices=${time}`
          }
          const response = await axios(url, {
            headers: { "X-Sim-Api-Key": process.env.DUNE_SIM_API_KEY }
          })
          const { balances } = response.data

          const result = balances.map((bal) => {
            const returnValue = {}
            returnValue.wallet_address = address
            returnValue.name = bal.name
            returnValue.chain = bal.chain
            returnValue.token_balance = `${formatByDecimals(bal.amount, bal.decimals)} ${bal.symbol}`
            returnValue.balance_usd = usdFormatter.format(bal.value_usd)
            returnValue.price_usd = usdFormatter.format(bal.price_usd)
            returnValue.token_address = bal.address
            returnValue.pool_size = `${numberFormatter.format(bal.pool_size)} ${bal.symbol}`
            returnValue.low_liquidity = bal.low_liquidity
            return returnValue
          })


          return result
    } catch (error) {
          throw new Error(error?.response?.data?.message || error.message || 'Unexpected Error')
    }
  }

  async function getBlockNumber(time, chainId){
    time = Math.floor(time / 1000)
      const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=block&action=getblocknobytime&timestamp=${time}&closest=before&apikey=${process.env.ETHERSCAN}`

      const response = await axios(url)

      const { data } = response

      return data.result
  }

  async function getBlocksNumberByTimeAgo (time, chainId) {
    if(time === 'latest'){
      const data = await getBlockNumber(Date.now(), chainId)
      return { startBlock: data, endBlock: data}
    }
    else {
      const now = Date.now()
      const start = now - time * 3600 * 1000
      const end = now
      const [startBlock, endBlock] = await Promise.all([
        getBlockNumber(start, chainId),
        getBlockNumber(end, chainId)
      ])
      return { startBlock, endBlock }
    }

  }
  async function getEthersScanTxList(addresses, time, chainId){
    const { startBlock, endBlock } = time

    const normalizedAddresses = normaliseString(addresses)

    const addressList = normalizedAddresses.split(',')
    const data = []

    for(let address of addressList){
        const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${process.env.ETHERSCAN}&offset=100&page=1`
        const response = await axios(url)
        const { result } = response.data
        const resultData = result || []
        if(!Array.isArray(resultData)){
          throw new Error(result)
        }
        const values = resultData.map((item) =>  {
          const timeStamp = item.timeStamp ? formatTimestamp(item.timeStamp) : null
          return {
            ...item,
            timeStamp
          }
        })
        data.push(...values)
    }
    return data

  }


module.exports = {
    getBalanceViaDune,
    getBlocksNumberByTimeAgo,
    getEthersScanTxList
}