# excessivelyadequate.com

My blog, [excessivelyadequate.com](https://excessivelyadequate.com), formerly known as [hejnoah.com](https://github.com/doersino/hejnoah.com).

*If you've come across an error in a post (even if it's only a typo), please let me know, preferably by [filing an issue](https://github.com/doersino/excessivelyadequate.com/issues/new) or [sending a pull request](https://github.com/doersino/excessivelyadequate.com) (in which case you'll be [listed as a contributor](https://github.com/doersino/excessivelyadequate.com/graphs/contributors)).*

---

The rest of this document serves as a *note to self* and is probably of little interest to you, dear reader.


## Style guide

Post titles in AP-style title case. Section headings not in title case (maybe I should revisit that). Abbreviations like "e.g." and "i.e." italicized belong italicized and between commas (Grust style).


### Note on linking

Link pages or media (in `static/`) like `{% link /static/image.jpg %}` but posts like `{% post_url 2024-04-05-name-of-post-without-extension %}` (when linking directly to post sections, add the `#section-title` outside/after the tag). For linking to dynamically-generated resources like the feed (or theme assets, I guess...?), `{{ "/feed.xml" | relative_url }}` ist best.


## Deployment

This website is deployed to my Uberspace `noahdoer@wirtanen` every time I `git push`, which additionally sends it off to GitHub.


### Initial setup

#### GitHub

Create a private repository `excessivelyadequate.com` with a preexisting `README.md`.


#### Uberspace

Perform the following steps:

```
cd ~
git clone --bare https://github.com/doersino/excessivelyadequate.com.git
cd excessivelyadequate.com.git/hooks
touch post-receive
chmod +x post-receive
```

`post-receive` must contain (e.g. via `cat > post-receive`, <kbd>⌘</kbd><kbd>V</kbd>, <kbd>Enter</kbd>, <kbd>ctrl</kbd><kbd>C</kbd>) the following:

```
GIT_REPO="$HOME/excessivelyadequate.com.git"
TMP_GIT_CLONE="$HOME/tmp_excessivelyadequate.com"
PUBLIC_WWW="/var/www/virtual/noahdoer/excessivelyadequate.com"

# make a temporary clone of repo
unset GIT_DIR
if [ ! -d "$TMP_GIT_CLONE" ]; then
    git clone "$GIT_REPO" "$TMP_GIT_CLONE"
    cd "$TMP_GIT_CLONE"
else
    cd "$TMP_GIT_CLONE"

    # avoid breaking the build when force pushing
    git fetch --all
    git reset --hard origin/master

    git pull
fi

# make sure that everything's installed
bundle config set --local path "vendor/bundle"
bundle config set --local deployment "true"
bundle install

# kick off the build
bundle exec jekyll build -s "$TMP_GIT_CLONE" -d "$PUBLIC_WWW"

exit
```

Note thate Ruby and the `bundle` command work out of the box on Uberspace, that's why no setup of them is needed.


#### Laptop

Install ruby from Homebrew since the version shipping with macOS is too old and adjust the `PATH` in your `.bashrc` as explained in the build caveats:

```
brew install ruby
```

Clone the repository:

```
git clone https://github.com/doersino/excessivelyadequate.com.git
```

Edit `excessivelyadequate.com/.git/config`: In the `[remote "origin"]` section, add the following two lines:

```
pushurl = https://github.com/doersino/excessivelyadequate.com.git
pushurl = ssh://noahdoer@wirtanen.uberspace.de/home/noahdoer/excessivelyadequate.com.git/
```

Then move all the files into the local clone.

Now `git add .`, `git commit ...`, and `git push`.

For running Jekyll locally, first install Bundler (which should work just fine with the system-provided Ruby – should this change, just get a more up-to-date Ruby distribution from Homebrew):

```
gem install --user-install bundler  # this might not be required if installing from Homebrew, run which bundler to check if it's already installed as part of Homebrew's Ruby distribution
```

Then define the following aliases in your `~/.bashrc` and use them from now on:

```
alias jekyllinstall='bundle install'  # as of recent versions, installs in ./vendor by default
alias jekyllreinstall='rm Gemfile.lock; bundle install; bundle lock --add-platform ruby'  # make sure to commit the new Gemfile.lock afterwards
alias jekyllserve='bundle exec jekyll serve'
alias jekyllservei='bundle exec jekyll serve --incremental'
```

Finally, run `jekyllinstall` and `jekyllserve`.


## Notes

* Might need to run `networksetup -setv6off “Wi-Fi”` before doing any fancy Ruby stuff because `api.rubygems.org` (or something on the way there) can't properly speak IPv6. Then turn it back on again using `networksetup -setv6automatic “Wi-Fi”`. Ugh.
* Files to be used in posts are to be sorted into `static/`, theme assets into `assets/`.


## License

My blog posts are licensed under the [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) License.

The software in this repository (i.e. everything *outside* of `_posts` and `static`) is licensed under the more liberal MIT License, see `LICENSE`. This license does not, however, apply to the following:

### Libraries

[KaTeX](https://katex.org) is used for rendering math, its license can be found in its directory in `assets/`. As of August 2023, it's used server-side only as described [here](https://www.xuningyang.com/blog/2021-01-11-katex-with-jekyll/), but its minimized stylesheet and fonts (v0.16.8, via [here](https://github.com/KaTeX/KaTeX/releases)) are still part of this repository.

### Webfonts

All webfonts (i.e. everything located in `assets/fonts/`) are licensed under the SIL Open Font License Version 1.1, a copy of which is included in each font's directory.

* Work Sans has been downloaded from [its GitHub repository](https://github.com/weiweihuanghuang/Work-Sans) at commit `28b121c`.
* Iosevka has been downloaded from [the releases section of its GitHub repository](https://github.com/be5invis/Iosevka/releases), namely `01-iosevka-2.3.3.zip`.
* Literata has been grabbed from [the releases section of its GitHub repository](https://github.com/googlefonts/literata/releases/), namely `3.103.zip` of release "3.103".
