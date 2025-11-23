import jwt, { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";

// ---- Cookie Options
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV !== "development",
  sameSite: "none" as const,
  path: "/",
  domain: ".ascs.space", // IMPORTANT
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ---- Access Token
export function signAccessToken(user: {
  id: string;
  email: string;
  role?: string;
}) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );
}

// ---- Refresh Token
export function signRefreshToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "7d",
  });
}

// ---- error handling
export function tokenErrStatus(err: unknown): number {
  if (err instanceof TokenExpiredError) return 401;
  if (err instanceof JsonWebTokenError) return 403;
  return 403;
}
