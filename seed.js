const fs = require('fs');

const examplePlan = `
(19,
 (((24,
    (1,
     (6,
      ((6,
        ((5, (b'__add__',)),
         (20,
          (23885703668, 30300883787, 85156589176, None, (13, (2,)), False)),
         (6,
          ((20,
            (23885703668,
             30300883787,
             85156589176,
             None,
             (13, (2,)),
             False)),)),
         (0, ()))),
       (6, (53361601662,)))))),
   (24,
    (1,
     (6,
      ((6,
        ((5, (b'torch.abs',)),
         None,
         (6,
          ((20, (50671613206, 53361601662, 85156589176, None, None, True)),)),
         (0, ()))),
       (6, (68554228008,)))))),
   (24, (9, 53361601662))),
  85156589176,
  (1, (30300883787,)),
  (6, (68554228008,)),
  (5, (b'plan_double_abs',)),
  None,
  None,
  True))
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
