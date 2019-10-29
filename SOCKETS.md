# grid.js

**It's highly suggested you read this document in order from top to bottom.**

## Socket Endpoints

You should always connect to grid.js securely using the `wss` protocol instead of `ws`. Such a url should be the load balancer endpoint and should look like: `wss://url-of-grid-server.com`, for instance.

**Note:** All messages sent to and received from grid.js should be sent as JSON and adhere to the following structure:

```json
{
  "type": "my-message-type",
  "data": {
    "key1": "value1",
    "key2": "value2",
    ...
  }
}
```

The following are socket endpoint types that you can hit with a syft.js or PySyft client:

### `socket-ping`

The `socket-ping` message is intended as a keep-alive to ensure the connection to grid.js isn't dropped. Traditionally, if a message is not sent or received by a socket server within a certain time interval, the connection will be considered "dead" and will be terminated. This timeout period varies between various hosting providers, but **a commonly accepted standard (and the one syft.js implements internally) is that such a message should be sent from the client to the socket server every 20 seconds (20000 milliseconds)**. Some socket frameworks do this automatically, but if you're not using a socket framework, you'll need to add this method yourself yourself. Grid.js does not respond to such messages, but it does have a place to receive them. It performs no internal actions with these messages, with the exception of logging the occurance while in debug mode.

#### Request

```json
{
  "type": "socket-ping",
  "data": {}
}
```

#### Response

None

### `get-protocol`

The `get-protocol` message is complicated in that many steps are done internally within grid.js to ensure an identical response. Currently there's no implicit "authentication" system within grid.js, but if the request doesn't match exactly what is inside the database, you will not receive any response.

First, a few terms:

