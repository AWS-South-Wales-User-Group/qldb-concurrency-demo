# QLDB Concurrency Demo

## Overview

This repository allows a user to test out how concurrency control works in Amazon QLDB. It contains scripts that allow for the creation of a customer record, as well as retrieving and updating a customer record. It also includes additional scripts that introduce configurable delays or sleeps into the code, to ensure that inflight transactions are interspersed.

The concept is that a Customer record has a unique email address. This means when creating a customer record, the following logic is applied:

1. Query the table to see if a record already exists with the email address. If not, then ...
2. Create a new customer record using the name, email and telephone number passed in, and then ...
3. Update the customer record with the unique doc Id returned from the second step

In total, this means that there are 3 database operations carried out to create a new record. All of these take place within a single atomic transaction.

## Create Ledger

To get started, create a new ledger. This can be done using the AWS CLI command as follows:

```shell
aws qldb create-ledger \
    --name qldb-concurrency \
    --no-deletion-protection \
    --permissions-mode ALLOW_ALL
```

## Create Tables

Next we need to create the Customer table in the ledger just created. To do this, we will make use of the QLDB shell (though you can also do this directly in the AWS Console). You can find more information about the QLDB Shell and how to install it [here](https://docs.aws.amazon.com/qldb/latest/developerguide/data-shell.html).

If using a mac, you can use the following commands to install:

```shell
> brew tap aws/tap
> brew install qldbshell
```

Next we can login to the QLDB shell and execute the `CREATE TABLE` PartiQL command:

```shell
> qldb --ledger qldb-concurrency
qldb> CREATE TABLE Customer
qldb> exit
```

## Demo 1 - Create Duplicate Customer Record

In this demo, we will attempt to create a duplicate customer record. You will need two terminal windows open ready to run the necessary commands. In the first terminal window run the following command:

```shell
$ node createCustomerWithDelay {name} {email} {telephone} {delay-in-ms}
e.g.
$ node createCustomerWithDelay matt matt@test.com 012345 10000
```

and then in the second terminal window immediately run the following command:

```shell
$ node createCustomer {name} {email} {telephone}
e.g.
$ node createCustomer matt matt@test.com 012345
```

In the first terminal window we should see output such as follows:

```shell
Attempt: 1
In checkEmailUnique function with email: matt@test.com
No records found for matt@test.com
About to pause for 10000 milliseconds
In the createRecord function with doc: [object Object]
In the addGuid function with docId: 2EOl5jE9nIlBycoHUltIxX and email: matt@test.com
Attempt: 2
In checkEmailUnique function with email: matt@test.com
Record already exists for matt@test.com
```

This shows that the QLDB driver identified that a change had taken place, and so retried the whole transaction block again. On this retry, it detected that the record already existed.

### Demo 2 - Create Customer Record

For the second demo, use the same approach as for the first demo, but have the second transaction create a different customer record. In the first terminal window we should see output such as follows:

```shell
Attempt: 1
In checkEmailUnique function with email: matt@test.com
No records found for matt@test.com
About to pause for 10000 milliseconds
In the createRecord function with doc: [object Object]
In the addGuid function with docId: 8KKV8h80qQqHCrLEJKG1Mb and email: matt@test.com
In the updateTelephone function with telephone: 01234567 and email: matt@test.com
Attempt: 2
In checkEmailUnique function with email: matt@test.com
No records found for matt@test.com
About to pause for 10000 milliseconds
In the createRecord function with doc: [object Object]
In the addGuid function with docId: 9mov0fkSUqZ0wrn83488BF and email: matt@test.com
In the updateTelephone function with telephone: 01234567 and email: matt@test.com
```

This is interesting, as it shows that the QLDB driver retries the first transaction as a result of an update to another record in the same table. This is not ideal, as it will result in longer running transactions and more OCC Exceptions. So now lets try it when we add an index.

### Demo 3 - Create Customer Record with Index

For the third demo, we will re-run the second demo, but first we will create an index on the `email` attribute that is in the WHERE clause of the first select statement. To do this in the QLDB shell, run the following:

```shell
> qldb --ledger qldb-concurrency
qldb> CREATE INDEX ON Customer (email)
qldb> exit
```

Running the demo now results in the following output:

```shell
Attempt: 1
In checkEmailUnique function with email: matt@test.com
No records found for matt@test.com
About to pause for 10000 milliseconds
In the createRecord function with doc: [object Object]
In the addGuid function with docId: 5kelU9q5mdRGfn0mCVQc96 and email: matt@test.com
In the updateTelephone function with telephone: 01234567 and email: matt@test.com
```

### Demo 4 - Timeout

The fourth demo is similar to any of the first 3, but the delay is set to a minimum of 30 seconds e.g.

```shell
$ node createCustomerWithDelay matt matt@test.com 012345 30000
```

This will result in the following:

```shell
InvalidSessionException: Transaction I1pH6SCujBW0JYpPoLQT02 has expired
  ...
  message: 'Transaction I1pH6SCujBW0JYpPoLQT02 has expired',
  code: 'InvalidSessionException',
  time: 2021-04-05T21:06:46.935Z,
  requestId: '4SnOdtcgpur5MmhXFEV3iE, 4SnOdtcgpur5MmhXFEV3iE',
  statusCode: 400,
  retryable: false
}
```

A transaction can run for up to 30 seconds before being committed. After this timeout, any work done on the transaction is rejected, and QLDB discards the session. This limit protects the client from leaking sessions by starting transactions and not committing or cancelling them.

### Additional Task - View Block Details

In QLDB, each transaction is committed as a block to the journal. This journal block contains transaction metadata, along with entries for each document revision made, and the corresponding PartiQL statements that committed them. It is useful to look at the block data, to better understand the type of data that is committed to a block.

In order to query the committed view of a document, you need to find out its `strandId` and `sequenceNo` in the block. You can find these by querying the committed view, e.g.

```shell
> qldb --ledger qldb-concurrency
qldb> SELECT * FROM _ql_committed_Customer WHERE data.email = 'matt@test.com'
qldb> exit
```

This will return a document with a `blockAddress` section containing the `strandId` and `sequenceNo`. Take these values and paste them into the `block.json` file in the relevant position.

Next you can retrieve the block record by running the following AWS CLI command

```shell
$ aws qldb get-block --name qldb-concurrency --block-address file://block.json

```

You can find out more about the contents in the developer guide [here](https://docs.aws.amazon.com/qldb/latest/developerguide/journal-contents.html)

## Deleting Resources

If you wish to remove the resources, you can simply delete the ledger using the following command

```shell
aws qldb delete-ledger \
    --name qldb-concurrency
```
