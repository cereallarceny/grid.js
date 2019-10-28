import {readFileSync} from 'fs';
import {join} from 'path';

export const millionaire_problem_protocol = readFileSync(join(__dirname, 'mp-protocol.txt'), 'utf-8').toString();
export const millionaire_problem_protocol_id = '2185004241';

export const multi_millionaire_problem_protocol = readFileSync(join(__dirname, 'mmp-protocol.txt'), 'utf-8').toString();
export const multi_millionaire_problem_protocol_id = '56437494566';

export const millionaire_problem_plan1 = readFileSync(join(__dirname, 'mp-plan1.txt'), 'utf-8').toString();
export const millionaire_problem_plan1_id = '83508139671';
export const millionaire_problem_plan1_worker = 'alice';

export const millionaire_problem_plan2 = readFileSync(join(__dirname, 'mp-plan2.txt'), 'utf-8').toString();
export const millionaire_problem_plan2_id = '8972290983';
export const millionaire_problem_plan2_worker = 'bob';

export const millionaire_problem_plan3 = readFileSync(join(__dirname, 'mp-plan3.txt'), 'utf-8').toString();
export const millionaire_problem_plan3_id = '6878158540';
export const millionaire_problem_plan3_worker = 'jon';
