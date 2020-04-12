# excessivelyadequate.com

My blog, [excessivelyadequate.com](https://excessivelyadequate.com).

If you've come across an error in a post (even if it's only a typo), please let me know, preferably by [filing an issue](https://github.com/doersino/excessivelyadequate.com/issues/new) or [sending a pull request](https://github.com/doersino/excessivelyadequate.com) (in which case you'll be [listed as a contributor](https://github.com/doersino/excessivelyadequate.com/graphs/contributors)).*


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
sudo gem install bundler
```

Then define the following aliases in your `~/.bashrc` and use them from now on (note that the environment variable `JEKYLL_NO_BUNDLER_REQUIRE=true` must be set on my system in order to run Jekyll for some reason, I've got no idea why – but I know it shouldn't be this way and it wasn't this way before):

```
alias jekyllinstall='bundle config set --local path "vendor/bundle"; bundle install'
alias jekyllreinstall='rm Gemfile.lock; bundle config set --local path "vendor/bundle"; bundle install'
alias jekyllserve='JEKYLL_NO_BUNDLER_REQUIRE=true bundle exec jekyll serve'
alias jekyllservei='JEKYLL_NO_BUNDLER_REQUIRE=true bundle exec jekyll serve --incremental'
```

Finally, run `jekyllinstall` and `jekyllserve`.


## Notes

*Mostly for myself.*

* Run `networksetup -setv6off “Wi-Fi”` before doing any fancy Ruby stuff because `api.rubygems.org` (or something on the way there) can't properly speak IPv6. Then turn it back on again using `networksetup -setv6automatic “Wi-Fi”`. Ugh.
* Files to be used in posts are to be sorted into `static/`, theme assets into `assets/`.


## License

My blog posts are licensed under the [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) License.

The software in this repository (i.e. everything *outside* of `_posts`) is licensed under the more liberal MIT License, see `LICENSE`. This license does not, however, apply to the following:

### Libraries

Two JavaScript libraries are used: KaTeX and [Littlefoot](https://github.com/goblindegook/littlefoot). Their licenses can be found in their respective directories in `assets/`.

### Webfonts

All webfonts (i.e. everything located in `assets/fonts/`) are licensed under the SIL Open Font License Version 1.1, a copy of which is included in each font's directory.

* Work Sans has been downloaded from [its GitHub repository](https://github.com/weiweihuanghuang/Work-Sans) at commit `28b121c`.
* Iosevka has been downloaded from [the releases section of its GitHub repository](https://github.com/be5invis/Iosevka/releases), namely `01-iosevka-2.3.3.zip`.
* IBM Plex Serif has been grabbed from [the releases section of its GitHub repository](https://github.com/IBM/plex/releases), namely `Web.zip` of release "v4.0.2".
