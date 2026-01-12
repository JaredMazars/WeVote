# Resolution Voting System

## Overview
Comprehensive AGM resolution voting system for corporate governance, financial approvals, and policy decisions with role-based access control.

## Security & Privacy

### User Roles
- **Regular Users**: Can vote on resolutions and view details, but cannot see voting results until voting closes
- **Administrators**: Can view real-time voting statistics, results, and all vote data

### Vote Privacy
- Vote statistics are hidden from regular users during active voting periods
- Results become visible to all users only after the voting period ends
- Admins can monitor voting progress in real-time
- Individual votes remain anonymous

## Features Implemented

### 1. **Resolution Management**
- 7 sample AGM resolutions based on standard corporate governance
- Resolution categories: Financial, Governance, Remuneration
- Voting requirements: Ordinary (50%) and Special (75%)
- Status tracking: Active, Closed, Upcoming

### 2. **Sample Resolutions Included**

#### Resolution 2025/01 - Financial Statements
- **Category**: Financial
- **Type**: Ordinary resolution
- **Description**: Approval of audited financial statements for year ended December 31, 2024
- **Proposed by**: Board of Directors

#### Resolution 2025/02 - Dividend Declaration
- **Category**: Financial
- **Type**: Ordinary resolution
- **Description**: Final dividend of R0.25 per share
- **Financial Impact**: R18.5 million total payment
- **Effective Date**: May 31, 2025

#### Resolution 2025/03 - Auditor Appointment
- **Category**: Governance
- **Type**: Ordinary resolution
- **Description**: Appointment of Grant & Co. Chartered Accountants
- **Financial Impact**: Estimated audit fees R2.8 million

#### Resolution 2025/04 - Directors' Remuneration
- **Category**: Remuneration
- **Type**: Ordinary resolution
- **Description**: Approval of directors' remuneration for 2025
- **Financial Impact**: Total R8.5 million

#### Resolution 2025/05 - Related Party Transactions
- **Category**: Governance
- **Type**: Ordinary resolution
- **Description**: Ratification of related party transactions
- **Financial Impact**: Total R12.3 million

#### Resolution 2025/06 - Dividend Policy Authorization
- **Category**: Financial
- **Type**: Ordinary resolution
- **Description**: Board authority for interim dividend policy

#### Resolution 2025/07 - Revised Articles of Association
- **Category**: Governance
- **Type**: Special resolution (requires 75%)
- **Description**: Adoption of revised Articles aligned with new Companies Act
- **Effective Date**: July 1, 2025

### 3. **Voting Features**

#### Three-Option Voting
- **For**: Support the resolution
- **Against**: Oppose the resolution
- **Abstain**: Neither support nor oppose

#### Vote Tracking
- Real-time vote statistics with progress bars
- Percentage breakdowns for each option
- Total vote count display
- Passing/Failing status indicator

#### Proxy Support
- Vote as yourself
- Vote on behalf of proxy group
- View proxy group members
- Member count badge
- Proxy group details modal

### 4. **UI/UX Features**

#### Resolution Cards
- Color-coded by status (green=active, gray=closed, blue=upcoming)
- Gradient headers with company brand colors
- Resolution number badges
- Voting requirement badges (Ordinary/Special)
- Financial impact highlights

#### Real-time Results Display (Admin Only)
- **Admin View**: Full statistics with progress bars
- Green progress bar for "For" votes
- Red progress bar for "Against" votes
- Gray progress bar for "Abstain" votes
- Passing threshold indicator
- Visual feedback for current passing status
- Total vote count display

#### Regular User View
- Vote options without visible results
- Resolution details and descriptions
- Information message explaining results will be available after voting closes
- Vote confirmation with selected choice indicator
- No access to voting statistics during active period

#### Interactive Elements
- Hover effects on voting buttons
- Selected vote confirmation with checkmark
- Smooth animations with Framer Motion
- Responsive design for all screen sizes

#### Resolution Details Modal
- Full resolution text
- Proposed by information
- Detailed description
- Financial impact warnings (yellow alert box)
- Effective dates
- Voting period dates

### 5. **Status & Filtering**

#### Filter Options
- **All**: Show all resolutions
- **Active**: Currently open for voting
- **Closed**: Voting period ended
- **Upcoming**: Not yet open for voting

#### Status Indicators
- Active: Green badge with clock icon
- Closed: Gray badge
- Upcoming: Blue badge

### 6. **Scalability for 100+ Members**

The system is designed to handle large proxy groups:
- Scrollable member lists with custom scrollbar
- Max height containers to prevent page overflow
- Member count badges for quick reference
- Individual member cards with avatars
- "Scroll to view all" hints for large lists
- Efficient rendering with React keys

### 7. **Mock Data Structure**

Each resolution includes:
```typescript
{
  id: string
  resolution_number: string  // e.g., "2025/01"
  title: string
  description: string
  proposed_by: string
  voting_requirement: 'ordinary' | 'special'
  category: string
  details?: string
  financial_impact?: string
  effective_date?: string
  status: 'active' | 'closed' | 'upcoming'
  vote_start_date: string
  vote_end_date: string
  created_at: string
}
```

