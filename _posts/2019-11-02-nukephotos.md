---
layout:       post
title:        "Using Shortcuts to Delete All Photos Not Located in a Specific Album on iOS"
date:         2019-11-02 15:00:00 +0100
---
*This post has a long introduction that appears to go off in a direction opposite of what the title suggests, but bear with me – I'll get to it eventually.*

Everyone takes photos and videos on their phone, yet only few have robust backup schemes in place. Most rely on the cloud provider of their choice keeping their photos safe, which is fraught with risks:

* Someone could social-engineer their way into one's account and wreak havoc.
* What happens to the data if the service is going out of business on short notice?
* [Algorithms gone rogue banning user's accounts](https://medium.com/@alexhowlett/youtube-accidentally-permanently-terminated-my-account-4b5852c80679) isn't unheard of.
* Silent sync breakdowns can go unnoticed for months.
* ...

As a result, the way I handle photos taken with my phone is somewhat idiosyncratic and, admittedly, unnecessarily complicated. So idiosyncratic, in fact, that I've written an [extensive Python script](https://github.com/doersino/apple-photos-export) which crawls the Photos.app-internal database and archives its contents in a format I like.


## How I export my photos

At the time of writing, my process is basically this:

1. Capture media on my iPhone 7[^capabilities], which is backed up to iCloud whenever a wifi signal is within reach. That's just temporary – in case I drop my phone off a cliff or into an ocean, or both at the same time, before I can get back to my computer and proceed with step 2.

2. Import those photos, videos, slomos, timelapses, and panoramas (or at least any new arrivals since the most recent import) into Apple Photos on my Mac. This also imports other media that's ended up in the phone's Photos library, such as photos edited and posted with Instagram (great, I want to keep those), *but also photos and videos I've received via WhatsApp (which I'm not yet sure whether or how best to archive)*.

3. This is where my bespoke Python script comes in: It queries the SQLite database[^exposed] that Photos is built around, copying any not-yet-archived media into my archive[^locationlocationlocation] while categorizing and renaming them to my liking. How this works is explained in the `README.md` that's available [here](https://github.com/doersino/apple-photos-export), it's not important for the remainder of this article.

This could in theory continue for a couple of years without either my phone or my laptop running out of space, but I like to be proactive about these things. So, not yet sure how to handle WhatsApp photos, *I was looking for a way of batch-deleting photos off my phone without touching anything in the WhatsApp album*.


## Shortcuts to the rescue!

Shortcuts makes this filtering step incredibly easy, and it works surprisingly well – much better than other components of this photo purge process, as I'll relay in a minute. Here's the shortcut in all of its three-step glory:

{:.center}
![]({{ "/static/nukephotos.jpg" | relative_url }})

{:.caption}
The shortcut in all its glory.

After around a year of using an iPhone, I had accumulated just shy of 6000 photos, so it took a few (very[^picard] paranoid) invocations of the shortcut to clear them all out. The limit of 1000 photos at a time is chosen arbitrarily, it's mostly there to keep any *is-it-working-or-stuck* anxieties at bay – deleting more than 1000 photos at once can take a minute.


## Some cleanup required

I followed this up by wiping the Photos library on my Mac, which was just a case of pressing <kbd>⌘</kbd><kbd>A</kbd>, then <kbd>⌘</kbd><kbd>←</kbd>, and finally emptying the trash that's kept inside Apple Photos – this took a good 15 minutes, I'm not entirely sure why.

Note that "Delete Photos", the final step of the shortcut, just means moving them to the "Recently Deleted" section in the Photos app. Media banished to this section disappears on its own after 30 days, so that wasn't an issue *directly* – rather, Photos.app on the Mac doesn't seem to ignore this section as it should, instead showing the just-deleted media as fresh and ready to import.

As a result, I needed to completely remove the discarded photos from the phone, but this wasn't wholly trivial: Whilst there is a "Delete All" option in the "Recently Deleted" section, it kept churning for a long time without any discernible effect (apart from most thumbnails going blank). In the end, I needed to select all photos individually and delete them in batches, which was made sort of tolerable thanks to the [swipe-to-select functionality provided by `UICollectionView`](https://stackoverflow.com/questions/27390728/uicollectionview-drag-finger-over-cells-to-select-them).

(Yes, getting all of this set up and documented took the better part of a morning and wasn't going to be necessary for a while – but having figured it out, I'm sure it'll go faster next time, or if I'm ever in a hurry. Or so I tell myself.)



[^capabilities]: That means no fancy wide-angle photos, no portrait mode, and no [slofies](https://www.youtube.com/watch?v=KEc3aGjN228) – live photos are pretty much the fanciest thing it does.
[^exposed]: Frankly, I'm surprised that it exists in a non-encrypted, sort-of-user-accessible way, and I wonder how long it's going to remain exposed, with Apple being Apple. This is one reason why I haven't upgraded to macOS Catalina yet (the other main reason being Photoshop CS6's 32-bit-ness).
[^locationlocationlocation]: The archive takes the shape of neatly sorted *files* located on a bunch of mirrored, independent external hard drives. That's far from ideal, but thanks to the versatility of "dumb" files, this scheme could trivially be extended to include a NAS and an S3 bucket.
[^picard]: Essentially involving a [quadruple take](https://www.youtube.com/watch?v=XFMrBldVk0s) to make sure the photos were stowed away safely. Gotta *make it so*.
