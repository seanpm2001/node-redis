import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import SMOVE from './SMOVE';

describe('SMOVE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      SMOVE.transformArguments('source', 'destination', 'member'),
      ['SMOVE', 'source', 'destination', 'member']
    );
  });

  testUtils.testAll('sMove', async client => {
    assert.equal(
      await client.sMove('{tag}source', '{tag}destination', 'member'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
