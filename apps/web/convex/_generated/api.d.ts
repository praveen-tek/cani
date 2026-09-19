/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as discover from "../discover.js";
import type * as http from "../http.js";
import type * as invites from "../invites.js";
import type * as lib_firecrawl from "../lib/firecrawl.js";
import type * as lib_markets from "../lib/markets.js";
import type * as lib_membership from "../lib/membership.js";
import type * as products from "../products.js";
import type * as profiles from "../profiles.js";
import type * as suggestions from "../suggestions.js";
import type * as teams from "../teams.js";
import type * as users from "../users.js";
import type * as votes from "../votes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  discover: typeof discover;
  http: typeof http;
  invites: typeof invites;
  "lib/firecrawl": typeof lib_firecrawl;
  "lib/markets": typeof lib_markets;
  "lib/membership": typeof lib_membership;
  products: typeof products;
  profiles: typeof profiles;
  suggestions: typeof suggestions;
  teams: typeof teams;
  users: typeof users;
  votes: typeof votes;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
