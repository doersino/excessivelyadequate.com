# excessivelyadequate.com

My blog, [excessivelyadequate.com](https://excessivelyadequate.com).

Feedback and contributions are welcome – feel free to file an issue or send a pull request.


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
bundle install --deployment

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

For running Jekyll locally, execute the following command (it should work just fine with the system-provided Ruby – should this change, just get a more up-to-date Ruby distribution from Homebrew):

```
sudo gem install bundler jekyll
```

Then define the following aliases in your `~/.bashrc` and use them from now on:

```
alias jekyllinstall='bundle install --path ./vendor/bundle'  # the --deployment flag also uses ./vendor/bundle, but requires a Gemfile.lock, which in the case of a Jekyll upgrade will not be current
alias jekyllreinstall='rm Gemfile.lock; bundle install --path ./vendor/bundle'
alias jekyllserve='bundle exec jekyll serve'
alias jekyllservei='bundle exec jekyll serve --incremental'
```

Finally, run `jekyllinstall` and `jekyllserve`.


## Notes

*Mostly for myself.*

* Run `networksetup -setv6off “Wi-Fi”` before doing any fancy Ruby stuff because `api.rubygems.org` (or something on the way there) can't properly speak IPv6. Then turn it back on again using `networksetup -setv6automatic “Wi-Fi”`. Ugh.
* Files to be used in posts are to be sorted into `static/`, theme assets into `assets/`.
