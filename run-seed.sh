#!/usr/bin/env bash
rm -rf ./seeds
mkdir seeds

node ./seed.js

for file in $(find ./seeds -type f -mindepth 1 -maxdepth 1); 
do
  mongoimport --file "$file" --db grid --drop --jsonArray --host ${MONGO_HOST:-127.0.0.1} --port ${MONGO_PORT:-27017}
done

rm -rf ./seeds
