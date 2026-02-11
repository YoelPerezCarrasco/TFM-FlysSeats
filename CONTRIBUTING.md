# Contributing to FlysSeats

Thank you for your interest in contributing to FlysSeats! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other contributors

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- Git
- Azure CLI (for deployment testing)

### Setup Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YourUsername/TFM-FlysSeats.git
   cd TFM-FlysSeats
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd flyseats-frontend
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../backend
   pip install -r requirements.txt
   ```

4. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Frontend Development

1. **Start Development Server**
   ```bash
   cd flyseats-frontend
   npm start
   ```

2. **Code Style**
   - Follow Angular style guide
   - Use TypeScript strict mode
   - Write self-documenting code
   - Add JSDoc comments for public APIs

3. **Component Guidelines**
   - Use standalone components
   - Keep components focused and small
   - Use OnPush change detection when possible
   - Follow mobile-first approach

4. **Service Guidelines**
   - Use RxJS observables
   - Implement proper error handling
   - Add caching where appropriate
   - Use environment configuration

### Backend Development

1. **Start Azure Functions**
   ```bash
   cd backend
   func start
   ```

2. **Code Style**
   - Follow PEP 8
   - Use type hints
   - Write docstrings
   - Handle errors gracefully

3. **Function Guidelines**
   - Keep functions focused
   - Return proper HTTP status codes
   - Log appropriately
   - Validate input

### Testing

#### Frontend Tests

**Unit Tests**
```bash
cd flyseats-frontend
npm test
```

**E2E Tests**
```bash
npm run cypress:open
```

#### Write Tests For
- New components
- New services
- Bug fixes
- Critical user flows

### Commit Guidelines

Follow Conventional Commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(flights): add advanced search filters

Added ability to filter flights by airline, stops, and price range.

Closes #123
```

```
fix(auth): resolve token expiration issue

Fixed bug where expired tokens were not properly handled.

Fixes #456
```

### Pull Request Process

1. **Before Submitting**
   - Update documentation
   - Add/update tests
   - Run linting
   - Test locally
   - Update CHANGELOG.md

2. **PR Description**
   - Describe what changed
   - Explain why the change was needed
   - Link related issues
   - Add screenshots for UI changes

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Unit tests pass
   - [ ] E2E tests pass
   - [ ] Manual testing completed
   
   ## Screenshots
   (if applicable)
   
   ## Related Issues
   Closes #123
   ```

4. **Review Process**
   - Address feedback promptly
   - Keep discussions focused
   - Be open to suggestions
   - Update PR as needed

## Code Review Guidelines

### For Reviewers
- Be constructive and respectful
- Focus on code, not the person
- Explain your reasoning
- Approve when ready

### For Contributors
- Respond to all comments
- Don't take feedback personally
- Ask questions if unclear
- Update code based on feedback

## Project Structure

```
flyseats-frontend/
├── src/
│   ├── app/
│   │   ├── core/           # Core services, guards, interceptors
│   │   ├── features/       # Feature modules
│   │   └── shared/         # Shared components
│   ├── assets/             # Static assets
│   └── environments/       # Environment configs
└── cypress/                # E2E tests

backend/
└── functions/              # Azure Functions
    ├── auth/
    ├── flights/
    └── bookings/
```

## Adding New Features

### Frontend Feature

1. Create feature module in `src/app/features/`
2. Create standalone components
3. Add route configuration
4. Create services if needed
5. Add translations
6. Write tests
7. Update documentation

### Backend Function

1. Create function directory in `backend/functions/`
2. Add `__init__.py` with handler
3. Add `function.json` with bindings
4. Implement business logic
5. Add error handling
6. Update API documentation

## Documentation

- Update README.md for major changes
- Update ARCHITECTURE.md for architectural changes
- Update DEPLOYMENT.md for deployment changes
- Add JSDoc/docstrings to new code
- Keep comments up to date

## Issue Reporting

### Bug Reports

Include:
- Clear title
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots/logs
- Environment details

### Feature Requests

Include:
- Clear title
- Use case
- Proposed solution
- Alternatives considered
- Additional context

## Questions?

- Open a discussion on GitHub
- Check existing documentation
- Review closed issues
- Ask in pull request

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort!
