# grid.js

**It's highly suggested you read this document in order from top to bottom.**

## HTTP Endpoints

We've added a few HTTP endpoints to allow a grid.js administrator to upload protocols and plans for syft.js clients to utilize. They are detailed below.

**Note:** Please note that the HTTP server runs on the same server as the socket server, however, the HTTP server runs on a different port. You can specify which port the HTTP server should run at by specifying the `HTTPPORT` environment variable. If you do not specify one, it will automatically start at 1 port higher than the socket server (i.e. socket server is running 5678, HTTP server is running on 5679). The default socket server port is 3000, thus the default HTTP server port is 3001.

### Add a protocol - `POST /protocols`

This endpoint adds a new protocol to the system. You must supply a `data` field with the Serde simplified string contents of the protocol generated in PySyft.

#### Request

Endpoint: `POST /protocols`

Data:

```json
{
  "data": "(24,\n
 (18797824900,\n
  None,\n
  None,\n
  (1,\n
   ((6, ((5, (b'assignment1',)), 12345)),\n
    (6, ((5, (b'assignment2',)), 67890)),\n
    (6, ((5, (b'assignment3',)), 13579)))),\n
  False))"
}
```

#### Response

Successful response (HTTP code 200):

```json
{
  "success": "Successfully added protocol 18797824900"
}
```

### Modify a protocol - `PUT /protocols`

This endpoint updates an existing protocol in the system. You must supply a `data` field with the Serde simplified string contents of the protocol generated in PySyft.

**Note:** Please note that the id of the protocol you're intending to update must remain the same. If the ID in the protocol is different, the database will "upsert" (add it to the database as a new protocol).

#### Request

Endpoint: `PUT /protocols`

Data:

```json
{
  "data": "(24,\n
 (18797824900,\n
  None,\n
  None,\n
  (1,\n
   ((6, ((5, (b'new-assignment-name1',)), 12345)),\n
    (6, ((5, (b'new-assignment-name2',)), 67890)),\n
    (6, ((5, (b'new-assignment-name3',)), 13579)))),\n
  False))"
}
```

#### Response

Successful response (HTTP code 200):

```json
{
  "success": "Successfully updated protocol 18797824900"
}
```

### Remove a protocol - `DELETE /protocols/:id`

This endpoint adds a new protocol to the system. You must supply a `data` field with the Serde simplified string contents of the protocol generated in PySyft.

#### Request

Endpoint: `POST /protocols`

Data:

```json
{
  "data": "(24,\n
 (18797824900,\n
  None,\n
  None,\n
  (1,\n
   ((6, ((5, (b'assignment1',)), 12345)),\n
    (6, ((5, (b'assignment2',)), 67890)),\n
    (6, ((5, (b'assignment3',)), 13579)))),\n
  False))"
}
```

#### Response

Successful response (HTTP code 200):

```json
{
  "success": "Successfully added protocol 18797824900"
}
```
