# Proxy Vote Form Login Bug Fix

## Issue
User with `proxy_vote_form = 'manual'` in database was seeing "Complete Proxy" button instead of "Upload Proxy Form" button after login.

## Root Cause
The `proxy_vote_form` field was not being included in the login response, so the Header component couldn't determine which button to display.

## Files Changed

### 1. `server/models/User.js`

#### `findByEmail()` method
Added `proxy_vote_form` to SELECT query:
```javascript
static async findByEmail(email) {
  const sql = `
    SELECT u.id, u.email, u.password_hash, u.name, u.surname, u.avatar_url, 
           u.role_id, u.is_active, u.email_verified, u.last_login,
           u.created_at, u.updated_at, u.microsoft_id, u.provider,
           u.phone_number, u.created_by, u.updated_by, u.member_number,
           u.is_temp_password, u.needs_password_change, u.proxy_vote_form, // ← Added
           r.name as role_name, r.description as role_description, r.permissions
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.email = '${email}' AND u.is_active = 1
  `;
  // ...
}
```

#### `findById()` method
Added `proxy_vote_form` to SELECT query:
```javascript
static async findById(id) {
  const sql = `
    SELECT u.id, u.email, u.name, u.surname, u.id_number, u.avatar_url, u.is_active,
           u.email_verified, u.last_login, u.created_at, u.member_number, u.role_id,
           u.proxy_vote_form, // ← Added
           r.name as role_name, r.description as role_description
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.id = ${id} AND u.is_active = 1
  `;
  // ...
}
```

### 2. `server/routes/auth.js`

#### Login endpoint
Added `proxy_vote_form` to userData response:
```javascript
const userData = {
  id: user.id,
  email: user.email,
  name: user.name,
  surname: user.surname,
  membership_number: user.member_number,
  member_number: user.member_number,
  id_number: user.id_number,
  avatar: user.avatar_url,
  role: user.role_name?.toLowerCase() || 'voter',
  role_id: user.role_id,
  email_verified: user.email_verified,
  is_temp_password: user.is_temp_password,
  needs_password_change: user.needs_password_change,
  proxy_vote_form: user.proxy_vote_form // ← Added
};
```

### 3. `src/components/Header.tsx`

Added debug logging to help diagnose issues:
```typescript
useEffect(() => {
  const checkProxyStatus = async () => {
    if (!user?.id) {
      setCheckingProxy(false);
      return;
    }

    try {
      const choice = user.proxy_vote_form;
      console.log('🔍 Header - proxy_vote_form from user:', choice); // ← Added
      console.log('🔍 Header - full user object:', user); // ← Added
      setProxyChoice(choice || null);
      // ...
    }
    // ...
  };
  checkProxyStatus();
}, [user?.id, user?.proxy_vote_form]);
```

Also added debug logging to `renderProxyButton()`:
```typescript
const renderProxyButton = () => {
  if (checkingProxy) return null;

  console.log('🔘 renderProxyButton called with:', { 
    hasProxyGroups, 
    proxyChoice,
    user_proxy_vote_form: user?.proxy_vote_form 
  }); // ← Added

  if (hasProxyGroups) {
    console.log('✅ Showing View My Proxy button'); // ← Added
    // ...
  }

  if (proxyChoice === 'manual') {
    console.log('✅ Showing Upload Proxy Form button (manual)'); // ← Added
    // ...
  } else if (proxyChoice === 'digital') {
    console.log('✅ Showing Complete Proxy button (digital)'); // ← Added
    // ...
  }

  console.log('⚠️ Showing default Complete Proxy button'); // ← Added
  // ...
};
```

## Testing Steps

1. **Verify database value**:
```sql
SELECT id, email, name, proxy_vote_form 
FROM users 
WHERE email = 'test@example.com';
```

2. **Clear browser cache and localStorage**:
   - Open DevTools (F12)
   - Go to Application tab
   - Clear localStorage
   - Clear cookies

3. **Login with the user**

4. **Check browser console**:
   - Look for: `🔍 Header - proxy_vote_form from user: manual`
   - Look for: `🔘 renderProxyButton called with: { hasProxyGroups: false, proxyChoice: 'manual', ... }`
   - Look for: `✅ Showing Upload Proxy Form button (manual)`

5. **Verify correct button appears**:
   - For `proxy_vote_form = 'manual'`: Should see "Upload Proxy Form" button
   - For `proxy_vote_form = 'digital'`: Should see "Complete Proxy" button
   - For `proxy_vote_form = 'abstain'`: Should see default behavior

## Expected Console Output

When logging in with a user that has `proxy_vote_form = 'manual'`:

```
🔍 Header - proxy_vote_form from user: manual
🔍 Header - full user object: {
  id: "123",
  email: "user@example.com",
  name: "John Doe",
  proxy_vote_form: "manual",
  ...
}
🔘 renderProxyButton called with: { 
  hasProxyGroups: false, 
  proxyChoice: 'manual',
  user_proxy_vote_form: 'manual' 
}
✅ Showing Upload Proxy Form button (manual)
```

## Troubleshooting

### Still showing wrong button?

1. **Check backend is returning the field**:
   - Open Network tab in DevTools
   - Look for the `/api/auth/login` request
   - Check the response JSON includes `proxy_vote_form`

2. **Check React state is updating**:
   - Look for console logs showing the value
   - Use React DevTools to inspect the Header component's state

3. **Check database has the correct value**:
```sql
SELECT id, email, proxy_vote_form FROM users WHERE email = 'test@example.com';
```

4. **Verify no TypeScript errors**:
   - Check VS Code Problems panel
   - Run `npm run build` to check for compilation errors

### Button not appearing at all?

- Check if `checkingProxy` is stuck as `true`
- Verify the proxy status API is responding
- Check for JavaScript errors in console

## Related Files
- `server/models/User.js` - Database queries
- `server/routes/auth.js` - Login endpoint
- `src/contexts/AuthContext.tsx` - User interface (already updated)
- `src/components/Header.tsx` - Button rendering logic
- `PROXY_CHOICE_DATABASE_UPDATE.md` - Previous update documentation

## Summary

✅ Added `proxy_vote_form` to `findByEmail()` query
✅ Added `proxy_vote_form` to `findById()` query  
✅ Added `proxy_vote_form` to login response userData
✅ Added debug console.log statements for troubleshooting

The user's `proxy_vote_form` value is now properly returned during login and the Header component can correctly determine which button to display.
