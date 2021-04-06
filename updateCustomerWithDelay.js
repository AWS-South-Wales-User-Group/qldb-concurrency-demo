const { QldbDriver, RetryConfig } = require('amazon-qldb-driver-nodejs');
const { getQldbDriver } = require('./helper/ConnectToLedger');


const updateExistingCustomer = async (email, phoneNumber, delay) => {

    try {
        const qldbDriver = getQldbDriver();
        let attempts = 0;

        await qldbDriver.executeLambda(async (txn) => {

            const custResponse = await getCustomerRecord(txn, email);

            console.log(`About to pause for ${delay} milliseconds`)
            await sleep(delay);

            console.log('Attempt: ' + ++attempts);

            const response = await updatePhoneNumber(txn, phoneNumber, email);
            const recordsReturned = response.getResultList().length;
            if (recordsReturned === 0) {
                console.log(`No phone number updated`);
            } else {
                console.log(`Phone number updated`);
            }
        },);
    
    } catch(err) {
        console.log(err);
    }
 
};

async function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}


// helper function to check if the email address is already registered
async function updatePhoneNumber(txn, phoneNumber, email) {
    console.log("In updatePhoneNumber function");
    const statement = `UPDATE Customer SET phoneNumber = ? WHERE email = ?`;
    return await txn.execute(statement, phoneNumber, email);
}

// helper function to check if the email address is already registered
async function getCustomerRecord(txn, email) {
    console.log("In getCustomerRecord function");
    const statement = `SELECT * FROM Customer WHERE email = ?`;
    return await txn.execute(statement, email);
}


async function main() {
    const args = process.argv.slice(2);

    if (args.length != 3) {
        console.log('USAGE: node updateCustomer email phoneNumber delay');
    } else {
        const email = args[0];
        const phoneNumber = args[1];
        const delay = args[2]
        const response = await updateExistingCustomer(email, phoneNumber, delay);
    }
}

main();