Vote statistics:
```typescript
{
  total_votes: number
  for_votes: number
  against_votes: number
  abstain_votes: number
  for_percentage: number
  against_percentage: number
  abstain_percentage: number
  required_majority: number  // 50 or 75
  is_passing: boolean
}
```

## Navigation

### Routes Added
- `/voting/resolutions` - Main resolution voting page

### Access Points
1. **Home Page** → "Start Voting" button → Voting Selection
2. **Voting Selection** → "Resolution Voting" card
3. Direct URL: `http://localhost:5174/voting/resolutions`

## API Integration (Ready for Backend)

### Expected Endpoints

```typescript
// Get all resolutions
GET /api/resolutions
Response: { data: Resolution[] }

// Get vote statistics for a resolution (Admin only)
GET /api/resolutions/:id/stats
Headers: { Authorization: 'Bearer <admin_token>' }
Response: { data: VoteStats }

// Cast a vote
POST /api/resolutions/:id/vote
Body: { choice: 'for' | 'against' | 'abstain', voting_as: 'self' | 'proxy' }
Response: { success: boolean, message: string }

// Get user's votes
GET /api/resolutions/my-votes
Response: { data: { resolution_id: string, choice: VoteChoice }[] }

// Get proxy groups
GET /api/proxy/groups/active
Response: { data: ProxyGroup[] }

// Check user role
GET /api/auth/me
Response: { user: { id: string, role_name: string, ... } }
```

### Role-Based Access
The frontend checks `localStorage.getItem('user')` for role information:
- If `user.role_name === 'Admin'`, show vote statistics
- Otherwise, hide results during active voting periods

## Customization Guide

### Adding New Resolutions
Edit the mock data in `ResolutionVoting.tsx` or connect to your backend API:

```typescript
const newResolution = {
  id: 'res-008',
  resolution_number: '2025/08',
  title: 'Your Resolution Title',
  description: 'Brief description',
  proposed_by: 'Board/Committee Name',
  voting_requirement: 'ordinary', // or 'special'
  category: 'Financial', // or 'Governance', 'Remuneration'
  details: 'Detailed explanation...',
  financial_impact: 'R X million', // optional
  effective_date: '2025-XX-XX', // optional
  status: 'active',
  vote_start_date: '2025-01-01',
  vote_end_date: '2025-06-30',
  created_at: new Date().toISOString()
};
```

### Changing Vote Thresholds
Special resolutions require 75%, ordinary require 50%. Modify `required_majority` in vote stats.

### Styling Customization
- Primary gradient: `from-[#0072CE] to-[#171C8F]`
- For votes: Green (`from-green-500 to-emerald-500`)
- Against votes: Red (`from-red-500 to-blue-500`)
- Abstain votes: Gray (`from-gray-400 to-gray-500`)

## Testing

### Current Mock Data
- 7 resolutions spanning all categories
- Realistic vote distributions
- Mix of passing and failing resolutions
- One special resolution (75% threshold)
- Financial impact amounts
- Effective dates
- 1 proxy group with 15 members

### Test Scenarios
1. ✅ Vote on active resolution
2. ✅ View resolution details
3. ✅ Switch between voting options
4. ✅ Filter by status
5. ✅ View proxy group members
6. ✅ Check passing/failing status
7. ✅ Responsive design on mobile
8. ✅ Scroll through large proxy groups

## Production Checklist

- [ ] Connect to backend API
- [ ] Implement authentication checks
- [ ] Add vote confirmation dialog
- [ ] Implement vote change restrictions
- [ ] Add voting period validation
- [ ] Set up real-time vote updates (WebSocket)
- [ ] Add audit logging
- [ ] Implement admin resolution management
- [ ] Add email notifications for new resolutions
- [ ] Generate PDF reports for resolution results
- [ ] Add export functionality for vote data
- [ ] Implement voting deadline reminders

## Accessibility

- ✅ Keyboard navigation support
- ✅ ARIA labels on interactive elements
- ✅ Color contrast compliance
- ✅ Screen reader friendly
- ✅ Focus indicators
- ✅ Semantic HTML

## Performance

- ✅ Lazy loading for large lists
- ✅ Optimized re-renders with React keys
- ✅ Efficient state management
- ✅ Custom scrollbar for better UX
- ✅ Framer Motion animations optimized

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

1. **Rich Text Editor** for resolution descriptions
2. **Document Attachments** (PDFs, financials)
3. **Voting History** timeline
4. **Email Digest** of new resolutions
5. **WhatsApp Integration** for vote reminders
6. **Multi-language Support**
7. **Vote Delegation** to specific individuals
8. **Conditional Resolutions** (dependent on other outcomes)
9. **Vote Amendment** proposals
10. **Real-time Chat** for resolution discussions

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready (Mock Data)
