const {
  detail,
  unserialize,
  ObjectMessage,
  protobuf
} = require('@openmined/syft.js');
const uuid = require('uuid/v4');
const bcrypt = require('bcrypt');

const data = require('./data.json');

// Admin user credentials
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin-password';
const adminUserId = uuid();

const detailToObject = text => {
  const detailedObject = detail(text);

  return {
    id: detailedObject.id.toString(),
    contents: text,
    createdBy: adminUserId
  };
};

const protobufToObject = (bin, obj) => {
  const detailedObject = unserialize(null, bin, obj);

  return {
    id:
      detailedObject instanceof ObjectMessage
        ? detailedObject.contents.id.toString()
        : detailedObject.id.toString(),
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

const protocol3 = data['protobuf-protocol'].protocol;
const pbPlan1 = data['protobuf-protocol'].plan1;
const pbPlan2 = data['protobuf-protocol'].plan2;

const exampleProtocols = [
  detailToObject(protocol1),
  detailToObject(protocol2),
  protobufToObject(protocol3, protobuf.syft_proto.messaging.v1.Protocol)
];

const examplePlans = [
  detailToObject(bobPlan),
  detailToObject(theoPlan),
  detailToObject(alicePlan),
  detailToObject(jasonPlan),
  detailToObject(andyPlan),
  // NOTE: these are not Plans temporarily; Plan can't be serialized yet
  protobufToObject(pbPlan1, protobuf.syft_proto.messaging.v1.ObjectMessage),
  protobufToObject(pbPlan2, protobuf.syft_proto.messaging.v1.ObjectMessage)
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
