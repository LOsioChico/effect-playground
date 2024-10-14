import { Effect, Layer } from "effect";
import { PokeApi } from "./PokeApi";

const MainLayer = Layer.mergeAll(PokeApi.Default);

const program = Effect.gen(function* () {
  const pokeApi = yield* PokeApi;
  return yield* pokeApi.getPokemon;
});

const runnable = program.pipe(Effect.provide(MainLayer));

const main = runnable.pipe(
  Effect.catchTags({
    ParseError: (error) => Effect.succeed(`Parse error - ${error.message}`),
    RequestError: (error) => Effect.succeed(`Request error - ${error.message}`),
    ResponseError: (error) =>
      Effect.succeed(`Response error - ${error.message}`),
  })
);

Effect.runPromise(main).then(console.log);
