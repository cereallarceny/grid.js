const { unserialize, ObjectMessage, protobuf } = require('@openmined/syft.js');
const uuid = require('uuid/v4');
const bcrypt = require('bcrypt');

const data = require('./data.json');

// Admin user credentials
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin-password';
const adminUserId = uuid();

const protobufToObject = (bin, obj) => {
  const detailedObject = unserialize(null, bin, obj);

  return {
    id: detailedObject.id.toString(),
    contents: bin,
    createdBy: adminUserId
  };
};

const protocol1 = data['three-way'].protocol;
const bobPlan = data['three-way'].bob;
const theoPlan = data['three-way'].theo;
const alicePlan = data['three-way'].alice;

const protocol2 = data['two-way'].protocol;
const jasonPlan = data['two-way'].jason;
const andyPlan = data['two-way'].andy;

const exampleProtocols = [
  protobufToObject(protocol1, protobuf.syft_proto.messaging.v1.Protocol),
  protobufToObject(protocol2, protobuf.syft_proto.messaging.v1.Protocol)
];

const examplePlans = [
  protobufToObject(bobPlan, protobuf.syft_proto.messaging.v1.Plan),
  protobufToObject(theoPlan, protobuf.syft_proto.messaging.v1.Plan),
  protobufToObject(alicePlan, protobuf.syft_proto.messaging.v1.Plan),
  protobufToObject(jasonPlan, protobuf.syft_proto.messaging.v1.Plan),
  protobufToObject(andyPlan, protobuf.syft_proto.messaging.v1.Plan)
];

const exampleUsers = [
  {
    id: adminUserId,
    username: adminUsername,
    password: bcrypt.hashSync(adminPassword, 10) //auto-gen a salt and hash with 10 rounds - https://www.npmjs.com/package/bcrypt
  }
];

module.exports = {
  exampleProtocols,
  examplePlans,
  exampleUsers
};
