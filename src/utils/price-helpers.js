const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();    
  
const cachedValidSymbols = new Map()

const SUPPORTED_CHAINS = new Map()

 const normaliseString = (string) => string.replace(/\s+/g, "")

 async function getSupportedChain(){
    if(SUPPORTED_CHAINS.size){
        return SUPPORTED_CHAINS
    }

    const url = 'https://api.sim.dune.com/v1/evm/supported-chains'
    const response = await axios(url, {
        headers: {
            'X-Sim-Api-Key': process.env.DUNE_SIM_API_KEY
        }
    })
    const { data } = response

    data.chains.forEach((item) => {
        SUPPORTED_CHAINS.set(item.name, { chainId: item.chain_id })
    })

    return SUPPORTED_CHAINS
  }

  async function getValidChainIds(chain){

    const CHAIN_IDs = await getSupportedChain()
    const normalisedChain = normaliseString(chain)

    return normalisedChain
    .split(',')
    .map((name) => {
      const key = name;
      const record = CHAIN_IDs.get(key);
      if (!record) throw new Error(`Unknown chain name: "${key}"`);
      return record.chainId;
    })
    .join(',');
  }

  async function getDuneSimTokenInfo (tokenAddress, chain, time) {
    try {
          const chainId = await getValidChainIds(chain)
          let url = `https://api.sim.dune.com/v1/evm/token-info/${tokenAddress}?chain_ids=${chainId}`
          if(time){
            url += `&historical_prices=${time}`
          }
          const response = await axios(url, {
            headers: {
              "X-Sim-Api-Key": process.env.DUNE_SIM_API_KEY
            }
          })
      
          const data = response.data.tokens 

          if(time){
      
          for(let item of data){
              const prices = item.historical_prices
              prices.forEach((priceData) => {
                const key = "price_in_" + priceData.offset_hours +"h"
                const price = priceData.price_usd 
                item[key] = price
                delete item['historical_prices']
              })
          }
          }

          return data 
    } catch (error) {
      throw new Error(error?.response?.data?.message || error.message || 'Unexpected Error')
    }
  }
  async function getCoingeckoValidSymbols() {

    try {
      if(cachedValidSymbols.size){
        return cachedValidSymbols
      }
      const response = await axios(`https://pro-api.coingecko.com/api/v3/coins/list`, {
        headers: {
          'x-cg-pro-api-key': process.env.COINGECKO_API_KEY
        }
      })

      const data = response.data
      const validSymbolsMap = new Map();

      data.forEach((item) => {
        const {symbol, id} = item
        if(symbol){
          validSymbolsMap.set(symbol, {id, symbol})
        }
        if(id){
          validSymbolsMap.set(id, {id, symbol})
        }
      })
      cachedValidSymbols = validSymbolsMap
      return validSymbolsMap
    } catch (error) {
        throw new Error(error?.response?.data?.status?.error_message || error.message)
    }

  }
  async function validateCurrencySymbol(coin){
      const coinQueryList = coin.split(',')
      const validSymbols = await getCoingeckoValidSymbols()
      const invalidCoinSymbols = coinQueryList.filter((id) => !validSymbols.get(id))
      return invalidCoinSymbols
  }

  function getDateFromTimeAgo(time){
      const now = new Date();

  return time
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((hoursStr) => {
      const hours = Number(hoursStr);
      if (isNaN(hours)) {
        throw new Error(`Invalid number: "${hoursStr}"`);
      }
      const date = new Date(now.getTime() - hours * 60 * 60 * 1000);
      return date.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
    });
  }

  function currentDate(){
    const now = new Date();
    return now.toISOString().slice(0, 16);  
  }


  async function getCoingeckoHistoricalDataById (symbol, date) {
    return { price: 8498989989, time: date, coin: symbol }

    // try {
    //       const id = this.cachedValidSymbols.get(symbol).id
    
    //       if(!id){
    //         new Error('Invalid coin id')
    //       }
    //       const url = `https://pro-api.coingecko.com/api/v3/coins/${id}/history?date=${date}&localization=false`;
    
    //       const response = await axios(url, {
    //         headers: {
    //           'x-cg-pro-api-key': process.env.COINGECKO_API_KEY
    //         }
    //       })


    //       const data = response.data

    //       const {market_data} = data

    //       const priceInUsd = market_data.usd

    //       return { price: priceInUsd, time: date, coin: id }
    // } catch (error) {
    //    throw new Error(error?.response?.data?.status?.error_message || error.message)
    // }

  }


module.exports = {
    getCoingeckoHistoricalDataById,
    currentDate,
    getDateFromTimeAgo,
    validateCurrencySymbol,
    getCoingeckoHistoricalDataById,
    getDuneSimTokenInfo,
    getValidChainIds,
    normaliseString
}