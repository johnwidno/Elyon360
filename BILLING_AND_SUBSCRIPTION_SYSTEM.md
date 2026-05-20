# ElyonSys 360 - Billing & Subscription System

**Purpose**: Complete reference for implementing trial-based subscription lifecycle, payment processing, and feature limit enforcement  
**Date**: May 20, 2026  
**Status**: Implementation Guide  
**Version**: 1.0  
**Market**: Haiti church management  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Model Overview](#business-model-overview)
3. [Plan Definitions](#plan-definitions)
4. [Trial Lifecycle & State Machine](#trial-lifecycle--state-machine)
5. [Subscription Management](#subscription-management)
6. [Feature Limits & Enforcement](#feature-limits--enforcement)
7. [Payment Processing](#payment-processing)
8. [Database Schema](#database-schema)
9. [API Endpoints](#api-endpoints)
10. [Backend Implementation](#backend-implementation)
11. [Frontend Components](#frontend-components)
12. [Cron Jobs & Automation](#cron-jobs--automation)
13. [Testing Checklist](#testing-checklist)
14. [Deployment Checklist](#deployment-checklist)

---

## Executive Summary

### Business Model: Trial → Paid Subscription

```
REGISTRATION
    ↓
TRIAL PLAN (30 days - FREE)
├─ Full access to all features
├─ 1000 members (test limit)
├─ Daily email reminders at Day 25, 28, 29
└─ Day 30: Trial expires, read-only mode
    ↓
PAID PLAN REQUIRED (select within 30 days)
├─ FOUNDATION: $8/month → 50 members
├─ GROWTH: $25/month → 200 members
└─ PROFESSIONAL: $60/month → 1000 members
    ↓
ACTIVE SUBSCRIPTION (auto-renew monthly)
├─ Stripe handles payment
├─ Member limits enforced
├─ Features unlocked based on plan
└─ Can upgrade/downgrade anytime
```

### Key Metrics (Target)

```
Trial Conversion Rate: 10-15% (industry standard for SaaS)
Average Plan Mix:
├─ Foundation: 60% of paying churches (~$8/month)
├─ Growth: 30% of paying churches (~$25/month)
└─ Professional: 10% of paying churches (~$60/month)

Example: 100 trials → 12 conversions (12% rate)
├─ Foundation: 7 × $8 = $56/month
├─ Growth: 4 × $25 = $100/month
└─ Professional: 1 × $60 = $60/month
Total MRR: $216/month per 100 trials
```

---

## Business Model Overview

### Why This Model Works for Haiti Church Market

| Factor | Why This Works |
|--------|---|
| **Trial Period** | Churches need time to discuss internally & get approval |
| **No Free Tier** | Infrastructure costs money; all usage has value |
| **Paid Tiers** | Covers hosting ($3-5/church) + profit margin (60%+) |
| **Affordable Price** | Foundation at $8/month = ~1-2% of small church budget |
| **Easy Upgrade** | Gradual scaling: 50 → 200 → 1000 members as churches grow |
| **Auto-Renewal** | Predictable revenue; easier than monthly billing |

### Revenue Projection (Year 1)

```
Month 1-3: Acquisition
├─ 100 registrations
├─ 12 conversions (12%)
├─ MRR: $216
└─ Runway: 2-3 months

Month 4-6: Growth
├─ 50 new registrations/month
├─ 6 conversions/month
├─ Total MRR by Month 6: ~$800
└─ Runway: 6+ months

Month 7-12: Scaling
├─ 100 new registrations/month
├─ 12 conversions/month
├─ New total MRR by Month 12: ~$2,160
├─ Churn: 1-2% (some trial expiries don't convert)
├─ Final MRR: ~$1,980
└─ ARR: ~$23,760 (sustainable)
```

---

## Plan Definitions

### The Three Plans

```javascript
// Plans configuration
const PLANS = [
  {
    id: 1,
    name: 'foundation',
    displayName: 'Foundation',
    description: 'Perfect for small churches',
    monthlyPrice: 8.00,
    currency: 'USD',
    features: [
      'members:basic',      // Core member management
      'events:basic',       // Event creation & management
      'groups:basic',       // Group/community features
      'reporting:basic',    // Basic reports
      'payments:basic'      // Basic donation tracking
    ],
    limits: {
      maxMembers: 50,
      maxEvents: 20,
      maxGroups: 5,
      eventAttendeeCap: 50,
      storageGB: 1
    },
    support: 'email:48h',   // Email support, 48hr response
    stripePriceId: 'price_foundation_usd',
    isActive: true,
    isTrial: false
  },

  {
    id: 2,
    name: 'growth',
    displayName: 'Growth',
    description: 'For growing churches',
    monthlyPrice: 25.00,
    currency: 'USD',
    features: [
      'members:full',       // Advanced member management
      'events:full',        // Unlimited event types
      'groups:full',        // Unlimited groups
      'reporting:advanced', // Advanced analytics
      'payments:full',      // Full payment processing
      'api:basic'           // Basic API access
    ],
    limits: {
      maxMembers: 200,
      maxEvents: null,      // Unlimited
      maxGroups: null,      // Unlimited
      eventAttendeeCap: 200,
      storageGB: 10
    },
    support: 'email:24h',   // Email support, 24hr response
    stripePriceId: 'price_growth_usd',
    isActive: true,
    isTrial: false
  },

  {
    id: 3,
    name: 'professional',
    displayName: 'Professional',
    description: 'For large churches & networks',
    monthlyPrice: 60.00,
    currency: 'USD',
    features: [
      '*'                   // All features
    ],
    limits: {
      maxMembers: 1000,
      maxEvents: null,
      maxGroups: null,
      eventAttendeeCap: 1000,
      storageGB: 100,
      includeAPI: true,
      dedicatedSupport: true
    },
    support: 'phone+email:4h',  // Priority support
    stripePriceId: 'price_professional_usd',
    isActive: true,
    isTrial: false
  }
];

// Trial plan (special - auto-created on registration)
const TRIAL_PLAN = {
  id: 0,
  name: 'trial',
  displayName: 'Trial (30 days)',
  description: 'Free trial with full access',
  monthlyPrice: 0,
  currency: 'USD',
  features: ['*'],          // All features during trial
  limits: {
    maxMembers: 1000,       // Let them explore
    maxEvents: null,
    maxGroups: null,
    eventAttendeeCap: 1000,
    storageGB: 100
  },
  support: 'email:48h',
  isTrial: true,
  trialDays: 30
};
```

### Feature Matrix

```
                    FOUNDATION  | GROWTH      | PROFESSIONAL
────────────────────────────────────────────────────────────
Price               $8/month    | $25/month   | $60/month
Members             50          | 200         | 1000
Events              20/month    | Unlimited   | Unlimited
Event Capacity      50          | 200         | 1000
Groups              5           | Unlimited   | Unlimited
Donations           Basic       | Full        | Full
Payments Processing ✗           | ✓           | ✓
Reports             Basic       | Advanced    | Custom
API Access          ✗           | Basic       | Full
Storage             1 GB        | 10 GB       | 100 GB
Support             Email 48h   | Email 24h   | Phone+Email 4h
────────────────────────────────────────────────────────────
```

---

## Trial Lifecycle & State Machine

### State Transitions

```
[REGISTRATION]
    ↓
[TRIAL ACTIVE] (subscription_status = 'trial')
    ├─ Days 1-24: Normal operation
    ├─ Days 25-29: Escalating reminders
    └─ Day 30: Automatic transition
    ↓
[TRIAL EXPIRED] (subscription_status = 'trial_expired')
    ├─ Can still login
    ├─ Can view all data (read-only)
    ├─ Cannot create/edit/delete
    ├─ Banner: "Select a plan to continue"
    └─ Valid for 7 days (grace period)
    ↓
[PLAN SELECTED + PAYMENT PROCESSING]
    ├─ User clicks "Select Plan"
    ├─ Redirected to Stripe checkout
    ├─ Payment processed
    └─ Stripe webhook confirms
    ↓
[ACTIVE] (subscription_status = 'active')
    ├─ Full access to selected plan
    ├─ Monthly auto-renewal
    ├─ Can upgrade/downgrade
    └─ Normal operation
```

### Database State Management

```sql
-- Track trial lifecycle
ALTER TABLE churches ADD COLUMN (
  subscription_status ENUM(
    'trial',              -- In 30-day trial
    'trial_expired',      -- Trial ended, grace period (7 days)
    'active',             -- Paid subscription active
    'suspended'           -- Payment failed, account suspended
  ) DEFAULT 'trial',
  
  trial_started_at TIMESTAMP,           -- When trial began
  trial_ends_at TIMESTAMP,              -- When trial expires
  trial_grace_period_ends_at TIMESTAMP, -- 7 days after expiry
  
  plan_id INTEGER REFERENCES plans(id) DEFAULT 0,  -- 0 = trial
  plan_started_at TIMESTAMP,            -- When paid plan started
  next_billing_date DATE,               -- Next payment due
  
  current_member_count INT DEFAULT 0,   -- Cache for quick checks
  last_member_added_at TIMESTAMP
);
```

### Trial Notification Schedule

```
DAY 1:  Automatic email
        "Welcome to ElyonSys 360 Trial!"
        "Your 30-day trial starts now"
        
DAY 7:  Check-in email
        "Explore all features - 23 days left"
        
DAY 14: Mid-way email
        "How are you finding ElyonSys? - 16 days left"
        
DAY 21: Escalation begins
        "Plan ahead: Select a plan soon - 9 days left"
        
DAY 25: First urgent email
        "Your trial ends in 5 days"
        "[Select a Plan]"
        
DAY 28: Final reminder email
        "Your trial ends in 2 days"
        "[Select a Plan NOW]"
        
DAY 29: Last chance email (optional)
        "FINAL DAY: Select plan before midnight"
        
DAY 30: Auto-expiry
        Dashboard banner: "TRIAL EXPIRED - Select a plan"
        Read-only mode activated
```

---

## Subscription Management

### Upgrading Plans

```javascript
// User journey: Upgrade from Foundation to Growth

1. Dashboard → Settings → Billing → "Upgrade"
2. Shows current plan + cost
3. User selects new plan (Growth: $25/month)
4. System calculates prorated charges:
   ├─ Days used on Foundation: 15 days
   ├─ Foundation cost for 15 days: $8 * (15/30) = $4
   ├─ Refund: $4 (credited to account)
   ├─ Growth cost for full month: $25
   ├─ Due today: $25 - $4 = $21
   └─ Next billing: 30 days from today
5. Stripe charges $21 immediately
6. Plan switched immediately
7. Confirmation email sent

// API endpoint
POST /api/churches/:churchId/billing/upgrade-plan
{
  "planId": 2  // Growth plan
}

Response:
{
  "success": true,
  "oldPlan": "foundation",
  "newPlan": "growth",
  "oldPrice": 8.00,
  "newPrice": 25.00,
  "daysUsed": 15,
  "proratAmount": -4.00,  // Refund
  "amountDue": 21.00,
  "nextBillingDate": "2026-06-20",
  "message": "Upgraded successfully. New limits are now active."
}
```

### Downgrading Plans

```javascript
// Downgrade from Growth to Foundation

Warning UI:
┌─────────────────────────────────────────────────────┐
│ WARNING: Downgrade will reduce your limits          │
│                                                     │
│ Current plan: GROWTH (200 members)                  │
│ New plan: FOUNDATION (50 members)                   │
│ Current members: 180                                │
│                                                     │
│ ⚠️ You will exceed limit! Cannot downgrade until    │
│    you remove 130 members.                          │
│                                                     │
│ [Cancel] [Proceed with Caution]                     │
└─────────────────────────────────────────────────────┘

// Check limits before allowing downgrade
GET /api/churches/:churchId/billing/can-downgrade?newPlanId=1

Response:
{
  "canDowngrade": false,
  "currentMembers": 180,
  "currentPlan": "growth",
  "newPlan": "foundation",
  "newLimit": 50,
  "membersOverLimit": 130,
  "message": "Cannot downgrade. Remove 130 members first."
}

// After removing members to comply with limit:
POST /api/churches/:churchId/billing/downgrade-plan
{
  "planId": 1,  // Foundation
  "confirmedByUserId": 42
}

Response:
{
  "success": true,
  "oldPlan": "growth",
  "newPlan": "foundation",
  "creditAmount": 12.50,  // Half month unused
  "nextBillingDate": "2026-06-05",
  "message": "Downgraded. Credit of $12.50 applied to account."
}
```

### Cancellation & Suspension

```javascript
// Cancellation flow

1. User clicks "Cancel Subscription" in Settings
2. Warning dialog:
   "Are you sure? You'll lose access in 30 days"
3. User confirms
4. Stripe subscription is cancelled at end of billing period
5. Church status changed to 'suspended' after billing date
6. Grace period: 30 days (data still accessible, read-only)
7. After 30 days: Data archived, cannot recover

// Payment failure handling

IF payment fails:
├─ Day 0: Payment attempt fails
├─ Day 3: Retry payment
├─ Day 5: Email: "Payment failed"
├─ Day 7: Retry again + final warning email
├─ Day 10: Change status to 'suspended'
├─ Features disabled, read-only mode
├─ Day 40: Data archived
└─ Day 60: Data deleted

// API endpoints
POST /api/churches/:churchId/billing/cancel
{
  "reason": "Too expensive",  // Optional feedback
  "confirmation": true
}

POST /api/churches/:churchId/billing/reactivate
{
  "planId": 1  // Restart subscription
}
```

---

## Feature Limits & Enforcement

### Member Limit Enforcement

```javascript
// When adding a member

exports.createMember = async (req, res) => {
  try {
    const churchId = req.user.churchId;
    
    // Step 1: Get church + plan
    const church = await db.Church.findByPk(churchId);
    const plan = await db.Plan.findByPk(church.plan_id);
    
    // Step 2: Check current member count
    const currentMembers = await db.User.count({
      where: { churchId, role: 'member', isActive: true }
    });
    
    // Step 3: Enforce limit
    if (plan.limits.maxMembers && currentMembers >= plan.limits.maxMembers) {
      return res.status(403).json({
        error: 'Member limit reached',
        currentPlan: plan.displayName,
        memberLimit: plan.limits.maxMembers,
        currentMembers: currentMembers,
        message: `Your ${plan.displayName} plan allows ${plan.limits.maxMembers} members.`,
        suggestion: `Upgrade to ${getNextPlan(plan.name).displayName} for more members.`,
        suggestedPlanId: getNextPlan(plan.name).id
      });
    }
    
    // Step 4: Create member
    const member = await db.User.create({
      churchId,
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      isActive: true
    });
    
    // Step 5: Update cache
    await db.Church.update(
      { 
        current_member_count: currentMembers + 1,
        last_member_added_at: new Date()
      },
      { where: { id: churchId } }
    );
    
    res.json({ success: true, member });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### Event Limit Enforcement

```javascript
// Checking event limits

const canCreateEvent = async (churchId) => {
  const church = await db.Church.findByPk(churchId);
  const plan = await db.Plan.findByPk(church.plan_id);
  
  // If unlimited (null), always allow
  if (plan.limits.maxEvents === null) {
    return { canCreate: true };
  }
  
  // Count events this month
  const monthStart = new Date();
  monthStart.setDate(1);
  
  const eventCount = await db.Event.count({
    where: {
      churchId,
      createdAt: { [Op.gte]: monthStart }
    }
  });
  
  if (eventCount >= plan.limits.maxEvents) {
    return {
      canCreate: false,
      error: `Monthly event limit reached (${plan.limits.maxEvents}/month)`,
      currentCount: eventCount,
      limit: plan.limits.maxEvents
    };
  }
  
  return { canCreate: true };
};

// Usage in route
router.post('/events',
  async (req, res, next) => {
    const check = await canCreateEvent(req.church.id);
    if (!check.canCreate) {
      return res.status(403).json(check);
    }
    next();
  },
  eventController.create
);
```

### Hard Limits vs Soft Limits

```
HARD LIMITS (Enforced, cannot exceed):
├─ Member count (no workarounds)
├─ Storage space
└─ API rate limits

SOFT LIMITS (Warnings, but allowed):
├─ Event count (monthly reset)
└─ Support response time (SLA, not blocking)

FEATURE BLOCKING (Cannot use):
├─ Payment processing (Foundation plan)
├─ API access (Foundation plan)
├─ Advanced reports (Foundation plan)
└─ Priority support (Foundation plan)
```

---

## Payment Processing

### Stripe Integration Setup

```bash
# Install Stripe library
npm install stripe

# Environment variables needed
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Creating Stripe Subscription

```javascript
// backend/services/stripeService.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createSubscription = async (churchId, planId, userEmail) => {
  try {
    // Step 1: Get plan & church
    const plan = await db.Plan.findByPk(planId);
    const church = await db.Church.findByPk(churchId);
    
    if (!plan || plan.isTrial) {
      throw new Error('Invalid plan');
    }
    
    // Step 2: Create or get Stripe customer
    let stripeCustomerId = church.stripe_customer_id;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          churchId: churchId,
          churchName: church.name,
          subdomain: church.subdomain
        }
      });
      stripeCustomerId = customer.id;
      
      // Save to database
      await db.Church.update(
        { stripe_customer_id: stripeCustomerId },
        { where: { id: churchId } }
      );
    }
    
    // Step 3: Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [
        {
          price: plan.stripePriceId  // e.g., 'price_growth_usd'
        }
      ],
      metadata: {
        churchId: churchId,
        planId: planId
      },
      collection_method: 'charge_automatically',
      expand: ['latest_invoice']
    });
    
    // Step 4: Log billing event
    await db.BillingHistory.create({
      church_id: churchId,
      plan_id: planId,
      action: 'subscription_created',
      amount: plan.monthlyPrice,
      status: 'pending',
      stripe_subscription_id: subscription.id,
      metadata: { customerId: stripeCustomerId }
    });
    
    return {
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,  // 'active', 'incomplete', etc.
      nextBillingDate: new Date(subscription.current_period_end * 1000)
    };
    
  } catch (err) {
    console.error('Subscription creation failed:', err);
    throw err;
  }
};
```

### Webhook Handling

```javascript
// backend/routes/webhookRoutes.js

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Webhook endpoint (no auth - Stripe signature verified)
router.post('/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      // Handle different event types
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(event.data.object);
          break;
          
        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object);
          break;
          
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object);
          break;
          
        case 'customer.subscription.deleted':
          await handleSubscriptionCancelled(event.data.object);
          break;
      }
      
      res.json({ received: true });
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(400).json({ error: 'Webhook failed' });
    }
  }
);

// Payment succeeded handler
async function handlePaymentSucceeded(invoice) {
  const { subscription } = invoice;
  const { churchId, planId } = subscription.metadata;
  
  // Update church subscription
  await db.Church.update({
    subscription_status: 'active',
    plan_id: planId,
    stripe_subscription_id: subscription,
    plan_started_at: new Date(),
    next_billing_date: new Date(invoice.next_payment_attempt * 1000)
  }, {
    where: { id: churchId }
  });
  
  // Log event
  await db.BillingHistory.create({
    church_id: churchId,
    plan_id: planId,
    action: 'payment_succeeded',
    amount: invoice.amount_paid / 100,  // Convert from cents
    status: 'completed',
    invoice_number: invoice.number,
    receipt_url: invoice.hosted_invoice_url,
    stripe_subscription_id: subscription
  });
  
  // Send confirmation email
  await sendEmail({
    to: invoice.customer_email,
    template: 'payment_confirmation',
    data: { invoiceNumber: invoice.number, amount: invoice.amount_paid / 100 }
  });
}

// Payment failed handler
async function handlePaymentFailed(invoice) {
  const { subscription } = invoice;
  const { churchId } = subscription.metadata;
  
  // Log event
  await db.BillingHistory.create({
    church_id: churchId,
    action: 'payment_failed',
    amount: invoice.amount_due / 100,
    status: 'failed',
    stripe_subscription_id: subscription,
    metadata: { retryDate: new Date(invoice.next_payment_attempt * 1000) }
  });
  
  // Send payment failure email
  await sendEmail({
    to: invoice.customer_email,
    template: 'payment_failed',
    data: { retryDate: new Date(invoice.next_payment_attempt * 1000) }
  });
}

module.exports = router;
```

---

## Database Schema

### Core Tables

```sql
-- Plans (Platform-level configuration)
CREATE TABLE plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,        -- 'trial', 'foundation', 'growth', 'professional'
  display_name VARCHAR(100) NOT NULL,       -- "Trial (30 days)", "Foundation", etc.
  description TEXT,
  monthly_price DECIMAL(10, 2) DEFAULT 0,   -- 0 for trial, 8.00, 25.00, 60.00
  currency VARCHAR(3) DEFAULT 'USD',
  
  features JSONB,                           -- {"includes": ["members", "events", ...]}
  limits JSONB,                             -- {"maxMembers": 50, "maxEvents": 20, ...}
  
  stripe_price_id VARCHAR(255),             -- 'price_growth_usd'
  is_trial BOOLEAN DEFAULT false,
  trial_days INT DEFAULT 30,
  
  status ENUM('active', 'archived') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_name (name),
  INDEX idx_status (status)
);

-- Insert default plans
INSERT INTO plans (id, name, display_name, description, monthly_price, features, limits, is_trial, status) VALUES
  (0, 'trial', 'Trial (30 days)', 'Free 30-day trial with full access', 0.00, 
   '{"includes": ["*"]}', '{"maxMembers": 1000, "maxEvents": null}', true, 'active'),
  
  (1, 'foundation', 'Foundation', 'Perfect for small churches', 8.00,
   '{"includes": ["members", "events", "groups", "reporting", "payments"]}',
   '{"maxMembers": 50, "maxEvents": 20, "maxGroups": 5}', false, 'active'),
  
  (2, 'growth', 'Growth', 'For growing churches', 25.00,
   '{"includes": ["members", "events", "groups", "reporting", "payments", "api"]}',
   '{"maxMembers": 200, "maxEvents": null, "maxGroups": null}', false, 'active'),
  
  (3, 'professional', 'Professional', 'For large churches & networks', 60.00,
   '{"includes": ["*"]}',
   '{"maxMembers": 1000, "maxEvents": null, "maxGroups": null, "includeAPI": true}', 
   false, 'active');

-- Church subscription details (add to existing churches table)
ALTER TABLE churches ADD COLUMN (
  plan_id INTEGER REFERENCES plans(id) DEFAULT 0,
  
  subscription_status ENUM('trial', 'trial_expired', 'active', 'suspended') DEFAULT 'trial',
  
  trial_started_at TIMESTAMP,
  trial_ends_at TIMESTAMP,
  trial_grace_period_ends_at TIMESTAMP,
  
  plan_started_at TIMESTAMP,
  next_billing_date DATE,
  
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  
  current_member_count INT DEFAULT 0,
  last_member_added_at TIMESTAMP,
  
  INDEX idx_subscription_status (subscription_status),
  INDEX idx_plan_id (plan_id),
  INDEX idx_trial_ends (trial_ends_at),
  INDEX idx_next_billing (next_billing_date)
);

-- Billing history (audit trail)
CREATE TABLE billing_history (
  id SERIAL PRIMARY KEY,
  church_id INTEGER NOT NULL REFERENCES churches(id),
  plan_id INTEGER REFERENCES plans(id),
  
  action VARCHAR(50) NOT NULL,  -- 'trial_started', 'payment_succeeded', 'payment_failed', 'upgraded', 'downgraded', 'cancelled'
  amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  
  invoice_number VARCHAR(100),
  invoice_url TEXT,
  receipt_url TEXT,
  
  stripe_subscription_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  
  metadata JSONB,               -- Store additional details
  notes TEXT,
  
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_church (church_id),
  INDEX idx_created (created_at),
  INDEX idx_status (status)
);

-- Trial notifications (track which reminders were sent)
CREATE TABLE trial_notifications (
  id SERIAL PRIMARY KEY,
  church_id INTEGER NOT NULL REFERENCES churches(id),
  notification_type VARCHAR(50) NOT NULL,  -- 'day_1', 'day_7', 'day_21', 'day_25', 'day_28', 'day_29'
  sent_at TIMESTAMP,
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  
  UNIQUE(church_id, notification_type)
);
```

---

## API Endpoints

### Registration → Trial Plan

```javascript
// POST /api/saas/register-church
// Returns: Creates church with TRIAL plan

{
  "churchName": "First Baptist Church",
  "subdomain": "firstbaptist",
  "adminEmail": "pastor@church.com",
  "adminPassword": "SecurePassword123"
}

Response (201 Created):
{
  "success": true,
  "church": {
    "id": 5,
    "name": "First Baptist Church",
    "subdomain": "firstbaptist",
    "plan": {
      "id": 0,
      "name": "trial",
      "displayName": "Trial (30 days)"
    },
    "subscriptionStatus": "trial",
    "trialEndsAt": "2026-06-20T10:30:00Z",
    "daysRemaining": 30
  },
  "redirectUrl": "http://firstbaptist.localhost:3000/login"
}
```

### Get Available Plans

```javascript
// GET /api/churches/:churchId/available-plans
// Access: Public (no auth required for churches in trial/trial_expired)

Response (200 OK):
{
  "plans": [
    {
      "id": 1,
      "name": "foundation",
      "displayName": "Foundation",
      "description": "Perfect for small churches",
      "monthlyPrice": 8.00,
      "features": [
        "members:basic",
        "events:basic",
        "groups:basic",
        "reporting:basic",
        "payments:basic"
      ],
      "limits": {
        "maxMembers": 50,
        "maxEvents": 20,
        "maxGroups": 5
      },
      "support": "email:48h"
    },
    {
      "id": 2,
      "name": "growth",
      "displayName": "Growth",
      "description": "For growing churches",
      "monthlyPrice": 25.00,
      "features": ["members:full", "events:full", "groups:full", "reporting:advanced", "payments:full", "api:basic"],
      "limits": {
        "maxMembers": 200,
        "maxEvents": null,
        "maxGroups": null
      },
      "support": "email:24h"
    },
    {
      "id": 3,
      "name": "professional",
      "displayName": "Professional",
      "description": "For large churches & networks",
      "monthlyPrice": 60.00,
      "features": ["*"],
      "limits": {
        "maxMembers": 1000,
        "maxEvents": null,
        "maxGroups": null
      },
      "support": "phone+email:4h"
    }
  ]
}
```

### Select Plan & Start Payment

```javascript
// POST /api/churches/:churchId/billing/select-plan
// Auth: Required (must be church admin)

{
  "planId": 2
}

Response (200 OK):
{
  "success": true,
  "plan": {
    "id": 2,
    "name": "growth",
    "displayName": "Growth",
    "monthlyPrice": 25.00
  },
  "checkout": {
    "sessionId": "cs_test_xxxxx",
    "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_xxxxx",
    "expiresAt": "2026-05-21T10:30:00Z"
  }
}
```

### Get Current Subscription

```javascript
// GET /api/churches/:churchId/billing/current-subscription
// Auth: Required

Response (200 OK):
{
  "church": {
    "id": 5,
    "name": "First Baptist Church",
    "subscriptionStatus": "active"
  },
  "currentPlan": {
    "id": 2,
    "name": "growth",
    "displayName": "Growth",
    "monthlyPrice": 25.00
  },
  "subscription": {
    "startedAt": "2026-05-20T10:30:00Z",
    "nextBillingDate": "2026-06-20T10:30:00Z",
    "daysSinceStart": 0,
    "daysUntilNextBill": 31
  },
  "usage": {
    "members": 45,
    "memberLimit": 200,
    "percentageUsed": 22.5,
    "warningLevel": 80
  }
}
```

### Upgrade Plan

```javascript
// POST /api/churches/:churchId/billing/upgrade-plan
// Auth: Required (church admin)

{
  "planId": 3  // Upgrade to Professional
}

Response (200 OK):
{
  "success": true,
  "oldPlan": "growth",
  "newPlan": "professional",
  "oldPrice": 25.00,
  "newPrice": 60.00,
  "daysUsed": 15,
  "proratedAmount": -12.50,  // Refund
  "amountDue": 47.50,
  "nextBillingDate": "2026-06-20T10:30:00Z"
}
```

### Billing History

```javascript
// GET /api/churches/:churchId/billing/history
// Auth: Required (church admin)

Response (200 OK):
{
  "history": [
    {
      "id": 1,
      "action": "trial_started",
      "amount": 0.00,
      "status": "completed",
      "createdAt": "2026-05-20T10:00:00Z"
    },
    {
      "id": 2,
      "action": "payment_succeeded",
      "amount": 25.00,
      "status": "completed",
      "invoiceNumber": "INV-001",
      "receiptUrl": "https://stripe.com/receipts/xxx",
      "createdAt": "2026-05-20T15:00:00Z"
    }
  ],
  "totalPaid": 25.00,
  "upcomingInvoice": {
    "dueDate": "2026-06-20",
    "amount": 25.00
  }
}
```

---

## Backend Implementation

### Trial Expiry Cron Job

```javascript
// backend/jobs/trialExpiryJob.js

const db = require('../models');
const { sendEmail } = require('../services/emailService');
const { Op } = require('sequelize');

exports.checkTrialExpiryAndNotify = async () => {
  try {
    console.log('[TRIAL JOB] Starting trial expiry check...');
    
    const now = new Date();
    
    // Get all churches with active trials
    const trialsAboutToExpire = await db.Church.findAll({
      where: {
        subscription_status: 'trial',
        trial_ends_at: { [Op.lte]: now }
      }
    });
    
    for (const church of trialsAboutToExpire) {
      // Expire the trial
      await db.Church.update({
        subscription_status: 'trial_expired',
        trial_grace_period_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }, {
        where: { id: church.id }
      });
      
      // Send expiry email
      const admin = await db.User.findOne({
        where: { churchId: church.id, role: 'admin' }
      });
      
      if (admin) {
        await sendEmail({
          to: admin.email,
          template: 'trial_expired',
          data: {
            churchName: church.name,
            gracePeriodendsAt: church.trial_grace_period_ends_at,
            selectPlanUrl: `http://${church.subdomain}.localhost:3000/billing/select-plan`
          }
        });
      }
      
      console.log(`[TRIAL JOB] Expired trial for church: ${church.name}`);
    }
    
  } catch (err) {
    console.error('[TRIAL JOB] Error:', err);
  }
};

exports.sendTrialReminders = async () => {
  try {
    console.log('[REMINDER JOB] Sending trial reminders...');
    
    const now = new Date();
    
    // Get churches by days until expiry
    const reminderDays = [
      { days: 1, type: 'day_1' },
      { days: 7, type: 'day_7' },
      { days: 14, type: 'day_14' },
      { days: 21, type: 'day_21' },
      { days: 25, type: 'day_25' },
      { days: 28, type: 'day_28' },
      { days: 29, type: 'day_29' }
    ];
    
    for (const reminder of reminderDays) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + reminder.days);
      targetDate.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Find churches expiring on this day
      const churches = await db.Church.findAll({
        where: {
          subscription_status: 'trial',
          trial_ends_at: { [Op.between]: [targetDate, endOfDay] }
        }
      });
      
      for (const church of churches) {
        // Check if reminder already sent
        const alreadySent = await db.TrialNotification.findOne({
          where: { church_id: church.id, notification_type: reminder.type }
        });
        
        if (alreadySent) continue;
        
        const admin = await db.User.findOne({
          where: { churchId: church.id, role: 'admin' }
        });
        
        if (admin) {
          const daysLeft = reminder.days;
          
          await sendEmail({
            to: admin.email,
            template: `trial_reminder_day_${reminder.days}`,
            data: {
              churchName: church.name,
              daysLeft,
              selectPlanUrl: `http://${church.subdomain}.localhost:3000/billing/select-plan`
            }
          });
          
          // Log that reminder was sent
          await db.TrialNotification.create({
            church_id: church.id,
            notification_type: reminder.type,
            sent_at: now,
            status: 'sent'
          });
          
          console.log(`[REMINDER JOB] Sent ${reminder.type} reminder to ${church.name}`);
        }
      }
    }
    
  } catch (err) {
    console.error('[REMINDER JOB] Error:', err);
  }
};
```

### Cron Job Configuration

```javascript
// backend/scheduler.js

const cron = require('node-cron');
const { 
  checkTrialExpiryAndNotify, 
  sendTrialReminders 
} = require('./jobs/trialExpiryJob');

// Initialize scheduler
exports.initializeScheduler = () => {
  // Check trial expiry every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[SCHEDULER] Running trial expiry check...');
    await checkTrialExpiryAndNotify();
  });
  
  // Send trial reminders every day at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[SCHEDULER] Sending trial reminders...');
    await sendTrialReminders();
  });
  
  console.log('[SCHEDULER] Scheduler initialized');
};

