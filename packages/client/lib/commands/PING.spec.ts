import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import PING from './PING';

describe.only('PING', () => {
  describe('transformArguments', () => {
    it('default', () => {
      assert.deepEqual(
        PING.transformArguments(),
        ['PING']
      );
    });

    it('with message', () => {
      assert.deepEqual(
        PING.transformArguments('message'),
        ['PING', 'message']
      );
    });
  });

  testUtils.testAll('ping', async client => {
    assert.equal(
      await client.ping(),
      'PONG'
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
