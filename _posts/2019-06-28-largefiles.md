---
layout:       post
title:        "Removing Large Files From a Git Repository's History"
date:         2019-06-28 20:00:00 +0200
---
Part of what makes Git so useful is that it keeps every version of every file you commit to a repository. For files that are changed frequently, this implies a lot of storage overhead. Git tries to keep this overhead manageable by compressing similar files in the repository's history into [packfiles](https://git-scm.com/book/en/v2/Git-Internals-Packfiles), making storage of code and other text-based file formats very space-efficient.

However, this deduplicating approach to compression doesn't work well for large binary files where the differences between versions are significant, such as images, PDFs, SQLite databases or other non-source data. This is why almost every Git guide discourages commiting these types of files[^generated] – they make your repository [balloon in size](https://www.youtube.com/watch?v=0_KQ1Uwvxn0) much more quickly than you might expect!

If you, like me, have resisted this advice[^why] and now want to purge a large file from your Git history, run the following commands:

```bash
FILE='path/to/file.ext'

# optional: make a backup of the file's current version
cp "$FILE" /tmp/

# purge the file from the history of all branches – this might take a while
git filter-branch --index-filter "git rm -rf --cached --ignore-unmatch $FILE" HEAD
git gc

# optional: restore and commit backupped version
cp /tmp/$(basename "$FILE") "$FILE"
git add "$FILE"
git commit -m "Re-add $FILE"

# push the changes to any remotes
git push --force
```

This might take a few minutes, but Git does a good job keeping you updated on its progress.

Please note that this is a bit of a *dangerous* operation (it rewrites your repository's entire history, notably changing all commit hashes), so you should check in with your contributors first. It's probably a decent idea to make a full backup, too.



[^generated]: *Especially* if the files can be regenerated quickly and easily from the repository's contents.
[^why]: In my case, I was frequently adding to a LaTeX-based list of recipes, with a photo for each recipe. I eventually (when the repository's size approached a gigabyte) realized that there was no point in maintaining the resulting PDF in Git, hence this post. (My working copy of the repository lives in my Dropbox anyway, so I'm able to access the PDF from anywhere, at any time.)
