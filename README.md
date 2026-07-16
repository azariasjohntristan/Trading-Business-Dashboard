# Trading Business Dashboard

## Project Specification Document

Version: 1.0  
Project Type: Personal Trading Analytics Platform  
Development Approach: Phased Implementation  

---

# 1. Project Overview

## Objective

Build a professional personal trading business dashboard that converts daily trading CSV exports into a centralized analytics system.

The application will allow the user to:

- Import daily trade CSV files
- Store all trading history permanently
- Analyze trading performance
- Monitor trading behavior
- Review account performance
- Track trading business KPIs

The goal is to treat trading like a business by using data-driven decisions instead of emotions.

---

# 2. Development Role

You are acting as a senior full-stack software engineer.

Your responsibilities:

- Design clean architecture
- Write maintainable production-quality code
- Follow best practices
- Build modular components
- Avoid unnecessary complexity
- Document important decisions

Before coding:

1. Read this entire README.
2. Understand the architecture.
3. Create an implementation plan.
4. Build only the current phase.
5. Test before moving to the next phase.

Do not build everything at once.

---

# 3. Development Strategy

The project must be built in phases.

## Phase 1
Foundation

## Phase 2
Authentication

## Phase 3
Trading Data System

## Phase 4
Dashboard

## Phase 5
Trade Management

## Phase 6
Analytics Engine

## Phase 7
Settings and Account Management

## Phase 8
Production Deployment

Complete and test each phase before continuing.

---

# 4. Technology Stack

## Frontend

Framework:
- React

Language:
- TypeScript

Build Tool:
- Vite

Styling:
- Tailwind CSS

Component Library:
- shadcn/ui

Charts:
- Recharts

Tables:
- TanStack Table


---

## Backend

Runtime:
- Node.js

Framework:
- Express.js

ORM:
- Prisma

API:
- REST API


---

## Database

Database:
- PostgreSQL

Hosting:
- Ubuntu Server

The database must support:

- Multiple trading accounts
- Permanent trade history
- Import history
- User authentication
- Trade metadata


---

## Deployment

Environment:

Ubuntu Server

Containerization:

Docker

Orchestration:

Docker Compose

Remote Access:

Tailscale

Development:

Windows PC

Production Testing:

Ubuntu Server

---

# 5. Application Architecture


Trading CSV File

    |

    v

React Dashboard

    |

    v

Express API

    |

    v

Prisma ORM

    |

    v

PostgreSQL Database

    |

    v

Analytics Engine

    |

    v

Dashboard Visualization


---

# 6. User Requirements

## User Type

Single user.

The application is private and personal.

Authentication required.

---

# 7. Authentication Requirements

Implement:

- Username/password login
- Password hashing
- Protected routes
- Login session
- Logout functionality

Do not implement:

- Multiple users
- 2FA
- Enterprise authentication

---

# 8. Trading Account System

The system must support multiple trading accounts.

Example:


Accounts

├── Personal Account
├── Prop Firm Account
└── Broker Account


Each trade must belong to an account.

---

# 9. CSV Import System

## Import Method

Manual upload only.

Workflow:


User selects account

    |

Upload CSV

    |

Validate CSV

    |

Detect duplicates

    |

Import new trades

    |

Update dashboard


---

# 10. CSV Format Requirements

The importer must accept ONLY this CSV format.

Required columns:


symbol
_priceFormat
_priceFormatType
_tickSize
buyFillId
sellFillId
qty
buyPrice
sellPrice
pnl
boughtTimestamp
soldTimestamp
duration


---

# 11. CSV Validation Rules

Before importing:

Check:

- Required columns exist
- Numeric fields are valid
- Timestamp format is readable
- PNL format is valid

Example PNL formats:


$16.50

$(86.00)


Convert to numeric USD values.

---

# 12. Duplicate Detection

The system must automatically prevent duplicate imports.

Use composite matching:


symbol

buyTimestamp

sellTimestamp

buyPrice

sellPrice

quantity


If a matching trade already exists:

Do not import again.

---

# 13. Import History

Every import must create a history record.

Store:


Import Date

Account

Filename

Trades Detected

New Trades Imported

Duplicates Skipped

Status

Error Messages


---

