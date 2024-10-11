const API_URL = "https://jsonplaceholder.typicode.com/todos";

interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

// Problems with this imperative approach:
// 1. Error handling is mixed with the main logic, making it harder to reason about.
// 2. The function doesn't handle different types of errors distinctly.
// 3. It doesn't provide a way to cancel the operation if needed.
// 4. Lacks proper resource management (e.g., closing connections).
// 5. Doesn't handle potential JSON parsing errors separately.
// 6. Returns an empty array on error, which might mask issues.
// 7. Doesn't allow for easy retries or backoff strategies.
const getTodosImperative = async (): Promise<Todo[] | undefined> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok)
      throw new Error(
        `[getTodosImperative] HTTP error! status: ${response.status}`
      );

    const todos = await response.json();
    return todos;
  } catch (error) {
    console.error(`[getTodosImperative] Error fetching todos: ${error}`);
  }
};

const todos = await getTodosImperative();
if (todos) console.log(`[getTodosImperative] Todos: ${todos.length}`);

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------

import { Data, Effect } from "effect";
import { Schema } from "@effect/schema";

const ResponseSchema = Schema.Array(
  Schema.Struct({
    userId: Schema.Int,
    id: Schema.Int,
    title: Schema.String,
    completed: Schema.Boolean,
  })
);

class RequestError extends Data.TaggedError("RequestError")<{
  message: string;
}> {}
class NotOkError extends Data.TaggedError("NotOkError") {}
class NotJsonError extends Data.TaggedError("NotJsonError") {}
class NoElementsError extends Data.TaggedError("NoElementsError") {}

const getTodosEffect = Effect.gen(function* (_) {
  const response = yield* _(
    Effect.tryPromise({
      try: () => fetch(API_URL),
      catch: (error: unknown) => new RequestError({ message: String(error) }),
    }),
    Effect.filterOrElse(
      (response) => response.ok,
      () => new NotOkError()
    )
  );

  const todos = yield* _(
    Effect.tryPromise({
      try: () => response.json(),
      catch: () => new NotJsonError(),
    })
  );

  const parsedTodos = yield* _(
    Schema.decodeUnknown(ResponseSchema, {
      exact: true,
    })(todos),
    Effect.filterOrElse(
      (todos) => todos.length > 0,
      () => new NoElementsError()
    )
  );

  return parsedTodos;
});
await getTodosEffect.pipe(
  Effect.catchAll((error) => {
    console.error(`[getTodosEffect] Error fetching todos: ${error.message}`);
    return Effect.fail(error);
  }),
  Effect.tap((todos) => {
    console.log(`[getTodosEffect] Todos: ${todos.length}`);
  }),
  Effect.ignore,
  Effect.runPromise
);
