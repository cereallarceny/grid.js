const uuid = require('uuid/v4');

// Get the plans of a user given an instanceId and protocolId
// If they also pass a scopeId, they must
export const getPlans = async (db, { instanceId, scopeId, protocolId }) => {
  if (!protocolId) return { error: 'Please supply a protocolId' };

  // Create an empty participants list which we will populate later
  const participants = [];

  // Get the protocol of that user
  const protocol = await db.collection('protocols').findOne({ id: protocolId });

  // If we don't already have an instanceId, assign one to us
  if (!instanceId) {
    instanceId = uuid();
  }

  // If we don't have a scopeId, we must be creating a new one
  if (!scopeId) {
    // Give this new scope an id
    scopeId = uuid();

    // Add the user creating this new scope to the database and assign them as the creator with the 0th list of plans
    await db.collection('users').insertOne({
      instanceId,
      protocolId,
      scopeId,
      role: 'creator',
      plan: 0
    });

    // Create all the other participants (protocol.plans.length - 1 since the first is the scope creator)
    [...Array(protocol.plans.length - 1)].forEach((_, i) => {
      // For each user create an id and push them onto the participants list
      const participantId = uuid();

      // Assign each participant their protocol and scope, as well as their participant role, and specific plan
      participants.push({
        instanceId: participantId,
        protocolId,
        scopeId,
        role: 'participant',
        plan: i + 1
      });
    });

    // Put them in the users database
    await db.collection('users').insertMany(participants);
  }

  // Get the user
  const user = await db
    .collection('users')
    .findOne({ instanceId, scopeId, protocolId });

  // If we didn't just create the scope, make sure we always return the list of other participants
  if (participants.length === 0) {
    const otherParticipants = await db
      .collection('users')
      .find({ scopeId, protocolId })
      .toArray();

    otherParticipants.forEach(participant => {
      if (participant.instanceId !== instanceId) {
        participants.push(participant.instanceId);
      }
    });
  }

  // Return the user, their assigned scopeId (passed to us or freshly created), their list of plans, and the other participants
  return {
    user,
    plans: protocol.plans[user.plan],
    participants: participants.map(p => p.instanceId)
  };
};
