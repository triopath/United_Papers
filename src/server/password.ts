import bcrypt from "bcryptjs";

export const BCRYPT_COST = 12;

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_COST);
}

// A real bcrypt hash to compare against when the account doesn't exist, so response
// time doesn't reveal whether an email is registered.
let dummy: string | null = null;
const dummyHash = () => (dummy ??= bcrypt.hashSync("not-a-real-password", BCRYPT_COST));

export function verifyPassword(plain: string, hash: string | undefined) {
  return bcrypt.compare(plain, hash ?? dummyHash());
}