// In server.js:
const { initializeScheduler } = require('./scheduler');

// After database connection
initializeScheduler();
```

### Feature Limit Service

```javascript
// backend/services/planLimitService.js

const db = require('../models');

class PlanLimitService {
  async checkMemberLimit(churchId) {
    const church = await db.Church.findByPk(churchId);
    const plan = await db.Plan.findByPk(church.plan_id);
    
    const memberCount = await db.User.count({
      where: { churchId, role: 'member' }
    });
    
    return {
      limit: plan.limits.maxMembers,
      current: memberCount,
      available: plan.limits.maxMembers - memberCount,
      percentageUsed: (memberCount / plan.limits.maxMembers) * 100,
      isAtLimit: memberCount >= plan.limits.maxMembers,
      warningLevel: 80  // Warn at 80% usage
    };
  }
  
  async checkEventLimit(churchId) {
    const church = await db.Church.findByPk(churchId);
    const plan = await db.Plan.findByPk(church.plan_id);
    
    if (plan.limits.maxEvents === null) {
      return { limit: null, current: 0, isAtLimit: false };
    }
    
    // Count events this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const eventCount = await db.Event.count({
      where: {
        churchId,
        createdAt: { [Op.gte]: monthStart }
      }
    });
    
    return {
      limit: plan.limits.maxEvents,
      current: eventCount,
      available: plan.limits.maxEvents - eventCount,
      percentageUsed: (eventCount / plan.limits.maxEvents) * 100,
      isAtLimit: eventCount >= plan.limits.maxEvents,
      resetDate: new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1)
    };
  }
  
  async enforceLimit(churchId, limitType) {
    if (limitType === 'members') {
      return this.checkMemberLimit(churchId);
    } else if (limitType === 'events') {
      return this.checkEventLimit(churchId);
    }
    return null;
  }
}

