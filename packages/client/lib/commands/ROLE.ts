import { ArrayReply, BlobStringReply, Command, NumberReply } from '../RESP/types';

type MasterRole = [
  role: BlobStringReply<'master'>,
  replicationOffest: NumberReply,
  replicas: ArrayReply<[host: BlobStringReply, port: NumberReply, replicationOffest: NumberReply]>,
];

type SlaveRole = [
  role: BlobStringReply<'slave'>,
  masterHost: BlobStringReply,
  masterPort: NumberReply,
  state: BlobStringReply<'connect' | 'connecting' | 'sync' | 'connected'>,
  dataReceived: NumberReply
];

type SentinelRole = [
  role: BlobStringReply<'sentinel'>,
  masterNames: ArrayReply<BlobStringReply>
];

type Role = MasterRole | SlaveRole | SentinelRole;

export default {
  IS_READ_ONLY: true,
  FIRST_KEY_INDEX: undefined,
  transformArguments() {
    return ['ROLE'];
  },
  transformReply(reply: Role) {
    switch (reply[0] as Role[0]['DEFAULT']) {
      case 'master': {
        const [role, replicationOffest, replicas] = reply as MasterRole;
        return {
          role,
          replicationOffest,
          replicas: replicas.map(([host, port, replicationOffest]) => ({
            host,
            port,
            replicationOffest,
          })),
        };
      }

      case 'slave': {
        const [role, masterHost, masterPort, state, dataReceived] = reply as SlaveRole;
        return {
          role,
          master: {
            host: masterHost,
            port: masterPort,
          },
          state,
          dataReceived,
        };
      }

      case 'sentinel': {
        const [role, masterNames] = reply as SentinelRole;
        return {
          role,
          masterNames,
        };
      }
    }
  }
} as const satisfies Command;
