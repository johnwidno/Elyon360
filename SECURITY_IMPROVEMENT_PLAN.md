# 🔐 Elyon360 Security Improvement Plan

**Document Version**: 1.0  
**Date**: May 20, 2026  
**Status**: Planning Phase  
**Priority**: HIGH (Before Production)

---

## Executive Summary

Your current multi-tenant architecture has **critical security gaps** in the registration and login workflow that could allow:
- Email enumeration attacks
- Cross-tenant access if middleware fails
- Subdomain takeover attempts
- Unauthorized tenant access

This document outlines the current workflow, security issues, and three recommended improvements.

---

## 1. CURRENT WORKFLOW ANALYSIS

### 1.1 Church Registration Flow

```
User visits: http://localhost:3000/register-church
      ↓
Fills form: churchName, subdomain, adminEmail, adminPassword, plan
      ↓
POST /api/saas/register-church
      ↓
Backend creates:
  1. Church record
  2. Admin User (with churchId)
  3. Base data (currencies, roles, etc.)
      ↓
Response: Redirect to payment OR success message
      ↓
User can now login
```

**Code Location**: [backend/controllers/saasController.js](backend/controllers/saasController.js) → `_createChurchFull()`

### 1.2 Login Flow (Current - PROBLEMATIC)

```
User visits: http://localhost:3000/login  (NO TENANT CONTEXT)
                OR
            http://demochurch.localhost:3000/login (WITH TENANT CONTEXT)
      ↓
Fills form: email + password
      ↓
POST /api/auth/login
      ↓
Backend checks:
  IF req.church exists (tenant context from subdomain):
     → Search User WHERE email = ? AND churchId = req.church.id
  IF user not found:
     → Search User globally WHERE email = ? (ANY church)
      ↓
If found and password matches:
  → Generate JWT with churchId, token, user details
      ↓
JWT contains: { id, email, churchId, churchSubdomain, roles, permissions }
```

**Code Location**: [backend/controllers/authController.js](backend/controllers/authController.js) → `exports.login`

---

## 2. SECURITY VULNERABILITIES

### 2.1 🔴 CRITICAL: Email Enumeration Attack

**Issue**: Attacker can discover which emails have accounts in ANY church

**Attack Scenario**:
```
Attacker tries: email = "pastor@demochurch.com"
Login endpoint (global search) finds user in demochurch
Attacker now knows:
  ✓ This email exists in some church
  ✓ Which church (from response or errors)
  ✓ Can attempt password brute force

Attacker tries: email = "admin@ourchurch.com"
Response: "User not found"
Attacker knows: This email doesn't exist in any church
```

**Risk**: 
- Privacy violation
- Enables targeted social engineering
- Compromises user email lists

---

### 2.2 🔴 CRITICAL: Global Search Fallback

**Issue**: If tenant validation fails, system falls back to global search

**Attack Scenario**:
```
Attacker: Logs in via demochurch.localhost
But JWT has churchId = 5 (different church)
If middleware has a bug and doesn't validate:
  → User can access church 5's data with wrong credentials
```

**Root Cause**: 
```javascript
// Current code in authController.js
if (!user) {
    console.log("Searching globally for email:", email);
    user = await db.User.findOne({
        where: { email: email },
        include: [{ model: db.Church, as: 'church' }]
    });
}
```

This global fallback defeats tenant isolation.

---

### 2.3 🟡 HIGH: No Explicit Tenant Selection

**Issue**: User doesn't specify which church they're logging into

**Problem**:
- System guesses tenant from subdomain
- If user visits wrong subdomain, they might login to wrong church
- No confirmation of which church they're accessing
- Confusing for users managing multiple churches

---

### 2.4 🟡 HIGH: Subdomain Spoofing Risk

**Issue**: Attacker can access any subdomain and try to login

**Scenario**:
```
Attacker: Visits attacker.localhost/login
Submits: email = "pastor@demochurch.com", password = "correct"
System: Doesn't find user in attacker.localhost church
Falls back to: Global search
Finds user in demochurch
Issues JWT with demochurch's churchId

Result: Logged in successfully despite wrong subdomain
```

