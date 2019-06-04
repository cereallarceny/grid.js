# grid.js

A Node API sitting between PySyft/syft.js on the server and syft.js on the client.

## Development

1. `npm install`
2. `npm start`

At this point you'll have a socket server running locally on the port of your specification (defaults to 3000). This project includes:

- Full support for hot reloading (meaning you can save your changes and reload the browser window to immediately see your changes)
- Full support for ES5/6/7 via Babel 7 (feel free to write in the newer Javascript syntax)
- Prettier running in the background (all code contributed should be syntatically identical from developer to developer - [feel free to install the plugin for the editor of your choice](https://prettier.io/)).

## Deployment

1. `npm install`
2. `npm run build`
3. `npm run serve`