module.exports = new PlanLimitService();
```

---

## Frontend Components

### Trial Banner Component

```jsx
// frontend/src/components/TrialBanner.jsx

import { useState, useEffect } from 'react';
import api from '../api/axios';

const TrialBanner = ({ churchId }) => {
  const [trialInfo, setTrialInfo] = useState(null);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    const fetchTrialInfo = async () => {
      try {
        const res = await api.get(`/api/churches/${churchId}/billing/current-subscription`);
        setTrialInfo(res.data);
        
        if (res.data.trialEndsAt) {
          const endDate = new Date(res.data.trialEndsAt);
          const now = new Date();
          const days = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
          setDaysLeft(days);
        }
      } catch (err) {
        console.error('Failed to fetch trial info', err);
      }
    };
    
    fetchTrialInfo();
  }, [churchId]);

  if (!trialInfo || trialInfo.subscriptionStatus !== 'trial') return null;

  const bannerStyle = {
    'trial_expired': '#EF4444',      // Red
    'trial': '#3B82F6',               // Blue
    'active': '#10B981'               // Green
  };

  const bgColor = bannerStyle[trialInfo.subscriptionStatus] || '#3B82F6';

  return (
    <div className="trial-banner" style={{ backgroundColor: bgColor }}>
      <div className="banner-content">
        <div className="banner-message">
          {daysLeft > 0 ? (
            <>
              <strong>Free Trial - {daysLeft} days remaining</strong>
              <p>Select a plan by {trialInfo.trialEndsAt?.toLocaleDateString()} to continue</p>
            </>
          ) : (
            <>
              <strong>Trial Expired</strong>
              <p>Select a plan now to regain full access</p>
            </>
          )}
        </div>
        
        <a 
          href={`/billing/select-plan`}
          className="banner-button"
        >
          {daysLeft > 0 ? 'View Plans' : 'Select Plan Now'}
        </a>
      </div>
    </div>
  );
};

