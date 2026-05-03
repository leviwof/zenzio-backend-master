# Security Guidelines for Zenzio Backend

## 🔒 Environment Variables

### Setup Instructions

1. **Never commit `.env` files to git**
   - The `.env` file contains production secrets and must remain local only
   - Use `.env.example` as a template for team members

2. **Creating your local .env file**
   ```bash
   cp .env.example .env
   # Edit .env and fill in your actual credentials
   ```

3. **Obtaining Production Credentials**
   - Contact the DevOps/Infrastructure team
   - Store credentials in your password manager
   - Never share credentials via email, Slack, or other insecure channels

## 🛡️ Security Best Practices

### Credential Management

- **Rotate credentials regularly** (quarterly at minimum)
- **Use different credentials** for development, staging, and production
- **Never log credentials** or tokens in console/files
- **Use environment-specific** AWS accounts and database instances

### JWT Configuration

Current settings require improvement:
- ✅ Access tokens: Should expire in 15 minutes (currently 30 days)
- ✅ Refresh tokens: Should expire in 7 days (currently 30 days)
- ✅ Use strong, randomly generated secrets (use: `openssl rand -base64 32`)

### API Security

1. **Rate Limiting**: Implement on all public endpoints
2. **Input Validation**: Always validate and sanitize user input
3. **Authentication**: All endpoints except public ones must require authentication
4. **Authorization**: Check user roles/permissions before allowing actions
5. **CORS**: Only allow trusted origins

### Database Security

- ✅ Use parameterized queries (avoid raw SQL)
- ✅ Principle of least privilege for database users
- ✅ Enable SSL/TLS for database connections
- ✅ Regular backups with encryption

### Dependencies

Run security audits regularly:
```bash
npm audit
npm audit fix
```

Update dependencies monthly:
```bash
npm outdated
npm update
```

## 🚨 Security Incident Response

If you discover a security issue:

1. **Do NOT** commit the fix immediately
2. **Contact** the security team/lead developer
3. **Document** the issue privately
4. **Coordinate** disclosure and patch deployment
5. **Rotate** any compromised credentials immediately

## 📋 Security Checklist for Pull Requests

Before submitting a PR:

- [ ] No hardcoded credentials or API keys
- [ ] No console.log of sensitive data
- [ ] Input validation on all user inputs
- [ ] Authentication guards on protected endpoints
- [ ] SQL injection prevention (use query builders)
- [ ] XSS prevention (sanitize outputs)
- [ ] CSRF protection where needed
- [ ] Rate limiting on public endpoints
- [ ] Error messages don't leak sensitive info

## 🔑 Credential Rotation Schedule

| Credential Type | Rotation Frequency | Last Rotated | Next Rotation |
|----------------|-------------------|--------------|---------------|
| JWT Secrets | Quarterly | TBD | TBD |
| AWS Keys | Quarterly | TBD | TBD |
| Database Password | Quarterly | TBD | TBD |
| Razorpay Keys | Annually | TBD | TBD |
| Firebase Keys | Annually | TBD | TBD |
| API Keys (3rd party) | As needed | TBD | TBD |

## 📞 Security Contacts

- **Security Lead**: [Add contact]
- **DevOps Team**: [Add contact]
- **Emergency**: [Add emergency contact]

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/authentication)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---

**Last Updated**: 2026-05-03  
**Version**: 1.0
