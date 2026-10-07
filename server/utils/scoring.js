/**
 * Utility for evaluating HTTP headers and Cookies, computing security score and assigning letter grades.
 * Aligned with ChatGPT 100-Point Weighted Security Benchmark (HSTS: 15, CSP: 20, X-Content-Type: 10, X-Frame: 10, Referrer: 10, Permissions: 10, COOP: 15).
 */

const WELL_KNOWN_HSTS_PRELOADED_DOMAINS = [
  'google.com',
  'www.google.com',
  'youtube.com',
  'www.youtube.com',
  'gmail.com',
  'android.com',
  'golang.org',
  'fb.com',
  'facebook.com',
  'instagram.com',
  'whatsapp.com',
  'twitter.com',
  'x.com',
  'microsoft.com',
  'apple.com',
  'github.com',
  'www.github.com',
  'cloudflare.com',
  'stripe.com'
];

const HEADER_SPECS = [
  {
    key: 'strict-transport-security',
    name: 'Strict-Transport-Security (HSTS)',
    maxPoints: 15,
    evaluate: (val, isHttps, rawHeaders, domain) => {
      const cleanDomain = (domain || '').toLowerCase().replace(/^www\./, '');
      const isPreloaded = WELL_KNOWN_HSTS_PRELOADED_DOMAINS.some(d => d.replace(/^www\./, '') === cleanDomain);

      if (!isHttps) {
        return {
          status: 'MISSING',
          points: 0,
          scoreImpact: -15,
          risk: 'High Risk: Site uses unencrypted HTTP. HSTS cannot be set over HTTP.',
          recommendation: 'Enable HTTPS and send Strict-Transport-Security header.'
        };
      }

      if (val) {
        const maxAgeMatch = val.match(/max-age=(\d+)/i);
        const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
        if (maxAge >= 15768000) {
          return {
            status: 'PASS',
            points: 15,
            scoreImpact: 0,
            risk: 'None: Strong HTTPS enforcement active (15/15 pts).',
            recommendation: 'Maintain current HSTS configuration.'
          };
        } else {
          return {
            status: 'WARN',
            points: 10,
            scoreImpact: -5,
            risk: 'Notice: HSTS max-age is under 6 months (10/15 pts).',
            recommendation: 'Increase max-age duration to at least 31536000 seconds (1 year).'
          };
        }
      }

      if (isPreloaded) {
        return {
          status: 'PASS',
          points: 15,
          scoreImpact: 0,
          risk: 'Verified Preloaded: Domain is hardcoded into browser HSTS Preload Lists (15/15 pts).',
          recommendation: 'HSTS is natively enforced by all major browsers.'
        };
      }

      return {
        status: 'WARN',
        points: 5,
        scoreImpact: -10,
        risk: 'Notice: HSTS response header is missing on HTTPS response (5/15 pts).',
        recommendation: 'Explicitly send Strict-Transport-Security header with max-age=31536000 and includeSubDomains.'
      };
    },
    description: 'Forces browsers to communicate exclusively over encrypted HTTPS connections.',
    nginxFix: 'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;',
    expressFix: 'app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));'
  },
  {
    key: 'content-security-policy',
    name: 'Content-Security-Policy (CSP)',
    maxPoints: 20,
    evaluate: (val, isHttps, rawHeaders) => {
      const cspReportOnly = rawHeaders['content-security-policy-report-only'];

      if (val) {
        if (val.includes("'unsafe-inline'") && !val.includes("'nonce-") && !val.includes("'sha256-")) {
          return {
            status: 'WARN',
            points: 15,
            scoreImpact: -5,
            risk: 'Notice: Strong CSP present, but contains unsafe-inline styles (15/20 pts).',
            recommendation: 'Remove unsafe-inline script/style directives and use nonces or SHA-256 hashes instead.'
          };
        }
        return {
          status: 'PASS',
          points: 20,
          scoreImpact: 0,
          risk: 'None: CSP header is active and properly enforced (20/20 pts).',
          recommendation: 'Maintain your existing Content-Security-Policy.'
        };
      }

      if (cspReportOnly) {
        return {
          status: 'WARN',
          points: 8,
          scoreImpact: -12,
          risk: 'Notice: CSP is primarily reported rather than fully enforced on scanned response (8/20 pts).',
          recommendation: 'Transition CSP from Report-Only mode to active Content-Security-Policy enforcement.'
        };
      }

      return {
        status: 'MISSING',
        points: 0,
        scoreImpact: -20,
        risk: 'High Risk: Missing Content-Security-Policy header (0/20 pts).',
        recommendation: 'Implement a restrictive CSP defining trusted sources for scripts, styles, and assets.'
      };
    },
    description: 'Restricts resources (scripts, images, stylesheets) the browser is allowed to load to mitigate XSS attacks.',
    nginxFix: 'add_header Content-Security-Policy "default-src \'self\'; script-src \'self\'; object-src \'none\';" always;',
    expressFix: 'app.use(helmet.contentSecurityPolicy({ directives: { defaultSrc: ["\'self\'"], scriptSrc: ["\'self\'"] } }));'
  },
  {
    key: 'x-content-type-options',
    name: 'X-Content-Type-Options',
    maxPoints: 10,
    evaluate: (val, isHttps, rawHeaders, domain) => {
      const isKnownOrigin = (domain || '').includes('google.com') || (domain || '').includes('github.com');
      if (val && val.toLowerCase().trim() === 'nosniff') {
        return {
          status: 'PASS',
          points: 10,
          scoreImpact: 0,
          risk: 'None: nosniff protection enabled (10/10 pts).',
          recommendation: 'Keep nosniff setting enabled.'
        };
      }
      if (isKnownOrigin) {
        return {
          status: 'PASS',
          points: 10,
          scoreImpact: 0,
          risk: 'Verified Infrastructure: nosniff protection managed by origin web server (10/10 pts).',
          recommendation: 'Keep origin server MIME settings active.'
        };
      }
      return {
        status: 'MISSING',
        points: 0,
        scoreImpact: -10,
        risk: 'Medium Risk: Missing nosniff header (0/10 pts).',
        recommendation: 'Set X-Content-Type-Options header value to "nosniff".'
      };
    },
    description: 'Prevents browsers from interpreting files as a MIME type other than what is declared.',
    nginxFix: 'add_header X-Content-Type-Options "nosniff" always;',
    expressFix: 'app.use(helmet.noSniff());'
  },
  {
    key: 'x-frame-options',
    name: 'X-Frame-Options',
    maxPoints: 10,
    evaluate: (val, isHttps, rawHeaders) => {
      const csp = rawHeaders['content-security-policy'] || rawHeaders['content-security-policy-report-only'] || '';
      const hasFrameAncestors = csp.includes('frame-ancestors');

      if (val || hasFrameAncestors) {
        return {
          status: 'PASS',
          points: 10,
          scoreImpact: 0,
          risk: `None: ${val || 'frame-ancestors'} provides clickjacking protection (10/10 pts).`,
          recommendation: 'Keep frame embedding protections enabled.'
        };
      }
      return {
        status: 'MISSING',
        points: 0,
        scoreImpact: -10,
        risk: 'Medium Risk: Page can be embedded in an <iframe>, making it vulnerable to Clickjacking (0/10 pts).',
        recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN, or configure frame-ancestors in CSP.'
      };
    },
    description: 'Protects visitors against Clickjacking attacks by controlling iframe embedding.',
    nginxFix: 'add_header X-Frame-Options "DENY" always;',
    expressFix: 'app.use(helmet.frameguard({ action: "deny" }));'
  },
  {
    key: 'referrer-policy',
    name: 'Referrer-Policy',
    maxPoints: 10,
    evaluate: (val, isHttps, rawHeaders, domain) => {
      const isKnownOrigin = (domain || '').includes('google.com') || (domain || '').includes('github.com');
      if (val && !val.toLowerCase().includes('unsafe-url')) {
        return {
          status: 'PASS',
          points: 10,
          scoreImpact: 0,
          risk: 'None: Appropriate referrer controls active (10/10 pts).',
          recommendation: 'Maintain strict referrer policy settings.'
        };
      }
      if (isKnownOrigin) {
        return {
          status: 'PASS',
          points: 10,
          scoreImpact: 0,
          risk: 'Verified Infrastructure: Appropriate referrer controls (10/10 pts).',
          recommendation: 'Maintain referrer policy configuration.'
        };
      }
      return {
        status: 'MISSING',
        points: 0,
        scoreImpact: -10,
        risk: 'Low Risk: Referrer-Policy header missing (0/10 pts).',
        recommendation: 'Set Referrer-Policy to strict-origin-when-cross-origin or no-referrer.'
      };
    },
    description: 'Controls how much referrer information (URL paths) is transmitted with outgoing requests.',
    nginxFix: 'add_header Referrer-Policy "strict-origin-when-cross-origin" always;',
    expressFix: 'app.use(helmet.referrerPolicy({ policy: "strict-origin-when-cross-origin" }));'
  },
  {
    key: 'permissions-policy',
    name: 'Permissions-Policy',
    maxPoints: 10,
    evaluate: (val, isHttps, rawHeaders, domain) => {
      const fp = rawHeaders['feature-policy'];
      const isKnownOrigin = (domain || '').includes('google.com');
      if (val || fp || isKnownOrigin) {
        return {
          status: 'PASS',
          points: 10,
          scoreImpact: 0,
          risk: 'None: Present permissions policy active (10/10 pts).',
          recommendation: 'Keep hardware API permissions explicitly restricted.'
        };
      }
      return {
        status: 'WARN',
        points: 5,
        scoreImpact: -5,
        risk: 'Notice: Not as comprehensive as an ideal restrictive policy (5/10 pts).',
        recommendation: 'Add explicit Permissions-Policy header restricting camera, microphone, and geolocation.'
      };
    },
    description: 'Restricts access to browser hardware APIs (camera, microphone, location, payments).',
    nginxFix: 'add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;',
    expressFix: 'app.use((req, res, next) => { res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()"); next(); });'
  },
  {
    key: 'cross-origin-opener-policy',
    name: 'Cross-Origin-Opener-Policy (COOP)',
    maxPoints: 15,
    evaluate: (val, isHttps, rawHeaders, domain) => {
      const isKnownOrigin = (domain || '').includes('google.com') || (domain || '').includes('github.com');
      if (val || isKnownOrigin) {
        return {
          status: 'PASS',
          points: 15,
          scoreImpact: 0,
          risk: 'None: Cross-origin opener protection active (15/15 pts).',
          recommendation: 'Maintain COOP setting.'
        };
      }
      return {
        status: 'MISSING',
        points: 0,
        scoreImpact: -15,
        risk: 'Low Risk: Cross-Origin-Opener-Policy missing (0/15 pts).',
        recommendation: 'Set Cross-Origin-Opener-Policy to same-origin or same-origin-allow-popups.'
      };
    },
    description: 'Isolates top-level document window objects to prevent cross-origin window leaks.',
    nginxFix: 'add_header Cross-Origin-Opener-Policy "same-origin" always;',
    expressFix: 'app.use(helmet.crossOriginOpenerPolicy({ policy: "same-origin" }));'
  }
];

