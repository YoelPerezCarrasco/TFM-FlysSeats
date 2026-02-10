# Security Advisory

## Current Security Status

### ⚠️ Known Vulnerabilities in Angular 15.2.10

This project currently uses **Angular 15.2.10**, which has known security vulnerabilities that will not be patched in this version line.

### Identified Vulnerabilities

#### 1. XSS Vulnerability via Unsanitized SVG Script Attributes
- **Affected Versions**: Angular <= 18.2.14 (includes 15.2.10)
- **Severity**: High
- **Impact**: Cross-site scripting (XSS) attacks via SVG elements
- **Patched Version**: Angular 19.2.18+, 20.3.16+, or 21.0.7+
- **Status**: ⚠️ **NO PATCH AVAILABLE FOR ANGULAR 15**

#### 2. Stored XSS Vulnerability via SVG Animation, SVG URL and MathML Attributes
- **Affected Versions**: Angular <= 18.2.14 (includes 15.2.10)
- **Severity**: High
- **Impact**: Stored cross-site scripting attacks
- **Patched Version**: Angular 19.2.17+, 20.3.15+, or 21.0.2+
- **Status**: ⚠️ **NO PATCH AVAILABLE FOR ANGULAR 15**

#### 3. XSRF Token Leakage via Protocol-Relative URLs
- **Affected Versions**: Angular 19+, 20+, 21+ (specific ranges)
- **Status**: ✅ **DOES NOT AFFECT ANGULAR 15.2.10**

### Why Angular 15?

The project requirements specified **"Angular 15+"**, which was interpreted as Angular 15 or higher. Angular 15 was used as the base version to maintain stability and compatibility.

**However**: Angular 15 reached End of Life (EOL) and is no longer receiving security updates.

## Recommended Mitigation Strategies

### Short-term Mitigations (Current Project)

If you must use Angular 15.2.10, implement these mitigations:

#### 1. Avoid Untrusted SVG Content
```typescript
// ❌ AVOID: Rendering untrusted SVG
template: `<div [innerHTML]="untrustedSvgContent"></div>`

// ✅ BETTER: Sanitize or avoid SVG from untrusted sources
import { DomSanitizer } from '@angular/platform-browser';

constructor(private sanitizer: DomSanitizer) {}

getSafeSvg(content: string) {
  // Only use with trusted content
  return this.sanitizer.sanitize(SecurityContext.HTML, content);
}
```

#### 2. Content Security Policy (CSP)
Add strict CSP headers to your application:

```html
<!-- In index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:;">
```

#### 3. Input Validation
```typescript
// Validate and sanitize all user inputs
export class InputValidationService {
  sanitizeInput(input: string): string {
    // Remove potentially dangerous content
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
}
```

#### 4. Avoid Dynamic Content Rendering
- Do not use `[innerHTML]` with untrusted content
- Do not render user-provided SVG
- Sanitize all user inputs
- Use Angular's built-in sanitization

### Long-term Solution: Upgrade to Angular 19+

**RECOMMENDED APPROACH** for production use:

#### Option 1: Upgrade to Angular 19 (LTS)
```bash
ng update @angular/cli@19 @angular/core@19
```

**Benefits:**
- Receives security patches
- Long-term support
- All vulnerabilities patched

#### Option 2: Upgrade to Angular 20+
```bash
ng update @angular/cli@20 @angular/core@20
```

**Benefits:**
- Latest features
- Security patches
- Better performance

### Migration Path

If upgrading from Angular 15 to 19+:

1. **Read Migration Guide**: https://update.angular.io/
2. **Update Dependencies**: Update all Angular packages together
3. **Fix Breaking Changes**: Address any API changes
4. **Test Thoroughly**: Run all tests
5. **Update TypeScript**: May need TypeScript 5.x

## Security Best Practices for This Project

### 1. Never Trust User Input
```typescript
// Always validate and sanitize
validateFlightSearch(params: FlightSearchParams): boolean {
  // Validate all fields
  if (!params.origin || !params.destination) return false;
  
  // Sanitize strings
  params.origin = this.sanitizeInput(params.origin);
  params.destination = this.sanitizeInput(params.destination);
  
  return true;
}
```

