const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const { promisify } = require("util");

// Initialize the JWKS client
const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
});

// Function to get the signing key
const getSigningKey = async (kid) => {
  try {
    const getSigningKeyAsync = promisify(client.getSigningKey);
    const key = await getSigningKeyAsync(kid);
    return key.getPublicKey();
  } catch (error) {
    console.error("Error getting signing key:", error);
    throw error;
  }
};

// Auth0 middleware
const auth0Middleware = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization header missing or invalid" });
    }

    // Extract the token
    const token = authHeader.split(" ")[1];

    // Decode the token to get the header
    const decoded = jwt.decode(token, { complete: true });

    if (!decoded || !decoded.header || !decoded.header.kid) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    // Get the signing key
    const signingKey = await getSigningKey(decoded.header.kid);

    // Verify the token
    const verifiedToken = jwt.verify(token, signingKey, {
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      algorithms: ["RS256"],
    });

    // Add the user info to the request
    req.auth = verifiedToken;

    // Call the next middleware
    next();
  } catch (error) {
    console.error("Auth0 middleware error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = auth0Middleware;
