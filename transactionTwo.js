const { QldbDriver, RetryConfig } = require('amazon-qldb-driver-nodejs');


const getLicence = async (id) => {
    const maxConcurrentTransactions = 10;
    const retryLimit = 4;
    const retryConfig = new RetryConfig(retryLimit);

    const qldbDriver = new QldbDriver("qldb-concurrency", {}, maxConcurrentTransactions, retryConfig);

    await qldbDriver.executeLambda(async (txn) => {

    },() => console.log("Retrying due to OCC conflict..."));
};

const transactionTwo = async() => {
    const response = await getLicence(id);
    console.log(response);
}

console.log(transactionTwo());

