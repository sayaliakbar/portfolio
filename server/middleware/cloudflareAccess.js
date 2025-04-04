const axios = require("axios");
const jwt = require("jsonwebtoken");

// Cache for certificates to avoid fetching them too often
let certificatesCache = null;
let certificatesCacheTime = 0;
const CERTIFICATES_CACHE_TTL = 3600000; // 1 hour

/**
 * Fetch certificates from Cloudflare Access
 */
const fetchCertificates = async () => {
  // Check cache first
  const now = Date.now();
  if (
    certificatesCache &&
    now - certificatesCacheTime < CERTIFICATES_CACHE_TTL
  ) {
    return certificatesCache;
  }

  try {
    // Fetch the certificates from Cloudflare
    const response = await axios.get(
      `https://${process.env.CLOUDFLARE_TEAM_DOMAIN}/cdn-cgi/access/certs`
    );

    certificatesCache = response.data;
    certificatesCacheTime = now;
    return response.data;
  } catch (error) {
    console.error("Error fetching Cloudflare certificates:", error);
    throw error;
  }
};

/**
 * Middleware to validate Cloudflare Access JWT
 */
const validateCloudflareAccess = async (req, res, next) => {
  try {
    // Look for the JWT in the Cloudflare header
    const cfAccessJwt = req.headers["cf-access-jwt-assertion"];

    if (!cfAccessJwt) {
      return res.status(401).json({
        message:
          "Access denied. This endpoint requires Cloudflare Access authentication.",
      });
    }

    // Get the certificates
    const certificates = await fetchCertificates();

    // Decode the JWT without verification to get the key ID
    const decoded = jwt.decode(cfAccessJwt, { complete: true });

    if (!decoded || !decoded.header || !decoded.header.kid) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    // Find the right certificate
    const cert = certificates.keys.find(
      (key) => key.kid === decoded.header.kid
    );

    if (!cert) {
      return res.status(401).json({ message: "Certificate not found" });
    }

    // Construct PEM certificate from JWKS
    const pem = `-----BEGIN CERTIFICATE-----\n${cert.cert}\n-----END CERTIFICATE-----`;

    // Verify the JWT
    const verified = jwt.verify(cfAccessJwt, pem, {
      algorithms: ["RS256"],
      audience: [process.env.CLOUDFLARE_AUD],
    });

    // Add user info to request
    req.cloudflareAccess = verified;
    req.cloudflareUser = {
      email: verified.email,
      name: verified.name || verified.email,
    };

    next();
  } catch (error) {
    console.error("Cloudflare Access validation error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = validateCloudflareAccess;