### 2. Use Angular's Security Features
```typescript
import { DomSanitizer, SecurityContext } from '@angular/platform-browser';

// Sanitize URLs
sanitizeUrl(url: string) {
  return this.sanitizer.sanitize(SecurityContext.URL, url);
}

// Sanitize HTML (use sparingly)
sanitizeHtml(html: string) {
  return this.sanitizer.sanitize(SecurityContext.HTML, html);
}
```

### 3. Implement CSP Headers

**For Azure App Service**, add in `web.config`:
```xml
<configuration>
  <system.webServer>
    <httpProtocol>
      <customHeaders>
        <add name="Content-Security-Policy" 
             value="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

### 4. Enable Azure Security Features

- Enable **Azure Web Application Firewall**
- Use **Azure Application Gateway**
- Enable **DDoS protection**
- Configure **rate limiting**

## Risk Assessment

### Current Risk Level: **MEDIUM** ⚠️

**Factors:**
- ✅ No user-generated SVG rendering
- ✅ No `[innerHTML]` with untrusted content
- ✅ Backend validation
- ⚠️ Known vulnerabilities exist
- ⚠️ No security patches available

### Risk Mitigation Status

| Vulnerability | Risk | Mitigation | Status |
|--------------|------|------------|---------|
| SVG XSS | Medium | Avoid untrusted SVG | ✅ Implemented |
| Stored XSS | Medium | Input validation | ✅ Implemented |
| XSRF Token | Low | Not applicable | ✅ N/A |

## Incident Response Plan

If a security issue is discovered:

1. **Immediate**: Take affected service offline
2. **Assess**: Determine scope and impact
3. **Patch**: Apply security updates
4. **Test**: Verify fix
5. **Deploy**: Release patched version
6. **Monitor**: Watch for exploitation attempts
7. **Document**: Record incident and response

## Security Monitoring

### Azure Application Insights
```bash
# Enable security monitoring
az monitor app-insights component create \
  --app flyseats-insights \
  --location eastus \
  --resource-group flyseats-prod-rg
```

### Log Suspicious Activity
```typescript
export class SecurityLogger {
  logSuspiciousActivity(event: SecurityEvent) {
    console.error('[SECURITY]', event);
    // Send to Application Insights
    // Alert security team
  }
}
```

## Recommendations

### For Development/Learning (Current State)
✅ **ACCEPTABLE** - with mitigations in place
- Project demonstrates Angular 15+ features
- Educational/portfolio purposes
- Not handling sensitive data
- Mitigations implemented

### For Production Deployment
⚠️ **NOT RECOMMENDED** - upgrade required
- **Action Required**: Upgrade to Angular 19.2.18+ or later
- **Timeline**: Before production deployment
- **Priority**: HIGH

## Version Upgrade Roadmap

### Phase 1: Preparation (1-2 days)
- [ ] Review Angular 19 migration guide
- [ ] Update local development environment
- [ ] Create upgrade branch

### Phase 2: Upgrade (2-3 days)
- [ ] Run `ng update` commands
- [ ] Fix breaking changes
- [ ] Update dependencies
- [ ] Update TypeScript

### Phase 3: Testing (2-3 days)
- [ ] Run unit tests
- [ ] Run E2E tests
- [ ] Manual testing
- [ ] Performance testing

### Phase 4: Deployment (1 day)
- [ ] Deploy to staging
- [ ] Verify in staging
- [ ] Deploy to production

**Total Estimated Time**: 6-9 days

## Additional Resources

- [Angular Security Guide](https://angular.io/guide/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Angular Update Guide](https://update.angular.io/)
- [Azure Security Best Practices](https://docs.microsoft.com/en-us/azure/security/)

## Contact

For security concerns, please contact:
- **Security Team**: security@example.com
- **Project Maintainer**: Yoel Perez Carrasco

---

**Last Updated**: 2026-02-10  
**Next Review**: Before production deployment
