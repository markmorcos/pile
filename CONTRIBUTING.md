# Contributing to pile.bio

Thank you for your interest in contributing to pile.bio! This document provides guidelines and instructions for contributing.

## Development Setup

1. **Fork and Clone**
```bash
git clone https://github.com/yourusername/pile.git
cd pile
```

2. **Install Dependencies**
```bash
npm install
```

3. **Set Up Environment**
```bash
cp env.example .env
# Edit .env with your credentials
```

4. **Set Up Database**
```bash
npm run db:push
```

5. **Start Development**
```bash
# Terminal 1: Main server
npm run dev

# Terminal 2: Metadata worker
npm run worker:metadata

# Terminal 3: Publish worker
npm run worker:publish
```

## Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Commit Messages

Follow the conventional commits format:

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semicolons, etc.
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

Examples:
```
feat: add link preview customization
fix: resolve socket connection timeout
docs: update deployment guide
```

## Pull Request Process

1. **Create a Branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make Your Changes**
   - Write clean, documented code
   - Test your changes thoroughly
   - Update documentation if needed

3. **Commit Your Changes**
```bash
git add .
git commit -m "feat: your feature description"
```

4. **Push to Your Fork**
```bash
git push origin feature/your-feature-name
```

5. **Create Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template
   - Request review

## PR Guidelines

- Keep PRs focused on a single feature/fix
- Include tests if applicable
- Update documentation
- Ensure all checks pass
- Respond to review feedback promptly

## Testing

Before submitting a PR:

1. **Test Locally**
   - Sign in flow works
   - Profile creation/editing works
   - Link CRUD operations work
   - Metadata fetching works
   - Publishing works
   - Socket.IO updates work

2. **Check for Errors**
   - No console errors
   - No TypeScript errors
   - No linting errors

3. **Test Edge Cases**
   - Invalid URLs
   - Missing data
   - Network failures
   - Concurrent operations

## Areas for Contribution

### High Priority
- [ ] Custom themes and layouts
- [ ] Analytics dashboard
- [ ] Link click tracking
- [ ] Custom domains support
- [ ] Image optimization

### Medium Priority
- [ ] QR code generation
- [ ] Social media integrations
- [ ] Scheduled publishing
- [ ] A/B testing
- [ ] SEO improvements

### Low Priority
- [ ] Additional auth providers
- [ ] Export/import functionality
- [ ] API rate limiting
- [ ] Admin dashboard
- [ ] Email notifications

## Bug Reports

When reporting bugs, include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, browser, Node version
6. **Screenshots**: If applicable
7. **Logs**: Relevant error logs

## Feature Requests

When requesting features, include:

1. **Use Case**: Why is this needed?
2. **Proposed Solution**: How should it work?
3. **Alternatives**: Other approaches considered
4. **Additional Context**: Any other relevant info

## Code Review

When reviewing PRs:

- Be respectful and constructive
- Focus on code quality and maintainability
- Suggest improvements, don't demand
- Approve when ready, request changes if needed
- Test the changes locally if possible

## Architecture Guidelines

### File Organization
```
src/
├── app/          # Next.js pages (App Router)
├── components/   # Reusable React components
├── hooks/        # Custom React hooks
├── lib/          # Utilities and configurations
└── workers/      # Background job workers
```

### Component Guidelines
- Use functional components
- Use TypeScript interfaces for props
- Keep components small and focused
- Extract reusable logic to hooks
- Use meaningful prop names

### API Route Guidelines
- Use `withAuth` for protected routes
- Validate input with Zod
- Return consistent error responses
- Use proper HTTP status codes
- Handle errors gracefully

### Database Guidelines
- Use Prisma for all queries
- Use transactions for related operations
- Add indexes for frequently queried fields
- Use meaningful relation names
- Keep migrations clean

## Performance Guidelines

- Minimize database queries
- Use proper indexes
- Optimize images
- Lazy load when possible
- Cache static data
- Use Socket.IO sparingly

## Security Guidelines

- Never expose secrets
- Validate all user input
- Use parameterized queries (Prisma does this)
- Implement rate limiting for APIs
- Use HTTPS everywhere
- Keep dependencies updated

## Documentation

When adding features:

1. Update README.md if needed
2. Update DEPLOYMENT.md for deployment changes
3. Add JSDoc comments for complex functions
4. Update API documentation
5. Add examples where helpful

## Questions?

- Open a GitHub issue
- Join our Discord (if available)
- Email the maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to pile.bio! 🎉