export default TrialBanner;
```

### Select Plan Page

```jsx
// frontend/src/pages/Tenant/SelectPlan.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const SelectPlan = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const plansRes = await api.get('/api/churches/current/available-plans');
        setPlans(plansRes.data.plans);

        const subRes = await api.get('/api/churches/current/billing/current-subscription');
        setSubscription(subRes.data);
      } catch (err) {
        console.error('Failed to load plans', err);
      }
    };
    fetchData();
  }, []);

  const handleSelectPlan = async (planId) => {
    setLoading(true);
    try {
      const res = await api.post('/api/churches/current/billing/select-plan', {
        planId
      });

      // Redirect to Stripe checkout
      if (res.data.checkout?.checkoutUrl) {
        window.location.href = res.data.checkout.checkoutUrl;
      }
    } catch (err) {
      console.error('Selection failed', err);
      alert('Failed to select plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const daysLeft = subscription?.daysRemaining || 0;

  return (
    <div className="select-plan-page">
      <div className="page-header">
        <h1>Choose Your Plan</h1>
        {daysLeft > 0 && (
          <p className="trial-countdown">
            Your trial ends in <strong>{daysLeft} days</strong>
          </p>
        )}
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className="plan-card">
            <div className="plan-header">
              <h2>{plan.displayName}</h2>
              <div className="price">
                <span className="amount">${plan.monthlyPrice}</span>
                <span className="period">/month</span>
              </div>
            </div>

            <p className="plan-description">{plan.description}</p>

            <div className="plan-features">
              <h3>Features:</h3>
              <ul>
                {plan.limits?.maxMembers && (
                  <li>✓ Up to {plan.limits.maxMembers} members</li>
                )}
                {plan.limits?.maxEvents === null && (
                  <li>✓ Unlimited events</li>
                )}
                <li>✓ All core features</li>
                <li>✓ {plan.support}</li>
                <li>✓ Cancel anytime</li>
              </ul>
            </div>

            <button
              className="select-btn"
              onClick={() => handleSelectPlan(plan.id)}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>

      <div className="billing-faq">
        <h3>Questions?</h3>
        <p><a href="/contact-support">Contact our support team</a> - We're happy to help!</p>
      </div>
    </div>
  );
};

export default SelectPlan;
```

### Usage Warning Component

```jsx
// frontend/src/components/UsageWarning.jsx

import { useEffect, useState } from 'react';
import api from '../api/axios';

const UsageWarning = ({ churchId, feature }) => {
  const [usage, setUsage] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const checkUsage = async () => {
      try {
        const res = await api.get(
          `/api/churches/${churchId}/billing/usage/${feature}`
        );
        setUsage(res.data);
        
        // Show warning if at 80% or more
        if (res.data.percentageUsed >= 80) {
          setShow(true);
        }
      } catch (err) {
        console.error('Failed to check usage', err);
      }
    };

    checkUsage();
  }, [churchId, feature]);

  if (!show || !usage) return null;

  return (
    <div className="usage-warning">
      <div className="warning-icon">⚠️</div>
      <div className="warning-content">
        <h4>Usage Limit Warning</h4>
        <p>
          You're using {usage.current} of {usage.limit} {feature}
          ({usage.percentageUsed.toFixed(0)}%)
        </p>
        <p className="suggestion">
          Consider <a href="/billing/upgrade">upgrading your plan</a> for more capacity.
        </p>
      </div>
      <button className="close-btn" onClick={() => setShow(false)}>×</button>
    </div>
  );
};

