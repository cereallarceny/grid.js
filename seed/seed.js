const fs = require('fs');

const { exampleProtocols, examplePlans, exampleUsers } = require('./samples');

// A simple function we can run to seed the database
function seedDB() {
  const seedData = {
    protocols: exampleProtocols,
    plans: examplePlans,
    users: exampleUsers
  };

  Object.keys(seedData).forEach(index => {
    fs.writeFile(
      `tmp/${index}.json`,
      JSON.stringify(seedData[index]),
      'utf8',
      () => console.log(`Seed file \"${index}\" created.`)
    );
  });
}

module.exports = seedDB();
