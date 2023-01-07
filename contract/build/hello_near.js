function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object.keys(descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;
  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }
  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);
  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }
  if (desc.initializer === void 0) {
    Object.defineProperty(target, property, desc);
    desc = null;
  }
  return desc;
}

// make PromiseIndex a nominal typing
var PromiseIndexBrand;
(function (PromiseIndexBrand) {
  PromiseIndexBrand[PromiseIndexBrand["_"] = -1] = "_";
})(PromiseIndexBrand || (PromiseIndexBrand = {}));
const TYPE_KEY = "typeInfo";
var TypeBrand;
(function (TypeBrand) {
  TypeBrand["BIGINT"] = "bigint";
  TypeBrand["DATE"] = "date";
})(TypeBrand || (TypeBrand = {}));
const ERR_INCONSISTENT_STATE = "The collection is an inconsistent state. Did previous smart contract execution terminate unexpectedly?";
const ERR_INDEX_OUT_OF_BOUNDS = "Index out of bounds";
function u8ArrayToBytes(array) {
  return array.reduce((result, value) => `${result}${String.fromCharCode(value)}`, "");
}
// TODO this function is a bit broken and the type can't be string
// TODO for more info: https://github.com/near/near-sdk-js/issues/78
function bytesToU8Array(bytes) {
  return Uint8Array.from([...bytes].map(byte => byte.charCodeAt(0)));
}
/**
 * Asserts that the expression passed to the function is truthy, otherwise throws a new Error with the provided message.
 *
 * @param expression - The expression to be asserted.
 * @param message - The error message to be printed.
 */
function assert(expression, message) {
  if (!expression) {
    throw new Error("assertion failed: " + message);
  }
}
function getValueWithOptions(value, options = {
  deserializer: deserialize
}) {
  const deserialized = deserialize(value);
  if (deserialized === undefined || deserialized === null) {
    return options?.defaultValue ?? null;
  }
  if (options?.reconstructor) {
    return options.reconstructor(deserialized);
  }
  return deserialized;
}
function serializeValueWithOptions(value, {
  serializer
} = {
  serializer: serialize
}) {
  return serializer(value);
}
function serialize(valueToSerialize) {
  return JSON.stringify(valueToSerialize, function (key, value) {
    if (typeof value === "bigint") {
      return {
        value: value.toString(),
        [TYPE_KEY]: TypeBrand.BIGINT
      };
    }
    if (typeof this[key] === "object" && this[key] !== null && this[key] instanceof Date) {
      return {
        value: this[key].toISOString(),
        [TYPE_KEY]: TypeBrand.DATE
      };
    }
    return value;
  });
}
function deserialize(valueToDeserialize) {
  return JSON.parse(valueToDeserialize, (_, value) => {
    if (value !== null && typeof value === "object" && Object.keys(value).length === 2 && Object.keys(value).every(key => ["value", TYPE_KEY].includes(key))) {
      switch (value[TYPE_KEY]) {
        case TypeBrand.BIGINT:
          return BigInt(value["value"]);
        case TypeBrand.DATE:
          return new Date(value["value"]);
      }
    }
    return value;
  });
}

/**
 * A Promise result in near can be one of:
 * - NotReady = 0 - the promise you are specifying is still not ready, not yet failed nor successful.
 * - Successful = 1 - the promise has been successfully executed and you can retrieve the resulting value.
 * - Failed = 2 - the promise execution has failed.
 */
var PromiseResult;
(function (PromiseResult) {
  PromiseResult[PromiseResult["NotReady"] = 0] = "NotReady";
  PromiseResult[PromiseResult["Successful"] = 1] = "Successful";
  PromiseResult[PromiseResult["Failed"] = 2] = "Failed";
})(PromiseResult || (PromiseResult = {}));
/**
 * A promise error can either be due to the promise failing or not yet being ready.
 */
var PromiseError;
(function (PromiseError) {
  PromiseError[PromiseError["Failed"] = 0] = "Failed";
  PromiseError[PromiseError["NotReady"] = 1] = "NotReady";
})(PromiseError || (PromiseError = {}));