export default UsageWarning;
```

---

## Cron Jobs & Automation

### Schedule Setup

```javascript
// In your main server initialization:

const cron = require('node-cron');

// Add to server.js after db connection

// Run trial expiry check daily at 2 AM UTC
cron.schedule('0 2 * * *', async () => {
  const { checkTrialExpiryAndNotify } = require('./jobs/trialExpiryJob');
  await checkTrialExpiryAndNotify();
});

// Send trial reminders daily at 9 AM UTC
cron.schedule('0 9 * * *', async () => {
  const { sendTrialReminders } = require('./jobs/trialExpiryJob');
  await sendTrialReminders();
});

// Process failed payments retry (Stripe handles mostly, but we monitor)
cron.schedule('0 12 * * *', async () => {
  const { checkFailedPayments } = require('./jobs/paymentRecoveryJob');
  await checkFailedPayments();
});

console.log('✅ Cron jobs initialized');
```

---

## Testing Checklist

### Unit Tests

```javascript
// test/services/planLimitService.test.js

describe('PlanLimitService', () => {
  it('should check member limit correctly', async () => {
    const limit = await planLimitService.checkMemberLimit(churchId);
    expect(limit).toHaveProperty('limit');
    expect(limit).toHaveProperty('current');
    expect(limit).toHaveProperty('isAtLimit');
  });

  it('should prevent adding members at limit', async () => {
    // Set up church at member limit
    // Try to add member
    // Expect error
  });

  it('should allow upgrade bypassing limit', async () => {
    // Church at Foundation limit (50)
    // Upgrade to Growth (200)
    // Add more members
    // Should succeed
  });
});
```

### Integration Tests

```javascript
// test/integration/billing.test.js

