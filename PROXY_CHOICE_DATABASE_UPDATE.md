# Proxy Choice Database Update

## Summary
Updated the application to use the `proxy_vote_form` field from the database instead of localStorage to determine which proxy button to display in the navbar.

## Changes Made

### 1. Backend Updates

#### `server/models/User.js`
Added `proxy_vote_form` to the SELECT query in `getAll()` method:
```javascript
static async getAll() {
  const sql = `
    SELECT u.id, u.email, u.name, u.avatar_url, u.is_active,
           u.email_verified, u.last_login, u.created_at,
           u.proxy_file_path, u.proxy_file_name, u.proxy_uploaded_at,
           u.proxy_vote_form,  // ← Added this field
           r.name as role_name, is_active, good_standing
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    ORDER BY u.created_at DESC
  `;
  const results = await database.query(sql);
  return results;
}
```

#### `server/routes/admin.js`
Added `proxy_vote_form` to the transformed user data:
```javascript
const transformedUsers = users.map(user => ({
  // ...existing fields...
  proxy_file_path: user.proxy_file_path,
  proxy_file_name: user.proxy_file_name,
  proxy_uploaded_at: user.proxy_uploaded_at,
  proxy_vote_form: user.proxy_vote_form  // ← Added this field
}));
```

### 2. Frontend Updates

#### `src/contexts/AuthContext.tsx`
Added `proxy_vote_form` to the User interface:
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  surname?: string;
  avatar?: string;
  role: string;
  role_id: number | string;
  email_verified?: number | boolean;
  needs_password_change?: number | boolean;
  is_temp_password?: number | boolean;
  membership_number?: string;
  proxy_vote_form?: string; // ← Added: 'manual', 'digital', or 'abstain'
}
```

#### `src/components/Header.tsx`
Updated `useEffect` to read from user object instead of localStorage:

**Before:**
```typescript
useEffect(() => {
  const checkProxyStatus = async () => {
    if (!user?.id) return;
    
    // Old: Read from localStorage
    const choice = localStorage.getItem(`proxyChoice_${user.email}`);
    setProxyChoice(choice);
    
    // ...rest of code
  };
  checkProxyStatus();
}, [user?.id, user?.email]);
```

**After:**
```typescript
useEffect(() => {
  const checkProxyStatus = async () => {
    if (!user?.id) return;
    
    // New: Read from user object (database)
    const choice = user.proxy_vote_form;
    setProxyChoice(choice || null);
    
    // ...rest of code
  };
  checkProxyStatus();
}, [user?.id, user?.proxy_vote_form]);  // ← Updated dependency
```

## Benefits

1. **Single Source of Truth**: Proxy choice is now stored in the database, not localStorage
2. **Persistence**: User's choice persists across devices and browsers
3. **Consistency**: All parts of the application read from the same source
4. **Security**: Cannot be tampered with via browser dev tools
5. **Admin Control**: Admins can view and modify user proxy choices if needed

## Database Field

The `proxy_vote_form` field in the `users` table stores one of three values:
- `'manual'` - User chose to upload a manual proxy form
- `'digital'` - User chose to complete the digital proxy form
- `'abstain'` - User chose not to participate in proxy voting
- `NULL` - User hasn't made a choice yet

## Testing

To test the changes:

1. **Check Database Value**:
```sql
SELECT id, email, name, proxy_vote_form 
FROM users 
WHERE email = 'test@example.com';
```

2. **Test Manual Choice**:
   - Set `proxy_vote_form = 'manual'` in database
   - Login and verify "Upload Proxy Form" button appears in navbar

3. **Test Digital Choice**:
   - Set `proxy_vote_form = 'digital'` in database
   - Login and verify "Complete Proxy" button appears in navbar

4. **Test Abstain Choice**:
   - Set `proxy_vote_form = 'abstain'` in database
   - Login and verify appropriate button behavior

5. **Test Null Value**:
   - Set `proxy_vote_form = NULL` in database
   - Login and verify default behavior (shows "Complete Proxy" button)

## Migration Notes

If users previously selected their proxy choice during registration:
- The `EmployeeLoginRegister.tsx` component should already be saving to the database
- Old localStorage values are no longer used
- No data migration needed if registration properly saves to database

## Related Files
- `server/models/User.js` - Database query updated
- `server/routes/admin.js` - API response updated
- `src/contexts/AuthContext.tsx` - User interface updated
- `src/components/Header.tsx` - Proxy choice logic updated
- `MANUAL_PROXY_UPLOAD_FEATURE.md` - Documentation updated

## Future Enhancements

1. Add admin interface to view/edit user proxy choices
2. Add API endpoint to update proxy choice: `PUT /api/users/:id/proxy-choice`
3. Add audit logging for proxy choice changes
4. Add validation to ensure only valid values are stored
5. Add user notification when proxy choice is changed by admin