---

### 2.5 🟡 HIGH: JWT Missing Verification

**Issue**: JWT contains churchId but no validation against request context

**Current JWT**:
```javascript
{
  id: user.id,
  email: user.email,
  churchId: user.churchId,        // Could be modified/stale
  churchSubdomain: user.church.subdomain,
  roles: roles,
  permissions: permissions,
  iat: 1234567890,
  exp: 1234567890
}
```

**Problem**: No validation that JWT's churchId matches request's churchId

---

### 2.6 🟡 MEDIUM: No Audit Trail for Failed Logins

**Issue**: Can't detect attack patterns

**Missing Data**:
- Which churches were attempted
- How many failed login attempts per email
- Timing of attempts
- IP addresses

---

### 2.7 🟡 MEDIUM: Password Reset Vulnerability

**Issue**: Not visible in your code, but password reset flows often leak tenant information

---

## 3. RECOMMENDED SOLUTIONS

### **OPTION A: SUBDOMAIN-FIRST LOGIN** ⭐ RECOMMENDED

**Best for**: Multi-tenant, church-specific subdomains

**Architecture**:
```
User accesses: demochurch.localhost:3000/login
      ↓
Middleware extracts: subdomain = "demochurch"
      ↓
Frontend knows: this is for demochurch church
      ↓
User enters: email + password (ONLY)
      ↓
Backend receives: email, password, AND churchId from middleware
      ↓
Validates:
  - Search User WHERE email = ? AND churchId = ?
  - NO global fallback
  - NO guessing
      ↓
JWT issued with: churchId from middleware (not user input)
```

