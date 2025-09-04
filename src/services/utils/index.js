const { NON_CACHEABLE_KEYS } = require("../constants")

const isCacheableUrl = (targetUrl) => {
    return !NON_CACHEABLE_KEYS.some((key) => targetUrl.includes(key));
}

module.exports = {
    isCacheableUrl
}