const { QldbDriver, RetryConfig } = require('amazon-qldb-driver-nodejs');

const name = "Matt Lewis1";
const email = "matt.e.lewis1@gmail.com";
const telephone = "015782456";



const createLicence = async () => {
    const maxConcurrentTransactions = 10;
    const retryLimit = 4;
    const retryConfig = new RetryConfig(retryLimit);

    const qldbDriver = new QldbDriver("qldb-concurrency", {region:"eu-west-1"}, maxConcurrentTransactions, retryConfig);

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
        await addGuid(txn, docId, name);
        licence = {
            "GUID": docId,
            "LicenceId": licenceId,
            "Name": name,
            "Email": email,
            "Telephone": telephone 
        };
    } else {
        throw new LicenceIntegrityError(400, 'Licence Integrity Error', `Licence record with email ${email} already exists. No new record created`);
    }
    },() => console.log("Retrying due to OCC conflict..."));
};

const transactionOne = async() => {
    const response = await createLicence();
    console.log(response);
}

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

// helper function to check if the email address is already registered
async function checkEmailUnique(txn, email) {
    Log.debug("In checkEmailUnique function");
    const query = `SELECT email FROM Concurrency AS WHERE email = ?`;
    let recordsReturned;
    await txn.execute(query, email).then((result) => {
        recordsReturned = result.getResultList().length;
        recordsReturned === 0 ? Log.debug(`No records found for ${email}`) : Log.debug(`Record already exists for ${email}`);
    });
    return recordsReturned;
}

// helper function to create a new licence record
async function createRecord(txn, recordDoc) {
    Log.debug("In the createRecord function");
    const statement = `INSERT INTO Concurrency ?`;
    return await txn.execute(statement, recordDoc);
};
  
// helper function to add the unique ID as the GUID
async function addGuid(txn, docId, name) {
    Log.debug("In the addGuid function");
    const statement = `UPDATE Concurrency as b SET b.guid = ? WHERE b.name = ?`;
    return await txn.execute(statement, docId, name);
}
  
console.log(transactionOne());

