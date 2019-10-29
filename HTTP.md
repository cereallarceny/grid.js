# grid.js

**It's highly suggested you read this document in order from top to bottom.**

## HTTP Endpoints

We've added a few HTTP endpoints to allow a grid.js administrator to upload protocols and plans for syft.js clients to utilize. They are detailed below.

**Note:** Please note that the HTTP server runs on the same server as the socket server, however, the HTTP server runs on a different port. You can specify which port the HTTP server should run at by specifying the `HTTPPORT` environment variable. If you do not specify one, it will automatically start at 1 port higher than the socket server (i.e. socket server is running 5678, HTTP server is running on 5679). The default socket server port is 3000, thus the default HTTP server port is 3001.

### Add a protocol - `POST /protocols`

This endpoint adds a new protocol to the system. You must supply a JSON body containing the Serde simplified string contents of the protocol generated in PySyft. The body must contain a single key (`data`) with the contents.

#### Request

Endpoint: `POST /protocols`

Body:

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

This endpoint updates an existing protocol in the system. You must supply a JSON body containing the Serde simplified string contents of the protocol generated in PySyft. The body must contain a single key (`data`) with the contents.

**Note:** Please note that the id of the protocol you're intending to update must remain the same. If the ID in the protocol is different, the database will "upsert" (add it to the database as a new protocol).

#### Request

Endpoint: `PUT /protocols`

Body:

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

This endpoint removes a protocol from the system. You must supply the ID of the protocol you would like to remove in the URL. No JSON body is required for this endpoint.

#### Request

Endpoint: `DELETE /protocols/:id`

#### Response

Successful response (HTTP code 200):

```json
{
  "success": "Successfully removed protocol 18797824900"
}
```

### Add a plan - `POST /plans`

This endpoint adds a new plan to the system. You must supply a JSON body containing the Serde simplified string contents of the plan generated in PySyft. The body must contain a single key (`data`) with the contents.

#### Request

Endpoint: `POST /plans`

Body:

```json
{
  "data": "(21,\n
  (12345,\n
  (23,\n
    ((6,\n
      ((33,\n
        (1,\n
          ((6,\n
            ((5, (b'abs')),\n
            (25, (25208484331, 51684948173, (5, (b'dan')), None, (11, (1,)), True)),\n
            (6, ()),\n
            (0, ()))),\n
          (1, (62869536441,))))),\n
      (33,\n
        (1,\n
          ((6,\n
            ((5, (b'__add__')),\n
            (25, (9655331350, 62869536441, (5, (b'dan')), None, None, True)),\n
            (6,\n
              ((25, (89426198911, 4863941835, (5, (b'dan')), None, (11, (1,)), False)),)),\n
            (0, ()))),\n
          (1, (3263650475,))))))),\n
    (6, (51684948173,)),\n
    (6, (3263650475,)))),\n
  (22,\n
    ((1, (4863941835,)),\n
    (1,\n
      ((14, (4863941835, (5,(b'somethinghere')), None, None, None, None)),)))),\n
  True,\n
  True,\n
  (5, (b'plan')),\n
  None,\n
  None))"
}
```

#### Response

Successful response (HTTP code 200):

```json
{
  "success": "Successfully added plan 12345"
}
```

### Modify a plan - `PUT /plans`

This endpoint updates an existing plan in the system. You must supply a JSON body containing the Serde simplified string contents of the plan generated in PySyft. The body must contain a single key (`data`) with the contents.

**Note:** Please note that the id of the plan you're intending to update must remain the same. If the ID in the plan is different, the database will "upsert" (add it to the database as a new plan).

#### Request

Endpoint: `PUT /plans`

Body:

```json
{
  "data": "(21,\n
  (12345,\n
  (23,\n
    ((6,\n
      ((33,\n
        (1,\n
          ((6,\n
            ((5, (b'abs')),\n
            (25, (25208484331, 51684948173, (5, (b'dan')), None, (11, (1,)), True)),\n
            (6, ()),\n
            (0, ()))),\n
          (1, (62869536441,))))),\n
      (33,\n
        (1,\n
          ((6,\n
            ((5, (b'__add__')),\n
            (25, (9655331350, 62869536441, (5, (b'dan')), None, None, True)),\n
            (6,\n
              ((25, (89426198911, 4863941835, (5, (b'dan')), None, (11, (1,)), False)),)),\n
            (0, ()))),\n
          (1, (3263650475,))))))),\n
    (6, (51684948173,)),\n
    (6, (3263650475,)))),\n
  (22,\n
    ((1, (4863941835,)),\n
    (1,\n
      ((14, (4863941835, (5,(b'myupdatedstring')), None, None, None, None)),)))),\n
  True,\n
  True,\n
  (5, (b'plan')),\n
  None,\n
  None))"
}
```

#### Response

Successful response (HTTP code 200):

```json
{
  "success": "Successfully updated plan 12345"
}
```

### Remove a plan - `DELETE /plans/:id`

This endpoint removes a plan from the system. You must supply the ID of the plan you would like to remove in the URL. No JSON body is required for this endpoint.

#### Request

Endpoint: `DELETE /plans/:id`

#### Response

Successful response (HTTP code 200):

```json
{
  "success": "Successfully removed plan 12345"
}
```
