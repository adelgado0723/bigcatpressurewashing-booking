declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }

  export const env: Env;

  export function test(
    name: string,
    fn: () => void | Promise<void>,
    options?: {
      ignore?: boolean;
      only?: boolean;
      sanitizeResources?: boolean;
      sanitizeOps?: boolean;
    }
  ): void;
} 