import { RedisScriptConfig, SHA1 } from '../lua-script';
import { TYPES } from './decoder';
import { VerbatimString } from './verbatim-string';

export type RespTypes = typeof TYPES;

export type RespTypesUnion = RespTypes[keyof RespTypes];

type RespType<
  RESP_TYPE extends RespTypesUnion,
  DEFAULT,
  TYPES = never,
  FLAG_TYPES = DEFAULT | TYPES
> = (DEFAULT | TYPES) & {
  RESP_TYPE: RESP_TYPE;
  DEFAULT: DEFAULT;
  TYPES: TYPES;
  FLAG: Flag<FLAG_TYPES>;
};

export type NullReply = RespType<
  RespTypes['NULL'],
  null
>;
export type BooleanReply<
  T extends boolean = boolean
> = RespType<
  RespTypes['BOOLEAN'],
  T
>;
export type NumberReply<
  T extends number = number
> = RespType<
  RespTypes['NUMBER'],
  T,
  `${T}`,
  number | string
>;
export type BigNumberReply<
  T extends bigint = bigint
> = RespType<
  RespTypes['BIG_NUMBER'],
  T,
  number | `${T}`,
  bigint | number | string
>;
export type DoubleReply<
  T extends number = number
> = RespType<
  RespTypes['DOUBLE'],
  T,
  `${T}`,
  number | string
>;
export type SimpleStringReply<
  T extends string = string
> = RespType<
  RespTypes['SIMPLE_STRING'],
  T,
  Buffer,
  string | Buffer
>;
export type BlobStringReply<
  T extends string = string
> = RespType<
  RespTypes['BLOB_STRING'],
  T,
  Buffer,
  string | Buffer
>;
export type VerbatimStringReply<
  T extends string = string
> = RespType<
  RespTypes['VERBATIM_STRING'],
  T,
  Buffer | VerbatimString,
  string | Buffer | VerbatimString
>;
export type SimpleErrorReply = RespType<
  RespTypes['SIMPLE_ERROR'],
  Buffer
>;
export type BlobErrorReply = RespType<
  RespTypes['BLOB_ERROR'],
  Buffer
>;
export type ArrayReply<T> = RespType<
  RespTypes['ARRAY'],
  Array<T>,
  never,
  Array<any>
>;
export type TuplesReply<T extends [...Array<unknown>]> = RespType<
  RespTypes['ARRAY'],
  T,
  never,
  Array<any>
>;
export type SetReply<T> = RespType<
  RespTypes['SET'],
  Array<T>,
  Set<T>,
  Array<any> | Set<any>
>;
export type MapReply<K, V> = RespType<
  RespTypes['MAP'],
  { [key: string]: V },
  Map<K, V> | Array<K | V>,
  Map<any, any> | Array<any>
>;

type MapKeyValue = [key: BlobStringReply, value: unknown];

type MapTuples = Array<MapKeyValue>;

export type TuplesToMapReply<T extends MapTuples> = RespType<
  RespTypes['MAP'], 
  {
    [P in T[number] as P[0] extends BlobStringReply<infer S> ? S : never]: P[1];
  },
  Map<T[number][0], T[number][1]> | FlattenTuples<T>
>;

type FlattenTuples<T> = (
  T extends [] ? [] :
  T extends [MapKeyValue] ? T[0] :
  T extends [MapKeyValue, ...infer R] ? [
    ...T[0],
    ...FlattenTuples<R>
  ] :
  never
);

export type ReplyUnion = NullReply | BooleanReply | NumberReply | BigNumberReply | DoubleReply | SimpleStringReply | BlobStringReply | VerbatimStringReply | SimpleErrorReply | BlobErrorReply |
  // cannot reuse ArrayReply, SetReply and MapReply because of circular reference
  RespType<
    RespTypes['ARRAY'],
    Array<ReplyUnion>
  > |
  RespType<
    RespTypes['SET'],
    Array<ReplyUnion>,
    Set<ReplyUnion>
  > |
  RespType<
    RespTypes['MAP'],
    { [key: string]: ReplyUnion },
    Map<ReplyUnion, ReplyUnion> | Array<ReplyUnion | ReplyUnion>
  >;

export type Reply = ReplyWithFlags<ReplyUnion, {}>;

export type Flag<T> = ((...args: any) => T) | (new (...args: any) => T);

type RespTypeUnion<T> = T extends RespType<RespTypesUnion, unknown, unknown, infer FLAG_TYPES> ? FLAG_TYPES : never;