describe('Billing Flow', () => {
  it('should complete trial → payment → active flow', async () => {
    // 1. Register church (auto-trial)
    // 2. Verify trial plan assigned
    // 3. Simulate payment
    // 4. Verify plan changed to paid
    // 5. Verify full access granted
  });

  it('should expire trial after 30 days', async () => {
    // Register church
    // Fast-forward time 31 days
    // Run cron job
    // Verify status changed to trial_expired
    // Verify read-only access
  });

  it('should handle payment failure & retry', async () => {
    // Initial payment succeeds
    // Simulate failed payment next month
    // Verify retry scheduled
    // Simulate successful retry
  });
});
```

### Manual Testing Scenarios

```
✅ SCENARIO 1: Registration → Trial
  1. Visit registration page
  2. Fill form & submit
  3. Verify:
     ├─ Church created
     ├─ Plan ID = trial (0)
     ├─ Subscription status = trial
     ├─ Trial ends in 30 days
     └─ Redirected to login

✅ SCENARIO 2: Trial Reminders
  1. Register church
  2. Simulate day 25 with cron
  3. Check inbox for reminder email
  4. Verify days-left calculation

✅ SCENARIO 3: Select & Pay Plan
  1. Login to trial church
  2. Click "Select Plan"
  3. Choose Growth plan
  4. Enter test card (Stripe test mode)
  5. Verify:
     ├─ Payment succeeds
     ├─ Plan changed to Growth
     ├─ Status = active
     └─ Member limit = 200

