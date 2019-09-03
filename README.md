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

### Heroku

If you want to deploy to Heroku via a one-click deployment, please click the following button:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

The button above will install grid.js to a Heroku instance pre-configured with MongoDB and Redis automatically provisioned and connected. All resources are automatically designated to be part of the free tier, as is the dyno itself. You're welcome to scale this up to as many dynos as you desire, as well as scale the MongoDB and Redis resources yourself. [See the scaling section](#scaling) for more information.

### Other

On a server of your choosing, you'll need to have the repository pulled down. Make sure that you can run NPM commands on this server. Please also make sure you've also installed MongoDB and Redis somewhere the application can connect to. From there, you'll need to install, build, configure, and serve the application.

1. `npm install`
2. `npm run build`
3. Add environment variables for MongoDB (`MONGODB_URI`) and Redis (`REDIS_URL`).
4. `npm run serve`

We don't provide support for this method, but it shouldn't be too hard if you have a basic dev ops knowledge. You'll also have to implement your own load balancer, which is beyond the scope of this document.

## Post-deployment

### Scaling

By default, grid.js is capable of scaling horizontally to meet your needs. While it's simply out of scope of this document to explain how to properly scale a server, you're welcome to explore this on your own or with someone that understands dev ops.

Redis is included as an "in-memory" database, allowing multiple deployments of grid.js to speak to one other. For sake of argument, let's say you have 3 users trying to train together, and 2 load-balanced deployments of grid.js. The first user to join may connect to deployment 1, while the second and third users connect to deployment 2. While each deployment connects to the same MongoDB database, we don't store any information on Websocket connections permanently in Mongo. Because of this, we need Redis' pub/sub system to pass messages between the various instances.

### Loading protocols

This hasn't been developed yet. In the future, you'll be able to send protocols you've generated in PySyft directly to grid.js. This allows users of syft.js to pull them down and train them in the browser.
