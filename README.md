# QLDB Concurrency Demo

## Overview

This repository allows a user to test out how concurrency control works in Amazon QLDB

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

In the first terminal window we should output such as follows:

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




## Deleting Resources

```shell
aws qldb delete-ledger \
    --name qldb-concurrency
```