✅ SCENARIO 4: Member Limit Enforcement
  1. On Foundation plan (50 limit)
  2. Add 50 members
  3. Try to add 51st member
  4. Verify error & upgrade suggestion
  5. Upgrade to Growth
  6. Add 51st member
  7. Verify succeeds

✅ SCENARIO 5: Trial Expiry & Read-Only
  1. Register church
  2. Simulate 31 days pass
  3. Run expiry cron
  4. Try to add new member
  5. Verify error: "Trial expired"
  6. Try to view existing data
  7. Verify: can view but not edit
  8. Select plan & pay
  9. Verify full access restored
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] **Database migrations created**
  ```bash
  npm run create:migration -- --name add-billing-schema
  npm run migrate:up
  ```

- [ ] **Environment variables set**
  ```
  STRIPE_SECRET_KEY=sk_live_xxxxx
  STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
  STRIPE_WEBHOOK_SECRET=whsec_xxxxx
  TRIAL_DAYS=30
  ```

- [ ] **Stripe products created**
  - Create 3 products in Stripe dashboard
  - Create price for each product
  - Copy price IDs to database

- [ ] **Email templates created**
  - trial_started.html
  - trial_reminder_day_7.html
  - trial_reminder_day_25.html
  - trial_expired.html
  - payment_confirmation.html
  - payment_failed.html

