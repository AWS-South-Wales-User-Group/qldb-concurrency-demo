const { QldbDriver, RetryConfig } = require('amazon-qldb-driver-nodejs');

const qldbDriver = createQldbDriver();

/**
 * Create a driver for interacting with QLDB.
 * @param ledgerName The name of the ledger to create the driver on.
 * @param serviceConfigurationOptions Configurations for the AWS SDK client that the driver uses.
 * @returns The driver for interacting with the specified ledger.
 */
function createQldbDriver(
  ledgerName = "qldb-concurrency",
  serviceConfigurationOptions = {},
) {
  //Use driver's default backoff function (and hence, no second parameter provided to RetryConfig)
  const retryConfig = new RetryConfig(4);
  const maxConcurrentTransactions = 10;
  const qldbDriver = new QldbDriver(ledgerName, serviceConfigurationOptions, maxConcurrentTransactions, retryConfig);
  return qldbDriver;
}

/**
 * Retrieve a driver for interacting with QLDB.
 * @returns The driver for interacting with the specified ledger.
 */
function getQldbDriver() {
  return qldbDriver;
}

module.exports = {
  getQldbDriver,
};