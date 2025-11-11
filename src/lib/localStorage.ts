import { createStorage } from "unstorage";
// @ts-expect-error - unstorage package.json exports don't properly expose driver types
import localStorageDriver from "unstorage/drivers/localstorage";

export const storage = createStorage({
  driver: localStorageDriver({ base: "app:" }),
});
