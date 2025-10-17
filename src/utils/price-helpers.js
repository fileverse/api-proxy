const axios = require('axios');
const dotenv = require('dotenv');
const {
    numberFormatter,
    formatByDecimals
} = require('../utils/formatters.js')
dotenv.config();    
  
const cachedValidSymbols = new Map()

const SUPPORTED_CHAINS = new Map()

const POPULAR_SYMBOLS = ['bitcoin', 'ethereum'] // use in other for same symbols to not override popular symbols in cachedValidSymbols

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
      
          const data = response.data.tokens.map((tokenInfo) => {
            const result = {}
            result.name = tokenInfo.name
            result.chain = tokenInfo.chain
            result.price_usd = tokenInfo.price_usd
            const supply = formatByDecimals(tokenInfo.total_supply, tokenInfo.decimals)
            result.total_supply = `${numberFormatter.format(supply)} ${tokenInfo.symbol}`
            result.fully_diluted_value = tokenInfo.fully_diluted_value
            const poolSize = formatByDecimals(tokenInfo.pool_size, tokenInfo.decimals)
            result.pool_size = `${numberFormatter.format(poolSize)} ${tokenInfo.symbol}`

            if(time){
             const prices = tokenInfo.historical_prices
              prices.forEach((priceData) => {
                const key = "price_in_" + priceData.offset_hours +"h"
                const price = priceData.price_usd 
                result[key] = price
              })
            }
            return result

          }) 

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

      data.forEach((item) => {
        const {symbol, id} = item
        if(symbol){
          if(cachedValidSymbols.get(symbol)){
            const prevValue = cachedValidSymbols.get(symbol).id
            if(!POPULAR_SYMBOLS.includes(prevValue.toLowerCase())){
              cachedValidSymbols.set(symbol, {id, symbol})
            }
          } else {
            cachedValidSymbols.set(symbol, {id, symbol})
          }
        }
        if(id){
          cachedValidSymbols.set(id, {id, symbol})
        }
      })
      return cachedValidSymbols
    } catch (error) {
        throw new Error(error?.response?.data?.status?.error_message || error.message)
    }

  }
  async function validateCurrencySymbol(coin){
      const coinQueryList = coin.split(',')
      const validSymbols = await getCoingeckoValidSymbols()
      const invalidCoinSymbols = coinQueryList.filter((id) => !validSymbols.get(id.toLowerCase()))
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
      return date.toISOString().split('T')[0];
    });
}

  function currentDate(){
    const now = new Date();
    return now.toISOString().split('T')[0];  
  }


  async function getCoingeckoHistoricalDataById (symbol, date) {
    try {
          const id = cachedValidSymbols.get(symbol.toLowerCase()).id
    
          if(!id){
            new Error('Invalid coin id')
          }
          const url = `https://pro-api.coingecko.com/api/v3/coins/${id}/history?date=${date}&localization=false`;
    
          const response = await axios(url, {
            headers: {
              'x-cg-pro-api-key': process.env.COINGECKO_API_KEY
            }
          })
          const data = response.data

          const {market_data} = data

          const priceInUsd = market_data.current_price.usd

          return { price: priceInUsd, date, coin: id,  symbol}
    } catch (error) {
       throw new Error(error?.response?.data?.status?.error_message || error.message)
    }

  }


module.exports = {
    currentDate,
    getDateFromTimeAgo,
    validateCurrencySymbol,
    getCoingeckoHistoricalDataById,
    getDuneSimTokenInfo,
    getValidChainIds,
    normaliseString
}