**Pros**:
- ✅ No email enumeration (can't search globally)
- ✅ Tight tenant coupling
- ✅ Clear which church user is logging into
- ✅ Simple UX
- ✅ Middleware enforces tenant isolation

**Cons**:
- ❌ Users can't login from wrong subdomain
- ❌ Requires proper subdomain setup

**Implementation**:
```javascript
// authController.js - MODIFIED
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // REJECT if no church context (must come from subdomain)
        if (!req.church || req.isSaaS) {
            return res.status(401).json({ 
                message: "Login must be from your church's subdomain" 
            });
        }
        
        // ONLY search in current church
        const user = await db.User.findOne({
            where: { 
                email: email,
                churchId: req.church.id  // ENFORCE church context
            },
            include: [{ model: db.Church, as: 'church' }]
        });
        
        if (!user) {
            return res.status(404).json({ 
                message: "Invalid email or password" 
            });  // Generic error - don't reveal if user exists
        }
        
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) {
            return res.status(400).json({ 
                message: "Invalid email or password" 
            });  // Generic error
        }
        
        // JWT MUST include churchId from middleware, not user input
        const token = jwt.sign({
            id: user.id,
            email: user.email,
            churchId: req.church.id,  // FROM MIDDLEWARE, not from user
            roles: user.role,
            iat: Date.now()
        }, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        res.json({ token, user });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
```

---

### **OPTION B: EMAIL-SUBDOMAIN DUAL INPUT** 

**Best for**: When you don't control subdomains

**Architecture**:
```
User accesses: http://localhost:3000/login (global login page)
      ↓
User enters: 
  - Church Subdomain (dropdown or input)
  - Email
  - Password
      ↓
Backend validates:
  - Find church WHERE subdomain = ?
  - Find user WHERE email = ? AND churchId = ?
  - No global fallback
      ↓
JWT issued with churchId
```

**Example Frontend**:
```jsx
const [churchSubdomain, setChurchSubdomain] = useState('');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

const handleLogin = async () => {
  const res = await api.post('/api/auth/login', {
    churchSubdomain,  // Explicit tenant selection
    email,
    password
  });
};
```

**Pros**:
- ✅ No email enumeration
- ✅ Explicit tenant selection
- ✅ Works from any URL
- ✅ Good UX reminder

**Cons**:
- ❌ Extra input field
- ❌ Users need to remember subdomain

---

### **OPTION C: EMAIL DOMAIN IDENTIFIER**

**Best for**: Custom domain setups

**Architecture**:
```
User accesses: http://localhost:3000/login
      ↓
User enters: email@yourchurch.com (domain is implicit)
      ↓
Backend:
  1. Parse email domain
  2. Find Church WHERE customDomain = ?
  3. Find User WHERE email = ? AND churchId = ?
      ↓
JWT issued with churchId
```

**Example**:
```
pastor@demochurch.org  → Find church by demochurch.org domain
admin@firstbaptist.net → Find church by firstbaptist.net domain
```

**Pros**:
- ✅ Professional appearance
- ✅ Brand reinforcement
- ✅ No guessing

**Cons**:
- ❌ Requires custom domain setup
- ❌ More complex
- ❌ Domain ownership validation needed

---

## 4. ADDITIONAL SECURITY MEASURES

### 4.1 Row-Level Security (RLS) in PostgreSQL

**Status**: NOT IMPLEMENTED - CRITICAL

Add PostgreSQL RLS to enforce tenant isolation at database level:

```sql
-- Enable RLS on all tenant-specific tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- ... all tables with churchId

-- Create policy for users table
CREATE POLICY users_isolation ON users
  USING (church_id = current_setting('app.current_church_id')::int);

-- Set tenant context before queries
SET app.current_church_id = 2;  -- Only user's church
```

**Impact**: Even if middleware is bypassed, database enforces isolation

---

### 4.2 Enhanced JWT Validation

**Current**: JWT accepted at face value

**Improved**:
```javascript
// Middleware to validate JWT against request context
const validateTenantJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // CRITICAL: Validate token's churchId matches request's churchId
    if (req.church && decoded.churchId !== req.church.id) {
        return res.status(403).json({ 
            error: 'Church mismatch in JWT' 
        });
    }
    
    req.user = decoded;
    next();
};
```

---

### 4.3 Audit Logging

**Missing**: No logging of:
- Login attempts (success/fail)
- Failed tenant validations
- Cross-tenant access attempts

**Add**:
```javascript
// Log all authentication events
const logAuthEvent = async (event) => {
    await db.AuditLog.create({
        eventType: event.type,  // 'LOGIN_SUCCESS', 'LOGIN_FAILED', etc.
        userId: event.userId,
        churchId: event.churchId,
        email: event.email,
        ipAddress: event.ipAddress,
        timestamp: new Date(),
        details: event.details
    });
};
```

---

### 4.4 Rate Limiting

**Missing**: No protection against brute force

**Add**:
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,  // 5 attempts per IP
    keyGenerator: (req) => `${req.ip}-${req.body.email}`,
    message: 'Too many login attempts, try again later'
});

