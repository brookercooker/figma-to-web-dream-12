import { SIGN_IN_REQUIRED } from "@/lib/authGate";

type Client = Record<string, any>;
/** Front-end write boundary only; server permissions remain authoritative. */
export function reviewClient(client: Client, hasUser: () => Promise<boolean>): Client {
  const denied = () => ({ data: null, error: { message: SIGN_IN_REQUIRED }, count: null });
  const chain = (target: any, writing = false): any => new Proxy(target, {
    get(obj, key) {
      if (key === "then") return (resolve: any, reject: any) => (async () => {
        if (writing && !await hasUser()) return denied();
        return await obj;
      })().then(resolve, reject);
      const value = Reflect.get(obj, key);
      if (typeof value !== "function") return value;
      return (...args: any[]) => chain(value.apply(obj, args), writing || ["insert", "update", "upsert", "delete"].includes(String(key)));
    },
  });
  const protectedMethods = (target: any, methods: string[]) => new Proxy(target, {
    get(obj, key) {
      const value = Reflect.get(obj, key);
      if (typeof value !== "function") return value;
      return async (...args: any[]) => {
        if (methods.includes(String(key)) && !await hasUser()) return denied();
        return value.apply(obj, args);
      };
    },
  });
  return new Proxy(client, {
    get(obj, key) {
      if (key === "from") return (...args: any[]) => chain(obj.from(...args));
      if (key === "functions") return protectedMethods(obj.functions, ["invoke"]);
      if (key === "storage") return new Proxy(obj.storage, { get(storage, prop) {
        if (prop === "from") return (...args: any[]) => protectedMethods(storage.from(...args), ["upload", "update", "remove", "move", "copy"]);
        const value = Reflect.get(storage, prop); return typeof value === "function" ? value.bind(storage) : value;
      } });
      const value = Reflect.get(obj, key); return typeof value === "function" ? value.bind(obj) : value;
    },
  });
}