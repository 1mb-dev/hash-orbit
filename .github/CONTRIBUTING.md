# Contributing to hash-orbit

Thank you for your interest in contributing to hash-orbit! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## Code of Conduct

Be respectful and professional in all interactions. We're here to build great software together.

## Getting Started

### Prerequisites

- Node.js >= 20.0.0 (use `nvm` with `.nvmrc` for automatic version switching)
- npm (comes with Node.js)
- Git

### Initial Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/hash-orbit.git
   cd hash-orbit
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Verify setup**

   ```bash
   npm test
   npm run lint
   npm run build
   ```

   All commands should pass successfully.

## Development Workflow

### Branch Naming

- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test additions or fixes
- `chore/description` - Tooling, deps, or config changes

### Making Changes

1. **Create a new branch**

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Run quality checks**

   ```bash
   npm run lint         # Check code style
   npm run format       # Auto-format code
   npm test             # Run all tests
   npm run coverage     # Check test coverage
   npm run build        # Verify build works
   ```

4. **Commit your changes** (see [Commit Messages](#commit-messages))

## Coding Standards

### TypeScript

- **Strict mode**: All code must pass TypeScript strict mode checks
- **Types**: Prefer explicit types over `any`
- **Interfaces**: Use interfaces for public APIs
- **Naming**: Use camelCase for variables/functions, PascalCase for classes/interfaces

### Code Style

- **Formatting**: Prettier handles formatting automatically (runs on commit)
- **Linting**: ESLint enforces code quality rules
- **Line length**: Aim for ≤100 characters (Prettier handles this)
- **Comments**: Write comments for complex logic, avoid obvious comments

### Best Practices

- **Single Responsibility**: Functions should do one thing well
- **Immutability**: Prefer const over let, avoid mutation when possible
- **Error Handling**: Handle edge cases explicitly
- **Performance**: Consider O(n) complexity for operations

## Testing

### Writing Tests

- Place tests in `test/` directory
- Name test files `*.test.ts`
- Use descriptive test names: `test('should return node for key when ring has nodes')`
- Cover edge cases: empty ring, single node, large ring
- Test both success and error paths

### Test Structure

```typescript
import { describe, test, expect } from 'vitest';
import { HashOrbit } from '../src/index.js';

describe('HashOrbit', () => {
  test('should create ring with default replicas', () => {
    const ring = new HashOrbit();
    expect(ring.size).toBe(0);
  });
});
```

### Running Tests

```bash
npm test              # Watch mode (interactive)
npm run test:ci       # Run once (CI mode)
npm run coverage      # Generate coverage report
```

### Coverage Requirements

- Minimum coverage: 90% (enforced in CI)
- Aim for 100% on new code
- Coverage reports available in `coverage/` directory

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Test additions or updates
- `chore`: Build, tooling, or dependency updates

### Examples

```bash
feat(core): add weighted node support
fix(get): handle empty ring edge case
docs(readme): add performance benchmarks
test(getN): add replication edge cases
chore(deps): update vitest to v4.0.13
```

### Pre-commit Hooks

Pre-commit hooks automatically:

- Format code with Prettier
- Lint code with ESLint
- Fix auto-fixable issues

If hooks fail, fix issues and commit again.

## Pull Request Process

### Before Submitting

- [ ] All tests pass (`npm test`)
- [ ] Coverage meets requirements (`npm run coverage`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Commits follow convention
- [ ] Documentation updated (if needed)
- [ ] CHANGELOG.md updated (for notable changes)

### Submitting

1. **Push your branch**

   ```bash
   git push origin feat/your-feature-name
   ```

2. **Create Pull Request**
   - Use a clear, descriptive title
   - Reference related issues (#123)
   - Describe what changed and why
   - Include screenshots/examples if relevant

3. **Review Process**
   - Maintainer will review within 7 days
   - Address feedback by pushing new commits
   - Once approved, maintainer will merge

### PR Requirements

- Minimum one approval from maintainer
- All CI checks passing
- No merge conflicts
- Up to date with main branch

## Release Process

_For maintainers only_

See release checklist in [CHANGELOG.md](../CHANGELOG.md) for detailed steps.

### Quick Reference

1. Update version in `package.json`
2. Update `CHANGELOG.md` with changes
3. Run `npm run build && npm test`
4. Commit: `chore(release): v0.x.x`
5. Tag: `git tag v0.x.x`
6. Push: `git push && git push --tags`
7. Publish: `npm publish`
8. Create GitHub release with notes

## Questions?

- **Bug reports**: [Open an issue](https://github.com/1mb-dev/hash-orbit/issues/new)
- **Feature requests**: [Open an issue](https://github.com/1mb-dev/hash-orbit/issues/new)
- **Security issues**: See [SECURITY.md](SECURITY.md)
- **General questions**: [Start a discussion](https://github.com/1mb-dev/hash-orbit/discussions)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](../LICENSE).

---

Thank you for contributing to hash-orbit! 🚀
