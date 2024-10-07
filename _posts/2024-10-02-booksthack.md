---
layout:       post
title:        "BookStack Hacks: Adding External Link Icons, Fewer Clicks to Copy a Page's Permalink, and More"
date:         2024-10-02 12:00:00 +0200
---

At [work](https://www.suedweststrom.de)[^threeoffour], we recently moved our internal knowledge base from a relatively creaky [DokuWiki](https://www.dokuwiki.org/dokuwiki) instance to a much more modern [BookStack](https://www.bookstackapp.com) setup. It's great and *requires* very little configuration, which – perhaps counter-intuitively – made me *want* to inflict some custom CSS (and a bit of JavaScript) upon[^customization] it.

[^threeoffour]: Three of my most recent four posts start with those two words. Boss makes a dollar, I make a dime – and get to (under certain conditions) write about stuff I build on company time.

[^customization]: In the "Customization" category of BookStack's settings, there's a "Custom HTML Head Content" option that allows an administrator to conveniently patch a bit of code into each page's `<head>` element without having to futz with template files (and thus complicating upgrades).

This kind of thing is even encouraged by [Dan Brown](https://danb.me), BookStack's developer, who has built a page collecting some [community-developed hacks](https://www.bookstackapp.com/hacks/) in addition to including a number of handy [hooks and other features that encourage hackery](https://www.bookstackapp.com/docs/admin/hacking-bookstack/) with BookStack itself.


## Adding external (and attachment) link icons

To motivate adding visual distinction (*aka*, perhaps, noise), let me divide the kinds of links commonly found in a wiki into three or four categories, which a vanilla BookStack installation renders identically.

* Internal links to other pages in that wiki – these are commonly called *wikilinks*. In a well-connected wiki, most links are going to be wikilinks, so they ought to look like standard links.

* Internal wikilinks whose target pages don't exist. [MediaWiki](https://www.mediawiki.org/wiki/MediaWiki) (which Wikipedia runs on) and DokuWiki color such *dead links* red. This alerts readers to that fact that they won't find further information behind them and nudges editors towards filling in those gaps.

  Sadly, BookStack presently doesn't provide the means to render dead links differently than links to existing pages. *(I've recently [inquired](https://github.com/BookStackApp/BookStack/issues/5163#issuecomment-2386914611) whether this would be possible to implement.)*

* Links to other[^www] websites. To signal that by following such an *external link*, you're leaving the safe and well-maintained confines our your knowledge base, MediaWiki and DokuWiki display an "<svg xmlns="http://www.w3.org/2000/svg" style="height: 0.8em;" viewBox="0 0 12 12"><g transform="translate(-1,1)"><path fill="currentColor" d="M6 1h5v5L8.86 3.85 4.7 8 4 7.3l4.15-4.16zM2 3h2v1H2v6h6V8h1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1"/></g></svg>" icon[^iconlicense] after the link text. Easily added to BookStack with some moderately-fancy CSS!

* This one's specific to BookStack: Links to *attachments*. Attachments are also listed in a page's sidebar, but to include some context, it sometimes makes sense to refer to them from within the page text. What's more, since BookStack configures the underlying web server to prompt the user's browser to *download* attachments (instead of *displaying*, say, PDFs), it's handy to have attachment links stand apart.

[^www]: Like this one!

[^iconlicense]: This is, in fact, MediaWiki's icon. As far as I can tell, being part of MediaWiki, it's made available under the [GNU General Public License](https://www.mediawiki.org/wiki/Copyright).

So! Adding MediaWiki's external link icon into BookStack is relatively easy with CSS – some explanation after the code:

```html
<style>
  /* mark external links like on wikipedia https://en.wikipedia.org/wiki/Help:External_link_icons */
  /* svg from https://en.wikipedia.org/w/skins/Vector/resources/skins.vector.styles/images/link-external-small-ltr-progressive.svg, licensed under the gnu general public license https://www.mediawiki.org/wiki/Copyright */
  /* converted for use in css with https://www.svgbackgrounds.com/tools/svg-to-css/ */
  .page-content a[href^="http"]:not([href^="https://your-bookstack.url"]) {
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><title>external link</title><path fill="%23206ea7" d="M6 1h5v5L8.86 3.85 4.7 8 4 7.3l4.15-4.16zM2 3h2v1H2v6h6V8h1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1"/></svg>');
    background-position: center right;
    background-repeat: no-repeat;
    background-size: 0.857em; /* matches the 12px icon size given bookstack's default 14px text size */
    padding-right: 1em;
  }
</style>
```

The CSS selector works like this: `.page-content` is a container element wrapped around, unsurprisingly, page content (it's also applied to the editor) but not BookStack's UI; `a[href^="http"]` selects all links within that whose targets start with `http` (importantly, this makes the rule *not* apply to relative links, which are internal by definition); and `:not([href^="https://your-bookstack.url"])` – modify this part to match your setup – *excludes* links beginning with your BookStack instance's base URL, *i.e.*, wikilinks.

Any links matched by the selector are padded rightwards to make space for the SVG icon defined in the `background-image` property. It's *so* neat how you can drop SVG code – sometimes requiring [minor modifications](https://www.svgbackgrounds.com/tools/svg-to-css/), but no [Base64](https://www.base64decode.org) obfuscation – straight[^nocurrentcolor] into CSS declarations. The `background-size` is chosen to yield a crisp 12-pixel icon at BookStack's default text size.

[^nocurrentcolor]: Though you [can't](https://stackoverflow.com/a/76006610) refer to CSS variables or special keywords like `currentColor` from within SVGs embedded in this manner.

Similarly, with a different selector and another[^othericon] icon "<svg xmlns="http://www.w3.org/2000/svg" style="height: 0.8em;" viewBox="1 0 10.5 12"><g transform="translate(1,1)" fill="currentColor"><path d="M2 1V10h6v-8h1v8c0 .5523-.4477 1-1 1h-6c-.5523 0-1-.4477-1-1v-8c0-.5523.4477-1 1-1h6c.5523 0 1 .4477 1 1l-7 0" /><path d="M 7,4 H 3 V 3 h 4" /><path d="M 7,6 H 3 V 5 h 4" /><path d="M 7,8 H 3 V 7 h 4" /></g></svg>", you can mark links to attachments:

[^othericon]: Hand-coded (with some help from [SvgPathEditor](https://yqnn.github.io/svg-path-editor/)) based on the previous icon.

```html
<style>
  /* similarly, mark links to attachments */
  .page-content a[href^="https://your-bookstack.url/attachments/"] {
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><title>attachment link</title><g transform="translate(1,1)" fill="%23206ea7"><path d="M2 1V10h6v-8h1v8c0 .5523-.4477 1-1 1h-6c-.5523 0-1-.4477-1-1v-8c0-.5523.4477-1 1-1h6c.5523 0 1 .4477 1 1l-7 0" /><path d="M 7,4 H 3 V 3 h 4" /><path d="M 7,6 H 3 V 5 h 4" /><path d="M 7,8 H 3 V 7 h 4" /></g></svg>');
    background-position: center right;
    background-repeat: no-repeat;
    background-size: auto 0.857em; /* matches the 12px icon size given bookstack's default 14px text size */
    padding-right: 0.92em;
  }
</style>
```

*(Curious what that'll look like? You'll find a screenshot, also including what's covered below, at the end of the post.)*


## Fewer clicks to copy a page's permalink

At the time of writing, BookStack's page URLs look like `https://your-bookstack.url/books/the-two-towers/page/the-last-march-of-the-ents`. Were a [friendly](https://en.wikipedia.org/wiki/List_of_Friends_episodes) editor to rename that page to "The One Where the Ents Flood Isengard", the URL would change accordingly, breaking[^revisionsystem] inbound links. Modifying book titles is even more impactful, affecting the URLs of all pages located in the relevant book.

[^revisionsystem]: Old links may continue to work, but that's not something you can rely on, according to [BookStack's documentation](https://www.bookstackapp.com/docs/user/content-permalinks/): "Upon name changes of the book or page, BookStack will use the revision system to attempt resolving when old links are used but it is possible for some actions to cause old page links to no longer lead to the updated content."

While BookStack is smart enough to cascade name changes, *i.e.*, it automatically adjusts internal links as you rename pages (and books, and chapters), external references to BookStack don't receive this treatment, of course. At work, this matters because we refer to BookStack pages in all kinds of places – internal tools, infrastructure alerts, task descriptions in various automation tools, and more – to provide context and more information.

To avoid links dying as we occasionally rename and move stuff, we[^trytorememberto] refer to *permalinks* instead of the human-readable URLs: Internally, each page is stored with identifier like `1337`, and links of the form `https://your-bookstack.url/link/1337` then redirect to the "standard" URL. BookStack [provides that permalink](https://www.bookstackapp.com/docs/user/content-permalinks/) in a slightly roundabout way:

[^trytorememberto]: ...try to remember to...

> Simply select any block of text within a page and you'll see a small popup box. Within this popup box will be an input containing the page permalink. A copy button next to the input allows you to copy the link with a single click.

During our migration from DokuWiki, where we had to update a whole bunch of links to now point to BookStack, this felt like too many clicks, so I wrote a little bit of JavaScript that adds a "Copy permalink" button to every page's sidebar:

```html
<script>
  // add a permalink, uh, link to the details section of the sidebar
  addEventListener("load", e => {
  
    // check if we're on a page (shelves/books/chapters also have ids but permalinks to these don't work)
    const isPage = !!document.querySelector("#page-details");
  
    // determine page id - can be extracted from the form for the "favorite" button in the sidebar of shelf/book/chapter/page pages
    const idInput = document.querySelector('.actions form input[name="id"]');
  
    if (isPage && idInput) {
      const id = idInput.value;
  
      // construct permalink url (baseUrl != location.origin if bookstack is installed in a subdirectory, hence some substring shenanigans)
      const baseUrl = location.href.substring(0, location.href.indexOf("/books/"));
      const permalinkUrl = `${baseUrl}/link/${id}${location.hash}`;
  
      // link icon taken from resources/icons/link.svg
      const linkIcon = '<svg class="svg-icon" data-icon="link" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1M8 13h8v-2H8zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5"></path></svg>';
      const permalinkTitle = 'Won\'t change when you rename (or move) pages or books.'
      const permalinkLabel = 'Copy permalink';
      
      const permalinkHtml = `<a id="copy-permalink" href="${permalinkUrl}" class="entity-meta-item" title="${permalinkTitle}">${linkIcon}${permalinkLabel}</a>`;
  
      // append permalink to details section of sidebar
      const sidebarDetailsElement = document.querySelector('.entity-meta');
      sidebarDetailsElement.insertAdjacentHTML('beforeend', permalinkHtml);
  
      // define click handler to copy permalink to clipboard
      const permalinkElement = document.querySelector("#copy-permalink");
      permalinkElement.addEventListener("click", e => {
          e.preventDefault();
          navigator.clipboard.writeText(permalinkUrl);

          // color link green, then fade back to default color
          permalinkElement.style.color = "var(--color-positive)";
          permalinkElement.style.transition = "";
          setTimeout(() => {
            permalinkElement.style.color = "";
            permalinkElement.style.transition = "color 1s";
          }, 2000);
      });
    }
  });
</script>
```

The inline comments explain what's happening in nigh-excruciating detail, but in short: The script determines the page's identifier, uses that to assemble a permalink, which it then patches into the sidebar, finally adding a click handler to copy the permalink to the clipboard (while providing visual feedback) instead of navigating to it.


## Displaying banners (or making other style changes) based on tags

To perform the initial migration of our DokuWiki content into BookStack, we'd built a script that renders DokuWiki's formatting syntax as HTML, adjusts wikilinks to target BookStack's URL scheme, collects images and other media, then uploads all that via [BookStack's API](https://www.bookstackapp.com/docs/admin/hacking-bookstack/#bookstack-api). This process transferred most pages just fine, but some were in need of minor adjustment – which is why we had our script set a tag `check-import` on each page, aptly named to indicate the need to manually check whether everything's still up to snuff.

Because tags are relatively inconspicuous[^dailyuse], we were glad to find out that BookStack registers page tags[^pagetags] in the form of [CSS classes on the `<body>`](https://www.bookstackapp.com/docs/admin/hacking-bookstack/#tag-classes) element...

[^dailyuse]: As they should be in daily use, of course!

[^pagetags]: I've [filed an issue](https://github.com/BookStackApp/BookStack/issues/5217) to explore the possibility of adding book and chapter tags into the `<body>`'s class list, as well. (My thinking is that setting subtly different background colors for all pages located in certain books would provide useful visual distinction.)

> While primarily for categorization, tags within BookStack can also provide opportunities for customization. [...] As an example, a tag name/value pair of `Priority: Critical` will apply the following classes to the body: `tag-name-priority`, `tag-value-critical`, `tag-pair-priority-critical`.

...allowing us to, in combination with a `::before` pseudo-element and the CSS `content` property, add an prominent explanatory banner to the top of any page tagged `check-import` which automatically disappears upon removal of that tag:

```html
<style>
  /* pages not yet checked after our migration from dokuwiki are tagged, which bookstack helpfully registers in the form of classes on the body - since those tags are pretty subtle, make things a bit more noisy */
  .tag-name-checkimport #bkmrk-page-title::before {
    content: "This page imported from DokuWiki still needs checking – in case you've got a minute...";
    color: var(--color-warning);
    font-size: 14px;
    font-weight: bold;
    line-height: 1.5;
    display: block;
    border: 1px solid var(--color-warning);
    border-radius: 0.2em;
    background-color: color(from var(--color-warning) srgb r g b / 0.1);  /* brighten color for background */
    padding: 0.5em 0.75em;
    margin-bottom: 1em;
  }
</style>
```

There's nothing fancy here apart from my use of the [`color()` function](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color) (a relatively new[^colorfunction] addition to the CSS specification) to brighten the `var(--color-warning)` defined in BookStack's stylesheet. 

[^colorfunction]: This was my first time using it, and I'm head over heels!

We've also set up a job that regularly dynamically generates certain pages (mostly infrastructure overviews) based on data collated from various sources. To indicate that such pages shouldn't be edited manually, they're equipped with a tag `auto-update` that's similarly associated with a CSS-powered notice:

```html
<style>
  /* similarly, point out that changes on auto-updated pages won't be persisted */
  .tag-name-autoupdate #bkmrk-page-title::before {
    content: "This page is regularly dynamically generated by an external program - any changes you make here will be overwritten during the next update.";
    color: var(--color-info);
    font-size: 14px;
    line-height: 1.5;
    display: block;
    border: 1px solid var(--color-info);
    border-radius: 0.2em;
    background-color: color(from var(--color-info) srgb r g b / 0.1);  /* brighten color for background */
    padding: 0.5em 0.75em;
    margin-bottom: 1em;
  }
</style>
```

(We could, alternatively, have the job that's generating these pages include a variant of this notice *within* the page content – but I prefer this approach.)

---

With these modifications in place, the screenshot below shows how a page[^bookstackdemo] might now appear: Notice the tag-dependent banner up top, the "Copy permalink" item in the sidebar, and the icons next to some links.

[^bookstackdemo]: In BookStack's [demo instance](https://demo.bookstackapp.com), in this case.

{:.wide}
![]({% link /static/booksthack.jpg %})
