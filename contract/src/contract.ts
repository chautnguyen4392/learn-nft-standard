// Find all our documentation at https://docs.near.org
import { NearBindgen, near, call, view, initialize, LookupMap, UnorderedSet } from 'near-sdk-js';
import { AccountId } from 'near-sdk-js/lib/types';

type TokenId = string

// ------- METADATA -------
class TokenMetadata {
  title: string|null; // ex. "Arch Nemesis: Mail Carrier" or "Parcel #5055"
  description: string|null; // free-form description
  media: string|null; // URL to associated media, preferably to decentralized, content-addressed storage
  media_hash: string|null; // Base64-encoded sha256 hash of content referenced by the `media` field. Required if `media` is included.
  copies: number|null; // number of copies of this set of metadata in existence when token was minted.
  issued_at: number|null; // When token was issued or minted, Unix epoch in milliseconds
  expires_at: number|null; // When token expires, Unix epoch in milliseconds
  starts_at: number|null; // When token starts being valid, Unix epoch in milliseconds
  updated_at: number|null; // When token was last updated, Unix epoch in milliseconds
  extra: string|null; // anything extra the NFT wants to store on-chain. Can be stringified JSON.
  reference: string|null; // URL to an off-chain JSON file with more info.
  reference_hash: string|null // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.

  constructor() {}
}

class NFTContractMetadata {
  spec: string; // required, essentially a version like "nft-2.0.0", replacing "2.0.0" with the implemented version of NEP-177
  name: string; // required, ex. "Mochi Rising — Digital Edition" or "Metaverse 3"
  symbol: string; // required, ex. "MOCHI"
  icon: string|null; // Data URL
  base_uri: string|null; // Centralized gateway known to have reliable access to decentralized storage assets referenced by `reference` or `media` URLs
  reference: string|null; // URL to a JSON file with more info
  reference_hash: string|null; // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.

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
  token_id: number;
  owner_id: AccountId;
  token_metadata: TokenMetadata
  constructor(token_id: number, owner_id: AccountId, token_metadata: TokenMetadata) {
    this.token_id = token_id;
    this.owner_id = owner_id;
    this.token_metadata = token_metadata;
  }
}

@NearBindgen({})
class Contract {
  token_id: number;
  owner_id: AccountId;
  metadata: NFTContractMetadata;
  owner_by_id: LookupMap<AccountId>; // key: TokenId, value: AccountId
  token_by_id: LookupMap<Token>; // key: TokenId, value: Token
  tokens_per_owner: LookupMap<UnorderedSet<TokenId>>; // key: AccountId, value: UnorderedSet<TokenId>
  approvals_by_id: LookupMap<{ [approvals: AccountId]: bigint }>; // key: TokenId, value: { [approvals: AccountId]: bigint }

  constructor() {
    this.token_id = 0;
    this.owner_id = "";
    this.metadata = new NFTContractMetadata();
    this.owner_by_id = new LookupMap("a");
    this.token_by_id = new LookupMap("b");
    this.tokens_per_owner = new LookupMap("c");
    this.approvals_by_id = new LookupMap("d");
  }

  @initialize({})
  init({owner_id, prefix}: {owner_id: AccountId, prefix: string}) {
    this.owner_id = owner_id;
    this.token_id = 0
    this.owner_by_id = new LookupMap(prefix);
    this.token_by_id = new LookupMap("b");
    this.tokens_per_owner = new LookupMap("c");
    this.approvals_by_id = new LookupMap("d");
  }

  @call({})
  nft_mint({token_owner_id, token_metadata}: {token_owner_id: AccountId, token_metadata: TokenMetadata}) {
    this.owner_by_id.set(this.token_id.toString(), token_owner_id);
    let token = new Token(this.token_id, token_owner_id, token_metadata);
    this.token_by_id.set(this.token_id.toString(), token);

    // Set tokens per owner
    let token_ids = this.tokens_per_owner.get(token_owner_id, {
      reconstructor: UnorderedSet.reconstruct,
    });
    if (token_ids === null) {
      token_ids = new UnorderedSet(this.token_id.toString());
    }
    token_ids.set(this.token_id.toString())
    this.tokens_per_owner.set(token_owner_id, token_ids)
    this.token_id++;
    return token;
  }

    // ------- ENUMERATION METHODS -------
  // Get the token having specific id
  get_token_by_id(token_id: string) {
    let token = this.token_by_id.get(token_id);
    if (token === null) {
      return null
    }
    return token;
  }

  // Returns the total supply of non-fungible tokens
  @view({})
  nft_total_supply() {
    return this.token_id;
  }

  // Get a list of all tokens
  @view({})
  nft_tokens({ start, max }: { start?: number; max?: number }) {
    var all_tokens = [];

    for (var i = 0; i < this.token_id; i++) {
      all_tokens.push(this.token_by_id.get(i.toString()));
    }

    return all_tokens;
  }

  // Get number of tokens owned by a given account
  @view({})
  nft_supply_for_owner({ owner_id }: { owner_id: AccountId }) {
    const tokens = this.tokens_per_owner.get(owner_id,  {
      reconstructor: UnorderedSet.reconstruct,
    })
    return tokens === null ? 0 : tokens.length;
  }

  // Get list of all tokens owned by a given account
  @view({})
  nft_tokens_for_owner({ owner_id, from_index, limit, }: {
    owner_id: AccountId;
    from_index?: number;
    limit?: number;
  }) {
    const tokens_per_owner = this.tokens_per_owner;
    const token_set = tokens_per_owner.get(owner_id, {
      reconstructor: UnorderedSet.reconstruct,
    });

    if (token_set === null ) {
      return null
    }

    const start_index = from_index === undefined ? 0 : from_index;
    let l = limit === undefined ? 2 ** 32 : limit;
    l = Math.min(l, token_set.length - start_index);

    const ret: Token[] = [];
    for (let i = start_index; i < start_index + l; i++) {
      const token_id = token_set.elements.get(i);
      ret.push(this.get_token_by_id(token_id));
    }
    return ret;
  }

  // ------- CORE FUNCTIONALITY METHODS -------
  @call({})
  nft_transfer() {

  }

  @call({})
  nft_transfer_call() {

  }

  @call({})
  nft_resolve_transfer() {

  }

  @view({})
  nft_token() {

  }

  // ------- APPROVAL MANAGEMENT METHODS -------
  @call({})
  nft_approve() {

  }

  @call({})
  nft_revoke() {

  }

  @call({})
  nft_revoke_all() {

  }

  @view({})
  nft_is_approved() {

  }
}