/*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function assertNumber(n) {
  if (!Number.isSafeInteger(n)) throw new Error(`Wrong integer: ${n}`);
}
function chain(...args) {
  const wrap = (a, b) => c => a(b(c));
  const encode = Array.from(args).reverse().reduce((acc, i) => acc ? wrap(acc, i.encode) : i.encode, undefined);
  const decode = args.reduce((acc, i) => acc ? wrap(acc, i.decode) : i.decode, undefined);
  return {
    encode,
    decode
  };
}
function alphabet(alphabet) {
  return {
    encode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('alphabet.encode input should be an array of numbers');
      return digits.map(i => {
        assertNumber(i);
        if (i < 0 || i >= alphabet.length) throw new Error(`Digit index outside alphabet: ${i} (alphabet: ${alphabet.length})`);
        return alphabet[i];
      });
    },
    decode: input => {
      if (!Array.isArray(input) || input.length && typeof input[0] !== 'string') throw new Error('alphabet.decode input should be array of strings');
      return input.map(letter => {
        if (typeof letter !== 'string') throw new Error(`alphabet.decode: not string element=${letter}`);
        const index = alphabet.indexOf(letter);
        if (index === -1) throw new Error(`Unknown letter: "${letter}". Allowed: ${alphabet}`);
        return index;
      });
    }
  };
}
function join(separator = '') {
  if (typeof separator !== 'string') throw new Error('join separator should be string');
  return {
    encode: from => {
      if (!Array.isArray(from) || from.length && typeof from[0] !== 'string') throw new Error('join.encode input should be array of strings');
      for (let i of from) if (typeof i !== 'string') throw new Error(`join.encode: non-string input=${i}`);
      return from.join(separator);
    },
    decode: to => {
      if (typeof to !== 'string') throw new Error('join.decode input should be string');
      return to.split(separator);
    }
  };
}
function padding(bits, chr = '=') {
  assertNumber(bits);
  if (typeof chr !== 'string') throw new Error('padding chr should be string');
  return {
    encode(data) {
      if (!Array.isArray(data) || data.length && typeof data[0] !== 'string') throw new Error('padding.encode input should be array of strings');
      for (let i of data) if (typeof i !== 'string') throw new Error(`padding.encode: non-string input=${i}`);
      while (data.length * bits % 8) data.push(chr);
      return data;
    },
    decode(input) {
      if (!Array.isArray(input) || input.length && typeof input[0] !== 'string') throw new Error('padding.encode input should be array of strings');
      for (let i of input) if (typeof i !== 'string') throw new Error(`padding.decode: non-string input=${i}`);
      let end = input.length;
      if (end * bits % 8) throw new Error('Invalid padding: string should have whole number of bytes');
      for (; end > 0 && input[end - 1] === chr; end--) {
        if (!((end - 1) * bits % 8)) throw new Error('Invalid padding: string has too much padding');
      }
      return input.slice(0, end);
    }
  };
}
function normalize(fn) {
  if (typeof fn !== 'function') throw new Error('normalize fn should be function');
  return {
    encode: from => from,
    decode: to => fn(to)
  };
}
function convertRadix(data, from, to) {
  if (from < 2) throw new Error(`convertRadix: wrong from=${from}, base cannot be less than 2`);
  if (to < 2) throw new Error(`convertRadix: wrong to=${to}, base cannot be less than 2`);
  if (!Array.isArray(data)) throw new Error('convertRadix: data should be array');
  if (!data.length) return [];
  let pos = 0;
  const res = [];
  const digits = Array.from(data);
  digits.forEach(d => {
    assertNumber(d);
    if (d < 0 || d >= from) throw new Error(`Wrong integer: ${d}`);
  });
  while (true) {
    let carry = 0;
    let done = true;
    for (let i = pos; i < digits.length; i++) {
      const digit = digits[i];
      const digitBase = from * carry + digit;
      if (!Number.isSafeInteger(digitBase) || from * carry / from !== carry || digitBase - digit !== from * carry) {
        throw new Error('convertRadix: carry overflow');
      }
      carry = digitBase % to;
      digits[i] = Math.floor(digitBase / to);
      if (!Number.isSafeInteger(digits[i]) || digits[i] * to + carry !== digitBase) throw new Error('convertRadix: carry overflow');
      if (!done) continue;else if (!digits[i]) pos = i;else done = false;
    }
    res.push(carry);
    if (done) break;
  }
  for (let i = 0; i < data.length - 1 && data[i] === 0; i++) res.push(0);
  return res.reverse();
}
const gcd = (a, b) => !b ? a : gcd(b, a % b);
const radix2carry = (from, to) => from + (to - gcd(from, to));
function convertRadix2(data, from, to, padding) {
  if (!Array.isArray(data)) throw new Error('convertRadix2: data should be array');
  if (from <= 0 || from > 32) throw new Error(`convertRadix2: wrong from=${from}`);
  if (to <= 0 || to > 32) throw new Error(`convertRadix2: wrong to=${to}`);
  if (radix2carry(from, to) > 32) {
    throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${radix2carry(from, to)}`);
  }
  let carry = 0;
  let pos = 0;
  const mask = 2 ** to - 1;
  const res = [];
  for (const n of data) {
    assertNumber(n);
    if (n >= 2 ** from) throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
    carry = carry << from | n;
    if (pos + from > 32) throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
    pos += from;
    for (; pos >= to; pos -= to) res.push((carry >> pos - to & mask) >>> 0);
    carry &= 2 ** pos - 1;
  }
  carry = carry << to - pos & mask;
  if (!padding && pos >= from) throw new Error('Excess padding');
  if (!padding && carry) throw new Error(`Non-zero padding: ${carry}`);
  if (padding && pos > 0) res.push(carry >>> 0);
  return res;
}
function radix(num) {
  assertNumber(num);
  return {
    encode: bytes => {
      if (!(bytes instanceof Uint8Array)) throw new Error('radix.encode input should be Uint8Array');
      return convertRadix(Array.from(bytes), 2 ** 8, num);
    },
    decode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('radix.decode input should be array of strings');
      return Uint8Array.from(convertRadix(digits, num, 2 ** 8));
    }
  };
}
function radix2(bits, revPadding = false) {
  assertNumber(bits);
  if (bits <= 0 || bits > 32) throw new Error('radix2: bits should be in (0..32]');
  if (radix2carry(8, bits) > 32 || radix2carry(bits, 8) > 32) throw new Error('radix2: carry overflow');
  return {
    encode: bytes => {
      if (!(bytes instanceof Uint8Array)) throw new Error('radix2.encode input should be Uint8Array');
      return convertRadix2(Array.from(bytes), 8, bits, !revPadding);
    },
    decode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('radix2.decode input should be array of strings');
      return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
    }
  };
}
function unsafeWrapper(fn) {
  if (typeof fn !== 'function') throw new Error('unsafeWrapper fn should be function');
  return function (...args) {
    try {
      return fn.apply(null, args);
    } catch (e) {}
  };
}
const base16 = chain(radix2(4), alphabet('0123456789ABCDEF'), join(''));
const base32 = chain(radix2(5), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'), padding(5), join(''));
chain(radix2(5), alphabet('0123456789ABCDEFGHIJKLMNOPQRSTUV'), padding(5), join(''));
chain(radix2(5), alphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZ'), join(''), normalize(s => s.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1')));
const base64 = chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'), padding(6), join(''));
const base64url = chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'), padding(6), join(''));
const genBase58 = abc => chain(radix(58), alphabet(abc), join(''));
const base58 = genBase58('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
genBase58('123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ');
genBase58('rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz');
const XMR_BLOCK_LEN = [0, 2, 3, 5, 6, 7, 9, 10, 11];
const base58xmr = {
  encode(data) {
    let res = '';
    for (let i = 0; i < data.length; i += 8) {
      const block = data.subarray(i, i + 8);
      res += base58.encode(block).padStart(XMR_BLOCK_LEN[block.length], '1');
    }
    return res;
  },
  decode(str) {
    let res = [];
    for (let i = 0; i < str.length; i += 11) {
      const slice = str.slice(i, i + 11);
      const blockLen = XMR_BLOCK_LEN.indexOf(slice.length);
      const block = base58.decode(slice);
      for (let j = 0; j < block.length - blockLen; j++) {
        if (block[j] !== 0) throw new Error('base58xmr: wrong padding');
      }
      res = res.concat(Array.from(block.slice(block.length - blockLen)));
    }
    return Uint8Array.from(res);
  }
};
const BECH_ALPHABET = chain(alphabet('qpzry9x8gf2tvdw0s3jn54khce6mua7l'), join(''));
const POLYMOD_GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
function bech32Polymod(pre) {
  const b = pre >> 25;
  let chk = (pre & 0x1ffffff) << 5;
  for (let i = 0; i < POLYMOD_GENERATORS.length; i++) {
    if ((b >> i & 1) === 1) chk ^= POLYMOD_GENERATORS[i];
  }
  return chk;
}
function bechChecksum(prefix, words, encodingConst = 1) {
  const len = prefix.length;
  let chk = 1;
  for (let i = 0; i < len; i++) {
    const c = prefix.charCodeAt(i);
    if (c < 33 || c > 126) throw new Error(`Invalid prefix (${prefix})`);
    chk = bech32Polymod(chk) ^ c >> 5;
  }
  chk = bech32Polymod(chk);
  for (let i = 0; i < len; i++) chk = bech32Polymod(chk) ^ prefix.charCodeAt(i) & 0x1f;
  for (let v of words) chk = bech32Polymod(chk) ^ v;
  for (let i = 0; i < 6; i++) chk = bech32Polymod(chk);
  chk ^= encodingConst;
  return BECH_ALPHABET.encode(convertRadix2([chk % 2 ** 30], 30, 5, false));
}
function genBech32(encoding) {
  const ENCODING_CONST = encoding === 'bech32' ? 1 : 0x2bc830a3;
  const _words = radix2(5);
  const fromWords = _words.decode;
  const toWords = _words.encode;
  const fromWordsUnsafe = unsafeWrapper(fromWords);
  function encode(prefix, words, limit = 90) {
    if (typeof prefix !== 'string') throw new Error(`bech32.encode prefix should be string, not ${typeof prefix}`);
    if (!Array.isArray(words) || words.length && typeof words[0] !== 'number') throw new Error(`bech32.encode words should be array of numbers, not ${typeof words}`);
    const actualLength = prefix.length + 7 + words.length;
    if (limit !== false && actualLength > limit) throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
    prefix = prefix.toLowerCase();
    return `${prefix}1${BECH_ALPHABET.encode(words)}${bechChecksum(prefix, words, ENCODING_CONST)}`;
  }
  function decode(str, limit = 90) {
    if (typeof str !== 'string') throw new Error(`bech32.decode input should be string, not ${typeof str}`);
    if (str.length < 8 || limit !== false && str.length > limit) throw new TypeError(`Wrong string length: ${str.length} (${str}). Expected (8..${limit})`);
    const lowered = str.toLowerCase();
    if (str !== lowered && str !== str.toUpperCase()) throw new Error(`String must be lowercase or uppercase`);
    str = lowered;
    const sepIndex = str.lastIndexOf('1');
    if (sepIndex === 0 || sepIndex === -1) throw new Error(`Letter "1" must be present between prefix and data only`);
    const prefix = str.slice(0, sepIndex);
    const _words = str.slice(sepIndex + 1);
    if (_words.length < 6) throw new Error('Data must be at least 6 characters long');
    const words = BECH_ALPHABET.decode(_words).slice(0, -6);
    const sum = bechChecksum(prefix, words, ENCODING_CONST);
    if (!_words.endsWith(sum)) throw new Error(`Invalid checksum in ${str}: expected "${sum}"`);
    return {
      prefix,
      words
    };
  }
  const decodeUnsafe = unsafeWrapper(decode);
  function decodeToBytes(str) {
    const {
      prefix,
      words
    } = decode(str, false);
    return {
      prefix,
      words,
      bytes: fromWords(words)
    };
  }
  return {
    encode,
    decode,
    decodeToBytes,
    decodeUnsafe,
    fromWords,
    fromWordsUnsafe,
    toWords
  };
}
genBech32('bech32');
genBech32('bech32m');
const utf8 = {
  encode: data => new TextDecoder().decode(data),
  decode: str => new TextEncoder().encode(str)
};
const hex = chain(radix2(4), alphabet('0123456789abcdef'), join(''), normalize(s => {
  if (typeof s !== 'string' || s.length % 2) throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
  return s.toLowerCase();
}));
const CODERS = {
  utf8,
  hex,
  base16,
  base32,
  base64,
  base64url,
  base58,
  base58xmr
};
`Invalid encoding type. Available types: ${Object.keys(CODERS).join(', ')}`;

var CurveType;
(function (CurveType) {
  CurveType[CurveType["ED25519"] = 0] = "ED25519";
  CurveType[CurveType["SECP256K1"] = 1] = "SECP256K1";
})(CurveType || (CurveType = {}));
var DataLength;
(function (DataLength) {
  DataLength[DataLength["ED25519"] = 32] = "ED25519";
  DataLength[DataLength["SECP256K1"] = 64] = "SECP256K1";
})(DataLength || (DataLength = {}));

const U64_MAX = 2n ** 64n - 1n;
const EVICTED_REGISTER = U64_MAX - 1n;
/**
 * Returns the account ID of the account that called the function.
 * Can only be called in a call or initialize function.
 */