export type Flags = {
  [P in RespTypesUnion]?: Flag<RespTypeUnion<Extract<ReplyUnion, RespType<P, any, any, any>>>>;
};

type MapKey<
  T,
  FLAGS extends Flags
> = ReplyWithFlags<T, FLAGS & {
  // simple and blob strings as map keys decoded as strings
  [TYPES.SIMPLE_STRING]: StringConstructor;
  [TYPES.BLOB_STRING]: StringConstructor;
}>;

export type ReplyWithFlags<
  REPLY,
  FLAGS extends Flags
> = (
  // if REPLY is a type, extract the coresponding type from FLAGS or use the default type
  REPLY extends RespType<infer RESP_TYPE, infer DEFAULT, infer TYPES, unknown> ? 
    FLAGS[RESP_TYPE] extends Flag<infer T> ?
      ReplyWithFlags<Extract<DEFAULT | TYPES, T>, FLAGS> :
      ReplyWithFlags<DEFAULT, FLAGS>
  : (
    // if REPLY is a known generic type, convert its generic arguments
    // TODO: tuples?
    REPLY extends Array<infer T> ? Array<ReplyWithFlags<T, FLAGS>> :
    REPLY extends Set<infer T> ? Set<ReplyWithFlags<T, FLAGS>> :
    REPLY extends Map<infer K, infer V> ? Map<MapKey<K, FLAGS>, ReplyWithFlags<V, FLAGS>> :
    // `Date` & `Buffer` are supersets of `Record`, so they need to be checked first
    REPLY extends Date ? REPLY :
    REPLY extends Buffer ? REPLY :
    REPLY extends Record<PropertyKey, any> ? {
      [P in keyof REPLY]: ReplyWithFlags<REPLY[P], FLAGS>;
    } :
    // otherwise, just return the REPLY as is
    REPLY
  )
);

export type TransformReply = (this: void, reply: any, preserve?: any) => any; // TODO;

export type RedisArgument = string | Buffer;

export type CommandArguments = Array<RedisArgument> & { preserve?: unknown };

export const REQUEST_POLICIES = {
  /**
   * TODO
   */
  ALL_NODES: 'all_nodes',
  /**
   * TODO
   */
  ALL_SHARDS: 'all_shards',
  /**
   * TODO
   */
  SPECIAL: 'special'
} as const;

export type REQUEST_POLICIES = typeof REQUEST_POLICIES;

export type RequestPolicies = REQUEST_POLICIES[keyof REQUEST_POLICIES];

export const RESPONSE_POLICIES = {
  /**
   * TODO
   */
  ONE_SUCCEEDED: 'one_succeeded',
  /**
   * TODO
   */
  ALL_SUCCEEDED: 'all_succeeded',
  /**
   * TODO
   */
  LOGICAL_AND: 'agg_logical_and',
  /**
   * TODO
   */
  SPECIAL: 'special'
} as const;

export type RESPONSE_POLICIES = typeof RESPONSE_POLICIES;

export type ResponsePolicies = RESPONSE_POLICIES[keyof RESPONSE_POLICIES];

export type CommandPolicies = {
  request?: RequestPolicies | null;
  response?: ResponsePolicies | null;
};

export type Command = {
  FIRST_KEY_INDEX?: number | ((this: void, ...args: Array<any>) => RedisArgument | undefined);
  IS_READ_ONLY?: boolean;
  POLICIES?: CommandPolicies;
  transformArguments(this: void, ...args: Array<any>): CommandArguments;
  TRANSFORM_LEGACY_REPLY?: boolean;
  transformReply: TransformReply | Record<RespVersions, TransformReply>;
};

export type RedisCommands = Record<string, Command>;

export type RedisModules = Record<string, RedisCommands>;

export interface RedisFunction extends Command {
  NUMBER_OF_KEYS?: number;
}

export type RedisFunctions = Record<string, Record<string, RedisFunction>>;

export type RedisScript = RedisScriptConfig & SHA1;

export type RedisScripts = Record<string, RedisScript>;

// TODO: move to Commander?
export interface CommanderConfig<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions
> {
  modules?: M;
  functions?: F;
  scripts?: S;
  /**
   * TODO
   */
  RESP?: RESP;
}

type Resp2Array<T> = (
  T extends [] ? [] :
  T extends [infer ITEM] ? [Resp2Reply<ITEM>] :
  T extends [infer ITEM, ...infer REST] ? [
    Resp2Reply<ITEM>,
    ...Resp2Array<REST>
  ] :
  T extends Array<infer ITEM> ? Array<Resp2Reply<ITEM>> :
  never
);