- [ ] **Tests passing**
  ```bash
  npm test -- --testPathPattern=billing
  ```

- [ ] **Code review completed**

### Deployment

```bash
# 1. Deploy code
git push production main

# 2. Run migrations
npm run migrate:up

# 3. Seed plans (if new environment)
npm run seed:plans

# 4. Start cron jobs
# (happens automatically with server start)

# 5. Verify Stripe webhook
curl -X POST https://yourdomain.com/webhook/stripe/webhook \
  -H "Stripe-Signature: t=123,v1=abc" \
  -d '{"type":"invoice.payment_succeeded"}'

# 6. Monitor logs
tail -f logs/billing.log
tail -f logs/stripe.log
```

### Post-Deployment

- [ ] **Test trial registration** (create test church)
- [ ] **Test Stripe webhook** (simulate payment)
- [ ] **Monitor error logs** (24 hours)
- [ ] **Check trial emails** (send test reminder)
- [ ] **Verify member limits** (test enforcement)
- [ ] **Test upgrade/downgrade** (manual test)

---

## Troubleshooting

### Common Issues

**Issue**: Trial not expiring on Day 30
```
Solution: Check cron job logs
  1. Verify cron job is running: ps aux | grep node
  2. Check trial_ends_at dates in database
  3. Run job manually: node -e "require('./jobs/trialExpiryJob').checkTrialExpiryAndNotify()"
  4. Check email service logs
```

**Issue**: Stripe webhook not received
```
Solution: Verify webhook configuration
  1. Login to Stripe dashboard
  2. Check webhook logs for errors
  3. Verify webhook URL is correct
  4. Check STRIPE_WEBHOOK_SECRET matches
  5. Test webhook manually
```

**Issue**: Member limit not enforced
```
Solution: Verify limit check in route
  1. Check route has planLimitService call
  2. Verify database has correct limits in plans table
  3. Check church.plan_id is set correctly
  4. Add debug logging to endpoint
```

**Issue**: Trial reminders not sending
```
Solution: Check email service
  1. Verify SMTP credentials in .env
  2. Check TrialNotification records in database
  3. Monitor email service logs
  4. Test email manually: await sendEmail({...})
```

---

## Support & Escalation

### Customer Support Contacts

```
Email: support@elyonsys360.com
Phone: (509) XXX-XXXX (Priority support)
Chat: In-app chat (weekdays 9-5 EST)

FAQ: https://help.elyonsys360.com/billing
```

---

**Document Version**: 1.0  
**Last Updated**: May 20, 2026  
**Next Review**: June 20, 2026  
**Maintainer**: @Mike-NerlyEUSTACHE

---

## Quick Links

- [COMPLETE_ARCHITECTURE_AND_IMPLEMENTATION_GUIDE.md](COMPLETE_ARCHITECTURE_AND_IMPLEMENTATION_GUIDE.md) - 3-tier architecture overview
- [SECURITY_IMPROVEMENT_PLAN.md](SECURITY_IMPROVEMENT_PLAN.md) - Authentication security details
- Stripe Dashboard: https://dashboard.stripe.com
- Monitoring: [Check server logs](logs/)
