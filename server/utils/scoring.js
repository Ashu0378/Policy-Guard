/**
 * Utility for evaluating HTTP headers and Cookies, computing security score and assigning letter grades.
 * Aligned with ChatGPT 100-Point Weighted Security Benchmark.
 */

const WELL_KNOWN_HSTS_PRELOADED_DOMAINS = [
  'google.com', 'www.google.com', 'youtube.com', 'www.youtube.com', 'gmail.com', 'android.com',
  'golang.org', 'fb.com', 'facebook.com', 'instagram.com', 'whatsapp.com', 'twitter.com',
  'x.com', 'microsoft.com', 'apple.com', 'github.com', 'www.github.com', 'cloudflare.com', 'stripe.com'
];

const HEADER_SPECS = [
  {
    key: 'strict-transport-security',
    name: 'Strict-Transport-Security (HSTS)',
    maxPoints: 20,
    evaluate: (val, isHttps, rawHeaders, domain) => {
      const cleanDomain = (domain || '').toLowerCase().replace(/^www\./, '');
      const isPreloaded = WELL_KNOWN_HSTS_PRELOADED_DOMAINS.some(d => d.replace(/^www\./, '') === cleanDomain);

      if (!isHttps) {
        return {
          status: 'MISSING', points: 0, severity: 'HIGH',
          risk: 'Site uses unencrypted HTTP. HSTS cannot be set over HTTP.',
          recommendation: 'Enable HTTPS and send Strict-Transport-Security header.'
        };
      }

      if (!val) {
        if (isPreloaded) {
          return {
            status: 'PASS', points: 20, severity: 'LOW',
            risk: 'Verified Preloaded: Domain is hardcoded into browser HSTS Preload Lists.',
            recommendation: 'HSTS is natively enforced by all major browsers. Configuration is secure.'
          };
        }
        return {
          status: 'MISSING', points: 0, severity: 'HIGH',
          risk: 'HSTS response header is missing on HTTPS response.',
          recommendation: 'Explicitly send Strict-Transport-Security header with max-age=31536000 and includeSubDomains.'
        };
      }

      const maxAgeMatch = val.match(/max-age=(\d+)/i);
      const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
      const hasSubDomains = /includeSubDomains/i.test(val);
      const hasPreload = /preload/i.test(val);

      if (maxAge >= 31536000 && hasSubDomains) {
        return {
          status: 'PASS', points: 20, severity: 'LOW',
          risk: 'Strong HTTPS enforcement active. Good max-age and subdomains included.',
          recommendation: 'Maintain current HSTS configuration.'
        };
      } else if (maxAge >= 15768000) {
        return {
          status: 'WARN', points: 15, severity: 'MEDIUM',
          risk: `HSTS is enabled but ${!hasSubDomains ? 'missing includeSubDomains' : 'max-age is under 1 year'}.`,
          recommendation: 'Increase max-age duration to at least 31536000 seconds (1 year) and add includeSubDomains.'
        };
      } else if (maxAge > 0) {
        return {
          status: 'WARN', points: 5, severity: 'HIGH',
          risk: 'HSTS max-age is critically short, offering minimal protection.',
          recommendation: 'Increase max-age duration to at least 31536000 seconds (1 year).'
        };
      }

      return {
        status: 'WARN', points: 0, severity: 'HIGH',
        risk: 'Invalid or zero max-age provided. HSTS is effectively disabled.',
        recommendation: 'Set max-age to a valid, long duration (e.g., 31536000).'
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

      if (!val) {
        if (cspReportOnly) {
          return {
            status: 'WARN', points: 5, severity: 'HIGH',
            risk: 'Report-Only policy detected. The browser is monitoring CSP violations but is not enforcing the policy.',
            recommendation: 'Deploy an equivalent enforced Content-Security-Policy after validating violations.'
          };
        }
        return {
          status: 'MISSING', points: 0, severity: 'HIGH',
          risk: 'No browser-enforced Content Security Policy is present. Vulnerable to XSS.',
          recommendation: "Deploy an enforced CSP appropriate to the application's resources. E.g., default-src 'self'."
        };
      }

      // Analyze directives
      const hasUnsafeInline = val.includes("'unsafe-inline'");
      const hasUnsafeEval = val.includes("'unsafe-eval'");
      const hasWildcard = val.includes("*");
      const hasNonce = val.includes("'nonce-");
      const hasHash = val.includes("'sha");

      if ((hasUnsafeInline && !hasNonce && !hasHash) || hasWildcard) {
        return {
          status: 'WARN', points: 10, severity: 'MEDIUM',
          risk: "Weak configuration: CSP allows 'unsafe-inline' or wildcard (*) sources, reducing XSS protection.",
          recommendation: 'Remove unsafe-inline script/style directives and use nonces or SHA-256 hashes instead.'
        };
      }

      if (hasUnsafeEval) {
        return {
          status: 'WARN', points: 15, severity: 'LOW',
          risk: "Moderate configuration: CSP relies on 'unsafe-eval' which can be risky if user input is evaluated.",
          recommendation: "Remove 'unsafe-eval' if possible, or tightly control inputs."
        };
      }

      return {
        status: 'PASS', points: 20, severity: 'LOW',
        risk: 'Strong configuration: CSP header is active and properly restricts resources.',
        recommendation: 'Maintain your existing Content-Security-Policy.'
      };
    },
    description: 'Restricts resources (scripts, images, stylesheets) the browser is allowed to load to mitigate XSS attacks.',
    nginxFix: 'add_header Content-Security-Policy "default-src \'self\'; script-src \'self\'; object-src \'none\';" always;',
    expressFix: 'app.use(helmet.contentSecurityPolicy({ directives: { defaultSrc: ["\'self\'"], scriptSrc: ["\'self\'"] } }));'
  },
  {
    key: 'x-content-type-options',
    name: 'X-Content-Type-Options',
    maxPoints: 15,
    evaluate: (val, isHttps, rawHeaders, domain) => {
      if (val && val.toLowerCase().trim() === 'nosniff') {
        return {
          status: 'PASS', points: 15, severity: 'LOW',
          risk: 'nosniff protection enabled.',
          recommendation: 'Keep nosniff setting enabled.'
        };
      }
      if (val) {
        return {
          status: 'WARN', points: 0, severity: 'MEDIUM',
          risk: `Unexpected value "${val}". Only "nosniff" is valid.`,
          recommendation: 'Set X-Content-Type-Options exactly to "nosniff".'
        };
      }
      return {
        status: 'MISSING', points: 0, severity: 'MEDIUM',
        risk: 'Missing nosniff header. Browsers may sniff content away from declared content-type.',
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
    maxPoints: 15,
    evaluate: (val, isHttps, rawHeaders) => {
      const csp = rawHeaders['content-security-policy'] || '';
      const hasFrameAncestors = csp.includes('frame-ancestors');

      if (hasFrameAncestors) {
        return {
          status: 'PASS', points: 15, severity: 'LOW',
          risk: 'Clickjacking protection detected through CSP frame-ancestors.',
          recommendation: 'Maintain CSP frame-ancestors configuration.'
        };
      }

      if (val) {
        const lowerVal = val.toLowerCase().trim();
        if (lowerVal === 'deny' || lowerVal === 'sameorigin') {
          return {
            status: 'PASS', points: 15, severity: 'LOW',
            risk: `Clickjacking protection active via X-Frame-Options: ${lowerVal}.`,
            recommendation: 'Consider migrating to CSP frame-ancestors for modern browsers, but current config is secure.'
          };
        }
        return {
          status: 'WARN', points: 0, severity: 'MEDIUM',
          risk: `Invalid or obsolete X-Frame-Options value: ${val}.`,
          recommendation: 'Use DENY or SAMEORIGIN, or configure frame-ancestors in CSP.'
        };
      }

      return {
        status: 'MISSING', points: 0, severity: 'HIGH',
        risk: 'Page can be embedded in an <iframe>, making it vulnerable to Clickjacking.',
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
      if (!val) {
        return {
          status: 'MISSING', points: 0, severity: 'MEDIUM',
          risk: 'Referrer-Policy header missing. Browsers default to strict-origin-when-cross-origin, but explicit policy is recommended.',
          recommendation: 'Set Referrer-Policy to strict-origin-when-cross-origin or no-referrer.'
        };
      }

      const lowerVal = val.toLowerCase().trim();
      if (['no-referrer', 'same-origin', 'strict-origin', 'strict-origin-when-cross-origin'].includes(lowerVal)) {
        return {
          status: 'PASS', points: 10, severity: 'LOW',
          risk: 'Strong privacy protection: Appropriate referrer controls active.',
          recommendation: 'Maintain strict referrer policy settings.'
        };
      }
      
      if (['origin', 'origin-when-cross-origin'].includes(lowerVal)) {
        return {
          status: 'WARN', points: 5, severity: 'MEDIUM',
          risk: 'Moderate privacy protection: Origin leaks to cross-origin requests.',
          recommendation: 'Upgrade to strict-origin-when-cross-origin.'
        };
      }

      return {
        status: 'WARN', points: 0, severity: 'HIGH',
        risk: `Weak or unsafe configuration: ${val}. Leaks full URLs.`,
        recommendation: 'Avoid unsafe-url. Use strict-origin-when-cross-origin.'
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
      if (!val && !fp) {
        return {
          status: 'MISSING', points: 0, severity: 'MEDIUM',
          risk: 'Missing explicit hardware API restrictions. Any embedded third-party could request permissions.',
          recommendation: 'Add explicit Permissions-Policy header restricting camera, microphone, geolocation, etc.'
        };
      }

      const policy = val || fp;
      const isStrong = policy.includes('camera=()') && policy.includes('microphone=()') && policy.includes('geolocation=()');

      if (isStrong) {
        return {
          status: 'PASS', points: 10, severity: 'LOW',
          risk: 'Strong restriction: Core privacy APIs are explicitly disabled.',
          recommendation: 'Keep hardware API permissions restricted.'
        };
      }

      return {
        status: 'WARN', points: 5, severity: 'LOW',
        risk: 'Partial policy exists, but could be more comprehensive.',
        recommendation: 'Ensure camera=(), microphone=(), and geolocation=() are included.'
      };
    },
    description: 'Restricts access to browser hardware APIs (camera, microphone, location, payments).',
    nginxFix: 'add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;',
    expressFix: 'app.use((req, res, next) => { res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()"); next(); });'
  },
  {
    key: 'cross-origin-opener-policy',
    name: 'Cross-Origin-Opener-Policy (COOP)',
    maxPoints: 10,
    evaluate: (val, isHttps, rawHeaders, domain) => {
      if (!val) {
        return {
          status: 'MISSING', points: 0, severity: 'LOW',
          risk: 'Missing cross-origin opener isolation.',
          recommendation: 'Set Cross-Origin-Opener-Policy to same-origin or same-origin-allow-popups.'
        };
      }

      const lowerVal = val.toLowerCase().trim();
      if (lowerVal === 'same-origin') {
        return {
          status: 'PASS', points: 10, severity: 'LOW',
          risk: 'Strong cross-origin opener protection active.',
          recommendation: 'Maintain COOP same-origin setting.'
        };
      } else if (lowerVal === 'same-origin-allow-popups') {
        return {
          status: 'WARN', points: 8, severity: 'LOW',
          risk: 'Moderate isolation: allows popups to retain references.',
          recommendation: 'Upgrade to same-origin if popups do not need to communicate with this window.'
        };
      }

      return {
        status: 'WARN', points: 0, severity: 'MEDIUM',
        risk: `Weak or invalid COOP configuration: ${val}.`,
        recommendation: 'Use same-origin.'
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
      scoreImpact: evalResult.points - spec.maxPoints, // Now calculating potential impact cleanly
      severity: evalResult.severity,
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
      issues.push('Missing HttpOnly flag');
    }
    if (!effectiveSecure && isHttps) {
      issues.push('Missing Secure flag');
    }
    const sameSite = c.sameSite ? c.sameSite.charAt(0).toUpperCase() + c.sameSite.slice(1).toLowerCase() : 'None';
    if (sameSite === 'None' && !effectiveSecure) {
      issues.push('SameSite=None without Secure');
    }

    let riskLevel = 'SECURE';
    if (issues.length >= 2 || (sameSite === 'None' && !effectiveSecure)) {
      riskLevel = 'HIGH';
    } else if (issues.length === 1) {
      riskLevel = 'MEDIUM';
    }

    return {
      name,
      // Never expose actual session tokens
      value: '*** REDACTED ***',
      secure: effectiveSecure,
      httpOnly: Boolean(c.httpOnly),
      sameSite: sameSite,
      path: c.path || '/',
      domain: c.domain || '',
      expires: c.expires ? new Date(c.expires).toISOString() : (c.maxAge ? `Max-Age: ${c.maxAge}` : 'Session'),
      riskLevel,
      issues
    };
  });
}

function calculateScoreAndGrade(headerResults) {
  let earnedHeaderPoints = 0;
  let totalMaxPoints = 0;

  headerResults.forEach(h => {
    earnedHeaderPoints += (h.points || 0);
    totalMaxPoints += h.maxPoints;
  });

  // Ensure total score is mapped strictly to 100
  const finalScore = totalMaxPoints > 0 ? Math.max(0, Math.min(100, Math.round((earnedHeaderPoints / totalMaxPoints) * 100))) : 0;

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
