/**
 * Security Demonstration Page
 * For demonstrating httpOnly cookie security to the security team
 */

import { XSSAttackDemo } from "@/components/security/XSSAttackDemo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle } from "lucide-react";

export default function SecurityDemo() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-8 w-8 text-green-600" />
          <h1 className="text-4xl font-bold">Security Demonstration</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Proving that httpOnly cookies prevent XSS token theft
        </p>
      </div>

      {/* Important Notice */}
      <Card className="border-blue-500 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <AlertTriangle className="h-5 w-5" />
            For Security Team Review
          </CardTitle>
          <CardDescription>
            This page demonstrates various XSS attack attempts and proves that
            httpOnly cookies cannot be accessed via JavaScript.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-2">
            <p>
              <strong>Purpose:</strong> Demonstrate that our authentication
              architecture is secure against XSS-based token theft.
            </p>
            <p>
              <strong>Old System (Spring Boot + localStorage):</strong> Tokens
              stored in localStorage could be stolen via{" "}
              <code className="bg-muted px-1 rounded">
                localStorage.getItem('token')
              </code>
            </p>
            <p>
              <strong>New System (Better Auth + httpOnly cookies):</strong>{" "}
              Tokens stored in httpOnly cookies are invisible to JavaScript and
              cannot be stolen.
            </p>
            <p className="text-muted-foreground">
              All attacks below are <strong>safe to run</strong> - they are
              legitimate security tests that prove our security model works.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Key Concepts */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">httpOnly Flag</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <code className="text-xs bg-muted px-1 rounded">
              Set-Cookie: token=xxx; HttpOnly
            </code>
            <p className="mt-2">
              Prevents JavaScript from accessing the cookie via{" "}
              <code className="bg-muted px-1 rounded">document.cookie</code>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Secure Flag</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <code className="text-xs bg-muted px-1 rounded">
              Set-Cookie: token=xxx; Secure
            </code>
            <p className="mt-2">
              Cookie only sent over HTTPS, preventing interception via
              unencrypted connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">SameSite Flag</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <code className="text-xs bg-muted px-1 rounded">
              Set-Cookie: token=xxx; SameSite=Lax
            </code>
            <p className="mt-2">
              Prevents cookie from being sent in cross-site requests (CSRF
              protection)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* XSS Attack Demo Component */}
      <XSSAttackDemo />

      {/* Conclusion */}
      <Card className="border-green-500 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-700 dark:text-green-400">
            ✅ Conclusion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <strong>All XSS attacks should fail.</strong> This proves that
            httpOnly cookies provide superior security compared to localStorage
            JWT tokens.
          </p>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="font-semibold text-red-700 dark:text-red-400 mb-2">
                ❌ Old System (localStorage)
              </div>
              <ul className="text-xs space-y-1 text-red-600 dark:text-red-300">
                <li>• Tokens accessible via JavaScript</li>
                <li>• XSS can steal tokens</li>
                <li>• Attacker can use tokens remotely</li>
                <li>
                  • <strong>Solution:</strong> Short expiration (5-15 min)
                  limits damage
                </li>
              </ul>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="font-semibold text-green-700 dark:text-green-400 mb-2">
                ✅ New System (httpOnly Cookies)
              </div>
              <ul className="text-xs space-y-1 text-green-600 dark:text-green-300">
                <li>• Tokens invisible to JavaScript</li>
                <li>• XSS cannot steal tokens</li>
                <li>• No remote access possible</li>
                <li>
                  • <strong>Solution:</strong> Attack prevented at source
                </li>
              </ul>
            </div>
          </div>
          <p className="text-muted-foreground pt-4">
            <strong>Recommendation:</strong> 24-hour sessions with 1-hour
            refresh provide excellent security while maintaining professional
            user experience. The XSS threat that short expiration times were
            protecting against is now eliminated by httpOnly cookies.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
