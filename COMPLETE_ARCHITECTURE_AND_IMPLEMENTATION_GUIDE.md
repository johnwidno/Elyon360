# ElyonSys 360 - Complete Architecture & Implementation Guide

**Purpose**: Single unified reference for understanding and implementing the complete 3-level tenant architecture with RBAC, data consent, and content distribution  
**Date**: May 12, 2026  
**Status**: Complete Implementation Guide  
**Version**: 2.1 (Option B — ChurchNetwork naming applied)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Core Concepts & Fundamental Rules](#core-concepts--fundamental-rules)
4. [Three-Level Tenant Hierarchy](#three-level-tenant-hierarchy)
5. [Permission Domains & Isolation](#permission-domains--isolation)
6. [Multi-Role Assignment & Permission Merging](#multi-role-assignment--permission-merging)
7. [Data Consent System](#data-consent-system)
8. [Content Distribution & Publishing](#content-distribution--publishing)
9. [Church Groups & Community](#church-groups--community)
10. [Complete Database Schema](#complete-database-schema)
11. [Authentication & Registration Security](#authentication--registration-security)
12. [Billing & Subscription System](#billing--subscription-system)
13. [Code Patterns & Implementation](#code-patterns--implementation)
14. [API Reference](#api-reference)
15. [Decision Framework](#decision-framework)
16. [Role Limits & Guardrails](#role-limits--guardrails)
17. [Security & Best Practices](#security--best-practices)
18. [Common Scenarios & Workflows](#common-scenarios--workflows)
19. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

### What We're Building

ElyonSys 360 is a **multi-tenant SaaS platform** for church management with three key architectural innovations:

1. **Three-Level Tenant Hierarchy**: Platform → Organization (Diocese/District/Network) → Church
2. **Church-Driven Affiliation**: Churches can independently affiliate with organizations
3. **Granular Data Consent**: Churches control what data they share with affiliated organizations
4. **Distributed Content System**: Organizations publish content, churches decide to adopt it

### Key Stakeholders

- **Platform Admins** (Super Admin): Manage entire SaaS platform
- **Organization Admins** (Org Admin, Org Finance, Org Operations): Manage affiliated churches at aggregate level (READ-ONLY)
- **Church Admins** (Admin, Pastor, Finance Officer, Staff, Member): Manage individual church
- **End Users**: Members in churches accessing features via portals and apps

### Architecture Tiers

```
┌─────────────────────────────────────────────────────────┐
│  TIER 1: PLATFORM LEVEL (SaaS Infrastructure)           │
│  • super_admin, platform_support, platform_finance      │
│  • churchId = NULL, orgId = NULL                        │
│  • Manages: All churches, payments, features, settings  │
└─────────────────────────────────────────────────────────┘
                         ⬇️ ISOLATION BOUNDARY
┌─────────────────────────────────────────────────────────┐
│  TIER 2: ORGANIZATION LEVEL (Optional Grouping)         │
│  • org_admin, org_finance, org_operations, org_comms    │
│  • churchId = NULL, orgId = SPECIFIC                    │
│  • Access: READ-ONLY aggregated data + content pub      │
│  • Examples: Diocese, District, Network, Mission        │
└─────────────────────────────────────────────────────────┘
                         ⬇️ ISOLATION BOUNDARY
┌─────────────────────────────────────────────────────────┐
│  TIER 3: CHURCH LEVEL (Core Tenants)                    │
│  • admin, pastor, finance_officer, staff, member        │
│  • churchId = SPECIFIC, orgId = NULL (independent)      │
│           OR churchId = SPECIFIC, orgId = SPECIFIC      │
│           (affiliated with organization)                │
│  • Access: Full management of church data + settings    │
└─────────────────────────────────────────────────────────┘
```

### Key Principles

| Principle                        | Meaning                              | Impact                            |
| -------------------------------- | ------------------------------------ | --------------------------------- |
| **Tenant Isolation**             | Data belongs to church only          | Church sees only their data       |
| **Permission Domain Separation** | Org permissions ≠ Church permissions | Org admin cannot edit church      |
| **Data Consent**                 | Churches control sharing             | Orgs respect consent flags        |
| **Church Autonomy**              | Churches drive decisions             | Can affiliate/unaffiliate anytime |
| **Optional Hierarchy**           | Organizations are optional           | Independent churches still work   |
| **READ-ONLY Aggregation**        | Orgs see summaries only              | No direct church data editing     |
| **Content Adoption**             | Churches decide content sharing      | Not pushed, not forced            |

### ⚠️ Naming Convention (Option B — Decided)

> The Tier 2 grouping concept (Diocese/District/Network) is described as an "Organization" in this document's architecture prose. However, in all **code, tables, routes, and JWT fields** it is implemented as **`ChurchNetwork`** to avoid collision with the existing `Organization` model (church-owned contact partners).
>
> | Architecture Concept               | Code / Table Name                                        | API Route              | JWT Field   |
> | ---------------------------------- | -------------------------------------------------------- | ---------------------- | ----------- |
> | Tier 2 grouping (Diocese/District) | `ChurchNetwork` / `church_networks`                      | `/api/networks/*`      | `networkId` |
> | Church-owned contact partner       | `Organization` / `organizations` _(existing, unchanged)_ | `/api/organizations/*` | —           |
>
> **Rationale**: Option B from [`devellpementprocess/ORGANIZATION_MODEL_AUDIT.md`](devellpementprocess/ORGANIZATION_MODEL_AUDIT.md) — zero disruption to existing working code.

---

## Architecture Overview

### System Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                        ELYON360 PLATFORM                          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ PLATFORM ADMIN DASHBOARD                                    │ │
│  │ • Manage organizations                                      │ │
│  │ • Monitor usage & payments                                  │ │
│  │ • Configure platform features                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ DATABASE LAYER (Multi-Tenant Data Store)                   │ │
│  │ ├─ User accounts & authentication                          │ │
│  │ ├─ Church Networks (Diocese/District/Network grouping)     │ │
│  │ ├─ Organizations (contact partners — church-owned)         │ │
│  │ ├─ Churches (core tenants)                                 │ │
│  │ ├─ Roles & permissions (per-tenant)                        │ │
│  │ ├─ Church-Network affiliations                             │ │
│  │ ├─ Data consent settings                                   │ │
│  │ ├─ Network content library                                 │ │
│  │ ├─ Church content adoption tracking                        │ │
│  │ ├─ Groups & community (per-church)                         │ │
│  │ └─ Aggregated metrics (respecting consent)                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ API LAYER (Tenant-Aware Endpoints)                         │ │
│  │ ├─ /api/platform/* (super admin only)                      │ │
│  │ ├─ /api/networks/* (network-level: Diocese/District)       │ │
│  │ ├─ /api/organizations/* (church contact partners)          │ │
│  │ ├─ /api/churches/* (church-level operations)               │ │
│  │ └─ /api/shared/* (network + church can both use)           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ CLIENT APPLICATIONS                                         │ │
│  │ ├─ Organization Admin Portal (Dashboards, Reports)         │ │
│  │ ├─ Church Admin Portal (Full Management)                   │ │
│  │ ├─ Member Portal (Self-Service)                            │ │
│  │ ├─ Mobile App (iOS/Android)                                │ │
│  │ └─ Public Church Website                                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

### Data Flow Examples

#### Example 1: Church Admin Logs In

```
1. Church Admin enters credentials at churchname.elyonsys.com
2. System identifies church from subdomain
3. Fetches user roles in THAT CHURCH (churchId = SPECIFIC)
4. Merges all role permissions (UNION)
5. Issues JWT with:
   - churchId = 1 (their church)
   - roles = ["admin", "finance"]
   - permissions = [...merged array...]
6. Church admin accesses ONLY Church 1 data
7. Organization data: INVISIBLE (not in permission domain)
```

#### Example 2: Organization Admin Views Dashboard

```
1. Org Admin logs in at elyonsys.com/networks
2. System identifies network from user profile (networkId = SPECIFIC)
3. Fetches user network roles (churchId = NULL, networkId = SPECIFIC)
4. Issues JWT with:
   - networkId = 2 (Diocese of Port-au-Prince)
   - churchId = NULL
   - roles = ["org_admin"]
   - permissions = ["org:view_dashboard", "org:view_content", ...]
5. Org admin queries: GET /api/networks/2/dashboard
6. Middleware: Verify networkId matches (✅ networkId = 2 in JWT ✅)
7. Database query:
   - Get all churches with networkId = 2
   - For EACH church, check church_data_consent flags
   - ONLY include data churches consented to share
   - EXCLUDE all other data
8. Returns aggregated dashboard respecting consent
```

#### Example 3: Church Admin Updates Data Consent

```
1. Church Admin at churchname.elyonsys.com
2. Navigates to Settings → Data Consent → Diocese of Port-au-Prince
3. Toggles: shareFinancialData ON/OFF, shareMembershipData ON/OFF
4. Clicks Save → PATCH /api/churches/1/data-consent/2
   {
     "networkId": 2,
     "shareFinancialData": false,    // Don't share our financial data
     "shareMembershipData": true,    // Do share member count
     "shareEventData": true,
     "shareActivityData": true,
     "shareAttendanceData": false
   }
5. Updates church_data_consent table
6. Logs audit event: "data_consent_updated"
7. Diocese admin's dashboard automatically excludes financial data
8. Diocese receives alert: "Church A updated consent settings"
```

#### Example 4: Organization Publishes Content to Churches

```
1. Diocese Admin (Org Admin) logs in
2. Navigates to Content → Create New
3. Creates announcement: "Q3 Budget Guidelines"
4. Sets: Title, Description, PDF attachment, Target churches
5. Clicks Publish → POST /api/networks/2/content
   {
     "contentType": "policy",
     "title": "Q3 Budget Guidelines",
     "targetAllAffiliatedChurches": true
   }
6. Inserts into network_content table
7. Notification sent to all affiliated churches: "New content from Diocese"
8. Each church can decide:
   - ✅ View & download
   - ✅ Display on our website
   - ✅ Share with members in newsletter
   - ❌ Ignore / don't adopt
9. Churches track in church_content_adoption table
```

---

## Core Concepts & Fundamental Rules

### The Multi-Tenant Principle

Every application query must explicitly specify the tenant context. No query should ever return data from multiple tenants.

```
✅ CORRECT:
SELECT * FROM users WHERE churchId = 1 AND email = 'pastor@church.com';

❌ WRONG:
SELECT * FROM users WHERE email = 'pastor@church.com';
// Could return pastor from Church 1, 2, 3, ... security breach!
```

### Fundamental Rules (11 Rules for Church-Level, +8 New Rules for Org-Level)

#### Church-Level Rules

1. **EVERY role query must include churchId filter** ✅
2. **EVERY permission check must verify churchId** ✅
3. **Platform roles have churchId = NULL** ✅
4. **Tenant roles have churchId = SPECIFIC_VALUE** ✅
5. **All tenant roles can be customized per-church** ✅
6. **Admins can rename roles, add/remove permissions - no code deployment** ✅
7. **Permissions are endpoint-based and database-configurable** ✅
8. **Role changes in Church A don't affect Church B** ✅
9. **A staff member can have MULTIPLE roles per church** ✅
10. **Permission resolution merges all role permissions (union)** ✅
11. **Each church defines its own multi-role structure** ✅

#### Organization-Level Rules (NEW)

12. **Organization roles have churchId = NULL AND orgId = SPECIFIC_VALUE** ✅
13. **Organization admin is READ-ONLY (no direct church edits)** ✅
14. **Church affiliation is optional (orgId can be NULL)** ✅
15. **Church can unaffiliate from organization at any time** ✅
16. **Permission checks must verify orgId match for org-level operations** ✅
17. **Data consent controls org visibility (church_data_consent flags)** ✅
18. **Organizations cannot see data churches didn't consent to share** ✅
19. **Organizations can publish content to affiliated churches** ✅
20. **Churches decide whether to adopt organization content** ✅

---

## Three-Level Tenant Hierarchy

### Level 1: Platform (SaaS Infrastructure)

**Context**: `churchId = NULL, orgId = NULL`

**Users**: SaaS team only (super admins, support staff, finance)

**Roles**:

- `super_admin`: Full platform access
- `platform_support`: User support & troubleshooting
- `platform_finance`: Payment processing & billing
- `platform_compliance`: Data retention, audit logs

**Access**: All churches, all organizations, all settings

**Example**: You, your team members managing the platform

**Responsibility**:

- Monitor system health
- Handle payments & billing
- Provide platform-level support
- Enable/disable platform features

---

### Level 2: Organization (Optional Grouping)

**Context**: `churchId = NULL, orgId = SPECIFIC`

**Users**: Organization leadership (bishops, district leaders, network heads)

**Types**: Diocese, District, Network, Mission, Institution

**Roles**:

- `org_admin`: Full organization oversight
- `org_finance`: Financial reporting & analytics
- `org_operations`: Operational metrics & performance
- `org_communications`: Content publishing & distribution
- `org_viewer`: Read-only dashboard access

**Access**: READ-ONLY aggregated view of affiliated churches

**Responsibilities**:

- Define organization policies
- Publish content for churches to adopt
- View aggregated financial reporting (what churches shared)
- Monitor membership trends (what churches shared)
- Make strategic decisions based on data

**Key Constraint**: CANNOT directly edit church data

```
Organization Admin CAN:
✅ View aggregated financial totals (churches that shared)
✅ View aggregated member counts (churches that shared)
✅ Publish policy documents
✅ Create training materials
✅ View adoption statistics (who downloaded what)
✅ Request data sharing from churches

Organization Admin CANNOT:
❌ Edit a church's members
❌ Delete a church
❌ Change a church's roles
❌ Force a church to adopt content
❌ See data churches didn't consent to share
```

**Example**: Diocese of Port-au-Prince manages 8 affiliated churches, sees aggregated metrics

> **Code naming**: This tier is `ChurchNetwork` in Sequelize (`church_networks` table). JWT field is `networkId`. Routes are `/api/networks/*`. See `devellpementprocess/ORGANIZATION_MODEL_AUDIT.md`.

**Context**:

- Independent: `churchId = SPECIFIC, orgId = NULL`
- Affiliated: `churchId = SPECIFIC, orgId = SPECIFIC`

**Users**: Church leaders and members

**Roles**: (Fully customizable per church)

- `admin`: Full church management
- `pastor`: Pastoral leadership
- `finance_officer`: Financial management
- `staff`: General staff
- `member`: Regular member (read-only)
- ... (unlimited custom roles per church)

**Access**: Full management of church data + settings

**Responsibilities**:

- Define church policies and procedures
- Manage members and roles
- Track finances and donations
- Create events and activities
- Manage groups and community
- Set data consent for affiliated organizations
- Adopt/share organization content

**Affiliate Decisions**:

- Churches independently decide to affiliate
- Churches independently decide to unaffiliate
- Affiliation is a business relationship, not technical requirement

**Example**: First Baptist Church of Port-au-Prince is part of Diocese, manages their own data, decides what to share

---

## Permission Domains & Isolation

### What Is a Permission Domain?

A permission domain is a **logical grouping of users and data** that cannot access each other.

### The Three Domains

```
┌────────────────────────────────────┐
│  PLATFORM DOMAIN                   │
│  churchId = NULL, orgId = NULL     │
│  • super_admin only                │
│  • Global access                   │
└────────────────────────────────────┘
            🔒 ISOLATED 🔒

┌────────────────────────────────────┐
│  ORGANIZATION DOMAIN               │
│  churchId = NULL, orgId = SPECIFIC │
│  • Org roles only                  │
│  • Org data + aggregated church    │
│  • READ-ONLY access                │
└────────────────────────────────────┘
            🔒 ISOLATED 🔒

┌────────────────────────────────────┐
│  CHURCH DOMAIN                     │
│  churchId = SPECIFIC, orgId = NULL │
│  • Church roles only               │
│  • Church data only                │
│  • Full management access          │
└────────────────────────────────────┘
```

### Key Isolation Principles

**Principle 1: Church Admin ≠ Organization Admin**

```
Church Admin (churchId = 1) CAN:
✅ See Church 1 data
✅ Manage Church 1 users
✅ Edit Church 1 settings

Church Admin (churchId = 1) CANNOT:
❌ See Church 2 data
❌ See organization dashboards
❌ Edit organization content
```

**Principle 2: Organization Admin ≠ Church Admin**

```
Org Admin (orgId = 2, churchId = NULL) CAN:
✅ See aggregated data from affiliated churches (if they shared)
✅ Publish content
✅ View adoption metrics

Org Admin (orgId = 2, churchId = NULL) CANNOT:
❌ Edit any church's members
❌ Delete any church's data
❌ Override church data consent
❌ Force adoption of content
```

**Principle 3: A User Can Have Multiple Roles in Multiple Domains**

```
Example: Bishop John
├─ Domain 1: Administrator of Church A
│  └─ churchId = 1, role = "admin"
│     └─ Can: Manage Church A
│
├─ Domain 2: Administrator of Diocese X (Church Network)
│  └─ networkId = 5, role = "org_admin"
│     └─ Can: Manage Network (aggregated)
│
└─ Both contexts active simultaneously
   └─ Has permissions for BOTH domain operations
      └─ Permission checks happen independently
```

### Middleware Pattern: Domain Verification

```javascript
// EVERY request must verify domain match

// For church endpoint: /api/churches/:churchId/*
app.use((req, res, next) => {
  const userChurchId = req.user.churchId; // From JWT
  const requestChurchId = req.params.churchId; // From URL

  if (userChurchId !== requestChurchId) {
    return res.status(403).json({ error: "Domain mismatch" });
  }
  next();
});

// For network endpoint: /api/networks/:networkId/*
app.use((req, res, next) => {
  const userNetworkId = req.user.networkId; // From JWT
  const requestNetworkId = req.params.networkId; // From URL

  if (userNetworkId !== requestNetworkId) {
    return res.status(403).json({ error: "Domain mismatch" });
  }
  next();
});
```

---

## Multi-Role Assignment & Permission Merging

### Why Multi-Role Matters

Different people have different responsibilities. A single role often isn't enough.

```
Examples:

Church A (Small):
├─ John (pastor) = 1 role
└─ Mary (staff) = 1 role

Church B (Medium):
├─ James (pastor + finance manager) = 2 roles
│  ├─ Can lead services (pastor)
│  └─ Can manage finances (finance_officer)
│
└─ Sarah (finance officer + events coordinator) = 2 roles
   ├─ Can manage finances
   └─ Can coordinate events

Church C (Large):
├─ Bishop David (pastor + member_manager + events + hr) = 4 roles
├─ Rachel (finance + hr + admin) = 3 roles
└─ Pastor Mike (pastor + counselor) = 2 roles
```

### How Permission Merging Works

When a user has multiple roles, their effective permissions are the **UNION** of all role permissions.

```
User: Sarah (Church B)
Roles Assigned: ["finance_officer", "events_coordinator"]

Role Permissions:
├─ finance_officer: ["finances:read", "finances:write", "reports:read"]
└─ events_coordinator: ["events:create", "events:edit", "members:read"]

Effective Permissions (UNION):
└─ ["finances:read", "finances:write", "reports:read",
    "events:create", "events:edit", "members:read"]

Result: Sarah CAN perform ANY of these actions
├─ ✅ View financial reports
├─ ✅ Create new events
├─ ✅ Update event details
├─ ✅ View member list
├─ ❌ Delete church (not in any role)
```

### Database Pattern

```sql
-- User can have multiple roles
SELECT ur.id, r.name, r.permissions
FROM user_roles ur
JOIN roles r ON ur.roleId = r.id
WHERE ur.userId = 42 AND ur.churchId = 1 AND ur.isActive = true;

-- Returns:
-- id | name                | permissions
-- 1  | finance_officer     | [...]
-- 2  | events_coordinator  | [...]

-- Application code merges these permissions (UNION)
-- Sarah gets combined permissions from both roles
```

### Code Pattern: Multi-Role Authentication

```javascript
// During login: Fetch all roles and merge permissions

const userRoles = await db.UserRole.findAll({
  where: { userId, churchId, isActive: true },
  include: [{ model: Role, attributes: ["name", "permissions"] }],
});

// Merge permissions from all roles
const allPermissions = new Set();
userRoles.forEach((ur) => {
  ur.role.permissions.forEach((perm) => {
    allPermissions.add(perm); // Union operation
  });
});

// Issue JWT with merged permissions
const token = jwt.sign(
  {
    userId,
    churchId,
    roles: userRoles.map((ur) => ur.role.name), // Array: ["finance", "events"]
    permissions: Array.from(allPermissions), // Array: [all perms merged]
    isPlatformLevel: false,
  },
  JWT_SECRET,
);
```

---

## Data Consent System

### Why Data Consent Matters

**Trust Problem**: Organizations want to see church metrics. But churches are nervous about sharing data.

**Solution**: Granular, per-organization, per-category data consent.

### How It Works

Churches decide **WHAT DATA** they share with **EACH ORGANIZATION**.

```
Church A & Diocese X Affiliation:
├─ Church A decides (independently, church admin only):
│  ├─ 🟢 Share financial data? YES
│  ├─ 🟢 Share member counts? YES
│  ├─ 🔴 Share member names? NO
│  ├─ 🟢 Share event data? YES
│  ├─ 🔴 Share attendance records? NO
│  └─ 🟢 Share donation data? YES
│
└─ Result: Diocese can see summaries ONLY, no details

Church B & Diocese X Affiliation:
├─ Church B decides (independently):
│  ├─ 🔴 Share financial data? NO
│  ├─ 🟢 Share member counts? YES
│  ├─ 🔴 Share member names? NO
│  ├─ 🟢 Share event data? YES
│  ├─ 🟢 Share attendance records? YES
│  └─ 🔴 Share donation data? NO
│
└─ Result: Diocese sees DIFFERENT metrics for Church B
```

### Consent Categories

```sql
CREATE TABLE church_data_consent (
    id SERIAL PRIMARY KEY,
    churchId INTEGER NOT NULL,
    networkId INTEGER NOT NULL,  -- FK to church_networks

    -- Data sharing categories (boolean flags)
    shareFinancialData BOOLEAN DEFAULT true,
    shareMembershipData BOOLEAN DEFAULT true,
    shareEventData BOOLEAN DEFAULT true,
    shareActivityData BOOLEAN DEFAULT true,
    shareAttendanceData BOOLEAN DEFAULT true,
    shareDetailedFinances BOOLEAN DEFAULT false,  -- Granular flag
    shareMemberNames BOOLEAN DEFAULT false,       -- PII flag

    -- Custom categories (JSON for extensibility)
    customSharedCategories JSON,

    -- Audit trail
    lastModifiedBy INTEGER REFERENCES users(id),
    lastModifiedAt TIMESTAMP,

    INDEX idx_churchId (churchId),
    INDEX idx_networkId (networkId)
);
```

### Default Consent

When a church first affiliates with an organization:

```javascript
// Sensible defaults (churches can change anytime)
{
  shareFinancialData: true,        // Want Diocese to know financial health
  shareMembershipData: true,       // Want Diocese to know growth trends
  shareEventData: true,            // Want Diocese to know activity
  shareActivityData: true,         // Want Diocese to know engagement
  shareAttendanceData: true,       // Want Diocese to know participation
  shareDetailedFinances: false,    // Don't share ledger-level details
  shareMemberNames: false          // Don't share PII
}
```

### Consent-Aware Queries

**Critical**: Organization queries MUST respect consent flags

```javascript
// ❌ WRONG: Get Church 1's finances without checking consent
const finances = await getChurchFinancials((churchId = 1));
const total = finances.totalDonations; // Breach!

// ✅ CORRECT: Get Church 1's finances ONLY if consented
const consent = await getChurchConsent(
  (churchId = 1),
  (networkId = dioceseNetworkId),
);
if (consent.shareFinancialData) {
  const finances = await getChurchFinancials((churchId = 1));
  const total = finances.totalDonations; // Safe!
} else {
  const total = null; // Hidden from org
}
```

### UI for Church Admin: Data Consent Settings

```
Church Settings → Data Sharing → Diocese of Port-au-Prince

┌────────────────────────────────────────────────────────────┐
│ WHAT DATA DO YOU WANT TO SHARE WITH THIS ORGANIZATION?    │
│                                                            │
│ ☑️ Financial Data (Total donations, expenses, budget)     │
│ ☑️ Member Count (Total active members, growth trends)    │
│ ☑️ Event Data (Events created, attendance trends)        │
│ ☑️ Activity Data (Groups, programs, engagement)          │
│ ☑️ Attendance Data (Service attendance trends)           │
│ ☐ Detailed Finances (Line-by-line ledger entries)       │
│ ☐ Member Names (Individual member names & contact info) │
│                                                            │
│ [Save Changes]  [View What Diocese Can See]  [Unaffiliate]│
└────────────────────────────────────────────────────────────┘
```

### Audit Logging

```javascript
// Every consent change is logged
await db.ActivityLog.create({
  churchId,
  userId: req.user.id,
  action: "data_consent_updated",
  entityType: "consent",
  entityId: consentId,
  changes: {
    shareFinancialData: { from: true, to: false },
    shareMembershipData: { from: true, to: true },
    shareDetailedFinances: { from: false, to: false },
  },
  timestamp: new Date(),
});
```

---

## Content Distribution & Publishing

### The Publishing Workflow

**Goal**: Diocese publishes policy documents, training materials, announcements. Churches decide what to share with their members.

### Step 1: Organization Creates Content

```
Diocese Admin → Content Library → Create New

Title: "Q3 Budget Guidelines"
Type: Policy Document
Content: [PDF file or rich text]
Target Churches:
  ☑️ All Affiliated Churches
  OR manually select specific churches
Publish: [PUBLISH NOW]
```

### Step 2: Content Published to Org Content Library

```sql
INSERT INTO network_content (
  networkId, contentType, title, description, fileUrl,
  isPublished, publishedAt, createdBy
) VALUES (
  2, 'policy', 'Q3 Budget Guidelines', '...', 'path/to/pdf',
  true, NOW(), userId
);
```

### Step 3: Church Sees Content Notification

```
Diocese Content Available: "Q3 Budget Guidelines" (Policy)
├─ [View]  [Download]  [Adopt & Share]  [Ignore]
```

### Step 4: Church Decides What To Do

**Option A: View Only**

```
Church admin views content but doesn't display publicly
- Stored in database
- Not visible to church members
- Can be shared later
```

**Option B: Adopt & Display**

```javascript
// Church admin clicks "Adopt & Share"
POST /api/churches/:churchId/content/:contentId/adopt
{
  "hasAdopted": true,
  "displayOnWebsite": true,
  "shareWithMembers": true
}
```

**Option C: Download & Archive**

```
Church downloads PDF
- Can customize before sharing
- Can upload to their system
- Reference locally
```

**Option D: Ignore**

```
Church doesn't care about this content
- No record created
- Diocese sees: "Not adopted"
```

### Step 5: Track Adoption

Diocese Admin can see:

```
Content: "Q3 Budget Guidelines"
├─ Targeted: 8 churches
├─ Adopted: 5 churches (62.5%)
├─ Downloaded: 6 churches
├─ Displayed on website: 4 churches
├─ Shared with members: 3 churches
└─ Not viewed: 3 churches
```

### Database Schema

```sql
-- Network publishes content
CREATE TABLE network_content (
    id SERIAL PRIMARY KEY,
    networkId INTEGER NOT NULL REFERENCES church_networks(id),
    contentType ENUM('document', 'announcement', 'training', 'event', 'policy', 'resource'),
    title VARCHAR NOT NULL,
    description LONGTEXT,
    content LONGTEXT,

    fileUrl VARCHAR,        -- PDF, Word, etc.
    fileName VARCHAR,
    fileType VARCHAR,       -- application/pdf, etc.

    isPublished BOOLEAN DEFAULT false,
    publishedAt TIMESTAMP,

    targetAllAffiliatedChurches BOOLEAN DEFAULT true,
    targetedChurchIds JSON,  -- [1, 2, 3] if selective

    createdBy INTEGER NOT NULL REFERENCES users(id),
    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,
    expiresAt TIMESTAMP,     -- Optional: auto-remove after date

    INDEX idx_networkId (networkId),
    INDEX idx_isPublished (isPublished)
);

-- Track which churches adopted what content
CREATE TABLE church_content_adoption (
    id SERIAL PRIMARY KEY,
    contentId INTEGER NOT NULL REFERENCES network_content(id),
    churchId INTEGER NOT NULL REFERENCES churches(id),

    hasAdopted BOOLEAN DEFAULT false,         -- Church decided to use it
    displayOnWebsite BOOLEAN DEFAULT false,   -- Public visibility
    shareWithMembers BOOLEAN DEFAULT false,   -- Email, newsletter, etc.

    viewedAt TIMESTAMP,
    adoptedAt TIMESTAMP,
    downloadedAt TIMESTAMP,

    INDEX idx_contentId (contentId),
    INDEX idx_churchId (churchId),
    UNIQUE(contentId, churchId)
);
```

### Content Types

| Type             | Purpose                          | Example                                           |
| ---------------- | -------------------------------- | ------------------------------------------------- |
| **Document**     | Policies, guidelines, procedures | Budget guidelines, HR policies                    |
| **Announcement** | News, updates, important notices | "New feature available", "Service schedule"       |
| **Training**     | Educational materials            | "How to use giving platform", "Member onboarding" |
| **Event**        | Events from diocese              | "Annual conference", "Worship summit"             |
| **Policy**       | Official policies                | "Data protection", "Code of conduct"              |
| **Resource**     | Helpful materials                | Sermon outlines, worship songs, graphics          |

---

## Church Groups & Community

### What Are Church Groups?

Church groups are **community spaces** for members to connect around shared interests, not access control.

```
Examples:

Church A:
├─ Melody des rachete (Choral group)
├─ Dorcas Ministry (Serving the needy)
├─ Sunday School Class (Education)
└─ ChatGroup (Default - all members)

Church B:
├─ Worship Team
├─ Prayer Warriors
├─ Youth Ministry
├─ Men's Fellowship
└─ ChatGroup (Default)

Key Difference:
├─ ROLES = Define ACCESS & PERMISSIONS
└─ GROUPS = Define COMMUNITY & BELONGING
```

### Group Features

**Default ChatGroup**:

- Auto-created for every church
- All members auto-joined
- Announcements & general discussion
- Never deleted

**Custom Groups**:

- Created by admin/manager on-demand
- Flexible membership
- Group owner has admin rights
- Auto-deleted if empty for 48 hours

### Database Schema

```sql
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    churchId INTEGER NOT NULL,
    name VARCHAR NOT NULL,
    machineNameSlug VARCHAR NOT NULL,   -- "melody-des-rachete"
    description TEXT,
    groupOwnerId INTEGER NOT NULL REFERENCES users(id),

    isDefaultChatGroup BOOLEAN DEFAULT false,
    isReadOnly BOOLEAN DEFAULT false,  -- Only owner can post

    isDeleted BOOLEAN DEFAULT false,
    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,
    deletedAt TIMESTAMP,

    UNIQUE(churchId, name),
    UNIQUE(churchId, machineNameSlug),
    INDEX idx_churchId (churchId)
);

CREATE TABLE user_groups (
    id SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL REFERENCES users(id),
    groupId INTEGER NOT NULL REFERENCES groups(id),
    churchId INTEGER NOT NULL,

    isOwner BOOLEAN DEFAULT false,
    joinedAt TIMESTAMP,
    leftAt TIMESTAMP NULL,
    isActive BOOLEAN DEFAULT true,

    UNIQUE(userId, groupId),
    INDEX idx_userId_churchId (userId, churchId)
);

CREATE TABLE group_messages (
    id SERIAL PRIMARY KEY,
    groupId INTEGER NOT NULL REFERENCES groups(id),
    churchId INTEGER NOT NULL,
    userId INTEGER NOT NULL REFERENCES users(id),

    message TEXT NOT NULL,
    messageType ENUM('text', 'image', 'document', 'announcement'),
    attachmentUrl VARCHAR,

    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,

    INDEX idx_groupId_createdAt (groupId, createdAt)
);
```

### Auto-Cleanup: 48-Hour Rule

**Problem**: Admins create groups but never add members, leaving orphaned groups

**Solution**: Groups auto-delete if no members for 48 hours

```
Timeline:

T=0h: Admin creates "Prayer Team" group
     └─ Countdown: 48 hours until deletion

T=12h: No members added yet
     └─ Countdown: 36 hours remain

T=24h: Admin adds first member
     └─ ✅ Countdown CANCELS
     └─ Group stays active

T=48h (if no members added):
     └─ ❌ Auto-deleted (soft delete)
     └─ Can't be recovered
```

---

## Complete Database Schema

### Overview

The complete database includes:

**Church-Level Tables** (2-level system):

- users, user_roles, roles, role_hierarchies
- churches, departments
- church_feature_flags
- groups, user_groups, group_messages
- activity_logs
- [All existing church-level tables]

**Organization-Level Tables** (NEW 3-level additions):

- church_networks
- network_roles, network_user_roles
- network_content, church_content_adoption
- church_data_consent

**Cross-Level Tables** (NEW):

- church_affiliations

### 1. Core Platform Tables

#### users

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    churchId INTEGER,  -- Scopes user to church (or NULL if org-level)
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    firstName VARCHAR,
    lastName VARCHAR,

    -- Role tracking moved to user_roles junction table

    -- Leadership info
    leadershipTitle ENUM('pastor', 'associate_pastor', 'deacon', 'elder', ...),
    isOrdained BOOLEAN DEFAULT false,
    ordinationDate DATE,
    licenseNumber VARCHAR,

    -- Department
    departmentId INTEGER REFERENCES departments(id),
    supervisorId INTEGER REFERENCES users(id),

    -- Status
    status ENUM('Active', 'Inactive', 'Suspended'),
    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,

    INDEX idx_churchId_email (churchId, email),
    INDEX idx_email (email)
);
```

#### user_roles (Junction Table)

```sql
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    churchId INTEGER NOT NULL,  -- Must match user's churchId
    roleId INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,

    assignedBy INTEGER REFERENCES users(id),
    assignedAt TIMESTAMP DEFAULT NOW(),

    expiresAt TIMESTAMP NULL,
    isActive BOOLEAN DEFAULT true,

    reason TEXT,
    notes TEXT,
    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,

    UNIQUE(userId, roleId),
    INDEX idx_userId_churchId (userId, churchId),
    INDEX idx_roleId_churchId (roleId, churchId),
    CONSTRAINT check_church_isolation CHECK (
        churchId IN (SELECT churchId FROM users WHERE id = userId)
    )
);
```

#### roles

```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    churchId INTEGER NOT NULL,  -- Per-tenant roles
    name VARCHAR NOT NULL,       -- 'admin', 'pastor', etc.
    permissions JSON NOT NULL,   -- ["members:read", "finances:write"]

    isDefault BOOLEAN DEFAULT true,
    displayName VARCHAR,         -- "Lead Pastor" (customizable)
    isEnabled BOOLEAN DEFAULT true,
    description TEXT,

    createdBy INTEGER REFERENCES users(id),
    modifiedBy INTEGER REFERENCES users(id),

    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,

    UNIQUE(churchId, name),
    INDEX idx_churchId (churchId)
);
```

#### role_hierarchies

```sql
CREATE TABLE role_hierarchies (
    id SERIAL PRIMARY KEY,
    churchId INTEGER NOT NULL,
    roleId INTEGER NOT NULL REFERENCES roles(id),
    level INTEGER NOT NULL,  -- 1=highest, 5=lowest

    canCreateRolesAt JSON,   -- [2,3,4]
    canEditUsersAt JSON,     -- [3,4,5]
    canDeleteUsersAt JSON,   -- [4,5]

    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,

    UNIQUE(churchId, roleId),
    INDEX idx_churchId (churchId)
);
```

#### churches

```sql
CREATE TABLE churches (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    subdomain VARCHAR UNIQUE,  -- "firstbaptist.elyonsys.com"

    -- Church Network affiliation (NEW)
    networkId INTEGER REFERENCES church_networks(id),  -- NULL if independent

    -- Contact info
    contactEmail VARCHAR,
    contactPhone VARCHAR,
    country VARCHAR,
    state VARCHAR,
    city VARCHAR,
    address TEXT,

    -- Details
    description LONGTEXT,
    foundedYear INTEGER,
    denomination VARCHAR,
    website VARCHAR,

    -- Status
    status ENUM('Active', 'Inactive', 'Suspended'),

    -- Metadata
    logo_url VARCHAR,
    color_scheme JSON,

    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,

    INDEX idx_networkId (networkId),
    INDEX idx_subdomain (subdomain),
    INDEX idx_status (status)
);
```

#### departments

```sql
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    churchId INTEGER NOT NULL REFERENCES churches(id),
    name VARCHAR NOT NULL,
    description TEXT,
    headId INTEGER REFERENCES users(id),
    budget DECIMAL(15,2),
    status ENUM('Active', 'Inactive'),

    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,

    INDEX idx_churchId (churchId)
);
```

#### church_feature_flags

```sql
CREATE TABLE church_feature_flags (
    id SERIAL PRIMARY KEY,
    churchId INTEGER NOT NULL REFERENCES churches(id),
    feature VARCHAR NOT NULL,
    isEnabled BOOLEAN DEFAULT false,
    config JSON,

    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,

    UNIQUE(churchId, feature),
    INDEX idx_churchId (churchId)
);
```

#### activity_logs

```sql
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    churchId INTEGER NOT NULL,
    userId INTEGER REFERENCES users(id),
    action VARCHAR NOT NULL,
    entityType VARCHAR,
    entityId INTEGER,
    changes JSON,
    ipAddress VARCHAR,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_churchId_timestamp (churchId, timestamp),
    INDEX idx_userId (userId)
);
```

### 2. Group & Community Tables

#### groups

```sql
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    churchId INTEGER NOT NULL REFERENCES churches(id),
    name VARCHAR NOT NULL,
    machineNameSlug VARCHAR NOT NULL,
    description TEXT,
    groupOwnerId INTEGER NOT NULL REFERENCES users(id),

    isDefaultChatGroup BOOLEAN DEFAULT false,
    isReadOnly BOOLEAN DEFAULT false,

    isDeleted BOOLEAN DEFAULT false,
    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,
    deletedAt TIMESTAMP,

    UNIQUE(churchId, machineNameSlug),
    UNIQUE(churchId, name),
    UNIQUE(churchId, isDefaultChatGroup) WHERE isDefaultChatGroup = true,
    INDEX idx_churchId (churchId)
);
```

#### user_groups

```sql
CREATE TABLE user_groups (
    id SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    groupId INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    churchId INTEGER NOT NULL,

    isOwner BOOLEAN DEFAULT false,

    joinedAt TIMESTAMP DEFAULT NOW(),
    leftAt TIMESTAMP NULL,
    isActive BOOLEAN DEFAULT true,

    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,

    UNIQUE(userId, groupId),
    INDEX idx_userId_churchId (userId, churchId),
    INDEX idx_groupId_churchId (groupId, churchId)
);
```

#### group_messages

```sql
CREATE TABLE group_messages (
    id SERIAL PRIMARY KEY,
    groupId INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    churchId INTEGER NOT NULL,
    userId INTEGER NOT NULL REFERENCES users(id),

    message TEXT NOT NULL,
    messageType ENUM('text', 'image', 'document', 'announcement'),
    attachmentUrl VARCHAR,

    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,

    INDEX idx_groupId_createdAt (groupId, createdAt),
    INDEX idx_churchId_createdAt (churchId, createdAt)
);
```

### 3. Church Network Tables (NEW)

> **Naming Decision (Option B)**: The Tier 2 grouping entity (Diocese/District/Network) uses `church_networks` as the table name and `ChurchNetwork` as the Sequelize model name. This avoids collision with the existing `organizations` table (church-owned contact partners). JWT field: `networkId`. Routes: `/api/networks/*`.

#### church_networks

```sql
CREATE TABLE church_networks (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    networkType ENUM('diocese', 'district', 'network', 'mission', 'institution'),
    description LONGTEXT,

    -- Contact info
    country VARCHAR,
    state VARCHAR,
    city VARCHAR,
    contactName VARCHAR,
    contactEmail VARCHAR,
    contactPhone VARCHAR,
    website VARCHAR,

    -- Status
    status ENUM('Active', 'Inactive', 'Suspended'),

    -- Metadata
    logo_url VARCHAR,
    foundedYear INTEGER,

    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,

    INDEX idx_networkType (networkType),
    INDEX idx_status (status)
);
```

#### network_roles

```sql
CREATE TABLE network_roles (
    id SERIAL PRIMARY KEY,
    networkId INTEGER NOT NULL REFERENCES church_networks(id),
    name VARCHAR NOT NULL,
    permissions JSON NOT NULL,

    isDefault BOOLEAN DEFAULT true,
    displayName VARCHAR,
    description TEXT,

    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,

    UNIQUE(networkId, name),
    INDEX idx_networkId (networkId)
);
```

#### network_user_roles

```sql
CREATE TABLE network_user_roles (
    id SERIAL PRIMARY KEY,
    networkId INTEGER NOT NULL REFERENCES church_networks(id),
    userId INTEGER NOT NULL REFERENCES users(id),
    roleId INTEGER NOT NULL REFERENCES network_roles(id),

    assignedBy INTEGER REFERENCES users(id),
    assignedAt TIMESTAMP DEFAULT NOW(),

    isActive BOOLEAN DEFAULT true,
    expiresAt TIMESTAMP NULL,

    reason TEXT,
    notes TEXT,

    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,

    UNIQUE(userId, networkId, roleId),
    INDEX idx_networkId_userId (networkId, userId),
    INDEX idx_isActive (isActive)
);
```

### 4. Data Consent Tables (NEW)

#### church_affiliations

```sql
CREATE TABLE church_affiliations (
    id SERIAL PRIMARY KEY,
    churchId INTEGER NOT NULL UNIQUE REFERENCES churches(id),
    networkId INTEGER NOT NULL REFERENCES church_networks(id),

    affiliatedAt TIMESTAMP DEFAULT NOW(),
    affiliatedBy INTEGER NOT NULL REFERENCES users(id),

    status ENUM('Active', 'Pending', 'Inactive'),

    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,

    UNIQUE(churchId, networkId),
    INDEX idx_networkId (networkId)
);
```

#### church_data_consent

```sql
CREATE TABLE church_data_consent (
    id SERIAL PRIMARY KEY,
    churchId INTEGER NOT NULL REFERENCES churches(id),
    networkId INTEGER NOT NULL REFERENCES church_networks(id),

    -- Data sharing categories (boolean flags)
    shareFinancialData BOOLEAN DEFAULT true,
    shareMembershipData BOOLEAN DEFAULT true,
    shareEventData BOOLEAN DEFAULT true,
    shareActivityData BOOLEAN DEFAULT true,
    shareAttendanceData BOOLEAN DEFAULT true,
    shareDetailedFinances BOOLEAN DEFAULT false,
    shareMemberNames BOOLEAN DEFAULT false,

    -- Custom
    customSharedCategories JSON,

    -- Audit
    lastModifiedBy INTEGER REFERENCES users(id),
    lastModifiedAt TIMESTAMP DEFAULT NOW(),

    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,

    UNIQUE(churchId, networkId),
    INDEX idx_churchId (churchId),
    INDEX idx_networkId (networkId),
    FOREIGN KEY (churchId, networkId) REFERENCES church_affiliations(churchId, networkId)
);
```

### 5. Content Distribution Tables (NEW)

#### network_content

```sql
CREATE TABLE network_content (
    id SERIAL PRIMARY KEY,
    networkId INTEGER NOT NULL REFERENCES church_networks(id),

    contentType ENUM('document', 'announcement', 'training', 'event', 'policy', 'resource'),
    title VARCHAR NOT NULL,
    description LONGTEXT,
    content LONGTEXT,

    fileUrl VARCHAR,
    fileName VARCHAR,
    fileType VARCHAR,

    isPublished BOOLEAN DEFAULT false,
    publishedAt TIMESTAMP,

    targetAllAffiliatedChurches BOOLEAN DEFAULT true,
    targetedChurchIds JSON,  -- [1, 2, 3]

    createdBy INTEGER NOT NULL REFERENCES users(id),
    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,
    expiresAt TIMESTAMP,

    INDEX idx_networkId (networkId),
    INDEX idx_contentType (contentType),
    INDEX idx_isPublished (isPublished)
);
```

#### church_content_adoption

```sql
CREATE TABLE church_content_adoption (
    id SERIAL PRIMARY KEY,
    contentId INTEGER NOT NULL REFERENCES network_content(id),
    churchId INTEGER NOT NULL REFERENCES churches(id),

    hasAdopted BOOLEAN DEFAULT false,
    displayOnWebsite BOOLEAN DEFAULT false,
    shareWithMembers BOOLEAN DEFAULT false,

    viewedAt TIMESTAMP,
    adoptedAt TIMESTAMP,
    downloadedAt TIMESTAMP,

    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,

    UNIQUE(contentId, churchId),
    INDEX idx_contentId (contentId),
    INDEX idx_churchId (churchId)
);
```

---

## Authentication & Registration Security

> **CRITICAL**: This section documents secure authentication patterns that prevent email enumeration, global search bypasses, and cross-tenant access. See [SECURITY_IMPROVEMENT_PLAN.md](SECURITY_IMPROVEMENT_PLAN.md) for detailed vulnerability analysis and implementation roadmap.

### Overview: Two-Page Secure Architecture

Secure authentication requires **separation of concerns** between registration and login:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│           GLOBAL / SaaS LAYER (No Subdomain Required)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  URL: http://localhost:3000/register-church                                │
│                                                                             │
│  [ChurchRegister.jsx]                                                      │
│    • Create NEW churches                                                   │
│    • NO tenant context required                                            │
│    • SaaS-level operation                                                  │
│                                                                             │
│  POST /api/saas/register-church                                            │
│    → Creates church, admin user, seed data                                 │
│    → Returns redirect to: {subdomain}.localhost/login                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                    ⬇️ REDIRECT USER ⬇️

┌─────────────────────────────────────────────────────────────────────────────┐
│      TENANT / SUBDOMAIN-SPECIFIC LAYER (Subdomain Required)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  URL: http://{subdomain}.localhost:3000/login                              │
│        Example: http://demochurch.localhost:3000/login                    │
│                                                                             │
│  [TenantLogin.jsx]                                                         │
│    • Login to SPECIFIC church ONLY                                         │
│    • Subdomain REQUIRED (from URL)                                         │
│    • Church-level operation                                                │
│                                                                             │
│  POST /api/auth/login                                                      │
│    • Middleware extracts churchId from subdomain                           │
│    • Search ONLY: WHERE email = ? AND churchId = ?                        │
│    • NO global fallback (REJECT if not found in church)                    │
│    → Issues JWT with churchId from middleware                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Security Guarantees

With this separation, you achieve:

| Vulnerability | Status | Method |
|---|---|---|
| Email Enumeration | ✅ BLOCKED | Can't search globally, subdomain-specific only |
| Global Search Fallback | ✅ REMOVED | Rejected with 401 if not found in church |
| Tenant Isolation Bypass | ✅ ENFORCED | Middleware validates churchId match |
| Subdomain Spoofing | ✅ BLOCKED | Must match request context + JWT |
| Cross-Tenant Access | ✅ PREVENTED | Database queries enforce churchId filter |

### Pattern A: SaaS-Level Church Registration (Global)

**Location**: `frontend/src/pages/SaaS/ChurchRegister.jsx`  
**URL**: `http://localhost:3000/register-church`  
**Access**: Anyone (no authentication required)  
**Status**: Already implemented ✅

**Key Points**:
- No subdomain required
- Creates church record + admin user + seed data
- Returns redirect URL with subdomain: `{subdomain}.localhost/login`

### Pattern B: Secure Tenant-Specific Login (Subdomain-Enforced)

**Location**: `frontend/src/pages/Tenant/TenantLogin.jsx`  
**URL**: `http://{subdomain}.localhost:3000/login`  
**Access**: Anyone with correct subdomain URL  
**Status**: Needs implementation ⚠️

**Frontend Implementation**:

```jsx
// frontend/src/pages/Tenant/TenantLogin.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const TenantLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // CRITICAL: Extract subdomain from hostname
  const getSubdomain = () => {
    const hostname = window.location.hostname;
    // localhost → no subdomain (SaaS)
    // demochurch.localhost → demochurch
    if (hostname === 'localhost' || hostname === 'elyonsys.com') {
      return null;
    }
    const parts = hostname.split('.');
    return parts[0];
  };

  const subdomain = getSubdomain();

  // If no subdomain, show error message
  if (!subdomain) {
    return (
      <div className="error-container">
        <h2>Church-Specific Login Required</h2>
        <p>Please access your church's login page using your church subdomain.</p>
        <p>Example: <code>https://yourchurch.elyonsys.com/login</code></p>
        <a href="/register-church">Or register a new church</a>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // POST to tenant-specific endpoint
      const res = await api.post('/api/auth/login', { email, password });

      // Store JWT
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Redirect to dashboard
      navigate('/dashboard');

    } catch (err) {
      // CRITICAL: Use generic error message (don't reveal if user exists)
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="church-header">
        <h2>Login</h2>
        <p className="subdomain-indicator">Church: {subdomain}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="help">
        <a href="/register-church">Create a new church account</a>
      </p>
    </div>
  );
};

export default TenantLogin;
```

**Backend Implementation** (SECURE):

```javascript
// backend/controllers/authController.js - SECURE VERSION

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ CRITICAL: REJECT if no church context (must come from subdomain)
    if (!req.church || req.isSaaS) {
      return res.status(401).json({
        error: 'Login must be from your church\'s subdomain',
        message: 'Please access your church\'s login page'
      });
    }

    // ✅ STEP 1: Log attempt (for audit trail)
    console.log(`[LOGIN ATTEMPT] Email: ${email}, Church: ${req.church.subdomain}, IP: ${req.ip}`);

    // ✅ STEP 2: ONLY search in current church (NO global fallback)
    const user = await db.User.findOne({
      where: {
        email: email,
        churchId: req.church.id  // ENFORCE church context
      },
      include: [{
        model: db.Church,
        as: 'church',
        attributes: ['id', 'name', 'subdomain']
      }]
    });

    if (!user) {
      // ✅ Log failed attempt
      await db.ActivityLog.create({
        churchId: req.church.id,
        userId: null,
        action: 'login_failed_user_not_found',
        entityType: 'user',
        details: { email, subdomain: req.church.subdomain },
        ipAddress: req.ip,
        timestamp: new Date()
      });

      // ✅ Generic error (don't reveal if user exists)
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // ✅ STEP 3: Verify password
    const validPass = await bcrypt.compare(password, user.password);

    if (!validPass) {
      // ✅ Log failed attempt
      await db.ActivityLog.create({
        churchId: req.church.id,
        userId: user.id,
        action: 'login_failed_invalid_password',
        entityType: 'user',
        details: { email: user.email },
        ipAddress: req.ip,
        timestamp: new Date()
      });

      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // ✅ STEP 4: Fetch all roles (multi-role support)
    const userRoles = await db.UserRole.findAll({
      where: {
        userId: user.id,
        churchId: req.church.id,
        isActive: true
      },
      include: [{
        model: db.Role,
        attributes: ['name', 'permissions']
      }]
    });

    // Merge permissions from all roles
    const permissionSet = new Set();
    const roleNames = [];
    userRoles.forEach((ur) => {
      roleNames.push(ur.role.name);
      ur.role.permissions.forEach((p) => permissionSet.add(p));
    });

    // ✅ STEP 5: Issue JWT with churchId from MIDDLEWARE (not user input)
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        churchId: req.church.id,      // FROM MIDDLEWARE
        churchSubdomain: req.church.subdomain,  // FROM MIDDLEWARE
        roles: roleNames,
        permissions: Array.from(permissionSet),
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '24h' }
    );

    // ✅ Log successful login
    await db.ActivityLog.create({
      churchId: req.church.id,
      userId: user.id,
      action: 'login_success',
      entityType: 'user',
      details: { email: user.email, roles: roleNames },
      ipAddress: req.ip,
      timestamp: new Date()
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: roleNames,
        churchId: req.church.id,
        churchName: req.church.name,
        churchSubdomain: req.church.subdomain
      }
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
```

**Route Configuration**:

```javascript
// backend/routes/authRoutes.js

const { detectTenant } = require('../middleware/tenant');
const { requireSubdomain } = require('../middleware/requireSubdomain');
const authController = require('../controllers/authController');

router.post(
  '/login',
  detectTenant,        // Step 1: Detect subdomain from request
  requireSubdomain,    // Step 2: REQUIRE subdomain (no SaaS mode)
  authController.login // Step 3: Process login (church-only, no fallback)
);
```

**Subdomain Requirement Middleware**:

```javascript
// backend/middleware/requireSubdomain.js

const requireSubdomain = (req, res, next) => {
  // ✅ CRITICAL: Login endpoint REQUIRES church context
  if (!req.church || req.isSaaS) {
    return res.status(401).json({
      error: 'Church subdomain required',
      message: 'Login must be accessed from your church subdomain'
    });
  }
  next();
};

module.exports = { requireSubdomain };
```

### Implementation Checklist

**Phase 1: Critical Changes (Week 1-2)**

Frontend:
- [ ] Create `src/pages/Tenant/TenantLogin.jsx` (new tenant-specific login)
- [ ] Keep `src/pages/SaaS/ChurchRegister.jsx` (already working)
- [ ] Update routes to use subdomain-aware URLs
- [ ] Add generic error messages

Backend:
- [ ] Replace `authController.login` with secure version (NO global fallback)
- [ ] Create `ActivityLog` model for audit trail
- [ ] Update tenant detection middleware to enhance subdomain extraction
- [ ] Add `requireSubdomain` middleware to login route
- [ ] Add rate limiting to login endpoint

Database:
- [ ] Create `activity_logs` table:
  ```sql
  CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    church_id INTEGER REFERENCES churches(id),
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100),
    entity_type VARCHAR(50),
    details JSONB,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_church_date (church_id, timestamp),
    INDEX idx_user_date (user_id, timestamp)
  );
  ```

Testing:
- [ ] Register church → verify redirects to `{subdomain}.localhost/login`
- [ ] Access `/login` globally → verify rejection
- [ ] Access `{subdomain}/login` → verify works
- [ ] Try wrong subdomain → verify isolation
- [ ] Try email from different church → verify rejection
- [ ] Verify audit logs record attempts

---

## Billing & Subscription System

> **Detailed Reference**: See [BILLING_AND_SUBSCRIPTION_SYSTEM.md](BILLING_AND_SUBSCRIPTION_SYSTEM.md) for complete implementation guide

### Overview

The billing system implements a **Trial → Paid Subscription** model optimized for the Haiti church market:

```
REGISTRATION
    ↓
TRIAL PLAN (30 days - FREE)
├─ Full access to all features
├─ 1000 members (test limit)
└─ Automatic reminders at Day 25, 28, 29
    ↓
SELECT PAID PLAN (required at Day 30)
├─ FOUNDATION: $8/month → 50 members
├─ GROWTH: $25/month → 200 members
└─ PROFESSIONAL: $60/month → 1000 members
    ↓
ACTIVE SUBSCRIPTION (auto-renew monthly)
├─ Stripe handles payment processing
├─ Member limits enforced
└─ Can upgrade/downgrade anytime
```

### Three Subscription Plans

| Plan | Price | Members | Features | Support |
|------|-------|---------|----------|---------|
| **Foundation** | $8/mo | 50 | Core features | Email 48h |
| **Growth** | $25/mo | 200 | All features | Email 24h |
| **Professional** | $60/mo | 1000 | All features + API | Phone 4h |

### Key Architecture Decisions

**Why Trial → Paid (No Free Tier)**:
- ✅ Infrastructure costs money (~$3-5 per church per month)
- ✅ All usage has economic value
- ✅ Trial provides risk-free evaluation period
- ✅ Churches have time to get internal approval

**Tenant-Level Billing**:
- Each church has independent subscription
- Plan stored in `churches.plan_id`
- Subscription status tracked in `churches.subscription_status`
- Limits enforced per-church in application layer

**Stripe Integration**:
- Automatic monthly renewal
- Webhook handling for payment events
- Proration for plan changes (upgrade/downgrade)
- Automatic retries for failed payments

### Feature Enforcement

Limits are checked **before** action, not after:

```javascript
// Before creating member:
if (currentMembers >= plan.limits.maxMembers) {
  return error: "Member limit reached"
}

// Enforced on:
├─ Member creation
├─ Event creation
├─ Storage usage
└─ API rate limits
```

### Trial Lifecycle

| Day | Status | Action |
|-----|--------|--------|
| 1 | `trial` | Full access begins |
| 25 | `trial` | First reminder email |
| 28 | `trial` | Final reminder email |
| 30 | `trial_expired` | Auto-expire, read-only mode |
| 30-37 | `trial_expired` | Grace period (7 days to select plan) |
| 37+ | `suspended` | Access blocked until plan selected |

### Integration with Tenant Architecture

```
┌─────────────────────────────────────────┐
│ Registration (SaaS Level)               │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Auto-assign TRIAL plan (churchId = 0)   │
│ subscription_status = 'trial'           │
│ trial_ends_at = now + 30 days           │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Church-Level: User logs in              │
│ Can use all features                    │
│ Limits enforced: 1000 members (trial)   │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Day 30: Trial expires automatically     │
│ subscription_status = 'trial_expired'   │
│ Dashboard shows: "Select a plan"        │
│ Write access BLOCKED (read-only mode)   │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ User selects plan → Stripe checkout     │
│ Payment succeeds → Webhook confirms     │
│ subscription_status = 'active'          │
│ plan_id = 1, 2, or 3 (based on choice)  │
└─────────────────────────────────────────┘
```

### Database Changes Required

```sql
-- New tables
CREATE TABLE plans (...)          -- Plan definitions
CREATE TABLE billing_history (...) -- Audit trail
CREATE TABLE trial_notifications (...) -- Email tracking

-- Church table additions
ALTER TABLE churches ADD (
  plan_id INT,                    -- Current plan
  subscription_status ENUM(...),  -- Trial, active, suspended
  trial_started_at TIMESTAMP,
  trial_ends_at TIMESTAMP,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  next_billing_date DATE
);
```

### API Endpoints (Summary)

```
POST /api/saas/register-church
  → Creates church + auto-assign trial plan

GET /api/churches/:id/available-plans
  → List all active plans (Foundation, Growth, Professional)

POST /api/churches/:id/billing/select-plan
  → Initiate Stripe checkout for selected plan

GET /api/churches/:id/billing/current-subscription
  → Get current plan + usage info

POST /api/churches/:id/billing/upgrade-plan
  → Upgrade to higher plan with proration

POST /webhook/stripe/webhook
  → Receive Stripe payment confirmations
```

### Cron Jobs

```
Daily at 2 AM UTC:
  → Check for expired trials
  → Auto-expire if Day 30 reached
  → Update status to 'trial_expired'

Daily at 9 AM UTC:
  → Send trial reminders (Day 7, 14, 21, 25, 28, 29)
  → Track sent notifications to avoid duplicates
```

### For Complete Implementation Details

See [BILLING_AND_SUBSCRIPTION_SYSTEM.md](BILLING_AND_SUBSCRIPTION_SYSTEM.md) which includes:

- ✅ Full code examples (backend + frontend)
- ✅ Complete database schema with migrations
- ✅ All 8 API endpoints with request/response examples
- ✅ Stripe integration setup guide
- ✅ React components (TrialBanner, SelectPlan, UsageWarning)
- ✅ Cron job configuration
- ✅ Testing checklist (unit + integration + manual)
- ✅ Deployment checklist
- ✅ Troubleshooting guide

---

## Code Patterns & Implementation

### ⚠️ Pattern 1: Church-Level Authentication with Multi-Role Support (DEPRECATED - VULNERABLE)

> **WARNING**: This pattern contains security vulnerabilities:
> - ❌ Global fallback search (email enumeration)
> - ❌ No subdomain enforcement  
> - ❌ Allows cross-tenant access if middleware fails
>
> **USE INSTEAD**: See [Authentication & Registration Security](#authentication--registration-security) for **Pattern B (Secure)** which removes the fallback and enforces subdomain-first login.

This pattern is shown for reference only. **DO NOT USE IN PRODUCTION**.

```javascript
// backend/controllers/authController.js - OLD/VULNERABLE VERSION

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ❌ VULNERABLE: Step 1: Search in church context first
    let user;
    if (req.church) {
      // Church context: search in this church first
      user = await db.User.findOne({
        where: { email, churchId: req.church.id },
      });
    }

    // Step 2: Fall back to platform search
    if (!user) {
      user = await db.User.findOne({ where: { email } });
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Step 3: Verify password
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Step 4: Fetch ALL roles for this user
    let roles = [];
    let permissions = [];

    if (user.churchId) {
      // Church-level user: fetch all roles in this church
      const userRoles = await db.UserRole.findAll({
        where: { userId: user.id, churchId: user.churchId, isActive: true },
        include: [
          {
            model: db.Role,
            where: { churchId: user.churchId },
            attributes: ["id", "name", "displayName", "permissions"],
          },
        ],
      });

      // Merge permissions from all roles (UNION)
      const permissionSet = new Set();
      userRoles.forEach((ur) => {
        roles.push(ur.role.name);
        ur.role.permissions.forEach((p) => permissionSet.add(p));
      });
      permissions = Array.from(permissionSet);
    } else if (user.networkId) {
      // Network-level user: fetch all roles in this network
      const userRoles = await db.NetworkUserRole.findAll({
        where: { userId: user.id, networkId: user.networkId, isActive: true },
        include: [
          {
            model: db.NetworkRole,
            where: { networkId: user.networkId },
            attributes: ["id", "name", "displayName", "permissions"],
          },
        ],
      });

      // Merge permissions (same pattern)
      const permissionSet = new Set();
      userRoles.forEach((ur) => {
        roles.push(ur.role.name);
        ur.role.permissions.forEach((p) => permissionSet.add(p));
      });
      permissions = Array.from(permissionSet);
    } else {
      // Platform-level user
      roles = ["super_admin"];
      permissions = ["all"];
    }

    // Step 5: Issue JWT with context
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        churchId: user.churchId,
        networkId: user.networkId, // Tier 2: Diocese/District/Network
        roles: roles,
        permissions: permissions,
        isPlatformLevel: !user.churchId && !user.networkId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        roles: roles,
        type: user.churchId
          ? "church"
          : user.networkId
            ? "network"
            : "platform",
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
```

### Pattern 4: Church Isolation Middleware

```javascript
// backend/middleware/churchIsolation.js

exports.ensureChurchIsolation = (req, res, next) => {
  const userChurchId = req.user?.churchId;
  const requestChurchId = req.params.churchId || req.body.churchId;

  if (
    !userChurchId ||
    (requestChurchId && userChurchId !== parseInt(requestChurchId))
  ) {
    return res.status(403).json({
      error: "Access Denied",
      message: "Church isolation violation",
    });
  }

  next();
};
```

### Pattern 5: Network Isolation Middleware

```javascript
// backend/middleware/networkIsolation.js

exports.ensureNetworkIsolation = (req, res, next) => {
  const userNetworkId = req.user?.networkId;
  const requestNetworkId = req.params.networkId || req.body.networkId;

  if (
    !userNetworkId ||
    (requestNetworkId && userNetworkId !== parseInt(requestNetworkId))
  ) {
    return res.status(403).json({
      error: "Access Denied",
      message: "Church network isolation violation",
    });
  }

  next();
};
```

### Pattern 6: Network Dashboard with Consent Filtering

```javascript
// backend/controllers/networkController.js

exports.getDashboard = async (req, res) => {
  try {
    const networkId = req.user.networkId;

    // Step 1: Get all affiliated churches
    const churches = await db.Church.findAll({
      where: { networkId, status: "Active" },
      attributes: ["id", "name"],
    });

    // Step 2: Get consent settings for each church
    const consents = await db.ChurchDataConsent.findAll({
      where: { networkId },
    });

    const consentMap = {};
    consents.forEach((c) => {
      consentMap[c.churchId] = c;
    });

    // Step 3: Aggregate data respecting consent
    let totalDonations = 0;
    let totalMembers = 0;
    let financialChurchCount = 0;
    let membershipChurchCount = 0;

    for (const church of churches) {
      const consent = consentMap[church.id];

      // Only include financial data if church consented
      if (consent?.shareFinancialData) {
        const financials = await db.Finance.findOne({
          where: { churchId: church.id },
        });
        if (financials) {
          totalDonations += financials.totalDonations;
          financialChurchCount++;
        }
      }

      // Only include membership if church consented
      if (consent?.shareMembershipData) {
        const memberCount = await db.User.count({
          where: { churchId: church.id, status: "Active" },
        });
        totalMembers += memberCount;
        membershipChurchCount++;
      }
    }

    res.json({
      network: { id: networkId },
      metrics: {
        totalChurches: churches.length,
        totalDonations: financialChurchCount > 0 ? totalDonations : null,
        financialChurchCount,
        totalMembers: membershipChurchCount > 0 ? totalMembers : null,
        membershipChurchCount,
        dataGaps: {
          financialGaps: churches.length - financialChurchCount,
          membershipGaps: churches.length - membershipChurchCount,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
```

### Pattern 5: Church Affiliates with Church Network

```javascript
// backend/controllers/churchController.js

exports.affiliateWithNetwork = async (req, res) => {
  try {
    const { churchId } = req.params;
    const { networkId } = req.body;
    const userId = req.user.id;

    // Step 1: Verify user is church admin
    if (!req.user.permissions.includes("church:manage_settings")) {
      return res.status(403).json({ error: "Permission denied" });
    }

    // Step 2: Verify church exists
    const church = await db.Church.findByPk(churchId);
    if (!church) {
      return res.status(404).json({ error: "Church not found" });
    }

    // Step 3: Verify church network exists
    const network = await db.ChurchNetwork.findByPk(networkId);
    if (!network) {
      return res.status(404).json({ error: "Church network not found" });
    }

    // Step 4: Create affiliation
    await db.ChurchAffiliation.create({
      churchId,
      networkId,
      affiliatedBy: userId,
      status: "Active",
    });

    // Step 5: Create default consent settings
    await db.ChurchDataConsent.create({
      churchId,
      networkId,
      shareFinancialData: true,
      shareMembershipData: true,
      shareEventData: true,
      shareActivityData: true,
      shareAttendanceData: true,
    });

    // Step 6: Log action
    await db.ActivityLog.create({
      churchId,
      userId,
      action: "affiliated_with_network",
      entityType: "affiliation",
      entityId: networkId,
      changes: { networkId },
    });

    res.json({
      message: "Church successfully affiliated",
      affiliation: { churchId, networkId },
    });
  } catch (error) {
    console.error("Affiliation Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
```

### Pattern 6: Update Data Consent

```javascript
// backend/controllers/consentController.js

exports.updateDataConsent = async (req, res) => {
  try {
    const { churchId } = req.params;
    const { networkId, consent } = req.body;
    const userId = req.user.id;

    // Step 1: Verify church admin
    if (!req.user.permissions.includes("church:manage_consent")) {
      return res.status(403).json({ error: "Permission denied" });
    }

    // Step 2: Find existing consent
    let consentRecord = await db.ChurchDataConsent.findOne({
      where: { churchId, networkId },
    });

    if (!consentRecord) {
      return res.status(404).json({ error: "Affiliation not found" });
    }

    // Step 3: Track changes for audit log
    const oldConsent = consentRecord.toJSON();

    // Step 4: Update consent
    await consentRecord.update({
      ...consent,
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    });

    // Step 5: Log changes
    await db.ActivityLog.create({
      churchId,
      userId,
      action: "data_consent_updated",
      entityType: "consent",
      entityId: consentRecord.id,
      changes: {
        shareFinancialData: {
          from: oldConsent.shareFinancialData,
          to: consent.shareFinancialData,
        },
        shareMembershipData: {
          from: oldConsent.shareMembershipData,
          to: consent.shareMembershipData,
        },
        // ... other fields
      },
    });

    res.json({
      message: "Consent settings updated",
      consent: consentRecord,
    });
  } catch (error) {
    console.error("Consent Update Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
```

---

## API Reference

### Church-Level Endpoints

#### Members

- `GET /api/churches/:churchId/members` - List all members
- `POST /api/churches/:churchId/members` - Create new member
- `GET /api/churches/:churchId/members/:memberId` - Get member details
- `PATCH /api/churches/:churchId/members/:memberId` - Update member
- `DELETE /api/churches/:churchId/members/:memberId` - Delete member
- `POST /api/churches/:churchId/members/:memberId/roles` - Assign roles

#### Roles

- `GET /api/churches/:churchId/roles` - List all roles
- `POST /api/churches/:churchId/roles` - Create custom role
- `PATCH /api/churches/:churchId/roles/:roleId` - Update role
- `DELETE /api/churches/:churchId/roles/:roleId` - Delete role

#### Groups

- `GET /api/churches/:churchId/groups` - List all groups
- `POST /api/churches/:churchId/groups` - Create new group
- `POST /api/churches/:churchId/groups/:groupId/members` - Add members
- `POST /api/churches/:churchId/groups/:groupId/messages` - Post message

#### Organization Affiliation

- `POST /api/churches/:churchId/affiliate` - Affiliate with organization
- `DELETE /api/churches/:churchId/unaffiliate` - Unaffiliate from organization
- `GET /api/churches/:churchId/affiliations` - List affiliations
- `GET /api/churches/:churchId/data-consent/:orgId` - Get consent settings
- `PATCH /api/churches/:churchId/data-consent/:orgId` - Update consent

#### Organization Content (from Network)

- `GET /api/churches/:churchId/network-content` - List network content available to church
- `GET /api/churches/:churchId/network-content/:contentId` - Get content details
- `POST /api/churches/:churchId/network-content/:contentId/adopt` - Adopt content
- `PATCH /api/churches/:churchId/network-content/:contentId/adoption` - Update adoption status

### Network-Level Endpoints (Diocese/District/Network)

> **Route prefix**: `/api/networks/:networkId/*` — protected by `ensureNetworkIsolation` middleware

#### Dashboard

- `GET /api/networks/:networkId/dashboard` - Main dashboard (consent-filtered aggregates)
- `GET /api/networks/:networkId/reports/finances` - Financial reports (consent-filtered)
- `GET /api/networks/:networkId/reports/membership` - Membership reports (consent-filtered)
- `GET /api/networks/:networkId/data-consent/status` - Consent compliance overview

#### Content

- `GET /api/networks/:networkId/content` - List all network content
- `POST /api/networks/:networkId/content` - Create new content
- `GET /api/networks/:networkId/content/:contentId` - Get content details
- `PATCH /api/networks/:networkId/content/:contentId` - Update content
- `POST /api/networks/:networkId/content/:contentId/publish` - Publish content
- `GET /api/networks/:networkId/content/:contentId/analytics` - Adoption analytics

#### Churches

- `GET /api/networks/:networkId/churches` - List affiliated churches
- `GET /api/networks/:networkId/churches/:churchId/consent` - Get church consent status
- `POST /api/networks/:networkId/churches/:churchId/data-request` - Request data sharing

#### Roles

- `GET /api/networks/:networkId/roles` - List network roles
- `POST /api/networks/:networkId/roles` - Create network role
- `PATCH /api/networks/:networkId/roles/:roleId` - Update network role
- `DELETE /api/networks/:networkId/roles/:roleId` - Delete network role

### Platform-Level Endpoints

#### Church Networks (Diocese/District/Network)

> **Note**: `/api/organizations` (flat) still exists for **church-owned contact partners** (businesses, NGOs, schools). These are different routes for a different concept.

- `GET /api/networks` - List all church networks
- `POST /api/networks` - Create new church network
- `PATCH /api/networks/:networkId` - Update church network
- `DELETE /api/networks/:networkId` - Delete church network

#### Churches

- `GET /api/churches` - List all churches
- `POST /api/churches` - Register new church
- `PATCH /api/churches/:churchId` - Update church details
- `DELETE /api/churches/:churchId` - Delete church

#### System

- `GET /api/health` - System health check
- `GET /api/metrics` - Platform metrics

---

## Decision Framework

### How to Choose: Platform vs Organization vs Church?

```
Is this managing the entire SaaS platform?
├─ YES → Platform role
│  ├─ churchId = NULL
│  ├─ orgId = NULL
│  ├─ Roles: super_admin, platform_support
│  └─ Example: You, your team
│
├─ Is this managing a GROUP of churches?
│  ├─ YES → Organization role
│  │  ├─ churchId = NULL
│  │  ├─ orgId = SPECIFIC
│  │  ├─ Roles: org_admin, org_finance, org_operations
│  │  └─ Example: Bishop, District Leader
│  │
│  └─ NO → Church role
│     ├─ churchId = SPECIFIC
│     ├─ orgId = NULL or SPECIFIC
│     ├─ Roles: admin, pastor, staff, member
│     └─ Example: Church Admin, Pastor, Staff
```

### Role Customization

```
Every church gets default roles that can be customized:

DEFAULT ROLES (isDefault = true):
├─ admin → Can customize to "Senior Pastor", "Lead Priest", etc.
├─ pastor → Can customize permissions (who can add events?)
├─ finance_officer → Can customize (read-only? write access?)
├─ staff → Can customize
└─ member → Can customize

CUSTOM ROLES (isDefault = false):
├─ Created on-demand by church admin
├─ Examples: trustee, worship_leader, deacon, elder
├─ Can have any permissions
└─ Can be deleted anytime

KEY PRINCIPLE:
├─ Admin can rename ANY role without code deployment
├─ Admin can change permissions for ANY role without code deployment
├─ Changes take effect immediately
└─ All churches are independent
```

---

## Role Limits & Guardrails

### Church-Level Limits

```
Maximum Roles Per Church: 100
├─ Default (pre-seeded): 5-8
│  ├─ admin, pastor, finance_officer, staff, member
│  └─ Leaves 92-95 for customization
│
├─ Custom: ~92 roles available
│  └─ Enough for most churches
│
└─ Rationale: Beyond 100 becomes unmanageable
   └─ Prevents role explosion
   └─ Scales to millions of churches
```

### Organization-Level Limits

```
Maximum Roles Per Organization: 50
├─ Default (pre-seeded): 5
│  ├─ org_admin, org_finance, org_operations, org_comms, org_viewer
│  └─ Leaves 45 for customization
│
└─ Rationale: Org roles less variable than church roles
```

### System Limits

```
Maximum Organizations: 10,000
├─ Allows for ~2 dioceses per country globally
└─ Plenty of capacity

Maximum Churches Per Organization: Unlimited
├─ Some dioceses have 1000+ churches
└─ Scale enabled by READ-ONLY aggregation

Maximum Users Per Church: 10,000
├─ Supports megachurches
└─ Community groups handle large member lists
```

---

## Security & Best Practices

### 1. Always Filter by Tenant Context

```javascript
// ❌ WRONG
const users = await db.User.findAll({ where: { status: "Active" } });
// Could return users from all churches!

// ✅ CORRECT
const users = await db.User.findAll({
  where: { churchId: req.user.churchId, status: "Active" },
});
// Only this church's users
```

### 2. Verify Permission Domain on Every Request

```javascript
// ❌ WRONG
app.get('/api/churches/:churchId/members', (req, res) => {
  const members = await db.User.findAll({ where: { churchId: req.params.churchId } });
  return res.json(members);  // User could access ANY church!
});

// ✅ CORRECT
app.get('/api/churches/:churchId/members',
  requireAuth,
  ensureChurchIsolation,  // Verify req.user.churchId === req.params.churchId
  (req, res) => {
    const members = await db.User.findAll({
      where: { churchId: req.user.churchId }  // Use user's context, not params
    });
    return res.json(members);
  }
);
```

### 3. Respect Data Consent in Org Queries

```javascript
// ❌ WRONG
const totalDonations = await db.sumDonations({
  where: { churchId: { [Op.in]: affiliatedChurchIds } },
});
// Returns donations from ALL churches regardless of consent!

// ✅ CORRECT
const consents = await db.ChurchDataConsent.findAll({
  where: { orgId: req.user.orgId, shareFinancialData: true },
});
const consentedChurchIds = consents.map((c) => c.churchId);

const totalDonations = await db.sumDonations({
  where: { churchId: { [Op.in]: consentedChurchIds } },
});
// Only from churches that consented to share
```

### 4. Organizations are READ-ONLY

```javascript
// ❌ WRONG
exports.updateChurch = async (req, res) => {
  const orgId = req.user.orgId;

  // Org admin tries to edit church
  await db.Church.update(
    { name: req.body.name },
    { where: { id: req.params.churchId } },
  );
  // Organization CAN'T edit churches!
};

// ✅ CORRECT
exports.updateChurch = async (req, res) => {
  const churchId = req.user.churchId;

  // Only church admins can edit their church
  if (!req.user.churchId) {
    return res.status(403).json({ error: "Not authorized" });
  }

  await db.Church.update({ name: req.body.name }, { where: { id: churchId } });
  // Only works for your church
};
```

### 5. Audit Every Significant Action

```javascript
await db.ActivityLog.create({
  churchId,
  userId: req.user.id,
  action: "member_created",
  entityType: "user",
  entityId: newUser.id,
  changes: {
    name: newUser.name,
    email: newUser.email,
    roles: roles,
  },
  ipAddress: req.ip,
  timestamp: new Date(),
});
```

### 6. Validate Affiliation Before Cross-Org Operations

```javascript
// Before returning org content to church
const affiliation = await db.ChurchAffiliation.findOne({
  where: { churchId: req.params.churchId, orgId: contentOrgId },
});

if (!affiliation) {
  return res.status(403).json({ error: "Church not affiliated" });
}

// Return content only if affiliated
```

---

## Common Scenarios & Workflows

### Scenario 1: Church Admin Sets Up Multi-Role User

**Goal**: Finance Officer who also coordinates events

```
1. Church Admin navigates to Members → Add User
2. Enters: John Doe (john@church.com)
3. Assigns MULTIPLE roles:
   ├─ finance_officer
   └─ events_coordinator
4. John logs in → JWT includes both roles
5. John can:
   ├─ ✅ View financial reports (finance_officer perm)
   ├─ ✅ Create events (events_coordinator perm)
   ├─ ❌ Delete members (not in any role)
```

### Scenario 2: Diocese Creates and Distributes Policy

```
1. Diocese Admin (Org Admin) logs in
2. Content → Create → Policy: "Q3 Budget Guidelines"
3. Uploads PDF, adds description
4. Selects "All affiliated churches" as target
5. Clicks "Publish"
6. All 8 affiliated churches receive notification
7. Each church independently decides:
   - John (Church A admin): "Adopt & Share" → displays on website
   - Mary (Church B admin): "View Only" → reads but doesn't share
   - David (Church C admin): "Ignore" → doesn't care
8. Diocese sees analytics:
   - Adopted: 5 churches (62%)
   - Displayed: 4 churches (50%)
   - Ignored: 3 churches (38%)
```

### Scenario 3: Church Admin Updates Data Consent

```
1. First Baptist Church members see Diocese is asking for data
2. Church Admin navigates to Settings → Data Sharing
3. Sees Diocese of Port-au-Prince listed
4. Current settings:
   ├─ ✅ Share member counts
   ├─ ✅ Share event data
   ├─ ❌ Share member names (PII protected)
   └─ ❌ Share detailed finances
5. Decision: "We want Diocese to see our growth"
   └─ Toggles "Share member names" → ON
6. Saves
7. Diocese dashboard immediately shows:
   - Member names now visible
   - Updated timestamp: "Church updated sharing settings"
8. Audit log: "data_consent_updated by pastor@firstbaptist.com"
```

### Scenario 4: Independent Church Later Affiliates

```
1. Grace Community Church has been independent
2. Joins Diocese of Port-au-Prince
3. Church Admin → Settings → Affiliate Organization
4. Selects Diocese, clicks Affiliate
5. System creates:
   - church_affiliation record (status = Active)
   - church_data_consent record (default settings)
6. Grace now appears in Diocese dashboard
7. Default consent: all data sharing ON
8. Grace can immediately:
   - See Diocese published content
   - Update consent settings
   - Get access to Diocese resources
```

### Scenario 5: User Has Both Church and Organization Roles

**Example**: Bishop who also leads a church

```
User: Bishop James

JWT issued with:
├─ userId: 42
├─ roles: ["admin", "pastor", "org_admin"]
├─ permissions: [
│   "church:*",           // From church roles
│   "org:view_dashboard"  // From network role
│ ]
├─ churchId: 5 (his church)
├─ networkId: 2 (his diocese network)  ← Tier 2 JWT field
└─ primaryContext: "church" (defaults to church portal)

When Bishop logs in:
├─ Can access Church 5 portal (full access)
├─ Can also access Diocese Network 2 dashboard (read-only)
├─ Permissions checked independently per context
└─ Can switch between contexts seamlessly
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Goal**: 2-level church architecture is stable

**Tasks**:

- ✅ Database: users, roles, churches, user_roles
- ✅ Auth: Login with multi-role support
- ✅ Middleware: Church isolation verification
- ✅ API: Basic CRUD for members, roles
- ✅ Frontend: Church admin dashboard

**Outcome**: Churches can manage users and roles

### Phase 2: Church Network Layer (Weeks 3-4)

**Goal**: 3-level architecture with Diocese/District/Network grouping support

> **Implementation Naming (Option B)**: The Tier 2 grouping entity is `ChurchNetwork` in Sequelize (table: `church_networks`). This avoids collision with the existing `Organization` model (church-owned contact partners, table: `organizations`). JWT field is `networkId`. Routes are `/api/networks/*`. See `devellpementprocess/ORGANIZATION_MODEL_AUDIT.md`.

**Tasks**:

- ✅ Database: `church_networks`, `network_roles`, `network_user_roles`, `church_affiliations`
- ✅ Affiliation: Churches can affiliate/unaffiliate with a church network
- ✅ Network Auth: Network-level users (org_admin) can log in — JWT with `networkId`
- ✅ Network Dashboard: Aggregated view of affiliated churches (consent-filtered)
- ✅ Network Isolation Middleware: `ensureNetworkIsolation` (networkId check)
- ✅ Frontend: Network admin portal (`/admin/networks/*`)

**New Sequelize models**:

- `db.ChurchNetwork` — `backend/models/ChurchNetwork.js`
- `db.NetworkRole` — `backend/models/NetworkRole.js`
- `db.NetworkUserRole` — `backend/models/NetworkUserRole.js`
- `db.ChurchAffiliation` — `backend/models/ChurchAffiliation.js`

**Outcome**: Networks (Dioceses/Districts) can group and view affiliated churches

### Phase 3: Data Consent (Weeks 5-6)

**Goal**: Consent-aware queries and UI

**Tasks**:

- ✅ Database: church_data_consent table
- ✅ Consent Update API: Church admins control sharing
- ✅ Consent-Aware Queries: Org views respect flags
- ✅ Audit Logging: Track consent changes
- ✅ Frontend: Consent settings UI

**Outcome**: Churches control what they share

### Phase 4: Content Distribution (Weeks 7-8)

**Goal**: Organizations publish, churches adopt

**Tasks**:

- ✅ Database: `network_content`, `church_content_adoption`
- ✅ Content Creation: Org admins publish content
- ✅ Content Publishing: Make content available
- ✅ Adoption: Churches can adopt/display content
- ✅ Analytics: Track adoption metrics
- ✅ Frontend: Content library UI

**Outcome**: Organizations distribute content

### Phase 5: Polish & Launch (Weeks 9-16)

**Goal**: Production-ready system

**Tasks**:

- ✅ Security audit
- ✅ Performance optimization
- ✅ Testing (unit, integration, e2e)
- ✅ Documentation
- ✅ User training
- ✅ Deployment & monitoring

**Outcome**: System live with users

---

## Summary: Key Takeaways

### Architectural Principles

1. **Every query is tenant-aware**: Explicitly filter by churchId or orgId
2. **Permission domains are isolated**: Org roles ≠ Church roles
3. **Organizations are read-only**: No direct church data editing
4. **Multi-role support**: Users can have multiple roles with merged permissions
5. **Church autonomy**: Churches make affiliation & consent decisions
6. **Data consent enforced**: Org queries respect consent flags
7. **Content is adoptable, not forced**: Churches choose what to share

### Security Priorities

1. Tenant isolation on EVERY database query
2. Permission domain verification on EVERY API request
3. Consent flag checking on EVERY org-level data access
4. Audit logging on ALL significant actions
5. Read-only enforcement for org-level operations

### Key Tables

**Church-Level** (2-level system):

- users, user_roles, roles, role_hierarchies, churches, departments, groups, user_groups, group_messages, activity_logs

**Network-Level** (NEW, 3-level system — Option B naming, no collision with existing `organizations` table):

- `church_networks`, `network_roles`, `network_user_roles` (Sequelize: `ChurchNetwork`, `NetworkRole`, `NetworkUserRole`)
- `network_content`, `church_content_adoption`
- `church_data_consent`, `church_affiliations`

> **Kept unchanged**: `organizations` table (church-owned contact partners) + `organization_members` junction. See `devellpementprocess/ORGANIZATION_MODEL_AUDIT.md`.

### Testing Priorities

1. Church isolation: User from Church A cannot access Church B data
2. Organization read-only: Org admin cannot edit church
3. Consent filtering: Org dashboard excludes non-consented data
4. Multi-role merging: User with 2 roles gets both permissions
5. Affiliation workflows: Church can affiliate/unaffiliate/update consent

---

## References & Next Steps

**This document is now the single source of truth for:**

- Architecture decisions
- Database design
- API specifications
- Code patterns
- Security requirements
- Implementation timeline

**Next Steps**:

1. Share with development team
2. Review architecture decisions
3. Begin Phase 1 implementation
4. Set up database schema
5. Start building auth system

---

**Document Version**: 2.0 (Merged)  
**Last Updated**: May 11, 2026  
**Author**: Architecture Team  
**Status**: Ready for Implementation
