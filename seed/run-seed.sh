#!/usr/bin/env bash
cd ./seed

rm -rf ./tmp
mkdir tmp

node ./seed.js

for file in $(find ./tmp -type f -mindepth 1 -maxdepth 1); 
do
  mongoimport --file "$file" --db grid --drop --jsonArray --host ${MONGO_HOST:-127.0.0.1} --port ${MONGO_PORT:-27017}
done

rm -rf ./tmp

cd ../