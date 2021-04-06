const { QldbDriver, RetryConfig } = require('amazon-qldb-driver-nodejs');
const { getQldbDriver } = require('./helper/ConnectToLedger');


const getCustomer = async (email) => {

    try {
        const qldbDriver = getQldbDriver();
        await qldbDriver.executeLambda(async (txn) => {

            const response = await getCustomerRecord(txn, email);
            const resultList = response.getResultList();
            const recordsReturned = response.getResultList().length;
            if (recordsReturned === 0) {
                console.log(`No customer record found`);
            } else {
                console.log(JSON.stringify(resultList[0]));
            }
        },);
    
    } catch(err) {
        console.log(err);
    }
 
};

// helper function to check if the email address is already registered
async function getCustomerRecord(txn, email) {
    console.log("In getCustomerRecord function");
    const statement = `SELECT * FROM Customer WHERE email = ?`;
    return await txn.execute(statement, email);
}


async function main() {
    const args = process.argv.slice(2);

    if (args.length != 1) {
        console.log('USAGE: node selectCustomer email');
    } else {
        const email = args[0];
        const response = await getCustomer(email);
    }
}

main();

