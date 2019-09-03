# grid.js

A Node API sitting between PySyft/syft.js on the server and syft.js on the client.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Development

1. Install Redis to your computer and have it running in the background ([using Homebrew](https://gist.github.com/tomysmile/1b8a321e7c58499ef9f9441b2faa0aa8))
2. [Install and run MongoDB locally](https://docs.mongodb.com/manual/installation/)
3. `npm install`
4. `npm run seed` (if you want to have a sample protocol put into the database)
5. `npm start`

At this point you'll have a socket server running locally on the port of your specification (defaults to 3000). This project includes:

- Full support for hot reloading (meaning you can save your changes and the server will restart automatically)
- Full support for ES5/6/7 via Babel 7 (feel free to write in the newer Javascript syntax)
- Prettier running in the background (all code contributed should be syntatically identical from developer to developer - [feel free to install the plugin for the editor of your choice](https://prettier.io/)).

## Deployment

1. `npm install`
2. `npm run build`
3. `npm run serve`
