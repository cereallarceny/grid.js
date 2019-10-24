const fs = require('fs');

const { exampleProtocol, examplePlans } = require('./samples');

// A simple function we can run to seed the database
function seedDB() {
  const seedData = {
    protocols: exampleProtocol,
    plans: examplePlans,
    users: [{}]
  };

  Object.keys(seedData).forEach(index => {
    fs.writeFile(
      `seeds/${index}.json`,
      JSON.stringify(seedData[index]),
      'utf8',
      () => console.log(`Seed file \"${index}\" created.`)
    );
  });
}

module.exports = seedDB();
