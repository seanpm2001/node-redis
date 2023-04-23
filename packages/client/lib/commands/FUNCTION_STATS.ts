// import { RedisCommandArguments } from '.';

// export function transformArguments(): RedisCommandArguments {
//     return ['FUNCTION', 'STATS'];
// }

// type FunctionStatsRawReply = [
//     'running_script',
//     null | [
//         'name',
//         string,
//         'command',
//         string,
//         'duration_ms',
//         number
//     ],
//     'engines',
//     Array<any> // "flat tuples" (there is no way to type that)
//     // ...[string, [
//     //     'libraries_count',
//     //     number,
//     //     'functions_count',
//     //     number
//     // ]]
// ];

// interface FunctionStatsReply {
//     runningScript: null | {
//         name: string;
//         command: string;
//         durationMs: number;
//     };
//     engines: Record<string, {
//         librariesCount: number;
//         functionsCount: number;
//     }>;
// }

// export function transformReply(reply: FunctionStatsRawReply): FunctionStatsReply {
//     const engines = Object.create(null);
//     for (let i = 0; i < reply[3].length; i++) {
//         engines[reply[3][i]] = {
//             librariesCount: reply[3][++i][1],
//             functionsCount: reply[3][i][3]
//         };
//     }

//     return {
//         runningScript: reply[1] === null ? null : {
//             name: reply[1][1],
//             command: reply[1][3],
//             durationMs: reply[1][5]
//         },
//         engines
//     };
// }


// #!LUA name=math \n redis.register_function{ function_name = "square", callback = function(keys, args) return args[1] * args[1] end, flags = { "no-writes" } }

import { Command, TuplesToMapReply, BlobStringReply, NullReply, NumberReply, MapReply } from '../RESP/types';

type FunctionStatsReply = TuplesToMapReply<[
  [BlobStringReply<'running_script'>, NullReply | TuplesToMapReply<[
    [BlobStringReply<'name'>, BlobStringReply],
    [BlobStringReply<'command'>, BlobStringReply],
    [BlobStringReply<'duration_ms'>, NumberReply]
  ]>],
  [BlobStringReply<'engines'>, MapReply<BlobStringReply, TuplesToMapReply<[
    [BlobStringReply<'libraries_count'>, NumberReply],
    [BlobStringReply<'functions_count'>, NumberReply]
  ]>>]
]>;

export default {
  IS_READ_ONLY: true,
  FIRST_KEY_INDEX: undefined,
  transformArguments() {
    return ['FUNCTION', 'STATS'];
  },
  transformReply: {
    2: (reply) => {

    },
    3: undefined as unknown as () => 
  }
} as const satisfies Command;
