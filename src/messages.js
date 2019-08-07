const uuid = require('uuid/v4');

// We need to save the user to the list of users and assign them the protocolId
// After that, return the protocol the user asked about
export const getProtocol = async (db, data) => {
  const { instanceId, protocolId } = data;

  // Store a new record linking the user's instanceId to their chosen protocolId
  await db
    .get('users')
    .push({ instanceId, protocolId })
    .write();

  // Get the appropriate protocol from the database and return it
  return await db
    .get('protocols')
    .find({ id: protocolId })
    .value();
};

// Given an instanceId and a scopeId, find the exact user
// Once this user is found, get the specific list of plans assigned to them
export const getPlans = async (db, data) => {
  const { instanceId, scopeId } = data;

  // Get the user
  const user = await db
    .get('users')
    .find({ instanceId, scopeId })
    .value();

  // Get the protocol of that user
  const protocol = await db
    .get('protocols')
    .find({ id: user.protocolId })
    .value();

  // Return that user's specific plans
  return protocol.plans[user.plan];
};

// Create and assign a scope for a user, assigning them as the creator, and give them the first plan
// After that, for each of the participants we need to create their records with the same scope, assigning them as participants, and giving them the other plans
// We just need to return the scopeId and the creator's plan index, syft.js will handle picking it from the chosen protocol
export const createScope = async (db, data) => {
  const { instanceId, participants, protocolId } = data;
  const scopeId = uuid(),
    creatorPlan = 0;

  // Update the creator of the scope as the creator and assign them a plan
  await db
    .get('users')
    .find({ instanceId })
    .assign({
      scopeId,
      role: 'creator',
      plan: creatorPlan
    })
    .write();

  // For each of the participants, add them to the database
  await participants.forEach(async (participant, i) => {
    await db
      .get('users')
      .push({
        instanceId: participant,
        protocolId,
        scopeId,
        role: 'participant',
        plan: i + 1
      })
      .write();
  });

  // Return only the scopeId that's been created and the plan index that the creator needs to handle
  return { scopeId, creatorPlan };
};
