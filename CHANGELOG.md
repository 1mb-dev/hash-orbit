# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Release Checklist

**For maintainers creating a new release:**

- [ ] Update version in `package.json` (follow semver)
- [ ] Update this CHANGELOG.md with version and date
- [ ] Ensure all tests pass: `npm test`
- [ ] Verify coverage meets threshold: `npm run coverage`
- [ ] Run linting: `npm run lint`
- [ ] Clean build: `npm run build`
- [ ] Review dist/ output for correctness
- [ ] Commit changes: `chore(release): vX.Y.Z`
- [ ] Create git tag: `git tag vX.Y.Z`
- [ ] Push commits and tags: `git push && git push --tags`
- [ ] Publish to npm: `npm publish` (with 2FA)
- [ ] Create GitHub release with changelog notes
- [ ] Verify package on npm: `npm info hash-orbit`

---

## [Unreleased]

## [1.0.0] - 2025-11-21

### Added

- Consistent hashing ring implementation with virtual nodes
- `add()` method to add nodes to the ring
- `remove()` method to remove nodes with minimal redistribution
- `get()` method for O(log n) key lookup using binary search
- `getN()` method for replica selection (replication support)
- `size` and `nodes` getters for introspection
- `toJSON()` and `fromJSON()` methods for serialization
- Input validation for node identifiers and keys
- TypeScript support with full type definitions and strict mode
- 100% test coverage with 42 comprehensive tests
- Fast test suite (<500ms execution time)
- GitHub Actions CI workflow with coverage reporting
- Pre-commit hooks with husky and lint-staged
- Comprehensive documentation and working examples
- Production-ready codebase with minimal dependencies

### Changed

- Optimized test suite (99% faster, removed bloat)
- Streamlined README (52% shorter, more practical)
- Deduplicated code and removed redundant comments
- Improved code maintainability and consistency

### Removed

- Codecov integration (coverage still verified locally via vitest)

## [0.1.0] - 2025-11-20

### Added

- Initial development version
- Core consistent hashing algorithm
- Binary search optimization
- MurmurHash integration for key hashing
- Full TypeScript support with strict mode
- Complete test suite with 34 tests
- ESLint and Prettier configuration
- CI/CD with GitHub Actions
- MIT License

[unreleased]: https://github.com/vnykmshr/hash-orbit/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/vnykmshr/hash-orbit/releases/tag/v1.0.0
[0.1.0]: https://github.com/vnykmshr/hash-orbit/releases/tag/v0.1.0
