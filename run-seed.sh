#!/usr/bin/env bash
rm -rf ./seeds
mkdir seeds

node ./seed.js

for file in $(find ./seeds -type f -mindepth 1 -maxdepth 1); 
do
  mongoimport --file "$file" --db grid --drop --jsonArray
done

rm -rf ./seeds