const { QldbDriver, RetryConfig } = require('amazon-qldb-driver-nodejs');
const { getQldbDriver } = require('./helper/ConnectToLedger');


const updateExistingCustomer = async (email, phoneNumber) => {

    try {
        const qldbDriver = getQldbDriver();
        await qldbDriver.executeLambda(async (txn) => {
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

// helper function to check if the email address is already registered
async function updatePhoneNumber(txn, phoneNumber, email) {
    console.log("In updatePhoneNumber function");
    const statement = `UPDATE Customer SET phoneNumber = ? WHERE email = ?`;
    return await txn.execute(statement, phoneNumber, email);
}


async function main() {
    const args = process.argv.slice(2);

    if (args.length != 2) {
        console.log('USAGE: node updateCustomer email phoneNumber');
    } else {
        const email = args[0];
        const phoneNumber = args[1];
        const response = await updateExistingCustomer(email, phoneNumber);
    }
}

main();

