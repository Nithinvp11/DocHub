/// <reference types="jest" />

declare global {
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void | Promise<void>): void;
  function expect<T>(actual: T): jest.Matchers<T>;
}

export {};
