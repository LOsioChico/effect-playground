import { Config, Effect, pipe } from "effect";

import { Pokemon } from "./schemas";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";

export class PokeApi extends Effect.Service<PokeApi>()("PokeApi", {
  effect: Effect.gen(function* () {
    return {
      getPokemon: getPokemonHttpClient,
    };
  }),
}) {}

const getPokemonHttpClient = Effect.gen(function* () {
  const baseUrl = yield* Config.string("BASE_URL");
  const pokemonName = yield* Effect.sync(() => process.argv[2] || "garchomp");

  return yield* pipe(
    HttpClientRequest.get(`${baseUrl}/api/v2/pokemon/${pokemonName}/`),
    HttpClientRequest.setHeader("Accept", "application/json"),
    HttpClient.fetchOk,
    Effect.flatMap(HttpClientResponse.schemaBodyJson(Pokemon)),
    Effect.scoped
  );
});

// const getPokemonFetch = Effect.gen(function* () {
//   const baseUrl = yield* Config.string("BASE_URL");

//   const response = yield* Effect.tryPromise({
//     try: () => fetch(`${baseUrl}/api/v2/pokemon/garchomp/`),
//     catch: () => new FetchError(),
//   });

//   if (!response.ok) {
//     return yield* new FetchError();
//   }

//   const json = yield* Effect.tryPromise({
//     try: () => response.json(),
//     catch: () => new JsonError(),
//   });

//   return yield* Schema.decodeUnknown(Pokemon)(json);
// });
