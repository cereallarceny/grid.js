const fs = require('fs');

const examplePlan = `
(19,
 (57895708650,
  (21,
   (((31,
      (1,
       ((6,
         ((5, (b'abs',)),
          (23, (25208484331, 51684948173, b'dan', None, (10, (1,)), True)),
          (6, ()),
          (0, ()))),
        (62869536441,)))),
     (31,
      (1,
       ((6,
         ((5, (b'__add__',)),
          (23, (9655331350, 62869536441, b'dan', None, None, True)),
          (6,
           ((23,
             (89426198911, 4863941835, b'dan', None, (10, (1,)), False)),)),
          (0, ()))),
        (3263650475,))))),
    (6, (51684948173,)),
    (6, (3263650475,)))),
  (20,
   ((1, (4863941835,)),
    (1,
     ((13, (4863941835, b'binary_tensor_data', None, None, None, None)),)))),
  True,
  True,
  (5, (b'plan',)),
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
