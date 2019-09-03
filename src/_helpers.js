// This is a simple helper function that shortens the long instanceId's and scopeId's being sent to the logger
// This should ONLY be used in conjunction with logger.log
export const shortenId = id =>
  id ? id.substr(0, id.indexOf('-')) : 'NOT FOUND';
