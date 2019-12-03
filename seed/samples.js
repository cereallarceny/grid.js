const { detail } = require('syft.js');
const data = require('./data.json');

const detailToObject = text => {
  const detailedObject = detail(text);

  return {
    id: detailedObject.id.toString(),
    contents: text
  };
};

const protocol1 = data['three-way'].protocol;
const bobPlan = data['three-way'].bob;
const theoPlan = data['three-way'].theo;
const alicePlan = data['three-way'].alice;

const protocol2 = data['two-way'].protocol;
const jasonPlan = data['two-way'].jason;
const andyPlan = data['two-way'].andy;

module.exports.exampleProtocols = [
  detailToObject(protocol1),
  detailToObject(protocol2)
];

module.exports.examplePlans = [
  detailToObject(bobPlan),
  detailToObject(theoPlan),
  detailToObject(alicePlan),
  detailToObject(jasonPlan),
  detailToObject(andyPlan)
];
