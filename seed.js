const fs = require('fs');

const examplePlan = `
(19,
  (50135235179,
  (21,
    ((6,
      ((31,
        (1,
          ((6,
            ((5, (b'abs')),
            (23, (25208484331, 51684948173, (5, (b'dan')), None, (10, (1,)), True)),
            (6, ()),
            (0, ()))),
          (1, (62869536441,))))),
      (31,
        (1,
          ((6,
            ((5, (b'__add__')),
            (23, (9655331350, 62869536441, (5, (b'dan')), None, None, True)),
            (6,
              ((23, (89426198911, 4863941835, (5, (b'dan')), None, (10, (1,)), False)),)),
            (0, ()))),
          (1, (3263650475,))))))),
    (6, (51684948173,)),
    (6, (3263650475,)))),
  (20,
    ((1, (37249328214,)),
    (1,
      ((13, (86275536166, (5,(b'somethinghere')), None, None, None, None)),)))),
  True,
  True,
  (5, (b'plan')),
  None,
  None))
`;

// A simple function we can run to seed the database
function seedDB() {
  const seedData = {
    protocols: [
      {
        id: 'millionaire-problem',
        plans: [
          [examplePlan, examplePlan, examplePlan],
          [examplePlan, examplePlan, examplePlan],
          [examplePlan, examplePlan, examplePlan]
        ]
      }
    ],
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
