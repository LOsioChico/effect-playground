import { Config, Context, Effect } from "effect";
import { Schema } from "@effect/schema";

import { FetchError, JsonError } from "./errors";
import { Pokemon } from "./schemas";

const make = {
  getPokemon: Effect.gen(function* () {
    const baseUrl = yield* Config.string("BASE_URL");

    const response = yield* Effect.tryPromise({
      try: () => fetch(`${baseUrl}/api/v2/pokemon/garchomp/`),
      catch: () => new FetchError(),
    });

    if (!response.ok) {
      return yield* new FetchError();
    }

    const json = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: () => new JsonError(),
    });

    return yield* Schema.decodeUnknown(Pokemon)(json);
  }),
};

export class PokeApi extends Context.Tag("PokeApi")<PokeApi, typeof make>() {
  static readonly Live = PokeApi.of(make);
}
