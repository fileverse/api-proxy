 const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2
});

const numberFormatter =   new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
})

const formatByDecimals = (value, decimal) => {
  if(!decimal) return value
  return value / 10 ** decimal
}


function formatTimestamp(ts) {
  if (!ts) return "";
  
  const date = new Date(ts.toString().length === 10 ? ts * 1000 : ts);

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

module.exports  = {
    usdFormatter,
    numberFormatter,
    formatByDecimals,
    formatTimestamp
}