app.post('/api/auth/login', loginLimiter, authController.login);
```

---

### 4.5 Generic Error Messages

**Current**:
```
"Utilisateur non trouvé." → Reveals user doesn't exist
"Mot de passe incorrect." → Reveals user exists
```

**Improved**:
```
"Invalid email or password"  → Same message for both failures
```

---

### 4.6 IP Address Tracking

**Missing**: No tracking of where logins come from

**Add**:
```javascript
const getClientIP = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.connection.remoteAddress;
};
```

---

## 5. IMPLEMENTATION ROADMAP

### Phase 1: Immediate (Week 1-2) 🔴 CRITICAL
- [ ] Implement Option A (Subdomain-First Login)
- [ ] Add generic error messages
- [ ] Remove global search fallback
- [ ] Add basic audit logging

### Phase 2: Short-term (Week 3-4) 🟡 HIGH
- [ ] Add PostgreSQL RLS policies
- [ ] Implement JWT tenant validation middleware
- [ ] Add rate limiting
- [ ] Add IP address tracking
- [ ] Create audit log database table

### Phase 3: Medium-term (Week 5-8) 🟢 MEDIUM
- [ ] Add 2FA/MFA support
- [ ] Implement password reset security
- [ ] Add login attempt alerts
- [ ] Security monitoring dashboard
- [ ] Penetration testing

### Phase 4: Long-term (Month 3+) 🔵 NICE-TO-HAVE
- [ ] SAML/Federation support
- [ ] Separate tenant databases (if scaling)
- [ ] Advanced threat detection
- [ ] SOC 2 compliance

---

## 6. FILES TO MODIFY

| File | Change | Priority |
|------|--------|----------|
| [backend/controllers/authController.js](backend/controllers/authController.js) | Refactor login to Option A | CRITICAL |
| [backend/middleware/auth.js](backend/middleware/auth.js) | Add JWT validation | HIGH |
| [backend/migrations/*.js](backend/migrations/) | Create AuditLog table | HIGH |
| [backend/models/AuditLog.js](backend/models/AuditLog.js) | Create new model | HIGH |
| [backend/routes/authRoutes.js](backend/routes/authRoutes.js) | Add rate limiting | HIGH |
| PostgreSQL init script | Add RLS policies | HIGH |
| [frontend/src/pages/Public/Login.jsx](frontend/src/pages/Public/Login.jsx) | Update to use Option A | CRITICAL |

---

## 7. DATABASE SCHEMA CHANGES

### New Table: AuditLog

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50),  -- 'LOGIN_ATTEMPT', 'LOGIN_SUCCESS', 'ACCESS_DENIED'
  user_id INTEGER REFERENCES users(id),
  church_id INTEGER REFERENCES churches(id),
  email VARCHAR(255),
  ip_address VARCHAR(45),
  status VARCHAR(20),  -- 'SUCCESS', 'FAILED', 'BLOCKED'
  failure_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_church_date ON audit_logs(church_id, created_at);
CREATE INDEX idx_audit_email_date ON audit_logs(email, created_at);
```

---

## 8. SECURITY CHECKLIST

Before deploying to production:

- [ ] Email enumeration fixed
- [ ] Global search fallback removed
- [ ] JWT includes & validates churchId
- [ ] RLS policies enforced
- [ ] Audit logging implemented
- [ ] Rate limiting enabled
- [ ] Generic error messages used
- [ ] Password hashing verified (bcrypt)
- [ ] Secrets in environment variables
- [ ] CORS configured (not `'*'`)
- [ ] SQL injection protected (parameterized queries)
- [ ] No sensitive data in logs
- [ ] Penetration testing done
- [ ] Security review completed

---

## 9. RISK ASSESSMENT

| Vulnerability | Current Risk | After Fix | Priority |
|---------------|-------------|----------|----------|
| Email Enumeration | HIGH | LOW | CRITICAL |
| Global Search Fallback | CRITICAL | NONE | CRITICAL |
| Missing JWT Validation | MEDIUM | LOW | HIGH |
| No Audit Trail | MEDIUM | LOW | HIGH |
| No Rate Limiting | MEDIUM | LOW | HIGH |
| Generic Errors | NOT IMPLEMENTED | IMPLEMENTED | MEDIUM |
| RLS at DB | NONE | ENFORCED | HIGH |

---

## 10. QUESTIONS FOR DISCUSSION

1. **Subdomain vs Custom Domain**: Do you want to use subdomains (demochurch.localhost) or custom domains (demochurch.elyon360.com)?

2. **Multi-Church Users**: Should ONE user be able to login to MULTIPLE churches? (Currently not possible)

3. **Password Policy**: Current: No requirements. Should we enforce:
   - Minimum length (12 chars)?
   - Complexity (uppercase, numbers, special chars)?
   - Expiration (90 days)?

4. **2FA**: Should 2FA be required or optional?

5. **Session Duration**: Currently 24h. Should we:
   - Make it shorter (8h)?
   - Add "Remember me" (7 days)?
   - Add refresh tokens?

6. **Timezone**: How should timezone be handled for audit logs?

---

**Next Steps**: 
1. Review this document
2. Answer the questions above
3. Choose an option (A, B, or C)
4. Create detailed task tickets
5. Begin Phase 1 implementation