function predecessorAccountId() {
  env.predecessor_account_id(0);
  return env.read_register(0);
}
/**
 * Returns the account ID of the current contract - the contract that is being executed.
 */
function currentAccountId() {
  env.current_account_id(0);
  return env.read_register(0);
}
/**
 * Returns the amount of NEAR attached to this function call.
 * Can only be called in payable functions.
 */
function attachedDeposit() {
  return env.attached_deposit();
}
/**
 * Returns the amount of Gas that was attached to this function call.
 */
function prepaidGas() {
  return env.prepaid_gas();
}
/**
 * Reads the value from NEAR storage that is stored under the provided key.
 *
 * @param key - The key to read from storage.
 */
function storageRead(key) {
  const returnValue = env.storage_read(key, 0);
  if (returnValue !== 1n) {
    return null;
  }
  return env.read_register(0);
}
/**
 * Checks for the existance of a value under the provided key in NEAR storage.
 *
 * @param key - The key to check for in storage.
 */
function storageHasKey(key) {
  return env.storage_has_key(key) === 1n;
}
/**
 * Get the last written or removed value from NEAR storage.
 */
function storageGetEvicted() {
  return env.read_register(EVICTED_REGISTER);
}
/**
 * Writes the provided bytes to NEAR storage under the provided key.
 *
 * @param key - The key under which to store the value.
 * @param value - The value to store.
 */
function storageWrite(key, value) {
  return env.storage_write(key, value, EVICTED_REGISTER) === 1n;
}
/**
 * Removes the value of the provided key from NEAR storage.
 *
 * @param key - The key to be removed.
 */
function storageRemove(key) {
  return env.storage_remove(key, EVICTED_REGISTER) === 1n;
}
/**
 * Returns the cost of storing 0 Byte on NEAR storage.
 */
function storageByteCost() {
  return 10000000000000000000n;
}
/**
 * Returns the arguments passed to the current smart contract call.
 */
function input() {
  env.input(0);
  return env.read_register(0);
}
/**
 * Join an arbitrary array of NEAR promises.
 *
 * @param promiseIndexes - An arbitrary array of NEAR promise indexes to join.
 */
function promiseAnd(...promiseIndexes) {
  return env.promise_and(...promiseIndexes);
}
/**
 * Create a NEAR promise which will have multiple promise actions inside.
 *
 * @param accountId - The account ID of the target contract.
 */
function promiseBatchCreate(accountId) {
  return env.promise_batch_create(accountId);
}
/**
 * Attach a callback NEAR promise to a batch of NEAR promise actions.
 *
 * @param promiseIndex - The NEAR promise index of the batch.
 * @param accountId - The account ID of the target contract.
 */
function promiseBatchThen(promiseIndex, accountId) {
  return env.promise_batch_then(promiseIndex, accountId);
}
/**
 * Attach a create account promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a create account action to.
 */
function promiseBatchActionCreateAccount(promiseIndex) {
  env.promise_batch_action_create_account(promiseIndex);
}
/**
 * Attach a deploy contract promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a deploy contract action to.
 * @param code - The WASM byte code of the contract to be deployed.
 */
function promiseBatchActionDeployContract(promiseIndex, code) {
  env.promise_batch_action_deploy_contract(promiseIndex, code);
}
/**
 * Attach a function call promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a function call action to.
 * @param methodName - The name of the method to be called.
 * @param args - The arguments to call the method with.
 * @param amount - The amount of NEAR to attach to the call.
 * @param gas - The amount of Gas to attach to the call.
 */
function promiseBatchActionFunctionCall(promiseIndex, methodName, args, amount, gas) {
  env.promise_batch_action_function_call(promiseIndex, methodName, args, amount, gas);
}
/**
 * Attach a transfer promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a transfer action to.
 * @param amount - The amount of NEAR to transfer.
 */
function promiseBatchActionTransfer(promiseIndex, amount) {
  env.promise_batch_action_transfer(promiseIndex, amount);
}
/**
 * Attach a stake promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a stake action to.
 * @param amount - The amount of NEAR to stake.
 * @param publicKey - The public key with which to stake.
 */
function promiseBatchActionStake(promiseIndex, amount, publicKey) {
  env.promise_batch_action_stake(promiseIndex, amount, publicKey);
}
/**
 * Attach a add full access key promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a add full access key action to.
 * @param publicKey - The public key to add as a full access key.
 * @param nonce - The nonce to use.
 */
function promiseBatchActionAddKeyWithFullAccess(promiseIndex, publicKey, nonce) {
  env.promise_batch_action_add_key_with_full_access(promiseIndex, publicKey, nonce);
}
/**
 * Attach a add access key promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a add access key action to.
 * @param publicKey - The public key to add.
 * @param nonce - The nonce to use.
 * @param allowance - The allowance of the access key.
 * @param receiverId - The account ID of the receiver.
 * @param methodNames - The names of the method to allow the key for.
 */
function promiseBatchActionAddKeyWithFunctionCall(promiseIndex, publicKey, nonce, allowance, receiverId, methodNames) {
  env.promise_batch_action_add_key_with_function_call(promiseIndex, publicKey, nonce, allowance, receiverId, methodNames);
}
/**
 * Attach a delete key promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a delete key action to.
 * @param publicKey - The public key to delete.
 */
function promiseBatchActionDeleteKey(promiseIndex, publicKey) {
  env.promise_batch_action_delete_key(promiseIndex, publicKey);
}
/**
 * Attach a delete account promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a delete account action to.
 * @param beneficiaryId - The account ID of the beneficiary - the account that receives the remaining amount of NEAR.
 */
function promiseBatchActionDeleteAccount(promiseIndex, beneficiaryId) {
  env.promise_batch_action_delete_account(promiseIndex, beneficiaryId);
}
/**
 * Attach a function call with weight promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a function call with weight action to.
 * @param methodName - The name of the method to be called.
 * @param args - The arguments to call the method with.
 * @param amount - The amount of NEAR to attach to the call.
 * @param gas - The amount of Gas to attach to the call.
 * @param weight - The weight of unused Gas to use.
 */
function promiseBatchActionFunctionCallWeight(promiseIndex, methodName, args, amount, gas, weight) {
  env.promise_batch_action_function_call_weight(promiseIndex, methodName, args, amount, gas, weight);
}
/**
 * Returns the result of the NEAR promise for the passed promise index.
 *
 * @param promiseIndex - The index of the promise to return the result for.
 */
function promiseResult(promiseIndex) {
  const status = env.promise_result(promiseIndex, 0);
  assert(Number(status) === PromiseResult.Successful, `Promise result ${status == PromiseResult.Failed ? "Failed" : status == PromiseResult.NotReady ? "NotReady" : status}`);
  return env.read_register(0);
}
/**
 * Executes the promise in the NEAR WASM virtual machine.
 *
 * @param promiseIndex - The index of the promise to execute.
 */
function promiseReturn(promiseIndex) {
  env.promise_return(promiseIndex);
}

/**
 * Tells the SDK to use this function as the initialization function of the contract.
 *
 * @param _empty - An empty object.
 */
function initialize(_empty) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (_target, _key, _descriptor
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  ) {};
}
/**
 * Tells the SDK to expose this function as a view function.
 *
 * @param _empty - An empty object.
 */
