const PLATFORM_FEE_PERCENT = 5;

const calculateCommission = (finalPrice) => {
  const platformFee = (finalPrice * PLATFORM_FEE_PERCENT) / 100;
  const workerEarnings = finalPrice - platformFee;
  return {
    platformFee: parseFloat(platformFee.toFixed(2)),
    workerEarnings: parseFloat(workerEarnings.toFixed(2)),
  };
};

module.exports = { calculateCommission };