# Wise Investor - Part 8: Testing, Reference & Best Practices
## Complete Testing Guide & Reference Materials

**Version**: 1.0.0  
**Last Updated**: November 2025

---

## Table of Contents

1. [Testing Strategy](#1-testing-strategy)
2. [API Quick Reference](#2-api-quick-reference)
3. [Configuration Reference](#3-configuration-reference)
4. [Troubleshooting Guide](#4-troubleshooting-guide)
5. [Best Practices](#5-best-practices)
6. [Glossary](#6-glossary)
7. [FAQ](#7-faq)

---

## 1. Testing Strategy

### 1.1 Testing Pyramid

```
                    /\
                   /  \
                  / E2E \          10% - End-to-End Tests
                 /______\
                /        \
               /Integration\        30% - Integration Tests
              /____________\
             /              \
            /  Unit Tests     \     60% - Unit Tests
           /__________________\
```

### 1.2 Unit Testing

**Backend Unit Tests (pytest):**
```python
# tests/test_donors.py
import pytest
from services.donor_service import DonorService
from models import Donor

def test_create_donor(db_session):
    """Test donor creation"""
    service = DonorService(db_session)
    
    donor_data = {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "organization_id": 1
    }
    
    donor = service.create_donor(donor_data, org_id=1, created_by=1)
    
    assert donor.id is not None
    assert donor.first_name == "John"
    assert donor.lifecycle_stage == "prospect"
    assert donor.lifetime_value == 0.0

def test_calculate_engagement_score(db_session):
    """Test engagement score calculation"""
    service = DonorService(db_session)
    
    # Create donor with donations
    donor = create_test_donor(db_session)
    create_test_donations(db_session, donor.id, count=5)
    
    score = service.calculate_engagement_score(donor.id, org_id=1)
    
    assert score >= 0
    assert score <= 100
    assert score > 0  # Should have score with donations

def test_update_lifecycle_stage(db_session):
    """Test lifecycle stage updates"""
    service = DonorService(db_session)
    
    donor = create_test_donor(db_session)
    
    # Add first donation
    create_test_donation(db_session, donor.id, amount=100)
    stage = service.update_lifecycle_stage(donor.id, org_id=1)
    assert stage == "first_time"
    
    # Add more donations
    create_test_donations(db_session, donor.id, count=5)
    stage = service.update_lifecycle_stage(donor.id, org_id=1)
    assert stage == "repeat"
    
    # Add major gift
    create_test_donation(db_session, donor.id, amount=15000)
    stage = service.update_lifecycle_stage(donor.id, org_id=1)
    assert stage == "major_donor"
```

**Run Unit Tests:**
```bash
cd ~/codebase/backend
source venv/bin/activate

# Install test dependencies
pip install pytest pytest-cov pytest-asyncio

# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_donors.py

# Run specific test
pytest tests/test_donors.py::test_create_donor

# Run with verbose output
pytest -v
```

**Frontend Unit Tests (Jest/React Testing Library):**
```javascript
// src/components/__tests__/DonorCard.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import DonorCard from '../DonorCard';

describe('DonorCard', () => {
  const mockDonor = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    lifetime_value: 5000.00,
    lifecycle_stage: 'major_donor',
  };

  test('renders donor information correctly', () => {
    render(<DonorCard donor={mockDonor} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
  });

  test('calls onClick when card is clicked', () => {
    const handleClick = jest.fn();
    render(<DonorCard donor={mockDonor} onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('article'));
    expect(handleClick).toHaveBeenCalledWith(mockDonor);
  });

  test('displays correct lifecycle stage badge', () => {
    render(<DonorCard donor={mockDonor} />);
    
    const badge = screen.getByText('Major Donor');
    expect(badge).toHaveClass('badge-gold');
  });
});
```

**Run Frontend Tests:**
```bash
cd ~/codebase/frontend/wise-investor

# Install test dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest

# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### 1.3 Integration Testing

**API Integration Tests:**
```python
# tests/integration/test_donor_api.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_and_retrieve_donor():
    """Test complete donor creation and retrieval flow"""
    
    # Login to get token
    response = client.post("/api/public/login", json={
        "username": "test@example.com",
        "password": "test123"
    })
    assert response.status_code == 200
    token = response.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create donor
    donor_data = {
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane@example.com"
    }
    response = client.post("/api/v1/donors", json=donor_data, headers=headers)
    assert response.status_code == 201
    donor = response.json()
    donor_id = donor["id"]
    
    # Retrieve donor
    response = client.get(f"/api/v1/donors/{donor_id}", headers=headers)
    assert response.status_code == 200
    retrieved_donor = response.json()
    assert retrieved_donor["first_name"] == "Jane"
    assert retrieved_donor["email"] == "jane@example.com"
    
    # Update donor
    update_data = {"phone": "+1-555-1234"}
    response = client.put(
        f"/api/v1/donors/{donor_id}",
        json=update_data,
        headers=headers
    )
    assert response.status_code == 200
    
    # Delete donor
    response = client.delete(f"/api/v1/donors/{donor_id}", headers=headers)
    assert response.status_code == 204
```

### 1.4 End-to-End Testing

**E2E Test with Playwright:**
```javascript
// e2e/donor-management.spec.js
import { test, expect } from '@playwright/test';

test.describe('Donor Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should create a new donor', async ({ page }) => {
    // Navigate to donors page
    await page.click('text=Donors');
    await expect(page).toHaveURL(/.*donors/);
    
    // Click add donor button
    await page.click('button:has-text("Add Donor")');
    
    // Fill in donor form
    await page.fill('input[name="first_name"]', 'Test');
    await page.fill('input[name="last_name"]', 'Donor');
    await page.fill('input[name="email"]', 'test.donor@example.com');
    await page.fill('input[name="phone"]', '+1-555-9999');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify success message
    await expect(page.locator('text=Donor created successfully')).toBeVisible();
    
    // Verify donor appears in list
    await expect(page.locator('text=Test Donor')).toBeVisible();
  });

  test('should record a donation', async ({ page }) => {
    // Navigate to specific donor
    await page.goto('http://localhost:5173/donors/1');
    
    // Click add donation
    await page.click('button:has-text("Add Donation")');
    
    // Fill in donation form
    await page.fill('input[name="amount"]', '500');
    await page.selectOption('select[name="payment_method"]', 'credit_card');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page.locator('text=Donation recorded')).toBeVisible();
    
    // Verify lifetime value updated
    await expect(page.locator('text=$500.00')).toBeVisible();
  });
});
```

**Run E2E Tests:**
```bash
# Install Playwright
cd ~/codebase/frontend/wise-investor
npm install --save-dev @playwright/test

# Initialize Playwright
npx playwright install

# Run E2E tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test
npx playwright test donor-management.spec.js
```

### 1.5 Performance Testing

**Load Testing with Locust:**
```python
# locustfile.py
from locust import HttpUser, task, between

class WiseInvestorUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login before tests"""
        response = self.client.post("/api/public/login", json={
            "username": "test@example.com",
            "password": "test123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(3)
    def list_donors(self):
        """List donors - most common operation"""
        self.client.get("/api/v1/donors", headers=self.headers)
    
    @task(2)
    def view_donor(self):
        """View donor details"""
        self.client.get("/api/v1/donors/1", headers=self.headers)
    
    @task(1)
    def list_campaigns(self):
        """List campaigns"""
        self.client.get("/api/v1/campaigns", headers=self.headers)
    
    @task(1)
    def dashboard(self):
        """Load dashboard"""
        self.client.get("/api/v1/dashboard/executive", headers=self.headers)
```

**Run Load Test:**
```bash
# Install Locust
pip install locust

# Run load test
locust -f locustfile.py --host=http://localhost:8000

# Open browser: http://localhost:8089
# Configure: Users=100, Spawn rate=10, Host=http://localhost:8000
```

---

## 2. API Quick Reference

### 2.1 Authentication

```bash
# Login
POST /api/public/login
Body: {"username": "user@example.com", "password": "password"}

# Get current user
GET /api/v1/auth/me
Headers: Authorization: Bearer <token>

# Refresh token
POST /api/v1/auth/refresh
Headers: Authorization: Bearer <token>
```

### 2.2 Donors

```bash
# List donors
GET /api/v1/donors?page=1&per_page=20&lifecycle_stage=major_donor

# Get donor
GET /api/v1/donors/{id}

# Create donor
POST /api/v1/donors
Body: {"first_name": "John", "last_name": "Doe", "email": "john@example.com"}

# Update donor
PUT /api/v1/donors/{id}
Body: {"phone": "+1-555-1234"}

# Delete donor
DELETE /api/v1/donors/{id}

# Get donor donations
GET /api/v1/donors/{id}/donations

# Get donor timeline
GET /api/v1/donors/{id}/timeline
```

### 2.3 Campaigns

```bash
# List campaigns
GET /api/v1/campaigns?status=active

# Get campaign
GET /api/v1/campaigns/{id}

# Create campaign
POST /api/v1/campaigns
Body: {"name": "Annual Fund", "goal_amount": 100000, ...}

# Update campaign
PUT /api/v1/campaigns/{id}

# Get campaign metrics
GET /api/v1/campaigns/{id}/metrics?period=daily

# Get campaign donors
GET /api/v1/campaigns/{id}/donors
```

### 2.4 Donations

```bash
# List donations
GET /api/v1/donations?start_date=2024-01-01&end_date=2024-12-31

# Get donation
GET /api/v1/donations/{id}

# Record donation
POST /api/v1/donations
Body: {"donor_id": 1, "amount": 500, "payment_method": "credit_card"}

# Update donation
PUT /api/v1/donations/{id}

# Generate receipt
GET /api/v1/donations/{id}/receipt
```

### 2.5 Analytics

```bash
# Executive dashboard
GET /api/v1/dashboard/executive

# Fundraising vitals
GET /api/v1/analytics/fundraising-vitals

# Donor lifecycle
GET /api/v1/analytics/donor-lifecycle

# Revenue analysis
GET /api/v1/analytics/revenue?period=monthly&year=2024
```

---

## 3. Configuration Reference

### 3.1 Environment Variables

**Backend (.env):**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=organization_db
DB_USER=orguser
DB_PASSWORD=<secure_password>

# Security
SECRET_KEY=<generate_with_openssl_rand_hex_32>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# Application
DEBUG=False
API_VERSION=v1
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=<email>
SMTP_PASSWORD=<password>
FROM_EMAIL=noreply@yourdomain.com

# Storage (optional)
UPLOAD_DIR=/var/uploads
MAX_UPLOAD_SIZE=10485760

# External Services (optional)
STRIPE_API_KEY=<key>
SENDGRID_API_KEY=<key>
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=Wise Investor
VITE_ENABLE_ANALYTICS=false
```

### 3.2 PostgreSQL Configuration

**postgresql.conf optimizations:**
```ini
# Memory Settings
shared_buffers = 256MB              # 25% of RAM
effective_cache_size = 1GB          # 50-75% of RAM
maintenance_work_mem = 64MB
work_mem = 16MB

# Checkpoint Settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Query Planner
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
log_min_duration_statement = 1000   # Log queries > 1 second
log_line_prefix = '%t [%p]: '
log_connections = on
log_disconnections = on
```

### 3.3 NGINX Configuration

**Key directives:**
```nginx
# Timeouts
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;

# Upload limits
client_max_body_size 50M;

# Compression
gzip on;
gzip_comp_level 6;

# Security headers
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
```

---

## 4. Troubleshooting Guide

### 4.1 Common Issues

**Issue: Can't login - "Invalid credentials"**
```bash
# Check user exists
psql -U orguser -d organization_db -c "SELECT email, is_active FROM users WHERE email='user@example.com';"

# Reset password
cd ~/codebase/backend
source venv/bin/activate
python -c "
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
print(pwd_context.hash('NewPassword123!'))
"
# Update password in database with output hash
```

**Issue: "502 Bad Gateway"**
```bash
# Check backend is running
sudo systemctl status wise-investor-backend

# Check backend logs
sudo journalctl -u wise-investor-backend -n 50

# Check if port 8000 is listening
sudo netstat -tlnp | grep 8000

# Restart backend
sudo systemctl restart wise-investor-backend
```

**Issue: Slow API responses**
```bash
# Check database connections
psql -U orguser -d organization_db -c "SELECT count(*) FROM pg_stat_activity;"

# Check for long-running queries
psql -U orguser -d organization_db -c "
SELECT pid, now() - query_start as duration, query 
FROM pg_stat_activity 
WHERE state = 'active' AND now() - query_start > interval '5 seconds';
"

# Run VACUUM ANALYZE
psql -U orguser -d organization_db -c "VACUUM ANALYZE;"
```

**Issue: Disk space full**
```bash
# Check disk usage
df -h

# Find large files
du -h /home/ubuntu | sort -rh | head -20

# Clean up logs
sudo journalctl --vacuum-time=7d

# Clean up old backups
find /var/backups/wise-investor -name "*.gz" -mtime +30 -delete
```

---

## 5. Best Practices

### 5.1 Development Best Practices

**Code Quality:**
- Follow PEP 8 for Python
- Follow Airbnb style guide for JavaScript
- Use type hints in Python
- Write comprehensive docstrings
- Keep functions small and focused
- Use meaningful variable names

**Version Control:**
- Commit frequently with clear messages
- Use feature branches
- Never commit secrets or credentials
- Tag releases
- Keep main branch stable
- Use pull requests for code review

**Security:**
- Never hardcode credentials
- Use environment variables
- Validate all user input
- Sanitize database queries
- Keep dependencies updated
- Follow OWASP guidelines

### 5.2 Database Best Practices

**Schema Design:**
- Normalize to 3NF minimum
- Use appropriate data types
- Add indexes on foreign keys
- Add indexes on frequently queried columns
- Use constraints for data integrity
- Document schema changes

**Queries:**
- Use parameterized queries
- Avoid SELECT *
- Use appropriate JOINs
- Add indexes for complex queries
- Monitor query performance
- Use EXPLAIN ANALYZE

**Maintenance:**
- Regular VACUUM ANALYZE
- Monitor table bloat
- Update statistics
- Archive old data
- Test backups regularly

### 5.3 API Best Practices

**Design:**
- Use RESTful conventions
- Version your API
- Use appropriate HTTP methods
- Return appropriate status codes
- Include pagination
- Provide filtering options

**Security:**
- Always use HTTPS
- Implement rate limiting
- Validate input data
- Sanitize output
- Use JWT tokens
- Implement RBAC

**Documentation:**
- Document all endpoints
- Provide request/response examples
- Document error codes
- Keep documentation updated
- Use OpenAPI/Swagger

### 5.4 Frontend Best Practices

**Component Design:**
- Keep components small
- Separate container/presentational
- Use custom hooks
- Implement error boundaries
- Optimize re-renders
- Use lazy loading

**State Management:**
- Keep state minimal
- Use appropriate state location
- Avoid prop drilling
- Cache API responses
- Handle loading states
- Handle error states

**Performance:**
- Code splitting
- Lazy load images
- Memoize expensive calculations
- Debounce user input
- Use production builds
- Monitor bundle size

---

## 6. Glossary

**API (Application Programming Interface)**: Interface that allows different software applications to communicate with each other.

**Authentication**: Process of verifying the identity of a user.

**Authorization**: Process of determining what an authenticated user is allowed to do.

**Campaign**: Organized fundraising effort with specific goals and timeline.

**Donor Lifecycle**: The stages a donor goes through: Prospect → First-time → Repeat → Major → Lapsed.

**Engagement Score**: Calculated metric (0-100) indicating donor engagement level based on donation frequency, recency, amount, and event participation.

**JWT (JSON Web Token)**: Secure method for transmitting information between parties as a JSON object.

**Lifecycle Stage**: Current stage in the donor lifecycle (prospect, first-time, repeat, major, lapsed).

**Lifetime Value (LTV)**: Total amount donated by a donor throughout their relationship with the organization.

**Major Gift**: Significant donation, typically defined as $10,000 or more (threshold varies by organization).

**Multi-tenancy**: Software architecture where a single instance serves multiple organizations (tenants) with complete data isolation.

**ORM (Object-Relational Mapping)**: Programming technique for converting data between incompatible type systems (database ↔ objects).

**RBAC (Role-Based Access Control)**: Access control method based on user roles and permissions.

**REST (Representational State Transfer)**: Architectural style for designing networked applications.

**Soft Delete**: Marking records as deleted without physically removing them from the database.

---

## 7. FAQ

**Q: How do I reset a user's password?**
A: Admins can reset passwords from Settings → Users → Select User → Reset Password. Users can use "Forgot Password" on the login page.

**Q: Can donors be merged if duplicates are found?**
A: Yes, use the "Merge Donors" feature from the donor profile. This will combine donation history and notes.

**Q: How often should I backup the database?**
A: Daily backups are recommended. Critical organizations should backup multiple times per day.

**Q: What happens to deleted data?**
A: Data is soft-deleted by default (marked as deleted but retained). Hard delete is available for compliance requirements.

**Q: Can I import existing donor data?**
A: Yes, use the Import feature (Donors → Import) with CSV or Excel files. Map your columns to system fields.

**Q: How is donor engagement score calculated?**
A: Engagement score (0-100) is based on: Donation frequency (40%), Recency (30%), Amount (20%), Event attendance (10%).

**Q: Can I customize receipt templates?**
A: Yes, from Settings → Templates → Receipt Template. Use available merge fields for donor/donation data.

**Q: How do I create a custom report?**
A: Navigate to Reports → Create Custom Report. Select data source, filters, fields, and save.

**Q: Is there a mobile app?**
A: Currently web-based only, but fully responsive. Native mobile apps are in the roadmap.

**Q: How do I add team members?**
A: Settings → Users → Add User. Assign appropriate role and permissions.

**Q: Can I integrate with my payment processor?**
A: Stripe and PayPal integrations are available. Contact support for custom integrations.

**Q: How do I export data?**
A: Most list views have Export buttons. Choose CSV or Excel format.

---

