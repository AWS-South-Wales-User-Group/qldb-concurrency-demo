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

In order to create tables, we will use the QLDB shell

```shell
> brew tap aws/tap
> brew install qldbshell
```

```shell
> qldb --ledger qldb-concurrency
qldb> CREATE TABLE Customer
qldb> exit
```


## Deleting Resources

```shell
aws qldb delete-ledger \
    --name qldb-concurrency
```
