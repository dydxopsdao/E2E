module.exports = async () => {
  if (!process.env.APPLITOOLS_BATCH_TIME) {
    process.env.APPLITOOLS_BATCH_TIME = String(Date.now());
  }
};
