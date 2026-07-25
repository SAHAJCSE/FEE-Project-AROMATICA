# Firebase Security Specification & TDD Framework

## 1. Data Invariants
1. **User Profile**: A user profile document can only be read or written by the authenticated user whose `request.auth.uid` matches the document path variable `userId`.
2. **Reservations**: Any user can create a reservation, but only the creator of the reservation (`resource.data.userId == request.auth.uid`) can read or modify it.
3. **Orders**: Only the user who placed the order (`resource.data.userId == request.auth.uid`) can read or update their order status.
4. **Contact Inquiries**: Anyone can write contact inquiries, but no general user or non-owner can read or write others' messages.

---

## 2. The "Dirty Dozen" Malicious Payloads
Here are 12 JSON payloads designed to violate system integrity, which must return `PERMISSION_DENIED`.

### Payload 1: Write User Profile for another user ID
- **Path**: `/users/other-attacker-id`
- **Payload**: `{"uid": "other-attacker-id", "name": "Attacker", "email": "attacker@gmail.com"}`
- **Reason**: Attempting to register or overwrite another user's profile.

### Payload 2: Write User Profile with empty values
- **Path**: `/users/my-user-id`
- **Payload**: `{"uid": "", "name": "", "email": ""}`
- **Reason**: Failing minimum string length validators.

### Payload 3: Injecting extra/unwanted ghost keys into User Profile
- **Path**: `/users/my-user-id`
- **Payload**: `{"uid": "my-user-id", "name": "Good Guy", "email": "good@gmail.com", "isAdmin": true}`
- **Reason**: Security rules must use strict key checks to prevent privilege escalation.

### Payload 4: Create reservation for someone else
- **Path**: `/reservations/res_12345`
- **Payload**: `{"ref": "RES-123456", "userId": "victim_uid", "outlet": "Aromatica", "table": "T1", "date": "2026-12-01", "time": "19:00", "guests": "2 Guests", "bookedAt": "7/25/2026", "status": "Confirmed"}`
- **Reason**: Attempting to book or modify reservations on behalf of others.

### Payload 5: Spoofing user email in reservation
- **Path**: `/reservations/res_12345`
- **Payload**: `{"ref": "RES-123456", "userId": "attacker_uid", "outlet": "Aromatica", "table": "T1", "date": "2026-12-01", "time": "19:00", "guests": "2 Guests", "bookedAt": "7/25/2026", "status": "Confirmed", "email": "admin@aromatica.com"}`
- **Reason**: Unbound extra properties or field injection.

### Payload 6: Reservation with invalid ID / malformed ID format
- **Path**: `/reservations/RES-junk-character-$$$`
- **Payload**: `{"ref": "RES-123456", "userId": "my_uid", "outlet": "A...", "table": "T1", "date": "2026-12-01", "time": "19:00", "guests": "2", "bookedAt": "7/25", "status": "Confirmed"}`
- **Reason**: Resource poisoning or ID injection.

### Payload 7: Update order status to delivered directly by user
- **Path**: `/orders/order_12345`
- **Payload**: `{"id": "AR-123456", "userId": "my_uid", "date": "7/25/2026", "items": [], "total": 250, "status": "Delivered"}`
- **Reason**: State shortcutting by user on system/terminal fields.

### Payload 8: Order with invalid field types
- **Path**: `/orders/order_12345`
- **Payload**: `{"id": "AR-123456", "userId": "my_uid", "date": "7/25/2026", "items": "not-an-array", "total": "not-a-number", "status": "Preparing"}`
- **Reason**: Type safety violation.

### Payload 9: Empty inquiry submission
- **Path**: `/contact_inquiries/inq_12345`
- **Payload**: `{"name": "", "email": "a", "subject": "", "message": "", "submittedAt": "now"}`
- **Reason**: Empty text field validation.

### Payload 10: Anonymous read of contact inquiries
- **Path**: `/contact_inquiries/inq_12345`
- **Payload**: Attempting to read `/contact_inquiries/inq_12345` as another user.
- **Reason**: General read/list queries on user inquiries are forbidden.

### Payload 11: Spoofed email verification state bypass
- **Path**: `/orders/order_12345`
- **Payload**: Same payload as standard order, but with `request.auth.token.email_verified == false`.
- **Reason**: System must check verified email states for standard authenticated operations.

### Payload 12: Overwriting immutable creation timestamp
- **Path**: `/orders/order_12345`
- **Payload**: Overwriting `createdAt` with a backdated timestamp during updates.
- **Reason**: Immortality of fields rule.

---

## 3. Test Runner Definition (`firestore.rules.test.ts`)
Verification suite containing test definitions.