export type Resp2Reply<RESP3REPLY> = (
  RESP3REPLY extends RespType<infer RESP_TYPE, infer DEFAULT, infer TYPES, unknown> ?
    // TODO: RESP3 only scalar types
    RESP_TYPE extends RespTypes['DOUBLE'] ? BlobStringReply :
    RESP_TYPE extends RespTypes['ARRAY'] | RespTypes['SET'] ? RespType<
      RESP_TYPE,
      Resp2Array<DEFAULT>
    > :
    RESP_TYPE extends RespTypes['MAP'] ? RespType<
      RespTypes['ARRAY'],
      Resp2Array<Extract<TYPES, Array<any>>>
    > :
    RespType<
      RESP_TYPE,
      DEFAULT,
      TYPES
    > :
  RESP3REPLY
);

export type RespVersions = 2 | 3;

export type CommandReply<
  COMMAND extends Command,
  RESP extends RespVersions
> = (
  // if transformReply is a function, use its return type
  COMMAND['transformReply'] extends (...args: any) => infer T ? T :
  // if transformReply[RESP] is a function, use its return type
  COMMAND['transformReply'] extends Record<RESP, (...args: any) => infer T> ? T :
  // otherwise use the generic reply type
  Reply
);

export type CommandSignature<
  COMMAND extends Command,
  RESP extends RespVersions,
  FLAGS extends Flags
> = (...args: Parameters<COMMAND['transformArguments']>) => Promise<ReplyWithFlags<CommandReply<COMMAND, RESP>, FLAGS>>;

export type CommandWithPoliciesSignature<
  COMMAND extends Command,
  RESP extends RespVersions,
  FLAGS extends Flags,
  POLICIES extends CommandPolicies
> = (...args: Parameters<COMMAND['transformArguments']>) => Promise<
  ReplyWithPolicy<
    ReplyWithFlags<CommandReply<COMMAND, RESP>, FLAGS>,
    MergePolicies<COMMAND, POLICIES>
  >
>;

export type MergePolicies<
  COMMAND extends Command,
  POLICIES extends CommandPolicies
> = Omit<COMMAND['POLICIES'], keyof POLICIES> & POLICIES;

type ReplyWithPolicy<
  REPLY,
  POLICIES extends CommandPolicies,
> = (
  POLICIES['request'] extends REQUEST_POLICIES['SPECIAL'] ? never :
  POLICIES['request'] extends null | undefined ? REPLY :
  unknown extends POLICIES['request'] ? REPLY :
  POLICIES['response'] extends RESPONSE_POLICIES['SPECIAL'] ? never :
  POLICIES['response'] extends RESPONSE_POLICIES['ALL_SUCCEEDED' | 'ONE_SUCCEEDED' | 'LOGICAL_AND'] ? REPLY :
  // otherwise, return array of replies
  Array<REPLY>
);

const SAME = {
  transformArguments(key: string): Array<string> {
    return ['GET', key];
  },
  transformReply: () => 'default' as const
} satisfies Command;

type SAME_DEFAULT = CommandWithPoliciesSignature<
  typeof SAME,
  2,
  {},
  {
    request: REQUEST_POLICIES['ALL_NODES'];
    response: RESPONSE_POLICIES['SPECIAL'];
  }
>;

// type SAME_RESP2 = CommandReply<typeof SAME, 2>;
// type SAME_COMMAND_RESP2 = CommandSignuture<typeof SAME, 2>;
// type SAME_RESP3 = CommandReply<typeof SAME, 3>;
// type SAME_COMMAND_RESP3 = CommandSignuture<typeof SAME, 3>;

// interface Test {
//   /**
//    * This is a test
//    */
//   a: 'a';
// }

// const DIFFERENT = {
//   transformArguments(key: string): Array<string> {
//     return ['GET', key];
//   },
//   transformReply: {
//     2: () => null as any as Test,
//     3: () => '3' as const
//   }
// } satisfies Command;

// type DIFFERENT_RESP2 = CommandReply<typeof DIFFERENT, 2>;
// type DIFFERENT_COMMAND_RESP2 = CommandSignuture<typeof DIFFERENT, 2>;
// type DIFFERENT_RESP3 = CommandReply<typeof DIFFERENT, 3>;
// type DIFFERENT_COMMAND_RESP3 = CommandSignuture<typeof DIFFERENT, 3>;

// const a = null as any as DIFFERENT_COMMAND_RESP2;

// const b = await a('a');

// b.a