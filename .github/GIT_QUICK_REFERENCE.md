# Git Quick Reference

快速參考指南，幫助你使用專案的 git 工作流程。

## 日常 Commit 工作流程

### 1. 查看變更
```bash
git status              # 查看修改的檔案
git diff                # 查看詳細變更
git diff --staged       # 查看已 staged 的變更
```

### 2. Stage 變更
```bash
git add <file>          # 加入特定檔案
git add .               # 加入所有變更
git add -p              # 互動式選擇變更
```

### 3. Commit（使用模板）
```bash
git commit              # 開啟編輯器，使用模板
```

模板會自動載入，填寫範例：
```
feat(search): add fuzzy search for services

- Implement search algorithm with fuzzy matching
- Add keyboard shortcuts (/, Cmd+K, Ctrl+K)
- Support searching across services, pages, and widgets

Closes #123
```

### 4. Commit（快速模式）
```bash
git commit -m "feat: add user authentication"
git commit -m "fix(widgets): resolve memory leak in polling"
git commit -m "docs: update installation guide"
```

## Commit Type 速查

| Type | 用途 | 範例 |
|------|------|------|
| `feat` | 新功能 | `feat(search): add global search` |
| `fix` | Bug 修復 | `fix(widgets): resolve polling issue` |
| `docs` | 文檔變更 | `docs: update README` |
| `style` | 格式化 | `style: format code with prettier` |
| `refactor` | 重構 | `refactor: simplify cache logic` |
| `perf` | 效能改善 | `perf: optimize widget rendering` |
| `test` | 測試 | `test: add unit tests for widgets` |
| `chore` | 建置/工具 | `chore(deps): update dependencies` |
| `ci` | CI 配置 | `ci: add GitHub Actions workflow` |

## 常用 Scope

- `widgets` - Widget 系統
- `addons` - Addon 系統
- `config` - 配置相關
- `ui` - UI 元件
- `i18n` - 國際化
- `api` - API routes
- `deps` - 依賴套件

## 查看歷史

```bash
git log --oneline -10                    # 簡潔格式，最近 10 筆
git log --stat                           # 包含變更統計
git log --graph --decorate --oneline     # 圖形化顯示
git log --author="Your Name"             # 特定作者的 commits
git log --since="2 weeks ago"            # 時間範圍
```

## 修改最後一次 Commit

### 修改 Commit 訊息
```bash
git commit --amend
```

### 加入遺漏的檔案
```bash
git add forgotten-file.ts
git commit --amend --no-edit
```

⚠️ **注意：** 只能修改尚未 push 的 commit！

## 撤銷變更

### 撤銷 Unstaged 變更
```bash
git restore <file>          # 單一檔案
git restore .               # 所有檔案
```

### 撤銷 Staged 變更
```bash
git restore --staged <file> # Unstage 檔案
git reset HEAD <file>       # 另一種方式
```

### 撤銷最後一次 Commit（保留變更）
```bash
git reset --soft HEAD~1
```

### 撤銷最後一次 Commit（刪除變更）
```bash
git reset --hard HEAD~1     # ⚠️ 危險！無法復原
```

## 分支操作

### 建立和切換分支
```bash
git branch feature-name                  # 建立分支
git checkout feature-name                # 切換分支
git checkout -b feature-name             # 建立並切換
git switch -c feature-name               # 新語法
```

### 合併分支
```bash
git checkout main
git merge feature-name
```

### 刪除分支
```bash
git branch -d feature-name               # 安全刪除
git branch -D feature-name               # 強制刪除
```

## Rebase（整理 Commits）

### Interactive Rebase
```bash
git rebase -i HEAD~3        # 整理最近 3 個 commits
```

常用指令：
- `pick` - 保留 commit
- `reword` - 修改訊息
- `squash` - 合併到前一個 commit
- `drop` - 刪除 commit

### Rebase 到主分支
```bash
git checkout feature-branch
git rebase main
```

## Stash（暫存變更）

```bash
git stash                   # 暫存當前變更
git stash list              # 查看 stash 列表
git stash pop               # 還原最新的 stash
git stash apply stash@{0}   # 還原特定 stash
git stash drop              # 刪除最新的 stash
git stash clear             # 清除所有 stash
```

## Remote 操作

### Push
```bash
git push origin main                     # Push 到 remote
git push -u origin feature-name          # 首次 push 新分支
git push --force-with-lease              # 安全的 force push
```

### Pull
```bash
git pull origin main                     # Pull 並 merge
git pull --rebase origin main            # Pull 並 rebase
```

### Fetch
```bash
git fetch origin                         # 下載 remote 變更
git fetch --all                          # 所有 remotes
```

## 查看差異

```bash
git diff                                 # Working directory vs staged
git diff --staged                        # Staged vs last commit
git diff HEAD                            # Working directory vs last commit
git diff main feature-branch             # 比較分支
git diff commit1 commit2                 # 比較 commits
```

## 搜尋

```bash
git log --grep="search term"             # 搜尋 commit 訊息
git log -S "function_name"               # 搜尋程式碼變更
git blame <file>                         # 查看每行的作者
```

## 好用的 Alias

加入到 `~/.gitconfig` 或執行以下命令：

```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'restore --staged'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual 'log --graph --decorate --oneline'
```

使用：
```bash
git st                  # 等於 git status
git visual              # 圖形化 log
```

## 疑難排解

### 不小心 commit 到錯誤的分支
```bash
git log -1              # 記下 commit hash
git reset --hard HEAD~1 # 撤銷 commit
git checkout correct-branch
git cherry-pick <commit-hash>
```

### 不小心刪除的檔案
```bash
git restore <file>      # 還原單一檔案
git restore .           # 還原所有檔案
```

### Merge 衝突
```bash
# 1. 編輯衝突的檔案，解決衝突標記
# 2. 標記為已解決
git add <resolved-file>
# 3. 完成 merge
git commit
```

## 參考資源

- 詳細規範：`.github/COMMIT_CONVENTION.md`
- Commit 模板：`.gitmessage`
- Conventional Commits：https://www.conventionalcommits.org/
- Pro Git Book：https://git-scm.com/book/zh-tw/v2
