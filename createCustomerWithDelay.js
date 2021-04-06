const { QldbDriver, RetryConfig } = require('amazon-qldb-driver-nodejs');
const { getQldbDriver } = require('./helper/ConnectToLedger');


const createNewCustomer = async (name, email, phoneNumber, delay) => {

    try {
        const qldbDriver = getQldbDriver();
        let attempts = 0;

        await qldbDriver.executeLambda(async (txn) =>  {

          console.log('Attempt: ' + ++attempts);

          // Check if the record already exists assuming email unique for demo
          const recordsReturned = await checkEmailUnique(txn, email);
    
            if (recordsReturned === 0) {

                console.log(`About to pause for ${delay} milliseconds`)
                await sleep(delay);
        
                const recordDoc = [{name, email, phoneNumber}]
                // Create the record. This returns the unique document ID in an array as the result set
                const result = await createRecord(txn, recordDoc);
        
                const docIdArray = result.getResultList()
                const docId = docIdArray[0].get("documentId").stringValue();
                // Update the record to add the document ID as the GUID in the payload
                await addGuid(txn, docId, email);
                await updateTelephone(txn, "01234567", email);

            } 

        }, new RetryConfig(2));
    
    } catch(err) {
        console.log(err);
    }
 
};

async function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

// helper function to check if the email address is already registered
async function checkEmailUnique(txn, email) {
    console.log("In checkEmailUnique function with email: " + email);
    const query = `SELECT email FROM Customer WHERE email = ?`;
    let recordsReturned;
    await txn.execute(query, email).then((result) => {
        recordsReturned = result.getResultList().length;
        recordsReturned === 0 ? console.log(`No records found for ${email}`) : console.log(`Record already exists for ${email}`);
    });
    return recordsReturned;
}

// helper function to create a new licence record
async function createRecord(txn, recordDoc) {
    console.log("In the createRecord function with doc: " + recordDoc);
    const statement = `INSERT INTO Customer ?`;
    return await txn.execute(statement, recordDoc);
};
  
// helper function to add the unique ID as the GUID
async function addGuid(txn, docId, email) {
    console.log("In the addGuid function with docId: " + docId + ' and email: ' + email);
    const statement = `UPDATE Customer as b SET b.guid = ? WHERE b.email = ?`;
    return await txn.execute(statement, docId, email);
}

// helper function to add the unique ID as the GUID
async function updateTelephone(txn, telephone, email) {
    console.log("In the updateTelephone function with telephone: " + telephone + ' and email: ' + email);
    const statement = `UPDATE Customer as b SET b.telephone = ? WHERE b.email = ?`;
    return await txn.execute(statement, telephone, email);
}


async function main() {
    const args = process.argv.slice(2);

    if (args.length != 4) {
        console.log('USAGE: node createCustomerWithDelay name email phoneNumber delayInMillis');
    } else {
        const name = args[0];
        const email = args[1];
        const phoneNumber = args[2];
        const delay = args[3]
        const response = await createNewCustomer(name, email, phoneNumber, delay);
    }
}

main();
