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
    formattedUrl = 'http://' + formattedUrl;
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
  const globalStartTime = Date.now();
  const { normalizedUrl, domain, isHttps } = await normalizeAndValidateUrl(inputUrl);

  const redirectHistory = [];
  let currentUrl = normalizedUrl;
  let response = null;
  let redirectsCount = 0;
  const maxRedirects = 5;

  // Use native fetch to avoid IPv6 hang issues with Axios
  // Temporarily disable TLS verification for this scope to allow scanning sites with bad certs
  const originalTlsReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const sanitizeHeaders = (headers) => {
    const sanitized = {};
    Object.keys(headers).forEach(k => {
      const val = headers[k];
      let strVal = Array.isArray(val) ? val.join(', ') : String(val);
      const lowerK = k.toLowerCase();
      if (['authorization', 'cookie', 'x-api-key', 'session'].includes(lowerK)) {
        strVal = '*** REDACTED ***';
      } else if (lowerK === 'set-cookie') {
        // Redact values but keep directives for visibility
        strVal = strVal.replace(/([^=;\s]+)=([^;]+)/g, (match, key) => {
           if (['domain', 'path', 'expires', 'max-age', 'samesite'].includes(key.toLowerCase())) {
               return match;
           }
           return `${key}=***REDACTED***`;
        });
      }
      sanitized[k] = strVal;
    });
    return sanitized;
  };

  try {
    while (redirectsCount <= maxRedirects) {
      try {
        const stepStartTime = Date.now();
        
        // Setup AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        response = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        });
        
        clearTimeout(timeoutId);
        
        const stepDuration = Date.now() - stepStartTime;
        
        // Convert Fetch Headers object to a plain key-value object
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          if (responseHeaders[key]) {
            responseHeaders[key] = `${responseHeaders[key]}, ${value}`;
          } else {
            responseHeaders[key] = value;
          }
        });

        // Set-Cookie requires special handling in Fetch API since they can't be joined by commas
        const setCookieHeaders = response.headers.getSetCookie ? response.headers.getSetCookie() : (responseHeaders['set-cookie'] ? [responseHeaders['set-cookie']] : []);
        if (setCookieHeaders.length > 0) {
           responseHeaders['set-cookie'] = setCookieHeaders;
        }
        
        const isRedirect = [301, 302, 303, 307, 308].includes(response.status) && responseHeaders.location;
        
        redirectHistory.push({
          url: currentUrl,
          status: response.status,
          location: responseHeaders.location || null,
          headers: sanitizeHeaders(responseHeaders),
          isFinal: !isRedirect,
          durationMs: stepDuration
        });

        if (isRedirect) {
          const nextUrl = new URL(responseHeaders.location, currentUrl).href;
          await normalizeAndValidateUrl(nextUrl);
          currentUrl = nextUrl;
          redirectsCount++;
          if (redirectsCount > maxRedirects) {
            break;
          }
        } else {
          // Attach our parsed headers to the response object so the rest of the code works
          response.parsedHeaders = responseHeaders;
          break; // Final response
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          throw new Error(`Connection Timeout: Request to ${currentUrl} timed out.`);
        } else if (err.cause?.code === 'ENOTFOUND') {
          throw new Error(`Target Unreachable: Hostname could not be found.`);
        } else if (err.cause?.code === 'ECONNREFUSED') {
          throw new Error(`Connection Refused: Target port is closed.`);
        } else {
          throw new Error(`Network Error: ${err.message}`);
        }
      }
    }
  } finally {
    // Restore TLS setting
    if (originalTlsReject === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    } else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalTlsReject;
    }
  }

  if (!response) {
    throw new Error('Failed to retrieve response from target domain.');
  }

  // Allow scanning even if it's a 4xx or 5xx, but flag it
  if (response.status >= 400) {
    // Only throw if it's WAF block or auth required that completely prevents scanning
  }

  const durationMs = Date.now() - globalStartTime;
  const rawHeaders = response.parsedHeaders;
  
  const setCookieHeader = response.headers['set-cookie'] || [];
  const parsedCookies = setCookieParser.parse(setCookieHeader, { decodeValues: true });

  const finalIsHttps = currentUrl.startsWith('https://');
  const headerResults = analyzeHeaders(rawHeaders, finalIsHttps, domain);
  const cookieResults = analyzeCookies(parsedCookies, finalIsHttps);
  const { score, grade } = calculateScoreAndGrade(headerResults);

  return {
    targetUrl: currentUrl,
    domain: domain,
    score,
    grade,
    headerResults,
    cookieResults,
    rawHeaders: sanitizeHeaders(rawHeaders),
    scanDurationMs: durationMs,
    redirectHistory,
    scannedAt: new Date()
  };
}

module.exports = {
  scanTarget,
  normalizeAndValidateUrl
};
