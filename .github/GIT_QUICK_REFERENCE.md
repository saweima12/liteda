# Git Quick Reference

Quick reference guide for the project's Git workflow.

## Daily Commit Workflow

### 1. Review changes
```bash
git status              # Show modified files
git diff                # Show detailed changes
git diff --staged       # Show staged changes
```

### 2. Stage changes
```bash
git add <file>          # Stage specific file
git add .               # Stage all changes
git add -p              # Interactively select changes
```

### 3. Commit (with template)
```bash
git commit              # Open editor with template
```

Template example:
```
feat(search): add fuzzy search for services

- Implement search algorithm with fuzzy matching
- Add keyboard shortcuts (/, Cmd+K, Ctrl+K)
- Support searching across services, pages, and widgets

Closes #123
```

### 4. Commit (quick mode)
```bash
git commit -m "feat: add user authentication"
git commit -m "fix(widgets): resolve memory leak in polling"
git commit -m "docs: update installation guide"
```

## Commit Type Cheat Sheet

| Type | Purpose | Example |
|------|---------|---------|
| `feat` | New feature | `feat(search): add global search` |
| `fix` | Bug fix | `fix(widgets): resolve polling issue` |
| `docs` | Documentation changes | `docs: update README` |
| `style` | Formatting | `style: format code with prettier` |
| `refactor` | Refactor | `refactor: simplify cache logic` |
| `perf` | Performance | `perf: optimize widget rendering` |
| `test` | Tests | `test: add unit tests for widgets` |
| `chore` | Build/tools | `chore(deps): update dependencies` |
| `ci` | CI config | `ci: add GitHub Actions workflow` |

## Common Scopes

- `widgets` - Widget system
- `addons` - Addon system
- `config` - Configuration
- `ui` - UI components
- `i18n` - Internationalization
- `api` - API routes
- `deps` - Dependencies

## View History

```bash
git log --oneline -10                    # Compact format, last 10 commits
git log --stat                           # Include change stats
git log --graph --decorate --oneline     # Graph view
git log --author="Your Name"             # Commits by author
git log --since="2 weeks ago"            # Time range
```

## Amend the Last Commit

### Change commit message
```bash
git commit --amend
```

### Add missing files
```bash
git add forgotten-file.ts
git commit --amend --no-edit
```

⚠️ **Note:** Only amend commits that have not been pushed.

## Undo Changes

### Undo unstaged changes
```bash
git restore <file>          # Single file
git restore .               # All files
```

### Undo staged changes
```bash
git restore --staged <file> # Unstage file
git reset HEAD <file>       # Alternative
```

### Undo last commit (keep changes)
```bash
git reset --soft HEAD~1
```

### Undo last commit (discard changes)
```bash
git reset --hard HEAD~1     # ⚠️ Dangerous! Cannot be undone
```

## Branch Operations

### Create and switch branches
```bash
git branch feature-name                  # Create branch
git checkout feature-name                # Switch branch
git checkout -b feature-name             # Create and switch
git switch -c feature-name               # New syntax
```

### Merge branches
```bash
git checkout main
git merge feature-name
```

### Delete branches
```bash
git branch -d feature-name               # Safe delete
git branch -D feature-name               # Force delete
```

## Rebase (Clean Up Commits)

### Interactive rebase
```bash
git rebase -i HEAD~3        # Clean up last 3 commits
```

Common commands:
- `pick` - Keep commit
- `reword` - Edit message
- `squash` - Merge into previous commit
- `drop` - Remove commit

### Rebase onto main
```bash
git checkout feature-branch
git rebase main
```

## Stash (Save Changes)

```bash
git stash                   # Stash current changes
git stash list              # List stashes
git stash pop               # Restore latest stash
git stash apply stash@{0}   # Restore specific stash
git stash drop              # Drop latest stash
git stash clear             # Clear all stashes
```

## Remote Operations

### Push
```bash
git push origin main                     # Push to remote
git push -u origin feature-name          # First push for new branch
git push --force-with-lease              # Safer force push
```

### Pull
```bash
git pull origin main                     # Pull and merge
git pull --rebase origin main            # Pull and rebase
```

### Fetch
```bash
git fetch origin                         # Download remote changes
git fetch --all                          # All remotes
```

## Compare Differences

```bash
git diff                                 # Working directory vs staged
git diff --staged                        # Staged vs last commit
git diff HEAD                            # Working directory vs last commit
git diff main feature-branch             # Compare branches
git diff commit1 commit2                 # Compare commits
```

## Search

```bash
git log --grep="search term"             # Search commit messages
git log -S "function_name"               # Search code changes
git blame <file>                         # Show per-line authorship
```

## Handy Aliases

Add to `~/.gitconfig` or run these commands:

```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'restore --staged'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual 'log --graph --decorate --oneline'
```

Usage:
```bash
git st                  # Same as git status
git visual              # Graph log view
```

## Troubleshooting

### Committed to the wrong branch
```bash
git log -1              # Note the commit hash
git reset --hard HEAD~1 # Undo commit
git checkout correct-branch
git cherry-pick <commit-hash>
```

### Accidentally deleted files
```bash
git restore <file>      # Restore single file
git restore .           # Restore all files
```

### Merge conflicts
```bash
# 1. Edit conflicted files, resolve markers
# 2. Mark as resolved
git add <resolved-file>
# 3. Finish merge
git commit
```

## References

- Detailed conventions: `.github/COMMIT_CONVENTION.md`
- Commit template: `.gitmessage`
- Conventional Commits: https://www.conventionalcommits.org/
- Pro Git Book: https://git-scm.com/book/en/v2
