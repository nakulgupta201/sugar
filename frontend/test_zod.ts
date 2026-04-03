import { z } from "zod";

type Test = z.infer<typeof schema>;
const schema = z.object({
  age: z.coerce.number().min(1).max(120),
});

const t: Test = { age: 30 };