function view(_empty) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (_target, _key, _descriptor
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  ) {};
}
function call({
  privateFunction = false,
  payableFunction = false
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (_target, _key, descriptor) {
    const originalMethod = descriptor.value;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    descriptor.value = function (...args) {
      if (privateFunction && predecessorAccountId() !== currentAccountId()) {
        throw new Error("Function is private");
      }
      if (!payableFunction && attachedDeposit() > 0n) {
        throw new Error("Function is not payable");
      }
      return originalMethod.apply(this, args);
    };
  };
}
function NearBindgen({
  requireInit = false,
  serializer = serialize,
  deserializer = deserialize
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return target => {
    return class extends target {
      static _create() {
        return new target();
      }
      static _getState() {
        const rawState = storageRead("STATE");
        return rawState ? this._deserialize(rawState) : null;
      }
      static _saveToStorage(objectToSave) {
        storageWrite("STATE", this._serialize(objectToSave));
      }
      static _getArgs() {
        return JSON.parse(input() || "{}");
      }
      static _serialize(value, forReturn = false) {
        if (forReturn) {
          return JSON.stringify(value, (_, value) => typeof value === "bigint" ? `${value}` : value);
        }
        return serializer(value);
      }
      static _deserialize(value) {
        return deserializer(value);
      }
      static _reconstruct(classObject, plainObject) {
        for (const item in classObject) {
          const reconstructor = classObject[item].constructor?.reconstruct;
          classObject[item] = reconstructor ? reconstructor(plainObject[item]) : plainObject[item];
        }
        return classObject;
      }
      static _requireInit() {
        return requireInit;
      }
    };
  };
}

/**
 * A lookup map that stores data in NEAR storage.
 */
class LookupMap {
  /**
   * @param keyPrefix - The byte prefix to use when storing elements inside this collection.
   */
  constructor(keyPrefix) {
    this.keyPrefix = keyPrefix;
  }
  /**
   * Checks whether the collection contains the value.
   *
   * @param key - The value for which to check the presence.
   */
  containsKey(key) {
    const storageKey = this.keyPrefix + key;
    return storageHasKey(storageKey);
  }
  /**
   * Get the data stored at the provided key.
   *
   * @param key - The key at which to look for the data.
   * @param options - Options for retrieving the data.
   */
  get(key, options) {
    const storageKey = this.keyPrefix + key;
    const value = storageRead(storageKey);
    return getValueWithOptions(value, options);
  }
  /**
   * Removes and retrieves the element with the provided key.
   *
   * @param key - The key at which to remove data.
   * @param options - Options for retrieving the data.
   */
  remove(key, options) {
    const storageKey = this.keyPrefix + key;
    if (!storageRemove(storageKey)) {
      return options?.defaultValue ?? null;
    }
    const value = storageGetEvicted();
    return getValueWithOptions(value, options);
  }
  /**
   * Store a new value at the provided key.
   *
   * @param key - The key at which to store in the collection.
   * @param newValue - The value to store in the collection.
   * @param options - Options for retrieving and storing the data.
   */
  set(key, newValue, options) {
    const storageKey = this.keyPrefix + key;
    const storageValue = serializeValueWithOptions(newValue, options);
    if (!storageWrite(storageKey, storageValue)) {
      return options?.defaultValue ?? null;
    }
    const value = storageGetEvicted();
    return getValueWithOptions(value, options);
  }
  /**
   * Extends the current collection with the passed in array of key-value pairs.
   *
   * @param keyValuePairs - The key-value pairs to extend the collection with.
   * @param options - Options for storing the data.
   */
  extend(keyValuePairs, options) {
    for (const [key, value] of keyValuePairs) {
      this.set(key, value, options);
    }
  }
  /**
   * Serialize the collection.
   *
   * @param options - Options for storing the data.
   */
  serialize(options) {
    return serializeValueWithOptions(this, options);
  }
  /**
   * Converts the deserialized data from storage to a JavaScript instance of the collection.
   *
   * @param data - The deserialized data to create an instance from.
   */
  static reconstruct(data) {
    return new LookupMap(data.keyPrefix);
  }
}

function indexToKey(prefix, index) {
  const data = new Uint32Array([index]);
  const array = new Uint8Array(data.buffer);
  const key = u8ArrayToBytes(array);
  return prefix + key;
}
/**
 * An iterable implementation of vector that stores its content on the trie.
 * Uses the following map: index -> element
 */
class Vector {
  /**
   * @param prefix - The byte prefix to use when storing elements inside this collection.
   * @param length - The initial length of the collection. By default 0.
   */
  constructor(prefix, length = 0) {
    this.prefix = prefix;
    this.length = length;
  }
  /**
   * Checks whether the collection is empty.
   */
  isEmpty() {
    return this.length === 0;
  }
  /**
   * Get the data stored at the provided index.
   *
   * @param index - The index at which to look for the data.
   * @param options - Options for retrieving the data.
   */
  get(index, options) {
    if (index >= this.length) {
      return options?.defaultValue ?? null;
    }
    const storageKey = indexToKey(this.prefix, index);
    const value = storageRead(storageKey);
    return getValueWithOptions(value, options);
  }
  /**
   * Removes an element from the vector and returns it in serialized form.
   * The removed element is replaced by the last element of the vector.
   * Does not preserve ordering, but is `O(1)`.
   *
   * @param index - The index at which to remove the element.
   * @param options - Options for retrieving and storing the data.
   */
  swapRemove(index, options) {
    assert(index < this.length, ERR_INDEX_OUT_OF_BOUNDS);
    if (index + 1 === this.length) {
      return this.pop(options);
    }
    const key = indexToKey(this.prefix, index);
    const last = this.pop(options);
    assert(storageWrite(key, serializeValueWithOptions(last, options)), ERR_INCONSISTENT_STATE);
    const value = storageGetEvicted();
    return getValueWithOptions(value, options);
  }
  /**
   * Adds data to the collection.
   *
   * @param element - The data to store.
   * @param options - Options for storing the data.
   */
  push(element, options) {
    const key = indexToKey(this.prefix, this.length);
    this.length += 1;
    storageWrite(key, serializeValueWithOptions(element, options));
  }
  /**
   * Removes and retrieves the element with the highest index.
   *
   * @param options - Options for retrieving the data.
   */
  pop(options) {
    if (this.isEmpty()) {
      return options?.defaultValue ?? null;
    }
    const lastIndex = this.length - 1;
    const lastKey = indexToKey(this.prefix, lastIndex);
    this.length -= 1;
    assert(storageRemove(lastKey), ERR_INCONSISTENT_STATE);
    const value = storageGetEvicted();
    return getValueWithOptions(value, options);
  }
  /**
   * Replaces the data stored at the provided index with the provided data and returns the previously stored data.
   *
   * @param index - The index at which to replace the data.
   * @param element - The data to replace with.
   * @param options - Options for retrieving and storing the data.
   */
  replace(index, element, options) {
    assert(index < this.length, ERR_INDEX_OUT_OF_BOUNDS);
    const key = indexToKey(this.prefix, index);
    assert(storageWrite(key, serializeValueWithOptions(element, options)), ERR_INCONSISTENT_STATE);
    const value = storageGetEvicted();
    return getValueWithOptions(value, options);
  }
  /**
   * Extends the current collection with the passed in array of elements.
   *
   * @param elements - The elements to extend the collection with.
   */
  extend(elements) {
    for (const element of elements) {
      this.push(element);
    }
  }
  [Symbol.iterator]() {
    return new VectorIterator(this);
  }
  /**
   * Create a iterator on top of the default collection iterator using custom options.
   *
   * @param options - Options for retrieving and storing the data.
   */
  createIteratorWithOptions(options) {
    return {
      [Symbol.iterator]: () => new VectorIterator(this, options)
    };
  }
  /**
   * Return a JavaScript array of the data stored within the collection.
   *
   * @param options - Options for retrieving and storing the data.
   */
  toArray(options) {
    const array = [];
    const iterator = options ? this.createIteratorWithOptions(options) : this;
    for (const value of iterator) {
      array.push(value);
    }
    return array;
  }
  /**
   * Remove all of the elements stored within the collection.
   */
  clear() {
    for (let index = 0; index < this.length; index++) {
      const key = indexToKey(this.prefix, index);
      storageRemove(key);
    }
    this.length = 0;
  }
  /**
   * Serialize the collection.
   *
   * @param options - Options for storing the data.
   */
  serialize(options) {
    return serializeValueWithOptions(this, options);
  }
  /**
   * Converts the deserialized data from storage to a JavaScript instance of the collection.
   *
   * @param data - The deserialized data to create an instance from.
   */
  static reconstruct(data) {
    const vector = new Vector(data.prefix, data.length);
    return vector;
  }
}
/**
 * An iterator for the Vector collection.
 */
class VectorIterator {
  /**
   * @param vector - The vector collection to create an iterator for.
   * @param options - Options for retrieving and storing data.
   */
  constructor(vector, options) {
    this.vector = vector;
    this.options = options;
    this.current = 0;
  }
  next() {
    if (this.current >= this.vector.length) {
      return {
        value: null,
        done: true
      };
    }
    const value = this.vector.get(this.current, this.options);
    this.current += 1;
    return {
      value,
      done: false
    };
  }
}

function serializeIndex(index) {
  const data = new Uint32Array([index]);
  const array = new Uint8Array(data.buffer);
  return u8ArrayToBytes(array);
}
function deserializeIndex(rawIndex) {
  const array = bytesToU8Array(rawIndex);
  const [data] = new Uint32Array(array.buffer);
  return data;
}
/**
 * An unordered set that stores data in NEAR storage.
 */
class UnorderedSet {
  /**
   * @param prefix - The byte prefix to use when storing elements inside this collection.
   */
  constructor(prefix) {
    this.prefix = prefix;
    this.elementIndexPrefix = `${prefix}i`;
    this.elements = new Vector(`${prefix}e`);
  }
  /**
   * The number of elements stored in the collection.
   */
  get length() {
    return this.elements.length;
  }
  /**
   * Checks whether the collection is empty.
   */
  isEmpty() {
    return this.elements.isEmpty();
  }
  /**
   * Checks whether the collection contains the value.
   *
   * @param element - The value for which to check the presence.
   * @param options - Options for storing data.
   */
  contains(element, options) {
    const indexLookup = this.elementIndexPrefix + serializeValueWithOptions(element, options);
    return storageHasKey(indexLookup);
  }
  /**
   * If the set did not have this value present, `true` is returned.
   * If the set did have this value present, `false` is returned.
   *
   * @param element - The value to store in the collection.
   * @param options - Options for storing the data.
   */
  set(element, options) {
    const indexLookup = this.elementIndexPrefix + serializeValueWithOptions(element, options);
    if (storageRead(indexLookup)) {
      return false;
    }
    const nextIndex = this.length;
    const nextIndexRaw = serializeIndex(nextIndex);
    storageWrite(indexLookup, nextIndexRaw);
    this.elements.push(element, options);
    return true;
  }
  /**
   * Returns true if the element was present in the set.
   *
   * @param element - The entry to remove.
   * @param options - Options for retrieving and storing data.
   */
  remove(element, options) {
    const indexLookup = this.elementIndexPrefix + serializeValueWithOptions(element, options);
    const indexRaw = storageRead(indexLookup);
    if (!indexRaw) {
      return false;
    }
    // If there is only one element then swap remove simply removes it without
    // swapping with the last element.
    if (this.length === 1) {
      storageRemove(indexLookup);
      const index = deserializeIndex(indexRaw);
      this.elements.swapRemove(index);
      return true;
    }
    // If there is more than one element then swap remove swaps it with the last
    // element.
    const lastElement = this.elements.get(this.length - 1, options);
    assert(!!lastElement, ERR_INCONSISTENT_STATE);
    storageRemove(indexLookup);
    // If the removed element was the last element from keys, then we don't need to
    // reinsert the lookup back.
    if (lastElement !== element) {
      const lastLookupElement = this.elementIndexPrefix + serializeValueWithOptions(lastElement, options);
      storageWrite(lastLookupElement, indexRaw);
    }
    const index = deserializeIndex(indexRaw);
    this.elements.swapRemove(index);
    return true;
  }
  /**
   * Remove all of the elements stored within the collection.
   */
  clear(options) {
    for (const element of this.elements) {
      const indexLookup = this.elementIndexPrefix + serializeValueWithOptions(element, options);
      storageRemove(indexLookup);
    }
    this.elements.clear();
  }
  [Symbol.iterator]() {
    return this.elements[Symbol.iterator]();
  }
  /**
   * Create a iterator on top of the default collection iterator using custom options.
   *
   * @param options - Options for retrieving and storing the data.
   */
  createIteratorWithOptions(options) {
    return {
      [Symbol.iterator]: () => new VectorIterator(this.elements, options)
    };
  }
  /**
   * Return a JavaScript array of the data stored within the collection.
   *
   * @param options - Options for retrieving and storing the data.
   */
  toArray(options) {
    const array = [];
    const iterator = options ? this.createIteratorWithOptions(options) : this;
    for (const value of iterator) {
      array.push(value);
    }
    return array;
  }
  /**
   * Extends the current collection with the passed in array of elements.
   *
   * @param elements - The elements to extend the collection with.
   */
  extend(elements) {
    for (const element of elements) {
      this.set(element);
    }
  }
  /**
   * Serialize the collection.
   *
   * @param options - Options for storing the data.
   */
  serialize(options) {
    return serializeValueWithOptions(this, options);
  }
  /**
   * Converts the deserialized data from storage to a JavaScript instance of the collection.
   *
   * @param data - The deserialized data to create an instance from.
   */
  static reconstruct(data) {
    const set = new UnorderedSet(data.prefix);
    // reconstruct Vector
    const elementsPrefix = data.prefix + "e";
    set.elements = new Vector(elementsPrefix);
    set.elements.length = data.elements.length;
    return set;
  }
}

/**
 * A promise action which can be executed on the NEAR blockchain.
 */
class PromiseAction {}
/**
 * A create account promise action.
 *
 * @extends {PromiseAction}
 */
class CreateAccount extends PromiseAction {
  add(promiseIndex) {
    promiseBatchActionCreateAccount(promiseIndex);
  }
}
/**
 * A deploy contract promise action.
 *
 * @extends {PromiseAction}
 */
class DeployContract extends PromiseAction {
  /**
   * @param code - The code of the contract to be deployed.
   */
  constructor(code) {
    super();
    this.code = code;
  }
  add(promiseIndex) {
    promiseBatchActionDeployContract(promiseIndex, this.code);
  }
}
/**
 * A function call promise action.
 *
 * @extends {PromiseAction}
 */
class FunctionCall extends PromiseAction {
  /**
   * @param functionName - The name of the function to be called.
   * @param args - The arguments to be passed to the function.
   * @param amount - The amount of NEAR to attach to the call.
   * @param gas - The amount of Gas to attach to the call.
   */
  constructor(functionName, args, amount, gas) {
    super();
    this.functionName = functionName;
    this.args = args;
    this.amount = amount;
    this.gas = gas;
  }
  add(promiseIndex) {
    promiseBatchActionFunctionCall(promiseIndex, this.functionName, this.args, this.amount, this.gas);
  }
}
/**
 * A function call weight promise action.
 *
 * @extends {PromiseAction}
 */
class FunctionCallWeight extends PromiseAction {
  /**
   * @param functionName - The name of the function to be called.
   * @param args - The arguments to be passed to the function.
   * @param amount - The amount of NEAR to attach to the call.
   * @param gas - The amount of Gas to attach to the call.
   * @param weight - The weight of unused Gas to use.
   */
  constructor(functionName, args, amount, gas, weight) {
    super();
    this.functionName = functionName;
    this.args = args;
    this.amount = amount;
    this.gas = gas;
    this.weight = weight;
  }
  add(promiseIndex) {
    promiseBatchActionFunctionCallWeight(promiseIndex, this.functionName, this.args, this.amount, this.gas, this.weight);
  }
}
/**
 * A transfer promise action.
 *
 * @extends {PromiseAction}
 */
class Transfer extends PromiseAction {
  /**
   * @param amount - The amount of NEAR to tranfer.
   */
  constructor(amount) {
    super();
    this.amount = amount;
  }
  add(promiseIndex) {
    promiseBatchActionTransfer(promiseIndex, this.amount);
  }
}
/**
 * A stake promise action.
 *
 * @extends {PromiseAction}
 */
class Stake extends PromiseAction {
  /**
   * @param amount - The amount of NEAR to tranfer.
   * @param publicKey - The public key to use for staking.
   */
  constructor(amount, publicKey) {
    super();
    this.amount = amount;
    this.publicKey = publicKey;
  }
  add(promiseIndex) {
    promiseBatchActionStake(promiseIndex, this.amount, this.publicKey.data);
  }
}
/**
 * A add full access key promise action.
 *
 * @extends {PromiseAction}
 */
class AddFullAccessKey extends PromiseAction {
  /**
   * @param publicKey - The public key to add as a full access key.
   * @param nonce - The nonce to use.
   */
  constructor(publicKey, nonce) {
    super();
    this.publicKey = publicKey;
    this.nonce = nonce;
  }
  add(promiseIndex) {
    promiseBatchActionAddKeyWithFullAccess(promiseIndex, this.publicKey.data, this.nonce);
  }
}
/**
 * A add access key promise action.
 *
 * @extends {PromiseAction}
 */
class AddAccessKey extends PromiseAction {
  /**
   * @param publicKey - The public key to add as a access key.
   * @param allowance - The allowance for the key in yoctoNEAR.
   * @param receiverId - The account ID of the reciever.
   * @param functionNames - The names of funcitons to authorize.
   * @param nonce - The nonce to use.
   */
  constructor(publicKey, allowance, receiverId, functionNames, nonce) {
    super();
    this.publicKey = publicKey;
    this.allowance = allowance;
    this.receiverId = receiverId;
    this.functionNames = functionNames;
    this.nonce = nonce;
  }
  add(promiseIndex) {
    promiseBatchActionAddKeyWithFunctionCall(promiseIndex, this.publicKey.data, this.nonce, this.allowance, this.receiverId, this.functionNames);
  }
}
/**
 * A delete key promise action.
 *
 * @extends {PromiseAction}
 */
class DeleteKey extends PromiseAction {
  /**
   * @param publicKey - The public key to delete from the account.
   */
  constructor(publicKey) {
    super();
    this.publicKey = publicKey;
  }
  add(promiseIndex) {
    promiseBatchActionDeleteKey(promiseIndex, this.publicKey.data);
  }
}
/**
 * A delete account promise action.
 *
 * @extends {PromiseAction}
 */
class DeleteAccount extends PromiseAction {
  /**
   * @param beneficiaryId - The beneficiary of the account deletion - the account to recieve all of the remaining funds of the deleted account.
   */
  constructor(beneficiaryId) {
    super();
    this.beneficiaryId = beneficiaryId;
  }
  add(promiseIndex) {
    promiseBatchActionDeleteAccount(promiseIndex, this.beneficiaryId);
  }
}
class PromiseSingle {
  constructor(accountId, actions, after, promiseIndex) {
    this.accountId = accountId;
    this.actions = actions;
    this.after = after;
    this.promiseIndex = promiseIndex;
  }
  constructRecursively() {
    if (this.promiseIndex !== null) {
      return this.promiseIndex;
    }
    const promiseIndex = this.after ? promiseBatchThen(this.after.constructRecursively(), this.accountId) : promiseBatchCreate(this.accountId);
    this.actions.forEach(action => action.add(promiseIndex));
    this.promiseIndex = promiseIndex;
    return promiseIndex;
  }
}
class PromiseJoint {
  constructor(promiseA, promiseB, promiseIndex) {
    this.promiseA = promiseA;
    this.promiseB = promiseB;
    this.promiseIndex = promiseIndex;
  }
  constructRecursively() {
    if (this.promiseIndex !== null) {
      return this.promiseIndex;
    }
    const result = promiseAnd(this.promiseA.constructRecursively(), this.promiseB.constructRecursively());
    this.promiseIndex = result;
    return result;
  }
}
/**
 * A high level class to construct and work with NEAR promises.
 */
class NearPromise {
  /**
   * @param subtype - The subtype of the promise.
   * @param shouldReturn - Whether the promise should return.
   */
  constructor(subtype, shouldReturn) {
    this.subtype = subtype;
    this.shouldReturn = shouldReturn;
  }
  /**
   * Creates a new promise to the provided account ID.
   *
   * @param accountId - The account ID on which to call the promise.
   */
  static new(accountId) {
    const subtype = new PromiseSingle(accountId, [], null, null);
    return new NearPromise(subtype, false);
  }
  addAction(action) {
    if (this.subtype instanceof PromiseJoint) {
      throw new Error("Cannot add action to a joint promise.");
    }
    this.subtype.actions.push(action);
    return this;
  }
  /**
   * Creates a create account promise action and adds it to the current promise.
   */
  createAccount() {
    return this.addAction(new CreateAccount());
  }
  /**
   * Creates a deploy contract promise action and adds it to the current promise.
   *
   * @param code - The code of the contract to be deployed.
   */
  deployContract(code) {
    return this.addAction(new DeployContract(code));
  }
  /**
   * Creates a function call promise action and adds it to the current promise.
   *
   * @param functionName - The name of the function to be called.
   * @param args - The arguments to be passed to the function.
   * @param amount - The amount of NEAR to attach to the call.
   * @param gas - The amount of Gas to attach to the call.
   */
  functionCall(functionName, args, amount, gas) {
    return this.addAction(new FunctionCall(functionName, args, amount, gas));
  }
  /**
   * Creates a function call weight promise action and adds it to the current promise.
   *
   * @param functionName - The name of the function to be called.
   * @param args - The arguments to be passed to the function.
   * @param amount - The amount of NEAR to attach to the call.
   * @param gas - The amount of Gas to attach to the call.
   * @param weight - The weight of unused Gas to use.
   */
  functionCallWeight(functionName, args, amount, gas, weight) {
    return this.addAction(new FunctionCallWeight(functionName, args, amount, gas, weight));
  }
  /**
   * Creates a transfer promise action and adds it to the current promise.
   *
   * @param amount - The amount of NEAR to tranfer.
   */
  transfer(amount) {
    return this.addAction(new Transfer(amount));
  }
  /**
   * Creates a stake promise action and adds it to the current promise.
   *
   * @param amount - The amount of NEAR to tranfer.
   * @param publicKey - The public key to use for staking.
   */
  stake(amount, publicKey) {
    return this.addAction(new Stake(amount, publicKey));
  }
  /**
   * Creates a add full access key promise action and adds it to the current promise.
   * Uses 0n as the nonce.
   *
   * @param publicKey - The public key to add as a full access key.
   */
  addFullAccessKey(publicKey) {
    return this.addFullAccessKeyWithNonce(publicKey, 0n);
  }
  /**
   * Creates a add full access key promise action and adds it to the current promise.
   * Allows you to specify the nonce.
   *
   * @param publicKey - The public key to add as a full access key.
   * @param nonce - The nonce to use.
   */
  addFullAccessKeyWithNonce(publicKey, nonce) {
    return this.addAction(new AddFullAccessKey(publicKey, nonce));
  }
  /**
   * Creates a add access key promise action and adds it to the current promise.
   * Uses 0n as the nonce.
   *
   * @param publicKey - The public key to add as a access key.
   * @param allowance - The allowance for the key in yoctoNEAR.
   * @param receiverId - The account ID of the reciever.
   * @param functionNames - The names of funcitons to authorize.
   */
  addAccessKey(publicKey, allowance, receiverId, functionNames) {
    return this.addAccessKeyWithNonce(publicKey, allowance, receiverId, functionNames, 0n);
  }
  /**
   * Creates a add access key promise action and adds it to the current promise.
   * Allows you to specify the nonce.
   *
   * @param publicKey - The public key to add as a access key.
   * @param allowance - The allowance for the key in yoctoNEAR.
   * @param receiverId - The account ID of the reciever.
   * @param functionNames - The names of funcitons to authorize.
   * @param nonce - The nonce to use.
   */
  addAccessKeyWithNonce(publicKey, allowance, receiverId, functionNames, nonce) {
    return this.addAction(new AddAccessKey(publicKey, allowance, receiverId, functionNames, nonce));
  }
  /**
   * Creates a delete key promise action and adds it to the current promise.
   *
   * @param publicKey - The public key to delete from the account.
   */
  deleteKey(publicKey) {
    return this.addAction(new DeleteKey(publicKey));
  }
  /**
   * Creates a delete account promise action and adds it to the current promise.
   *
   * @param beneficiaryId - The beneficiary of the account deletion - the account to recieve all of the remaining funds of the deleted account.
   */
  deleteAccount(beneficiaryId) {
    return this.addAction(new DeleteAccount(beneficiaryId));
  }
  /**
   * Joins the provided promise with the current promise, making the current promise a joint promise subtype.
   *
   * @param other - The promise to join with the current promise.
   */
  and(other) {
    const subtype = new PromiseJoint(this, other, null);
    return new NearPromise(subtype, false);
  }
  /**
   * Adds a callback to the current promise.
   *
   * @param other - The promise to be executed as the promise.
   */
  then(other) {
    assert(other.subtype instanceof PromiseSingle, "Cannot callback joint promise.");
    assert(other.subtype.after === null, "Cannot callback promise which is already scheduled after another");
    other.subtype.after = this;
    return other;
  }
  /**
   * Sets the shouldReturn field to true.
   */
  asReturn() {
    this.shouldReturn = true;
    return this;
  }
  /**
   * Recursively goes through the current promise to get the promise index.
   */
  constructRecursively() {
    const result = this.subtype.constructRecursively();
    if (this.shouldReturn) {
      promiseReturn(result);
    }
    return result;
  }
  /**
   * Called by NearBindgen, when return object is a NearPromise instance.
   */
  onReturn() {
    this.asReturn().constructRecursively();
  }
}

var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _class, _class2;
// ------- CONSTANT -------
const GAS_FOR_RESOLVE_TRANSFER = BigInt(15_000_000_000_000);
const GAS_FOR_NFT_TRANSFER_CALL = BigInt(30_000_000_000_000) + GAS_FOR_RESOLVE_TRANSFER;
const GAS_FOR_NFT_APPROVE = BigInt(20_000_000_000_000);
class NFTContractMetadata {
  // required, essentially a version like "nft-2.0.0", replacing "2.0.0" with the implemented version of NEP-177
  // required, ex. "Mochi Rising — Digital Edition" or "Metaverse 3"
  // required, ex. "MOCHI"
  // Data URL
  // Centralized gateway known to have reliable access to decentralized storage assets referenced by `reference` or `media` URLs
  // URL to a JSON file with more info
  // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.

  constructor() {
    this.spec = "nft-1.0.0";
    this.name = "";
    this.symbol = "";
    this.icon = null;
    this.base_uri = null;
    this.reference = null;
    this.reference_hash = null;
  }
}

// ------- TOKEN AND CONTRACT -------
class Token {
  constructor(token_id, owner_id, token_metadata, approved_account_ids) {
    this.token_id = token_id;
    this.owner_id = owner_id;
    this.token_metadata = token_metadata;
    this.approved_account_ids = approved_account_ids;
  }
  static reconstruct(data) {
    return new Token(data.token_id, data.owner_id, data.token_metadata, data.approved_account_ids);
  }
}
let Contract = (_dec = NearBindgen({}), _dec2 = initialize(), _dec3 = call({}), _dec4 = view(), _dec5 = view(), _dec6 = view(), _dec7 = view(), _dec8 = call({}), _dec9 = call({}), _dec10 = call({}), _dec11 = view(), _dec12 = call({
  payableFunction: true
}), _dec13 = call({
  payableFunction: true
}), _dec14 = call({
  payableFunction: true
}), _dec15 = view(), _dec(_class = (_class2 = class Contract {
  // key: TokenId, value: AccountId
  // key: TokenId, value: Token
  // key: AccountId, value: UnorderedSet<TokenId>
  // key: TokenId, value: { [approvals: AccountId]: bigint }

  constructor() {
    this.token_id = 0;
    this.owner_id = "";
    this.metadata = new NFTContractMetadata();
    this.owner_by_id = new LookupMap("a");
    this.token_by_id = new LookupMap("b");
    this.tokens_per_owner = new LookupMap("c");
    this.approvals_by_id = new LookupMap("d");
    this.next_approval_id_by_id = new LookupMap("e");
  }
  init({
    owner_id,
    prefix
  }) {
    this.owner_id = owner_id;
    this.token_id = 0;
    this.owner_by_id = new LookupMap(prefix);
    this.token_by_id = new LookupMap("b");
    this.tokens_per_owner = new LookupMap("c");
    this.approvals_by_id = new LookupMap("d");
    this.next_approval_id_by_id = new LookupMap("e");
  }
  nft_mint({
    token_owner_id,
    token_metadata
  }) {
    this.owner_by_id.set(this.token_id.toString(), token_owner_id);
    const approved_account_ids = this.approvals_by_id ? {} : undefined;
    let token = new Token(this.token_id, token_owner_id, token_metadata, approved_account_ids);
    this.token_by_id.set(this.token_id.toString(), token);

    // Set tokens per owner
    let token_ids = this.tokens_per_owner.get(token_owner_id, {
      reconstructor: UnorderedSet.reconstruct
    });
    if (token_ids === null) {
      token_ids = new UnorderedSet(this.token_id.toString());
    }
    token_ids.set(this.token_id.toString());
    this.tokens_per_owner.set(token_owner_id, token_ids);
    this.token_id++;
    return token;
  }

  // ------- ENUMERATION METHODS -------
  // Returns the total supply of non-fungible tokens
  nft_total_supply() {
    return this.token_id;
  }

  // Get a list of all tokens
  nft_tokens({
    start,
    max
  }) {
    var all_tokens = [];
    for (var i = 0; i < this.token_id; i++) {
      all_tokens.push(this.token_by_id.get(i.toString()));
    }
    return all_tokens;
  }

  // Get number of tokens owned by a given account
  nft_supply_for_owner({
    owner_id
  }) {
    const tokens = this.tokens_per_owner.get(owner_id, {
      reconstructor: UnorderedSet.reconstruct
    });
    return tokens === null ? 0 : tokens.length;
  }

  // Get list of all tokens owned by a given account
  nft_tokens_for_owner({
    owner_id,
    from_index,
    limit
  }) {
    const tokens_per_owner = this.tokens_per_owner;
    const token_set = tokens_per_owner.get(owner_id, {
      reconstructor: UnorderedSet.reconstruct
    });
    if (token_set === null) {
      return null;
    }
    const start_index = from_index === undefined ? 0 : from_index;
    let l = limit === undefined ? 2 ** 32 : limit;
    l = Math.min(l, token_set.length - start_index);
    const ret = [];
    for (let i = start_index; i < start_index + l; i++) {
      const token_id = token_set.elements.get(i);
      ret.push(this.get_token_by_id(token_id));
    }
    return ret;
  }

  // ------- CORE FUNCTIONALITY METHODS -------
  nft_transfer({
    receiver_id,
    token_id,
    approval_id,
    memo
  }) {
    const sender_id = predecessorAccountId();
    this.internal_transfer(sender_id, receiver_id, token_id, approval_id, memo);
  }
  nft_transfer_call({
    receiver_id,
    token_id,
    approval_id,
    memo,
    msg
  }) {
    assert(prepaidGas() > GAS_FOR_NFT_TRANSFER_CALL, "Not enough prepaid gas");
    const sender_id = predecessorAccountId();
    const [previous_owner_id, approved_account_ids] = this.internal_transfer(sender_id, receiver_id, token_id, approval_id, memo);
    const promise = NearPromise.new(receiver_id).functionCall("nft_on_transfer", JSON.stringify({
      sender_id,
      previous_owner_id,
      token_id,
      msg
    }), BigInt(0), prepaidGas() - GAS_FOR_NFT_TRANSFER_CALL).then(NearPromise.new(currentAccountId()).functionCall("nft_resolve_transfer", JSON.stringify({
      previous_owner_id,
      receiver_id,
      token_id,
      approved_account_ids
    }), BigInt(0), GAS_FOR_RESOLVE_TRANSFER));
    return promise;
  }
  nft_resolve_transfer({
    previous_owner_id,
    receiver_id,
    token_id,
    approved_account_ids
  }) {
    let must_revert = false;
    let p;
    try {
      p = promiseResult(0);
    } catch (e) {
      if (e.message.includes("Not Ready")) {
        throw new Error();
      } else {
        must_revert = true;
      }
    }
    if (!must_revert) {
      try {
        const yes_or_no = JSON.parse(p);
        if (typeof yes_or_no == "boolean") {
          must_revert = yes_or_no;
        } else {
          must_revert = true;
        }
      } catch (_e) {
        must_revert = true;
      }
    }
    if (!must_revert) {
      return true;
    }
    const current_owner = this.owner_by_id.get(token_id);
    if (current_owner) {
      if (current_owner != receiver_id) {
        return true;
      }
    } else {
      if (approved_account_ids) {
        this.refund_storage_deposit(previous_owner_id, serialize(approved_account_ids).length);
      }
      return true;
    }
    this.internal_transfer_unguarded(token_id, receiver_id, previous_owner_id);
    if (this.approvals_by_id) {
      const receiver_approvals = this.approvals_by_id.get(token_id);
      if (receiver_approvals) {
        this.refund_storage_deposit(receiver_id, serialize(receiver_approvals).length);
      }
      if (approved_account_ids) {
        this.approvals_by_id.set(token_id, approved_account_ids);
      }
    }
    return false;
  }
  nft_token({
    token_id
  }) {
    const owner_id = this.owner_by_id.get(token_id);
    if (owner_id == null) {
      return null;
    }
    const token = this.token_by_id?.get(token_id, {
      reconstructor: Token.reconstruct
    });
    const approved_account_ids = this.approvals_by_id?.get(token_id);
    return new Token(parseInt(token_id), owner_id, token.token_metadata, approved_account_ids);
  }

  // ------- APPROVAL MANAGEMENT METHODS -------
  nft_approve({
    token_id,
    account_id,
    msg
  }) {
    if (this.approvals_by_id === null) {
      throw new Error("NFT does not support Approval Management");
    }
    const approvals_by_id = this.approvals_by_id;
    const token = this.owner_by_id.get(token_id);
    if (token === null) {
      throw new Error("Token not found");
    }
    const owner_id = token;
    assert(predecessorAccountId() === owner_id, "Predecessor must be token owner.");
    if (this.next_approval_id_by_id === null) {
      throw new Error("next_approval_by_id must be set for approval ext");
    }
    const next_approval_id_by_id = this.next_approval_id_by_id;
    const approved_account_ids = approvals_by_id.get(token_id) ?? {};
    const approval_id = next_approval_id_by_id.get(token_id) ?? BigInt(1);
    const old_approved_account_ids_size = serialize(approved_account_ids).length;
    approved_account_ids[account_id] = approval_id;
    const new_approved_account_ids_size = serialize(approved_account_ids).length;
    approvals_by_id.set(token_id, approved_account_ids);
    next_approval_id_by_id.set(token_id, approval_id + BigInt(1));
    const storage_used = new_approved_account_ids_size - old_approved_account_ids_size;
    this.refund_deposit(BigInt(storage_used));
    if (msg) {
      return NearPromise.new(account_id).functionCall("nft_on_approve", serialize({
        token_id,
        owner_id,
        approval_id,
        msg
      }), BigInt(0), prepaidGas() - GAS_FOR_NFT_APPROVE);
    }
    return null;
  }
  nft_revoke({
    token_id,
    account_id
  }) {
    if (this.approvals_by_id === null) {
      throw new Error("NFT does not support Approval Management");
    }
    const approvals_by_id = this.approvals_by_id;
    const token = this.owner_by_id.get(token_id);
    if (token === null) {
      throw new Error("Token not found");
    }
    const owner_id = token;
    const predecessorAccountId$1 = predecessorAccountId();
    assert(predecessorAccountId$1 === owner_id, "Predecessor must be token owner.");
    const approved_account_ids = approvals_by_id.get(token_id);
    const old_approved_account_ids_size = serialize(approved_account_ids).length;
    let new_approved_account_ids_size;
    if (approved_account_ids[account_id]) {
      delete approved_account_ids[account_id];
      if (Object.keys(approved_account_ids).length === 0) {
        approvals_by_id.remove(token_id);
        new_approved_account_ids_size = serialize(approved_account_ids).length;
      } else {
        approvals_by_id.set(token_id, approved_account_ids);
        new_approved_account_ids_size = 0;
      }
      const promise_id = promiseBatchCreate(predecessorAccountId$1);
      promiseBatchActionTransfer(promise_id, BigInt(new_approved_account_ids_size - old_approved_account_ids_size) * storageByteCost());
      promiseReturn(promise_id);
    }
  }
  nft_revoke_all({
    token_id
  }) {
    if (this.approvals_by_id === null) {
      throw new Error("NFT does not support Approval Management");
    }
    const approvals_by_id = this.approvals_by_id;
    const token = this.owner_by_id.get(token_id);
    if (token === null) {
      throw new Error("Token not found");
    }
    const owner_id = token;
    const predecessorAccountId$1 = predecessorAccountId();
    assert(predecessorAccountId$1 === owner_id, "Predecessor must be token owner.");
    const approved_account_ids = approvals_by_id.get(token_id);
    if (approved_account_ids) {
      const promise_id = promiseBatchCreate(predecessorAccountId$1);
      promiseBatchActionTransfer(promise_id, BigInt(serialize(approved_account_ids).length) * storageByteCost());
      promiseReturn(promise_id);
      approvals_by_id.remove(token_id);
    }
  }
  nft_is_approved({
    token_id,
    approved_account_id,
    approval_id
  }) {
    const token = this.owner_by_id.get(token_id);
    if (token === null) {
      throw new Error("Token not found");
    }
    if (this.approvals_by_id === null) {
      return false;
    }
    const approvals_by_id = this.approvals_by_id;
    const approved_account_ids = approvals_by_id.get(token_id);
    if (approved_account_ids === null) {
      return false;
    }
    const actual_approval_id = approved_account_ids[approved_account_id];
    if (actual_approval_id === undefined) {
      return false;
    }
    if (approval_id) {
      return BigInt(approval_id) === actual_approval_id;
    }
    return true;
  }

  // PRIVATE METHODS
  // Get the token having specific id
  get_token_by_id(token_id) {
    let token = this.token_by_id.get(token_id);
    if (token === null) {
      return null;
    }
    return token;
  }
  internal_transfer(sender_id, receiver_id, token_id, approval_id, memo) {
    const owner_id = this.owner_by_id.get(token_id);
    if (owner_id == null) {
      throw new Error("Token not found");
    }
    const approved_account_ids = this.approvals_by_id?.remove(token_id);
    if (sender_id != owner_id) {
      if (!approved_account_ids) {
        throw new Error("Unauthorized");
      }
      const actual_approval_id = approved_account_ids[sender_id];
      if (!actual_approval_id) {
        throw new Error("Sender not approved");
      }
      assert(approval_id === undefined || approval_id == actual_approval_id, `The actual approval_id ${actual_approval_id} is different from the given ${approval_id}`);
    }
    assert(owner_id != receiver_id, "Current and next owner must differ");
    this.internal_transfer_unguarded(token_id, owner_id, receiver_id);
    return [owner_id, approved_account_ids];
  }
  internal_transfer_unguarded(token_id, from, to) {
    this.owner_by_id.set(token_id, to);
    if (this.tokens_per_owner) {
      const owner_tokens_set = this.tokens_per_owner.get(from, {
        reconstructor: UnorderedSet.reconstruct
      });
      if (owner_tokens_set == null) {
        throw new Error("Unable to access tokens per owner in unguarded call.");
      }
      owner_tokens_set.remove(token_id);
      if (owner_tokens_set.isEmpty()) {
        this.tokens_per_owner.remove(from);
      } else {
        this.tokens_per_owner.set(from, owner_tokens_set);
      }
      let receiver_tokens_set = this.tokens_per_owner.get(to, {
        reconstructor: UnorderedSet.reconstruct
      });
      receiver_tokens_set.set(token_id);
      this.tokens_per_owner.set(to, receiver_tokens_set);
    }
  }
  refund_storage_deposit(account_id, storage_released) {
    const promise_id = promiseBatchCreate(account_id);
    promiseBatchActionTransfer(promise_id, BigInt(storage_released) * storageByteCost());
    promiseReturn(promise_id);
  }
  refund_deposit(storage_used) {
    this.refund_deposit_to_account(storage_used, predecessorAccountId());
  }
  refund_deposit_to_account(storage_used, account_id) {
    const required_cost = storageByteCost() * storage_used;
    const attached_deposit = attachedDeposit();
    assert(required_cost <= attached_deposit, `Must attach ${required_cost} yoctoNEAR to cover storage`);
    const refund = attached_deposit - required_cost;
    if (refund > BigInt(1)) {
      const promise_id = promiseBatchCreate(account_id);
      promiseBatchActionTransfer(promise_id, refund);
      promiseReturn(promise_id);
    }
  }
}, (_applyDecoratedDescriptor(_class2.prototype, "init", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "init"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_mint", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_mint"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_total_supply", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_total_supply"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_tokens", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_tokens"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_supply_for_owner", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_supply_for_owner"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_tokens_for_owner", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_tokens_for_owner"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_transfer", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_transfer"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_transfer_call", [_dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_transfer_call"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_resolve_transfer", [_dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_resolve_transfer"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_token", [_dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_token"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_approve", [_dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_approve"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_revoke", [_dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_revoke"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_revoke_all", [_dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_revoke_all"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_is_approved", [_dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_is_approved"), _class2.prototype)), _class2)) || _class);
function nft_is_approved() {
  const _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  const _args = Contract._getArgs();
  const _result = _contract.nft_is_approved(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result, true));
}
function nft_revoke_all() {
  const _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  const _args = Contract._getArgs();
  const _result = _contract.nft_revoke_all(_args);
  Contract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result, true));
}
function nft_revoke() {
  const _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  const _args = Contract._getArgs();
  const _result = _contract.nft_revoke(_args);
  Contract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result, true));
}
function nft_approve() {
  const _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  const _args = Contract._getArgs();
  const _result = _contract.nft_approve(_args);
  Contract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result, true));
}
function nft_token() {
  const _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  const _args = Contract._getArgs();
  const _result = _contract.nft_token(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result, true));
}
function nft_resolve_transfer() {
  const _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  const _args = Contract._getArgs();
  const _result = _contract.nft_resolve_transfer(_args);
  Contract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result, true));
}
function nft_transfer_call() {
  const _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  const _args = Contract._getArgs();
  const _result = _contract.nft_transfer_call(_args);
  Contract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result, true));
}
function nft_transfer() {
  const _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  const _args = Contract._getArgs();
  const _result = _contract.nft_transfer(_args);
  Contract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result, true));
}
function nft_tokens_for_owner() {
  const _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  const _args = Contract._getArgs();
  const _result = _contract.nft_tokens_for_owner(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result, true));
}
function nft_supply_for_owner() {
  const _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  const _args = Contract._getArgs();
  const _result = _contract.nft_supply_for_owner(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result, true));
}
function nft_tokens() {
  const _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  const _args = Contract._getArgs();
  const _result = _contract.nft_tokens(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result, true));
}
function nft_total_supply() {
  const _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  const _args = Contract._getArgs();
  const _result = _contract.nft_total_supply(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result, true));
}
function nft_mint() {
  const _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  const _args = Contract._getArgs();
  const _result = _contract.nft_mint(_args);
  Contract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result, true));
}
function init() {
  const _state = Contract._getState();
  if (_state) {
    throw new Error("Contract already initialized");
  }
  const _contract = Contract._create();
  const _args = Contract._getArgs();
  const _result = _contract.init(_args);
  Contract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result, true));
}

export { init, nft_approve, nft_is_approved, nft_mint, nft_resolve_transfer, nft_revoke, nft_revoke_all, nft_supply_for_owner, nft_token, nft_tokens, nft_tokens_for_owner, nft_total_supply, nft_transfer, nft_transfer_call };
//# sourceMappingURL=hello_near.js.map