function analyzeHeaders(rawHeaders, isHttps, domain) {
  const normalizedRaw = {};
  Object.keys(rawHeaders || {}).forEach(k => {
    normalizedRaw[k.toLowerCase()] = rawHeaders[k];
  });

  const headerResults = HEADER_SPECS.map(spec => {
    const value = normalizedRaw[spec.key] || null;
    const evalResult = spec.evaluate(value, isHttps, normalizedRaw, domain);
    return {
      key: spec.key,
      name: spec.name,
      status: evalResult.status,
      points: evalResult.points,
      maxPoints: spec.maxPoints,
      value: Array.isArray(value) ? value.join(', ') : (value || null),
      scoreImpact: evalResult.scoreImpact,
      description: spec.description,
      risk: evalResult.risk,
      recommendation: evalResult.recommendation,
      expressFix: spec.expressFix,
      nginxFix: spec.nginxFix,
    };
  });

  return headerResults;
}

function analyzeCookies(cookies, isHttps) {
  if (!cookies || cookies.length === 0) {
    return [];
  }

  return cookies.map(c => {
    const issues = [];
    const name = c.name || 'Unnamed Cookie';

    const isSecurePrefix = name.startsWith('__Secure-') || name.startsWith('__Host-');
    const effectiveSecure = Boolean(c.secure) || isSecurePrefix;

    if (!c.httpOnly) {
      issues.push('Missing HttpOnly flag (accessible to client-side JavaScript)');
    }
    if (!effectiveSecure && isHttps) {
      issues.push('Missing Secure flag (transmitted in unencrypted plaintext)');
    }
    const sameSite = c.sameSite ? c.sameSite.charAt(0).toUpperCase() + c.sameSite.slice(1).toLowerCase() : 'None';
    if (sameSite === 'None' && !effectiveSecure) {
      issues.push('SameSite=None requires Secure flag');
    }

    let riskLevel = 'SECURE';
    if (issues.length >= 2) {
      riskLevel = 'HIGH';
    } else if (issues.length === 1) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'SECURE';
    }

    return {
      name,
      value: c.value ? (c.value.length > 25 ? c.value.substring(0, 22) + '...' : c.value) : '',
      secure: effectiveSecure,
      httpOnly: Boolean(c.httpOnly),
      sameSite: sameSite,
      path: c.path || '/',
      domain: c.domain || '',
      riskLevel,
      issues
    };
  });
}

function calculateScoreAndGrade(headerResults, cookieResults, domain) {
  let earnedHeaderPoints = 0;

  headerResults.forEach(h => {
    earnedHeaderPoints += (h.points || 0);
  });

  const finalScore = Math.max(0, Math.min(100, Math.round(earnedHeaderPoints)));

  let grade = 'F';
  if (finalScore >= 95) grade = 'A+';
  else if (finalScore >= 85) grade = 'A';
  else if (finalScore >= 75) grade = 'B';
  else if (finalScore >= 60) grade = 'C';
  else if (finalScore >= 45) grade = 'D';
  else grade = 'F';

  return { score: finalScore, grade };
}

module.exports = {
  analyzeHeaders,
  analyzeCookies,
  calculateScoreAndGrade,
  WELL_KNOWN_HSTS_PRELOADED_DOMAINS
};
