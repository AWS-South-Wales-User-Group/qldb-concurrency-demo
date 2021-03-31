const { QldbDriver, RetryConfig } = require('amazon-qldb-driver-nodejs');
const { getQldbDriver } = require('./helper/ConnectToLedger');

const name = "Matt";
const email = "matt3@test.com";
const telephone = "015782456";



const createLicence = async () => {

    try {
        const qldbDriver = getQldbDriver();

        await qldbDriver.executeLambda(async (txn) => {
    
          // Check if the record already exists assuming email unique for demo
          const recordsReturned = await checkEmailUnique(txn, email);
    
            if (recordsReturned === 0) {

                const recordDoc = [{name, email, telephone}]
                // Create the record. This returns the unique document ID in an array as the result set
                const result = await createRecord(txn, recordDoc);
        
                const docIdArray = result.getResultList()
                const docId = docIdArray[0].get("documentId").stringValue();
                // Update the record to add the document ID as the GUID in the payload
                await addGuid(txn, docId, email);

            } else {
    //            throw error(`Licence record with email ${email} already exists. No new record created`);
            }
        },);
    
    } catch(err) {
        console.log(err);
    }
 
};

const transactionTwo = async() => {
    const response = await createLicence();
}

async function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

// helper function to check if the email address is already registered
async function checkEmailUnique(txn, email) {
    console.log("In checkEmailUnique function");
    const query = `SELECT email FROM Duplicate WHERE email = ?`;
    let recordsReturned;
    await txn.execute(query, email).then((result) => {
        recordsReturned = result.getResultList().length;
        recordsReturned === 0 ? console.log(`No records found for ${email}`) : console.log(`Record already exists for ${email}`);
    });
    return recordsReturned;
}

// helper function to create a new licence record
async function createRecord(txn, recordDoc) {
    console.log("In the createRecord function");
    const statement = `INSERT INTO Duplicate ?`;
    return await txn.execute(statement, recordDoc);
};
  
// helper function to add the unique ID as the GUID
async function addGuid(txn, docId, email) {
    console.log("In the addGuid function with docId: " + docId + ' and email: ' + email);
    const statement = `UPDATE Duplicate as b SET b.guid = ? WHERE b.email = ?`;
    return await txn.execute(statement, docId, email);
}
  
transactionTwo()
  .then()
  .catch((err) => console.log(err));

