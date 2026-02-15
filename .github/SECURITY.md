# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of hash-orbit seriously. If you discover a security vulnerability, please report it responsibly.

### Using GitHub Security Advisories (Recommended)

The preferred method for reporting security vulnerabilities is through GitHub's private security reporting:

1. Navigate to the [Security Advisories](https://github.com/1mb-dev/hash-orbit/security/advisories) page
2. Click "Report a vulnerability"
3. Fill out the advisory form with details about the vulnerability
4. Submit the report

This method keeps the vulnerability private until a fix is released.

### What to Include in Your Report

Please include the following information to help us understand and address the issue:

- **Description**: A clear description of the vulnerability
- **Impact**: What kind of vulnerability is it? (RCE, XSS, DoS, etc.)
- **Reproduction**: Step-by-step instructions to reproduce the issue
- **Affected versions**: Which versions are affected?
- **Suggested fix**: If you have ideas on how to fix it (optional)

### Response Timeline

- **Initial response**: Within 48 hours of receiving your report
- **Status update**: Within 7 days with assessment and planned fix timeline
- **Fix release**: Depends on severity and complexity, typically within 30 days

### Disclosure Policy

- Please do not publicly disclose the vulnerability until we've had a chance to address it
- We will credit you in the security advisory (unless you prefer to remain anonymous)
- Once a fix is released, we will publish a security advisory crediting the reporter

## Security Best Practices

When using hash-orbit:

1. **Keep dependencies updated**: Regularly update to the latest version
2. **Validate node identifiers**: Sanitize any user input used as node identifiers
3. **Monitor for updates**: Watch this repository for security advisories
4. **Use 2FA**: Enable two-factor authentication on npm if you're a maintainer

## Security Update Process

1. Security vulnerability reported via GitHub Security Advisories
2. Maintainers assess severity and impact
3. Patch developed and tested privately
4. Security advisory published with CVE assignment
5. Patched version released to npm
6. Users notified through GitHub and npm

## Contact

For security-related questions that are not vulnerability reports, you can:

- Open a discussion in the [GitHub Discussions](https://github.com/1mb-dev/hash-orbit/discussions)
- Open a regular issue if it's not sensitive

Thank you for helping keep hash-orbit and its users safe!
