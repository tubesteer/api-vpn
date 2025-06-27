// This API route will check the health of a given proxy IP and port.
// It proxies the request to an external health check service.

// Define the external health check API endpoint.
// Make sure to replace this with your actual external health check service URL.
const PROXY_HEALTH_CHECK_API = "https://id1.foolvpn.me/api/v1/check";

/**
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function (req, res) {
  // Set CORS headers to allow requests from any origin.
  const CORS_HEADER_OPTIONS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
  for (const [key, value] of Object.entries(CORS_HEADER_OPTIONS)) {
    res.setHeader(key, value);
  }

  // Handle pre-flight OPTIONS request for CORS.
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests.
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Get the 'target' query parameter from the request URL.
  const { target } = req.query;

  // Check if the 'target' parameter is provided.
  if (!target) {
    return res.status(400).json({ error: 'Missing target query parameter (e.g., ?target=1.1.1.1:443)' });
  }

  // Split the target to get the IP and port.
  const [proxyIP, proxyPort] = target.split(":");

  // Check for valid IP and port format.
  if (!proxyIP || !proxyPort) {
    return res.status(400).json({ error: 'Invalid target format. Use ip:port' });
  }
  
  try {
    // Make a request to the external health check API.
    const response = await fetch(`${PROXY_HEALTH_CHECK_API}?ip=${proxyIP}:${proxyPort}`);

    // Check if the response from the external API is successful.
    if (!response.ok) {
      // If the external API returns an error, forward that status and message.
      return res.status(response.status).json({ error: `External API error: ${response.statusText}` });
    }

    // Parse the JSON response from the external API.
    const result = await response.json();

    // Send the JSON response back to the client.
    return res.status(200).json(result);
  } catch (error) {
    // Catch any network or parsing errors and send a 500 Internal Server Error.
    console.error('Error in proxy health check:', error);
    return res.status(500).json({ error: 'An error occurred while checking proxy health.' });
  }
}
