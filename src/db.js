import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';

import examplePlan from './example-plan';

export default () => {
  const DEFAULT_DATA = {
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
    users: []
  };

  // Create a LowDB data based on the default data containing a sample protocol
  const adapter = new FileSync('db.json', {
    defaultValue: DEFAULT_DATA
  });

  // Return this DB adapter
  return low(adapter);
};
