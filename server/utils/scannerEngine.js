const axios = require('axios');
const dns = require('dns').promises;
const ipaddr = require('ipaddr.js');
const setCookieParser = require('set-cookie-parser');
const { analyzeHeaders, analyzeCookies, calculateScoreAndGrade } = require('./scoring');

/**
 * Validates if an IP address is a private/internal range to prevent Server-Side Request Forgery (SSRF).
 */
function isPrivateIp(ipString) {
  try {
    if (!ipaddr.isValid(ipString)) return true; // Block invalid formats
    const parsed = ipaddr.parse(ipString);
    const range = parsed.range();

    // Standard private/internal range names returned by ipaddr.js
    const privateRanges = [
      'loopback',
      'private',
      'linkLocal',
      'broadcast',
      'carrierGradeNat',
      'unspecified',
      'uniqueLocal',
      'ipv4Mapped'
    ];

    if (privateRanges.includes(range)) {
      return true;
    }

    return false;
  } catch (err) {
    return true; // Safe fallback: block if parsing fails
  }
}

/**
 * Normalizes input URL and verifies target domain resolves to public IPs.
 */
async function normalizeAndValidateUrl(inputUrl) {
  let formattedUrl = inputUrl.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = 'https://' + formattedUrl;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(formattedUrl);
  } catch (err) {
    throw new Error('Invalid URL format. Please enter a valid domain or URL (e.g., example.com or https://example.com).');
  }

  const hostname = parsedUrl.hostname;

  // Block obvious localhost / internal hostnames
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1'
  ) {
    throw new Error('SSRF Protection Blocked: Scans to internal/localhost IP addresses are not permitted.');
  }

  // Check if direct IP address was submitted
  if (ipaddr.isValid(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error('SSRF Protection Blocked: Scanning private or reserved IP ranges is prohibited.');
    }
  } else {
    // Perform DNS lookup to check resolved IPs against SSRF rules
    try {
      const addresses = await dns.lookup(hostname, { all: true });
      for (const addr of addresses) {
        if (isPrivateIp(addr.address)) {
          throw new Error(`SSRF Protection Blocked: Domain ${hostname} resolves to private IP (${addr.address}).`);
        }
      }
    } catch (dnsErr) {
      if (dnsErr.message.includes('SSRF Protection Blocked')) {
        throw dnsErr;
      }
      throw new Error(`DNS Lookup Failed: Unable to resolve hostname "${hostname}". Please verify the domain name.`);
    }
  }

  return {
    normalizedUrl: parsedUrl.href,
    domain: parsedUrl.hostname,
    isHttps: parsedUrl.protocol === 'https:'
  };
}

/**
 * Executes scanner HTTP GET request following up to 5 redirects.
 */
async function scanTarget(inputUrl) {
  const startTime = Date.now();
  const { normalizedUrl, domain, isHttps } = await normalizeAndValidateUrl(inputUrl);

  const redirectHistory = [];
  let currentUrl = normalizedUrl;
  let response = null;
  let redirectsCount = 0;
  const maxRedirects = 5;

  const instance = axios.create({
    timeout: 5000,
    maxRedirects: 0, // Manual redirect handling to record history
    validateStatus: () => true, // Accept all HTTP status codes (2xx, 3xx, 4xx, 5xx)
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });

  while (redirectsCount <= maxRedirects) {
    try {
      response = await instance.get(currentUrl);
      redirectHistory.push({
        url: currentUrl,
        status: response.status
      });

      // Handle HTTP redirects (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(response.status) && response.headers.location) {
        const nextUrl = new URL(response.headers.location, currentUrl).href;
        
        // Re-validate target URL for SSRF on redirect
        await normalizeAndValidateUrl(nextUrl);

        currentUrl = nextUrl;
        redirectsCount++;
        if (redirectsCount > maxRedirects) {
          break;
        }
      } else {
        break; // Reached final target response
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        throw new Error(`Connection Timeout: Request to ${currentUrl} timed out after 5 seconds.`);
      } else if (err.code === 'ENOTFOUND') {
        throw new Error(`Target Unreachable: Hostname could not be found.`);
      } else if (err.code === 'ECONNREFUSED') {
        throw new Error(`Connection Refused: Target port is closed or unreachable.`);
      } else {
        throw new Error(`Network Error: ${err.message}`);
      }
    }
  }

  if (!response) {
    throw new Error('Failed to retrieve response from target domain.');
  }

  // Validate final response status code
  if (![200, 204, 304].includes(response.status)) {
    if (response.status === 403 || response.status === 503 || response.status === 401) {
      throw new Error(`WAF/Security Block: The target domain returned a ${response.status} status code, likely blocking the automated scanner.`);
    }
    throw new Error(`Invalid Target Response: The target domain returned a non-success HTTP status code (${response.status}). Only 200, 204, and 304 are supported for scanning.`);
  }

  const durationMs = Date.now() - startTime;
  const rawHeaders = response.headers;
  
  // Extract set-cookie headers
  const setCookieHeader = response.headers['set-cookie'] || [];
  const parsedCookies = setCookieParser.parse(setCookieHeader, {
    decodeValues: true
  });

  // Evaluate Headers & Cookies
  const finalIsHttps = currentUrl.startsWith('https://');
  const headerResults = analyzeHeaders(rawHeaders, finalIsHttps, domain);
  const cookieResults = analyzeCookies(parsedCookies, finalIsHttps);
  const { score, grade } = calculateScoreAndGrade(headerResults, cookieResults, domain);

  // Convert raw headers to key-value string map for persistence & API response
  const formattedRawHeaders = {};
  Object.keys(rawHeaders).forEach(k => {
    const val = rawHeaders[k];
    formattedRawHeaders[k] = Array.isArray(val) ? val.join(', ') : String(val);
  });

  return {
    targetUrl: currentUrl,
    domain: domain,
    score,
    grade,
    headerResults,
    cookieResults,
    rawHeaders: formattedRawHeaders,
    scanDurationMs: durationMs,
    redirectHistory,
    scannedAt: new Date()
  };
}

module.exports = {
  scanTarget,
  normalizeAndValidateUrl
};
