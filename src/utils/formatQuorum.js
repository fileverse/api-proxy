
function formatQuorum(raw, decimals) {
  if(!decimals){
    return raw
  }
  const quorum = BigInt(raw)
  const divisor = 10 ** decimals;
  const normalized = Number(quorum) / divisor;

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(normalized);
}

module.exports = { formatQuorum };