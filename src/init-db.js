import low from 'lowdb';
import FileAsync from 'lowdb/adapters/FileAsync';

import examplePlan from './example-plan';

export default async () => {
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

  const adapter = new FileAsync('db.json', {
    defaultValue: DEFAULT_DATA
  });

  return await low(adapter);
};
