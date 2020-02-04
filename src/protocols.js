import { unserialize, protobuf } from '@openmined/syft.js';
import { shortenId as s } from './_helpers';
const uuid = require('uuid/v4');

// Get the protocol the worker is requesting
// If they also pass a scopeId, they must be a participant
export const getProtocol = async (
  db,
  { workerId, scopeId, protocolId },
  logger
) => {
  if (!protocolId) throw new Error('Please supply a protocolId');

  // Create an empty participants list which we will populate later
  const participants = [];

  // Get the protocol of that worker
  const protocol = await db.collection('protocols').findOne({ id: protocolId });
  if (!protocol) throw new Error(`Cannot find protocol ${protocolId}`);
  else logger.log(`Found protocol ${protocolId}`);

  // We also need to detail the retrieved protocol to read the plan we will need to fetch later
  let detailedProtocol = unserialize(
    null,
    protocol.contents,
    protobuf.syft_proto.messaging.v1.Protocol
  );

  // If we don't have a scopeId, we must be creating a new one
  if (!scopeId) {
    // Give this new scope an id
    scopeId = uuid();

    logger.log(`No scopeId supplied, generating a new one ${s(scopeId)}`);

    // Assign the creator the 0th plan
    const creatorPlanIndex = 0;

    // Add the worker creating this new scope to the database and designate their role as "creator"
    await db.collection('workers').insertOne({
      workerId,
      protocolId,
      scopeId,
      role: 'creator',
      plan: creatorPlanIndex,
      assignment: detailedProtocol.plans[creatorPlanIndex][0]
    });

    logger.log(`Created new creator worker ${s(workerId)}`);

    // Create all the other participants (detailedProtocol.plans.length - 1 since the first is the scope creator)
    [...Array(detailedProtocol.plans.length - 1)].forEach((_, i) => {
      // For each worker create an id and push them onto the participants list
      const participantId = uuid();

      // Each participant will get a plan greater than the 0th plan
      const participantPlanIndex = i + 1;

      // Assign each participant their protocol and scope, as well as their participant role, and specific plan
      participants.push({
        workerId: participantId,
        protocolId,
        scopeId,
        role: 'participant',
        plan: participantPlanIndex,
        assignment: detailedProtocol.plans[participantPlanIndex][0]
      });
    });

    // Put those participants in the workers database
    await db.collection('workers').insertMany(participants);

    logger.log(
      `Created ${participants.length} new participant worker${
        participants.length !== 1 ? 's' : ''
      } for scope ${s(scopeId)}`
    );
  }

  // Get the worker
  const worker = await db
    .collection('workers')
    .findOne({ workerId, scopeId, protocolId });

  if (worker)
    logger.log(
      `Found ${worker.role} worker ${s(workerId)} with scope ${s(scopeId)}`
    );

  // Get the worker's assigned plan
  const plan = await db
    .collection('plans')
    .findOne({ id: detailedProtocol.plans[worker.plan][1].toString() });

  if (plan)
    logger.log(
      `Found plan ${detailedProtocol.plans[
        worker.plan
      ][1].toString()} for worker ${s(workerId)}`
    );

  // If we didn't just create the scope, make sure we always return the list of other participants
  if (participants.length === 0) {
    const otherParticipants = await db
      .collection('workers')
      .find({ scopeId, protocolId })
      .toArray();

    logger.log(
      `Found ${otherParticipants.length - 1} other participant worker${
        otherParticipants.length - 1 !== 1 ? 's' : ''
      } with scope ${s(scopeId)}`
    );

    otherParticipants.forEach(participant => {
      if (participant.workerId !== workerId) {
        participants.push(participant);
      }
    });
  }

  // Create a map between each other worker's workerId and their assignment
  const participantAssigments = {};

  participants.forEach(({ workerId, assignment }) => {
    participantAssigments[workerId] = assignment;
  });

  // Return the worker, their assigned scopeId (passed to us or freshly created), their protocol, their plan, and the list of other participants
  return {
    worker,
    protocol: protocol.contents,
    plan: plan.contents,
    participants: participantAssigments
  };
};
