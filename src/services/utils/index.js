const { NON_CACHEABLE_KEYS } = require("../constants")

const isCacheable = (targetUrl) => {
    return !NON_CACHEABLE_KEYS.some((key) => targetUrl.includes(key));
}

module.exports = {
    isCacheable
}