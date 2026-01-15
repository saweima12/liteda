# Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Type

Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries
- **ci**: Changes to CI configuration files and scripts
- **revert**: Reverts a previous commit

## Scope (Optional)

The scope could be anything specifying the place of the commit change:

- `widgets` - Widget system changes
- `addons` - Addon system changes
- `config` - Configuration related
- `ui` - UI components
- `i18n` - Internationalization
- `api` - API routes
- `deps` - Dependencies

## Subject

The subject contains a succinct description of the change:

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No dot (.) at the end
- Maximum 50 characters

## Body (Optional)

The body should include the motivation for the change and contrast this with previous behavior.

- Use the imperative, present tense
- Wrap at 72 characters
- Can use multiple lines with "-" for bullet points

## Footer (Optional)

The footer should contain any information about **Breaking Changes** and is also the place to reference GitHub issues that this commit closes.

**Breaking Changes** should start with the word `BREAKING CHANGE:` with a space or two newlines.

## Examples

### Feature with body

```
feat(search): add global search functionality

- Implement search store with Svelte 5 runes
- Add keyboard shortcuts (Cmd+K / Ctrl+K)
- Support fuzzy matching with keyboard navigation

Closes #123
```

### Fix

```
fix(widgets): resolve polling interval memory leak

The widget polling wasn't properly cleaned up on unmount,
causing memory leaks when switching pages.
```

### Breaking change

```
feat(config): migrate to new settings format

BREAKING CHANGE: The settings.yaml format has changed.
Migration guide: docs/migration/v2.md

- Rename 'services' to 'pages'
- Add 'layout' configuration
```

### Chore

```
chore(deps): update dependencies

- Update svelte to 5.16.0
- Update vite to 6.0.0
```

### Documentation

```
docs: add widget development guide

Add comprehensive guide for creating custom widgets
including schema definition and handler patterns.
```

## Tips

1. **Use the template**: Run `git commit` (without `-m`) to use the commit template
2. **Keep it atomic**: One commit = one logical change
3. **Write meaningful messages**: Future you will thank present you
4. **Reference issues**: Link to relevant issues/PRs when applicable
5. **Explain why, not what**: The diff shows what changed, explain why

## Tools

To make commits easier, you can use:

```bash
# Use the commit template (configured in .gitmessage)
git commit

# Amend the last commit message
git commit --amend

# Interactive rebase to clean up history (before pushing)
git rebase -i HEAD~3
```

## Pre-commit Checklist

Before committing, make sure:

- [ ] Code follows project style guide (run `bun run check`)
- [ ] No console.log or debug code left
- [ ] All files are properly formatted
- [ ] Commit message follows convention
- [ ] Changes are atomic and focused

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)
- [Semantic Versioning](https://semver.org/)
