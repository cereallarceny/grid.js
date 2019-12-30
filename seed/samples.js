const { detail } = require('@openmined/syft.js');
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

const protocol1 = data['three-way'].protocol;
const bobPlan = data['three-way'].bob;
const theoPlan = data['three-way'].theo;
const alicePlan = data['three-way'].alice;

const protocol2 = data['two-way'].protocol;
const jasonPlan = data['two-way'].jason;
const andyPlan = data['two-way'].andy;

const exampleProtocols = [detailToObject(protocol1), detailToObject(protocol2)];

const examplePlans = [
  detailToObject(bobPlan),
  detailToObject(theoPlan),
  detailToObject(alicePlan),
  detailToObject(jasonPlan),
  detailToObject(andyPlan)
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
