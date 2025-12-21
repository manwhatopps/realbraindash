# Production Server Configuration

## Security Headers (Required for Production)

These headers MUST be configured at the server/CDN level for production deployment.

### Nginx Example

```nginx
# /etc/nginx/sites-available/braindash

server {
    listen 443 ssl http2;
    server_name braindash.example.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/braindash.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/braindash.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;

    # Root directory
    root /var/www/braindash/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name braindash.example.com;
    return 301 https://$server_name$request_uri;
}
```

### Apache Example

```apache
# /etc/apache2/sites-available/braindash.conf

<VirtualHost *:443>
    ServerName braindash.example.com
    DocumentRoot /var/www/braindash/dist

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/braindash.example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/braindash.example.com/privkey.pem
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite HIGH:!aNULL:!MD5

    # Security Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"

    # Content Security Policy
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"

    # SPA fallback
    <Directory /var/www/braindash/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Cache static assets
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>
</VirtualHost>

# HTTP to HTTPS redirect
<VirtualHost *:80>
    ServerName braindash.example.com
    Redirect permanent / https://braindash.example.com/
</VirtualHost>
```

### Cloudflare Example

If using Cloudflare as CDN:

1. Enable HTTPS (Full or Full Strict)
2. Enable HSTS from SSL/TLS → Edge Certificates
3. Add Transform Rules for custom headers:

```
Transform Rule: Add Security Headers
When: All incoming requests
Then: Set Response Headers
  - Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: geolocation=(), microphone=(), camera=()
  - Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; font-src 'self' data:; frame-ancestors 'none'
```

4. Enable Cloudflare WAF (Web Application Firewall)
5. Enable Rate Limiting:
   - `/api/*` endpoints: 100 requests per minute per IP
   - Login endpoints: 10 requests per minute per IP

### Vercel Example

Create `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; font-src 'self' data:; frame-ancestors 'none'"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Netlify Example

Create `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; font-src 'self' data:; frame-ancestors 'none'"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Rate Limiting

### Application-Level (Supabase Edge Functions)

Already implemented via `check_rate_limit()` function in database.

### Infrastructure-Level (Recommended)

Configure at CDN/Load Balancer:

**Cloudflare Rate Limiting Rules:**
- `/functions/v1/secure-lobby-join`: 10 req/5min per IP
- `/functions/v1/secure-match-settle`: 3 req/match per IP
- `/functions/v1/secure-answer-submit`: 100 req/match per IP

**Nginx Rate Limiting:**

```nginx
# Define rate limit zones
limit_req_zone $binary_remote_addr zone=lobby_join:10m rate=10r/m;
limit_req_zone $binary_remote_addr zone=api_general:10m rate=100r/m;

# Apply to locations
location /functions/v1/secure-lobby-join {
    limit_req zone=lobby_join burst=2 nodelay;
    proxy_pass https://[project].supabase.co;
}

location /functions/v1/ {
    limit_req zone=api_general burst=20 nodelay;
    proxy_pass https://[project].supabase.co;
}
```

## Monitoring & Alerts

### Recommended Monitoring

1. **Error Rates**
   - Alert if 5xx errors > 1% of requests
   - Alert if 4xx errors spike > 50% increase

2. **Financial Anomalies**
   - Alert if single user deposits > $5,000 in 24h
   - Alert if single user withdrawals > $2,000 in 24h
   - Alert if rake collection drops > 30%

3. **Security Events**
   - Alert on repeated failed login attempts (> 10 in 5 min)
   - Alert on KYC rejection rate spike
   - Alert on escrow lock failures

4. **Performance**
   - Alert if P99 latency > 2 seconds
   - Alert if database connection pool exhausted
   - Alert if settlement fails

### Log Aggregation

Send logs to centralized logging (Datadog, Splunk, ELK):
- Application logs (Edge Function errors)
- Audit events (from `audit_events` table)
- Database slow queries
- CDN access logs

## Backup & Disaster Recovery

### Database Backups

Supabase provides automatic backups. Additional recommendations:

```bash
# Daily full backup
pg_dump -h [db-host] -U postgres -d [db-name] -F c -f backup-$(date +%Y%m%d).dump

# Upload to S3
aws s3 cp backup-$(date +%Y%m%d).dump s3://braindash-backups/db/
```

### Recovery Plan

1. Identify incident (fraud, data breach, outage)
2. Assess impact (affected users, financial loss)
3. Contain (disable affected endpoints, block IPs)
4. Restore (rollback database, redeploy code)
5. Communicate (notify affected users, regulators)
6. Post-mortem (document root cause, prevention)

## Compliance

### Required for Real-Money Gaming

- [ ] Terms of Service signed and timestamped
- [ ] Privacy Policy with GDPR compliance
- [ ] AML/KYC procedures documented
- [ ] Responsible gaming limits enforced
- [ ] Audit trail retention (7 years minimum)
- [ ] Incident response plan
- [ ] Regular penetration testing
- [ ] SOC 2 Type II certification (recommended)

---

**Last Updated**: 2024-12-21
