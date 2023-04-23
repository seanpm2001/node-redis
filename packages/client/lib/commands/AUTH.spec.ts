import { strict as assert } from 'assert';
import AUTH from './AUTH';

describe('AUTH', () => {
  describe('transformArguments', () => {
    it('password only', () => {
      assert.deepEqual(
        AUTH.transformArguments({
          password: 'password'
        }),
        ['AUTH', 'password']
      );
    });

    it('username & password', () => {
      assert.deepEqual(
        AUTH.transformArguments({
          username: 'username',
          password: 'password'
        }),
        ['AUTH', 'username', 'password']
      );
    });
  });
});
