const { detail } = require('syft.js');

const detailToObject = text => {
  const detailedObject = detail(text);

  return {
    id: detailedObject.id.toString(),
    contents: text
  };
};

const assignmentIds = ['37163364537', '70249651082', '81654059278'];

const protocol = `
(24,
 (18797824900,
  None,
  None,
  (1,
   ((6, ((5, (b'assignment1',)), ${assignmentIds[0]})),
    (6, ((5, (b'assignment2',)), ${assignmentIds[1]})),
    (6, ((5, (b'assignment3',)), ${assignmentIds[2]})))),
  False))
`;

const plan = id => `
(21,
  (${id},
  (23,
    ((6,
      ((33,
        (1,
          ((6,
            ((5, (b'abs')),
            (25, (25208484331, 51684948173, (5, (b'dan')), None, (11, (1,)), True)),
            (6, ()),
            (0, ()))),
          (1, (62869536441,))))),
      (33,
        (1,
          ((6,
            ((5, (b'__add__')),
            (25, (9655331350, 62869536441, (5, (b'dan')), None, None, True)),
            (6,
              ((25, (89426198911, 4863941835, (5, (b'dan')), None, (11, (1,)), False)),)),
            (0, ()))),
          (1, (3263650475,))))))),
    (6, (51684948173,)),
    (6, (3263650475,)))),
  (22,
    ((1, (4863941835,)),
    (1,
      ((14, (4863941835, (5,(b'somethinghere')), None, None, None, None)),)))),
  True,
  True,
  (5, (b'plan')),
  None,
  None))
`;

module.exports.exampleProtocols = [detailToObject(protocol)];

module.exports.examplePlans = assignmentIds.map(i => detailToObject(plan(i)));
