## Launch NodeJS services

```
npm run-script start
npm run-script inspect
```

## How to make a node.js application run permanently ?

http://www.web-technology-experts-notes.in/2017/01/how-to-make-nodejs-application-run-permanently.html


1/ Open putty
2/ Login to ssh with username and password
3/ Go to the folder where node file exist.
4/ Execute following command

nohup node server.js &

5/ then execute following command

rm nohup.out

6/ Now you can close the putty !

## How to check nodeJS running?

top

## How to stop/kill the node ?

1/ Get the "process id" from terminal and kill the same.

kill {PROCESS_ID}

OR

killall node

## How to search the process using command ?

ps -fC node



## MongoDb

https://zestedesavoir.com/tutoriels/312/debuter-avec-mongodb-pour-node-js/

-- Windows :

1/ start MongoDB.bat
2/ mongo.exe

-- Mac :

1/ terminal : mongod
2/ mongo --host 127.0.0.1:27017


show dbs
use {dbName}
db.{collectionName}.find()


## Open Movies API

http://www.omdbapi.com/