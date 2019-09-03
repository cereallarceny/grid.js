import { shortenId as s } from './_helpers';

const uuid = require('uuid/v4');

// Get the plans of a user given an instanceId and protocolId
// If they also pass a scopeId, they must
export const getPlans = async (
  db,
  { instanceId, scopeId, protocolId },
  logger
) => {
  if (!protocolId) throw new Error('Please supply a protocolId');

  // Create an empty participants list which we will populate later
  const participants = [];

  // Get the protocol of that user
  const protocol = await db.collection('protocols').findOne({ id: protocolId });
  if (!protocol) throw new Error(`Cannot find protocol '${protocolId}'`);
  else logger.log(`Found protocol '${protocolId}'`);

  // If we don't have a scopeId, we must be creating a new one
  if (!scopeId) {
    // Give this new scope an id
    scopeId = uuid();

    logger.log(`No scopeId supplied, generating a new one '${s(scopeId)}'`);

    // Add the user creating this new scope to the database and assign them as the creator with the 0th list of plans
    const newCreator = await db.collection('users').insertOne({
      instanceId,
      protocolId,
      scopeId,
      role: 'creator',
      plan: 0
    });
    if (!newCreator)
      throw new Error(`Cannot create new creator user '${s(instanceId)}'`);
    else logger.log(`Created new creator user '${s(instanceId)}'`);

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

    // Put those participants in the users database
    const newParticipants = await db
      .collection('users')
      .insertMany(participants);
    if (!newParticipants)
      throw new Error(
        `Cannot create new participant users for scope '${s(scopeId)}'`
      );
    else
      logger.log(
        `Created ${participants.length} new participant user${
          participants !== 1 ? 's' : ''
        } for scope '${s(scopeId)}'`
      );
  }

  // Get the user
  const user = await db
    .collection('users')
    .findOne({ instanceId, scopeId, protocolId });
  if (!user)
    throw new Error(
      `Cannot find user '${s(instanceId)}' with scope '${s(scopeId)}'`
    );
  else
    logger.log(
      `Found ${user.role} user '${s(instanceId)}' with scope '${s(scopeId)}'`
    );

  // If we didn't just create the scope, make sure we always return the list of other participants
  if (participants.length === 0) {
    const otherParticipants = await db
      .collection('users')
      .find({ scopeId, protocolId })
      .toArray();
    if (!otherParticipants)
      throw new Error(
        `Cannot find other participant users with scope '${s(scopeId)}'`
      );
    else
      logger.log(
        `Found ${otherParticipants.length - 1} other participant user${
          otherParticipants.length - 1 !== 1 ? 's' : ''
        } with scope '${s(scopeId)}'`
      );

    otherParticipants.forEach(participant => {
      if (participant.instanceId !== instanceId) {
        participants.push(participant);
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
