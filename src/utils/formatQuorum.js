
function formatQuorum(raw) {
  const quorum = BigInt(raw)

  // return if the quorum is not in erc20 token format
  if(quorum < 10n ** 18n) {
    return raw
  }
  const decimals = 18;
  const divisor = 10 ** decimals;
  const normalized = Number(quorum) / divisor;

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(normalized);
}

module.exports = { formatQuorum };