const uuid = require('uuid/v4');

// Get the plans of a user given an instanceId and protocolId
// If they also pass a scopeId, they must
export const getPlans = async (
  db,
  { instanceId = uuid(), scopeId, protocolId }
) => {
  if (!protocolId) return { error: 'Please supply a protocolId' };

  // Create an empty participants list which we will populate later
  const participants = [];

  // Get the protocol of that user
  const protocol = await db
    .get('protocols')
    .find({ id: protocolId })
    .value();

  // If we don't have a scopeId, we must be creating a new one
  if (!scopeId) {
    // Give this new scope an id
    scopeId = uuid();

    // Add the user creating this new scope to the database and assign them as the creator with the 0th list of plans
    await db
      .get('users')
      .push({
        instanceId,
        protocolId,
        scopeId,
        role: 'creator',
        plan: 0
      })
      .write();

    // Create all the other participants (protocol.plans.length - 1 since the first is the scope creator)
    await [...Array(protocol.plans.length - 1)].forEach(async (_, i) => {
      // For each user create an id and push them onto the participants list
      const participantId = uuid();
      participants.push(participantId);

      // Put them in the users database as a participant and assign them a list of plans
      await db
        .get('users')
        .push({
          instanceId: participantId,
          protocolId,
          scopeId,
          role: 'participant',
          plan: i + 1
        })
        .write();
    });
  }

  // Get the user
  const user = await db
    .get('users')
    .find({ instanceId, scopeId, protocolId })
    .value();

  // If we didn't just create the scope, make sure we always return the list of other participants
  if (participants.length === 0) {
    const otherParticipants = await db
      .get('users')
      .filter({ scopeId, protocolId })
      .value();

    otherParticipants.forEach(participant => {
      if (participant.instanceId !== instanceId) {
        participants.push(participant.instanceId);
      }
    });
  }

  // Return the user, their assigned scopeId (passed to us or freshly created), their list of plans, and the other participants
  return { user, plans: protocol.plans[user.plan], participants };
};
