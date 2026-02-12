# Research Document

## Multi-Tenancy Analysis

| Approach | Pros | Cons |
|:--- |:--- |:--- |
| **Shared Database, Shared Schema** | Simple setup, easy migrations, low cost. | Strict code-level isolation required, data leak risk if query bugs exist. |
| **Shared Database, Separate Schema** | Better isolation, easy backup per tenant. | Complex migrations, higher overhead per tenant. |
| **Separate Database** | Best isolation, security. | High cost, complex infrastructure. |

**Chosen Approach**: **Shared Database, Shared Schema**.
**Justification**: For a SaaS of this scale (startup/MVP), shared schema provides the best balance of development speed and performance. We will enforce isolation via Middleware (`where tenant_id = ?`) and extensive testing.

## Technology Stack Justification
- **Backend**: Node.js + Express.
  - *Why*: Fast execution, huge ecosystem, JSON native.
- **Frontend**: React.
  - *Why*: Component-based, excellent state management, huge community.
- **Database**: PostgreSQL.
  - *Why*: Reliable, supports JSONB if needed, ACID compliance.
- **Auth**: JWT.
  - *Why*: Stateless, scalable, standard for REST APIs.

## Security Considerations
1. **Data Isolation**: Middleware injection of `tenant_id` into all queries.
2. **Auth**: JWT with short expiry (24h).
3. **Passwords**: Bcrypt hashing (Argon2 optional).
4. **API**: Rate limiting, Input validation (Joi/Zod).
5. **Docker**: Non-root users in containers.
