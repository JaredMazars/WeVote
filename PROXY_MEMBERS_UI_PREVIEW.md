# Proxy Members UI Preview

## What You'll See in the VotingStatusBar

When you open the VotingStatusBar and navigate to the "Proxy Delegations" tab, you'll now see:

### Main Delegation Card
```
┌────────────────────────────────────────────────────────────┐
│ 👤 John Smith (Principal)                     5/10 votes   │
│    john.smith@example.com                     remaining     │
│    📊 employee votes • 📅 Valid until 2/17/26  ▓▓▓▓▓░░░░░   │
│                                                             │
│ ─────────────────────────────────────────────────────────  │
│                                                             │
│ Proxy Members                                               │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 👤 Jane Doe                    [DISCRETIONARY]      │   │
│ │    jane.doe@example.com                             │   │
│ │    Member #: 12345                                  │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 👤 Mike Johnson                [INSTRUCTIONAL]      │   │
│ │    mike.johnson@example.com                         │   │
│ │    Member #: 67890                                  │   │
│ │                                                      │   │
│ │    Allowed Candidates:                               │   │
│ │    🏆 Sarah Williams • Manager • 🏢 IT Department   │   │
│ │    🏆 Tom Brown • Director • 🏢 Finance             │   │
│ │    🏆 Lisa Davis • Senior Lead • 🏢 Operations      │   │
│ └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

## Color Coding

### DISCRETIONARY Proxies
- **Badge Color:** 🟢 Green (`bg-green-100 text-green-800`)
- **Meaning:** This proxy member can vote for any eligible candidate
- **Display:** Shows member info only (no allowed candidates list)

### INSTRUCTIONAL Proxies
- **Badge Color:** 🟠 Orange (`bg-orange-100 text-orange-800`)
- **Meaning:** This proxy member can ONLY vote for specific pre-approved candidates
- **Display:** Shows member info + bordered list of allowed candidates
- **Candidate Border:** Orange left border (`border-orange-300`)

## Information Hierarchy

```
Proxy Delegation (Principal)
  │
  ├─ Principal Info
  │   ├─ Name
  │   ├─ Email
  │   ├─ Vote Type (employee/resolution/both)
  │   └─ Valid Until Date
  │
  ├─ Vote Progress
  │   ├─ Remaining/Total Votes
  │   └─ Progress Bar
  │
  └─ Proxy Members
      │
      ├─ Member 1 (DISCRETIONARY)
      │   ├─ Name
      │   ├─ Email
      │   └─ Member Number
      │
      └─ Member 2 (INSTRUCTIONAL)
          ├─ Name
          ├─ Email
          ├─ Member Number
          └─ Allowed Candidates
              ├─ Candidate 1 (Name, Position, Department)
              ├─ Candidate 2 (Name, Position, Department)
              └─ Candidate 3 (Name, Position, Department)
```

## Example Scenarios

### Scenario 1: Discretionary Proxy Only
```
Proxy Delegation: Sarah Johnson
├─ Vote Progress: 3/5 votes remaining
└─ Proxy Members:
    └─ Alice Brown [DISCRETIONARY]
        - Can vote for anyone
        - No restrictions shown
```

### Scenario 2: Instructional Proxy Only
```
Proxy Delegation: Robert Lee
├─ Vote Progress: 8/10 votes remaining
└─ Proxy Members:
    └─ David Chen [INSTRUCTIONAL]
        - Must vote for:
          • Mary Wilson (Manager, HR)
          • James Taylor (Director, Finance)
```

### Scenario 3: Mixed Proxy Types
```
Proxy Delegation: Emily White
├─ Vote Progress: 4/8 votes remaining
└─ Proxy Members:
    ├─ Alex Green [DISCRETIONARY]
    │   - Full voting discretion
    │
    └─ Chris Black [INSTRUCTIONAL]
        - Must vote for:
          • Linda Gray (VP, Operations)
          • Kevin Blue (Manager, IT)
          • Nancy Red (Director, Sales)
```

## User Experience Flow

1. **Open VotingStatusBar** (bottom-left floating bar)
2. **Click "View Details"** (eye icon or button)
3. **Navigate to "Proxy Delegations" tab**
4. **See all proxy delegations** where you are a proxy member
5. **Expand proxy delegation cards** to see:
   - Who delegated votes to you (principal)
   - Other proxy members in the same group
   - Their appointment types (discretionary vs instructional)
   - Allowed candidates (if instructional)

## Key Visual Indicators

| Element | Visual | Meaning |
|---------|--------|---------|
| Green Badge | `[DISCRETIONARY]` | Freedom to vote for anyone |
| Orange Badge | `[INSTRUCTIONAL]` | Must vote for specific candidates |
| Orange Border | `│ Allowed Candidates` | List of restricted candidates |
| 👤 Icon | User symbol | Proxy member identity |
| 🏆 Icon | Award symbol | Candidate/position |
| 🏢 Icon | Building symbol | Department |
| 📊 Icon | Chart symbol | Vote type |
| 📅 Icon | Calendar symbol | Validity date |

## Responsive Design

- Cards stack vertically for easy scrolling
- Hover states on interactive elements
- Smooth animations when expanding sections
- Mobile-friendly touch targets
- Clear visual hierarchy with spacing and borders
