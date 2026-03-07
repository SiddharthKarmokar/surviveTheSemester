const isProduction = process.env.NODE_ENV === "production";

export const authCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
};

export const clearAuthCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
};

export const setCookie = (res, name, value) => {
    res.cookie(name, value, authCookieOptions);
};

export const clearAuthCookie = (res, name) => {
    res.clearCookie(name, clearAuthCookieOptions);
};