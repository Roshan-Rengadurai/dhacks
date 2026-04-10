const supabase = require("../lib/supabase");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "No auth token found — make sure you're sending the Authorization header",
    });
  }

  const token = header.replace("Bearer ", "");

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({
      error: "Couldn't verify your session — try logging in again",
    });
  }

  req.user = user;
  next();
}

module.exports = requireAuth;