# 14. Trade Database Requirements

Each trade should store:

Original CSV fields:


symbol

quantity

buyPrice

sellPrice

pnl

boughtTimestamp

soldTimestamp

duration


Calculated fields:


direction

tradeDate

accountId


User-added field:


chartLink


---

# 15. Trade Direction Calculation

Automatically calculate:


IF sellPrice > buyPrice

Direction = LONG

IF sellPrice < buyPrice

Direction = SHORT


---

# 16. Timezone

Primary timezone:


America/New_York


All analytics must use New York time.

Used for:

- Trading day calculation
- Calendar
- Hour analysis
- Session analysis

---

# 17. Currency

Currency:

USD only.

Examples:


+$120.50

-$86.00


No currency conversion.

---

# 18. Dashboard Page

The dashboard is the daily command center.

Include:

## KPI Cards

- Today's P&L
- Weekly P&L
- Monthly P&L
- Total P&L
- Win Rate
- Profit Factor
- Total Trades


---

## P&L Calendar

Interactive calendar.

Requirements:

- Display daily P&L
- Green profitable days
- Red losing days
- Click date for details


Clicking a date shows:


Date

Daily P&L

Number of Trades

Win Rate

Trade List


---

## Recent Trades

Show latest trades.

---

# 19. Analytics Page

Purpose:

Analyze trading performance and behavior.

---

# Performance Analytics

Include:

- Equity curve
- Cumulative P&L
- Daily P&L
- Weekly P&L
- Monthly P&L
- Profit Factor
- Expectancy
- Maximum Drawdown
- Winning streak
- Losing streak

---

# Trading Behavior Analytics

Include:

## Time Analysis

- P&L by hour
- Best trading hours
- Worst trading hours
- Win rate by hour


## Day Analysis

- Best weekday
- Worst weekday
- P&L by weekday


## Duration Analysis

- Average holding time
- Winning trade duration
- Losing trade duration


## Direction Analysis

- Long performance
- Short performance
- Long win rate
- Short win rate


## Execution Analysis

- Average quantity
- Trade frequency
- Overtrading patterns

---

# 20. Trade Page

Purpose:

Detailed trade history.

Features:

- Search
- Sort
- Filter
- View details


Trade details:


Symbol

Direction

Quantity

Entry Price

Exit Price

P&L

Duration

Entry Time

Exit Time

Chart Link


Only editable field:


chartLink


---

# 21. Import Page

Features:

- Account selection
- CSV upload
- Validation result
- Import summary
- Import history

---

# 22. Accounts Page

Features:

- Create account
- Edit account
- Delete account
- Compare accounts

Show:

- P&L
- Win rate
- Trades
- Drawdown

---

# 23. Settings Page

Include:

## Account Management

## User Settings

## Theme Settings

## Timezone Settings

## System Status

Display:

- Backend status
- Database status
- Last import


---

# 24. Date Filtering

Support:

Preset:


Today

This Week

This Month

This Year


Custom:


Start Date

End Date


Apply filters globally.

---

# 25. Responsive Design

Support:

- Desktop
- Tablet
- Mobile

Design style:

Modern SaaS.

Reference style:

- Linear
- Vercel

---

# 26. UI Layout

Sidebar:


Dashboard

Analytics

Trades

Import

Accounts

Settings


Top navigation:


Account Selector

Date Filter

User Profile


---

# 27. Backup

Version 1:

Manual backup only.

Provide:

- PostgreSQL backup script
- Restore documentation

---

# 28. AI Features

NOT included in Version 1.

Do not build:

- AI coaching
- AI analysis
- AI recommendations

Keep architecture clean for future expansion.

---

# 29. Data Retention

Keep all trades permanently.

No automatic deletion.

---

# 30. Coding Rules

Follow:

- Clean architecture
- Modular components
- Environment variables
- Secure database practices
- Clear documentation

Avoid:

- Hardcoded secrets
- Unnecessary dependencies
- Overengineering

---

# 31. Final Instruction

Start with Phase 1 only.

Before writing code:

1. Explain the implementation plan.
2. Show proposed folder structure.
3. Confirm database schema design.
4. Wait for approval before continuing.

Do not skip phases.

Build this application as a long-term trading business operating system.