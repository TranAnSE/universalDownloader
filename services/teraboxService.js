const axios = require("axios");

/**
 * Fetch file info and download URL from Terabox.
 * Accepts both full URLs and short codes.
 * @param {string} inputUrl - Full Terabox URL or short code.
 * @returns {Promise<Object>} - Returns { filename, size, downloadUrl }
 */
async function fetchTeraBox(inputUrl) {
  try {
    const shortUrl = extractShortUrl(inputUrl);
    if (!shortUrl) throw new Error("Invalid Terabox URL or short code.");

    const apiBase = "https://terabox.hnn.workers.dev";

    // Fetch file info
    const infoRes = await axios.get(
      `${apiBase}/api/get-info-new?shorturl=${encodeURIComponent(shortUrl)}`,
      {
        headers: getHeaders(apiBase),
      }
    );

    const info = infoRes.data;
    if (!info.ok || !info.list?.length) {
      throw new Error("Failed to retrieve file info from Terabox.");
    }

    const file = info.list[0];

    const payload = {
      shareid: info.shareid,
      uk: info.uk,
      sign: info.sign,
      timestamp: info.timestamp,
      fs_id: file.fs_id,
    };

    // Fetch download link
    const downloadRes = await axios.post(
      `${apiBase}/api/get-download`,
      payload,
      {
        headers: {
          ...getHeaders(apiBase),
          "Content-Type": "application/json",
        },
      }
    );

    const data = downloadRes.data;
    if (!data.ok) throw new Error("Failed to get download URL from Terabox.");

    return {
      filename: file.server_filename,
      size: file.size,
      downloadUrl: data.downloadLink || data.url || data.link,
    };
  } catch (error) {
    throw new Error(`Terabox API request failed: ${error.message}`);
  }
}

/**
 * Extract shorturl from full Terabox link or return if short code provided.
 */
function extractShortUrl(input) {
  if (/^[A-Za-z0-9_-]+$/.test(input)) return input;
  const match = input.match(/(?:\/s\/|shorturl=)([A-Za-z0-9_-]+)/i);
  return match ? match[1] : null;
}

/**
 * Generate browser-like headers to bypass 403s.
 */
function getHeaders(origin) {
  return {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    Origin: origin,
    Referer: origin + "/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  };
}

module.exports = { fetchTeraBox };