- **scope** - a "private room" based on a uniquely generated ID that allows clients of that same scope to communicate to one another. [We use version 4 of the uuid NPM package](https://www.npmjs.com/package/uuid) for this, but technically any library that generates a sufficiently complex unique string ID will do. The "ID" is always referred to as the `scopeId`.
- **worker** - a uniquely generated ID that represents a syft.js client (or theoretically a PySyft client). You can think of this as the "username" of the client that's trying to connect to grid.js. Just like `scopeId`, we also use version 4 of the uuid NPM package for generating this string value. The "ID" is always referred to as the `workerId`.

Now, for the general algorithm of how plans are generated or found, and eventually returned:

1. If the client has not specified an `workerId` in their request, generate one for them.
2. Do a lookup to find the requested protocol based on the `protocolId`.
3. If a `scopeId` was not specified in the request, we assume that the client desires to create a new scope. In this case, we must designate the requesting client as the "creator" of that scope. Likewise, we must also generate and store the information of the other participants. The number of additional participants to be created depends on the number of plan assignments inside the protocol (_i.e. for a protocol with 3 assignments, 2 other users (other than the creator) will be created_). In grid.js, a client is structured as such in the database:

   ```js
   {
     workerId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
     scopeId: 'f0be538d-e185-47cc-ac68-27ec26088ba6',
     protocolId: 'millionaire-problem',
     role: 'creator',  // Or "participant"
     plan: 0,  // Always an integer, speicifying which array index in the list of plans they are assigned to
     assignment: 'assignment-1'  // The name of the assignment, allowing us to map the appropriate plan assignment
   }
   ```

   In grid.js, the creator of the scope is always assigned the 0th plan in the protocol (and thus, the 0th assignment).

4. Find the plan in the protocol that the client is responsible for. This will be a giant Serde simplified string.
5. Once we have generated or retieved all the clients in the scope, we send the response to the client which includes a JSON object with three keys:
   - `user` - all of their client information
   - `protocol` - the protocol the user requested (returned in a Serde simplified string)
   - `plan` - the plan that the user is assigned to (returned in a Serde simplified string)
   - `participants` - an object mapping the `workerId`'s of each of the users to their respective assignments (so that each user knows what `workerId` has what `assignment`)

**Note:** If this workflow is at all still confusing, [it's suggested you read through the protocol.js file](./src/protocol.js) to see exactly what is happening internally. Note that it presumes the presence of an `workerId` and a `protocolId`, but not a `scopeId`.

#### Request<br />

If you want to create a new scope:

```json
{
  "type": "get-protocol",
  "data": {
    "protocolId": "millionaire-problem"
  }
}
```

If you want to join an existing scope (even as the original creator of that scope):

```json
{
  "type": "get-protocol",
  "data": {
    "workerId": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
    "scopeId": "f0be538d-e185-47cc-ac68-27ec26088ba6",
    "protocolId": "millionaire-problem"
  }
}
```

#### Response

**Note:** The `protocol` and `plan` return below is too long (an arbitrary) to be included below. They have thus been replaced as `SIMPLIFIED_PROTOCOL` and `SIMPLIFIED_PLAN` respectively. Simply understand that each of these represent a Serde simplified string of the protocol and assigned plan.

```json
{
  "type": "get-protocol",
  "data": {
    "user": {
      "workerId": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
      "scopeId": "f0be538d-e185-47cc-ac68-27ec26088ba6",
      "protocolId": "millionaire-problem",
      "role": "creator",
      "plan": 0,
      "assignment": "assignment-1"
    },
    "protocol": SIMPLIFIED_PROTOCOL,
    "plan": SIMPLIFIED_PLAN,
    "participants": {
      "5b06f42e-ee96-43e6-a6e7-e24f5a21268b": "assignment-2",
      "e64130ae-b044-4cd7-b1fe-623cec3fb8e8": "assignment-3"
    }
  }
}
```

### `webrtc: join-room`

**Note:** If you're unfamiliar with WebRTC, it's highly encouraged that you [read this article first](https://www.html5rocks.com/en/tutorials/webrtc/basics/).

The `webrtc: join-room` endpoint is to let other participants in the same `scopeId` know that they are attempting to create a WebRTC peer-to-peer connection with them. In syft.js, we require a mesh network to be established between all peers. This is because each peer will eventually be sending information to other individual peers directly, rather than having one peer (or the socket server) control all connections. This is more computationally expensive for the client, but a requirement for truly private training to exist.

The request consists of the `workerId` and the `scopeId` of the client. The response is not sent back to the requesting client, but rather to every other client sharing the exact same `scopeId`. Obviously, a client must be connected to grid.js in order to receive another client's `webrtc: join-room` message. In the event that no other participant clients are connected, no response will be sent.

#### Request

```json
{
  "type": "webrtc: join-room",
  "data": {
    "workerId": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
    "scopeId": "f0be538d-e185-47cc-ac68-27ec26088ba6"
  }
}
```

#### Response

**Note:** There is no response sent back to the client that sent this request. The response is **only** sent to the other peers with the same `scopeId` that are currently connected to grid.js. The response is identical to the request.

**Since the response is the same as the request, we will not paste them again here for brevity. Please consult the request section above for more information.**

### `webrtc: internal-message`

**Note:** If you're unfamiliar with WebRTC, it's highly encouraged that you [read this article first](https://www.html5rocks.com/en/tutorials/webrtc/basics/).

Internal messages in WebRTC actually consist of three possible SDP messages: an "offer", an "answer", or an "ICE candidate". An offer is generated by one client and sent to exactly one other client. Upon receiving an offer, an answer is generated by the receiving client and sent to the exact client that sent the original offer. Once an offer and an answer have been exchanged, ICE candidates are sent back and forth and stored locally between each of the two clients - these message establish a communication gateway instructing the receiving client how the sending client is going to perform NAT traversal.

If this is confusing, don't worry! The Grid client does not need to do anything with these, or any messages with the `webrtc` prefix - simply direct them to the appropriate peer (or peers) depending on the message.

In the case of an internal message, this will always be sent to exactly one other peer, whose `workerId` is specified in the `to` field of the message.

#### Request

**Note:** For brevity, we've replaced the inner-most `data` field with `SDP_MESSAGE`. This is because SDP messages are long, difficult to understand, and for the purposes of this document... irrelevant. If you're curious what one of these messages looks like, [please consult the following RFC](https://tools.ietf.org/html/rfc4317).

For an offer:

```json
{
  "type": "webrtc: internal-message",
  "data": {
    "workerId": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
    "scopeId": "f0be538d-e185-47cc-ac68-27ec26088ba6",
    "to": "5b06f42e-ee96-43e6-a6e7-e24f5a21268b",
    "type": "offer",
    "data": SDP_MESSAGE
  }
}
```

For an answer:

```json
{
  "type": "webrtc: internal-message",
  "data": {
    "workerId": "5b06f42e-ee96-43e6-a6e7-e24f5a21268b",
    "scopeId": "f0be538d-e185-47cc-ac68-27ec26088ba6",
    "to": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
    "type": "answer",
    "data": SDP_MESSAGE
  }
}
```

For an ICE candidate:

```json
{
  "type": "webrtc: internal-message",
  "data": {
    "workerId": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
    "scopeId": "f0be538d-e185-47cc-ac68-27ec26088ba6",
    "to": "5b06f42e-ee96-43e6-a6e7-e24f5a21268b",
    "type": "candidate",
    "data": SDP_MESSAGE
  }
}
```

#### Response

**Note:** There is no response sent back to the client that sent this request. The response is **only** sent to peer requested in the `to` field of the message. According to WebRTC, an internal message may only be sent to another peer already connected to the same socket server, so you can presume that unless the client representing the `to` field has since disconnected, they will always exist. The response is identical to the request.

**Since the response is the same as the request, we will not paste them again here for brevity. Please consult the request section above for more information.**

### `webrtc: peer-left`

**Note:** If you're unfamiliar with WebRTC, it's highly encouraged that you [read this article first](https://www.html5rocks.com/en/tutorials/webrtc/basics/).

The `webrtc: peer-left` should be quite obvious. This is sent when a peer loses connection (intentionally or accidentally) with grid.js. It can technically be sent from syft.js, but it would be more accurate to send from grid.js upon detection of a closed connection. This would prevent unnecessarily sending the same message twice.

This message is sent to all other clients with the same `scopeId`. This message is not sent back to the client that has disconnected... for obvious reasons.

#### Request

```json
{
  "type": "webrtc: peer-left",
  "data": {
    "workerId": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
    "scopeId": "f0be538d-e185-47cc-ac68-27ec26088ba6"
  }
}
```

#### Response

**Note:** There is no response sent back to the client that sent this request. The response is **only** sent to the other peers with the same `scopeId` that are currently connected to grid.js. The response is identical to the request.

**Since the response is the same as the request, we will not paste them again here for brevity. Please consult the request section above for more information.**
