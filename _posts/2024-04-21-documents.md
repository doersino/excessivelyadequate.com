---
layout:       post
title:        "Secure Backups of Important Files to Insecure Locations"
date:         2024-04-21 16:00:00 +0200
---

I've mostly[^loseblattsammlung] done away with keeping binders of important documents, instead storing everything in a directory on my computer. In addition to my usual backup routine, which comprises

[^loseblattsammlung]: With the exception of a few paper originals I'm legally required to keep (or not totally confident I'm *not*), which I store in order of receipt in a file folder. (Of course, there's a German word for keeping loose collections of papers: *Loseblattsammlung*.)

* hourly [Time Machine](https://support.apple.com/en-us/104984) backups to an external SSD taped to the back of my display,
* monthly [SuperDuper!](https://shirt-pocket.com/SuperDuper/SuperDuperDescription.html) clones to a disk in a desk drawer, and (...now transitioning from "backup" to "medium-term archival")
* quarterly-ish exports to a fairly inscrutable storage scheme distributed across a frankly deranged amount[^nas] of unlabeled external drives,

[^nas]: Every once in a while, I entertain the idea of getting a NAS, but noise and power consumption (and feature creep – with an always-on computer, I really ought to set up [Plex](https://www.plex.tv) for my definitely-not-[fallen-off-the-back-of-a-truck](https://en.wiktionary.org/wiki/fall_off_the_back_of_a_truck) video collection, maybe get into [Homebridge](https://homebridge.io), automate a few random things etc.) tend to shut any fantasies down relatively quickly – so far...

these documents seem to warrant another "layer" or two of disaster proofing, my implementation of which I'll describe in this post. Notably, those previous layers of my proverbial backup onion all live in my apartment[^backblaze] – and since it's [best practice](https://www.backblaze.com/blog/whats-the-diff-3-2-1-vs-3-2-1-1-0-vs-4-3-2/) to keep at least one backup off site, enabling just that in a secure manner was a primary goal here.

[^backblaze]: In addition to my recurring NAS thought experiments described in the previous footnote, I keep thinking about just setting up [Backblaze](https://www.backblaze.com/cloud-backup) (or similar), but apart from the not-insignificant price tag, the cloud backup solutions I've looked at don't implement encryption satisfactorily: I'd only use one that encrypts the data on my machine (most do!) but *doesn't* [send the decryption keys to the backup service](https://www.backblaze.com/computer-backup/docs/encryption) for convenience's sake (because then what's the point of encryption beyond in-transit security?).

Here's a heavily-redacted screenshot of the files[^german] in question (because images break up the monotony of mediocre prose):

[^german]: 99% of what I do on computers is in English, so in retrospect, I'm not sure why I stuck to German for the naming of subdirectories here. Then again, translating terms like "Lohnsteuerbescheinigungen", "Sozialversicherungsausweis" and "Steueridentifikationsnummer" into another language might be akin to denying my cultural heritage.

{:.wide}
![]({% link /static/documents.png %})


## Compression

The first step of the backup solution I came up with zips up the directory using `tar -cz ".../path/to/the/documents/"`, yielding a `.tar.gz` bitstream. That's less to save on storage space (with the files being mostly scans, screenshots, and PDFs, trusty old [Gzip](https://jvns.ca/blog/2013/10/23/day-15-how-gzip-works/) can only squeeze out about 20% of redundancy) and more because a singular file is easier to work with than the original directory.


## Encryption

There's confoundingly many ways to encrypt a file – pick your poison. I find that in this kind of context, OpenSSL tends to come in handy – it's an industry standard, can be found preinstalled on many systems, and is reasonably easy to use, even if you want to use a password instead of a [keypair](https://opensource.com/article/21/4/encryption-decryption-openssl).

After a bit of searching around, together with the `tar` command from above, the following invocation...

```sh
tar -cz ".../path/to/the/documents/" | openssl enc -aes-256-cbc -md sha512 -pbkdf2 -iter 1000000 -pass pass:"correct-horse-battery-staple" -out ".../temporary/documents.tar.gz.bin"
```

...seems to do the trick (that's not my actual [password](https://xkcd.com/936/), of course). I found it in a [Stack Overflow answer](https://unix.stackexchange.com/a/507132) which succinctly explains the meaning of the `openssl` arguments:

> - `-aes-256-cbc` is what you *should* use for maximum protection [...],
>
> - `-md sha512` is a bit the faster variant of SHA-2 functions family compared to SHA-256 while it might be a bit more secure [...],
>
> - `-pbkdf2`: use PBKDF2 (Password-Based Key Derivation Function 2) algorithm,
>
> - `-iter 1000000` is overriding the default count of iterations (which is 10000) for the password [...].

There's no standard file extension for thusly encrypted data, so I chose `.tar.gz.bin` to signify that it's some sort of binary blob containing `.tar.gz` data.

*Note on sensitive data and command-line applications:* Because I only ever run this command on my local machine, I don't worry greatly about passing the encryption password within a command-line argument – on a shared server, where other users might see it briefly pop up in the process list, another solution (*e.g.*, environment variables or a file[^xargs]) would be advisable.

[^xargs]: If you're going to store the password (and nothing else) in a file, be careful not to include any whitespace at the beginning or end of the file (*e.g.*, a newline character) – or, more resiliently to future inattention when, say, changing the password, just strip off any whitespace. In the command above, `... -pass pass:"$(cat ".../path/to/your/password.file" | xargs)" ...` would do the trick.


## Distribution

I just copy the resulting `.tar.gz.bin` file to a couple of locations – presently, that's my iCloud Drive[^paranoia] and the server this website is running on (for which `scp` is my tool of choice). Since the file is encrypted, there's technically no reason (apart from common sense) not to distribute it widely, assuming that the password's going to remain[^passman] private. ~~Ask me for a copy and I might well send you one!~~

[^paranoia]: Where, as far as I can tell, Apple (and whatever American goverment agencies might be interested) can access it, hence the encryption. *I'm not paranoid, you're paranoid!*

[^passman]: I keep the encryption password in my password manager (whose [KeePass](https://keepass.info)-compatible database is also backed up in various locations).

---

## ...and back again

In the event of a disaster where my computer (and plethora of hard drives (plus a few other copies I didn't mention (yes, I'm a digital prepper))) were magically deleted from reality *but* I'd still be around to retrieve the `.tar.gz.bin` file and recall the associated password, the following pipeline would yield the original directory.

```sh
openssl enc -d -aes-256-cbc -md sha512 -pbkdf2 -iter 1000000 -pass pass:"correct-horse-battery-staple" -in ".../temporary/documents.tar.gz.bin" | tar -xzf -
```
