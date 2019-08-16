export default (type, data, send, rooms, ws) => {
  if (type === 'webrtc: join-room') {
    // If the room doesn't exist yet, create it
    if (!rooms.hasOwnProperty(data.scopeId)) {
      rooms[data.scopeId] = {};
    }

    // Have the current client join the room
    rooms[data.scopeId][data.instanceId] = ws;

    // Let everyone else in the room know about the new client
    Object.keys(rooms[data.scopeId]).forEach(client => {
      send(
        'webrtc: new-peer',
        { instanceId: data.instanceId },
        rooms[data.scopeId][client]
      );
    });
  } else if (type === 'webrtc: internal-message') {
    if (data.to !== undefined && rooms[data.scopeId][data.to] !== undefined) {
      // If the message indicates the recipient and this recipient is known to the server, we send the message only to him...
      send('webrtc: internal-message', data, rooms[data.scopeId][data.to]);
    } else {
      // ... otherwise we consider the message to be broadcast
      Object.keys(rooms[data.scopeId]).forEach(client => {
        if (client !== data.instanceId) {
          send('webrtc: internal-message', data, rooms[data.scopeId][client]);
        }
      });
    }
  } else if (type === 'webrtc: peer-left') {
    // When disconnecting a client, we inform the rest about it
    Object.keys(rooms[data.scopeId]).forEach(client => {
      if (client !== data.instanceId) {
        send('webrtc: peer-left', data, rooms[data.scopeId][client]);
      }
    });

    // Remove that peer from the rooms object
    delete rooms[data.scopeId][data.instanceId];
  }
};
