const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();  
  
  async function getBalanceViaDune(address, chains, time){
    try {
          let url = `https://api.sim.dune.com/v1/evm/balances/${address}?chain_ids=${chains}`
          if (time) {
              url += `&historical_prices=${encodeURIComponent(time)}`
          }
          const response = await axios(url, {
            headers: { "X-Sim-Api-Key": process.env.DUNE_SIM_API_KEY }
          })
          const { balances } = response.data

          if(time){
            for(let bal of balances){
                bal['wallet_address'] = address
                if(!bal.historical_prices) continue
                for(let history of bal.historical_prices){
                const key = "price_in_" + history.offset_hours +"h"
                const price = bal.price_usd 
                bal[key] = price
                }
                delete bal['historical_prices']
            }
          }


          return balances
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
      const start = now - time * 3600
      const end = now
      const [startBlock, endBlock] = await Promise.all([
        getBlockNumber(start, chainId),
        getBlockNumber(end, chainId)
      ])
      return { startBlock, endBlock }
    }

  }
  async function getEthersScanTxList(addresses, time, chainId){
    const {startBlock, endBlock} = time

    const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=account&action=txlist&address=${addresses}&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${process.env.ETHERSCAN}`


    const response = await axios(url)

    const { result } = response.data
    if(response.data.status !== "1"){
        throw new Error(result || response.data.message)
    }
    return result

  }


module.exports = {
    getBalanceViaDune,
    getBlocksNumberByTimeAgo,
    getEthersScanTxList
}