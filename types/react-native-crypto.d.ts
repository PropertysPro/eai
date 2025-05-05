declare module 'react-native-crypto' {
  export function randomBytes(size: number): {
    toString(encoding: 'hex'): string;
  };
}
