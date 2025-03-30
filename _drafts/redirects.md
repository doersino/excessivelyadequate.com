---
layout:       post
title:        "Wikipedia-style Redirects in BookStack"
date:         2025-03-30 21:45:00 +0200
---

In lieu of writing a novel introduction, allow me to recycle[^planet] the one from a previous post...

[^planet]: It's good for the planet.

> At [work](https://www.suedweststrom.de), we recently moved our internal knowledge base from a relatively creaky [DokuWiki](https://www.dokuwiki.org/dokuwiki) instance to a much more modern [BookStack](https://www.bookstackapp.com) setup. It's great and *requires* very little configuration, which – perhaps counter-intuitively – made me *want* to inflict some custom CSS (and a bit of JavaScript) upon it.

...in which I wrote about adding [external link icons, a button to copy a page's permalink, and tag-dependent banners]({% post_url 2024-10-02-booksthack %}). All of this was possible without touching[^complicate] BookStack's source code, instead relying on a bit of CSS and JavaScript hacked into the "Custom HTML Head Content" option of BookStack's settings.

[^complicate]: Which would unacceptably complicate updates. (Lesson learned more than the nominal "once": Make updates as simple as possible to ensure they're *actually* done.)

Same goes for *redirects* as I've implemented[^slow] them.

[^slow]: Before dropping you into the "background" section, let me admit that this implementation happened on a whim during a slow Friday afternoon (on which I had a bit of a headache to boot). So the "background" section is a bit of a retcon and really, 'tis all because I had an idle thought: "Hey, redirects are a thing on Wikipedia, so why not BookStack? Can I do this in JS? I think so, let's try it!"


## Background

On Wikipedia – where I got[^kiddo] the idea from – redirects [cover all kinds of situations](https://en.wikipedia.org/wiki/Wikipedia:Redirect#Purposes_of_redirects) where a page needs to be reachable under multiple names: think synonyms, alternate names, common misspellings, or non-standard romanizations. Increasing discoverability of sections of long articles by redirecting from identically-named pages is another use case.

[^kiddo]: *Anecdote:* I was a nerdy kid. I remember having a book about Wikipedia (probably got it for a birthday because my nerdiness came with a side of being unable to conceal it) when I was like 11 or 12, which is almost 20 years ago now. Just went looking for it and I'm pretty sure it's [this one](https://upload.wikimedia.org/wikipedia/commons/8/8b/WikiPress_1_Wikipedia.pdf). (Warning: 270-page PDF with lots of long German words.) Pages 199-203 are about redirects, which, I now seem to recall, really appealed to me back then for some inexplicable reason...? So adding redirects into BookStack turned out to be one of these full-circle moments you tend to encounter with increasing frequency as you age.

In BookStack, depending on how large your knowledge base is, few of these reasons may apply. But at work, we've found that the structure dictated by BookStack's [book→chapter→page hierarchy](https://www.bookstackapp.com/docs/user/content-overview/) sometimes results in related topics becoming scattered across two or three "subtrees", making it a bit tricky to find all relevant information from, say, a chapter index.

To make such connections more immediately apparent, we now tend to employ redirects sort of as "see also" pointers[^concept] visible at the book/chapter overview level. *(That's in addition to [reorganizing things](https://www.bookstackapp.com/docs/user/organising-content/) as required, which is less of a band-aid solution, of course.)*

[^concept]: That's also a concept [~~stolen~~adapted](https://en.wikipedia.org/wiki/Wikipedia:Manual_of_Style/Layout#%22See_also%22_section) from Wikipedia.


## Syntax

Seeing as you're now totally convinced that wiki redirects are the best[^marginally] thing since sliced bread, here's how you'd set one up.

[^marginally]: Alright, I'll settle for "marginally useful".

### On Wikipedia

Let's say there's a page titled "VPN Gateway" but those darn readers[^real] just keep searching for "VPN Appliance". To keep the 404s away, one might create another page under "VPN Appliance" with the following content.

[^real]: Or, more likely – let's be real – "AI" crawlers. *(The author sighed in mild dismay at the state of the internet while penning this footnote.)*

```
#REDIRECT [[VPN Gateway]]
```

If a reader now searched for "VPN Appliance" (or went directly to the URL of that page, *e.g.*, after being linked to it), they'd land on "VPN Gateway" with a little notice disclosing that they've been redirected.

### In BookStack

My implementation in BookStack is meant to be used identically, the sole difference stemming from that fact that Wikipedia is written using the [wikitext](https://en.wikipedia.org/wiki/Help:Wikitext) markup language whereas BookStack's [default editor](https://www.bookstackapp.com/docs/user/wysiwyg-editor/) is of the WYSIWYG variety.

So if you wanted to redirect searches like "Oh no, everything's down" to your server outage plan, you'd create a page with that name and the following content.

> #REDIRECT [https://demo.bookstackapp.com/books/it-department/page/server-outage-plan](https://demo.bookstackapp.com/books/it-department/page/server-outage-plan)

Note that the reference to the redirect target must be an actual link – just plain text isn't enough – so type a space after pasting it in to turn it into one. That's because

1. it makes parsing out the redirect target basically trivial,
2. there might be [changes](https://github.com/BookStackApp/BookStack/issues/5411) to how/if renaming pages affects existing inbound links in future, and
3. this way, it'll still work without JavaScript (just, y'know, requiring an additional click) *or* if a future change to BookStack's HTML markup were to break my code.

It's also worth pointing out that my implementation really just follows any link you put after "#REDIRECT", so it also supports redirects to books, chapters, sections of pages, or even external websites.

## Implementation

At last!

Maintaining the same ridiculous comments-to-code ratio as in my [previous post on BookStack hacks]({% post_url 2024-10-02-booksthack %}), I don't think the code requires all that much explanatory prose, yet I'll still write a few paragraphs – with a screenshot or two – after the listing.

```html
<script>
  // make wikipedia-style redirects possible, see https://en.wikipedia.org/wiki/Wikipedia:Redirect
  // to redirect, create a page whose content begins with "#REDIRECT", then a link
  addEventListener("load", e => {

    // determine base url (baseUrl != location.origin if bookstack is installed in a subdirectory, hence some substring action)
    const baseUrl = location.href.substring(0, location.href.indexOf("/books/"));

    // helper function to show a notice above the page heading
    // note: "position: absolute" to avoid shifting content around a split-second after page load, which can be jarring
    const showRedirectNotice = message => {
      const redirectNotice = `
        <p style="opacity: 0.75; font-style: italic; position: absolute; margin-top: -0.2em; overflow-x: hidden;">
          (${message})
        </p>
      `;
      document.querySelector(".content-wrap").insertAdjacentHTML("afterbegin", redirectNotice);
    }

    // visual flourish: italicize redirect pages in book/chapter overviews and search results
    const listedPages = document.querySelectorAll(".entity-list .entity-list-item.page");
    listedPages.forEach(listedPage => {
      const snippet = listedPage.querySelector(".entity-item-snippet .text-muted");
      if (!!snippet && snippet.textContent.trim().startsWith("#REDIRECT")) {
        listedPage.style.fontStyle = "italic";
      }
    });

    // CASE 1: ON REDIRECT PAGE

    // only do stuff if we're on a page and the first paragraph begins with "#REDIRECT"
    const isPage = !!document.querySelector("#page-details");
    const firstParagraph = document.querySelector(".page-content p");
    if (isPage && firstParagraph.textContent.trim().startsWith("#REDIRECT")) {

      // quit if the url query string contains "no_redirect" (to enable the user to edit the page)
      if (location.search.includes("no_redirect")) {
        showRedirectNotice("Not redirected due to <code>no_redirect</code> URL parameter")
        return;
      }

      // also quit if it looks like the user has just edited the page
      if (document.querySelector(".notification.pos span").textContent == "Page successfully updated") {
        showRedirectNotice("Not redirected because you've just updated this page – reload to be redirected anyway")
        return;
      }

      // parse out target url
      const redirectTargetUrl = firstParagraph.querySelector("a").href;

      // if it's an external link, just go there
      const isExternalLink = !redirectTargetUrl.startsWith(baseUrl);
      if (isExternalLink) {
        location.href = redirectTargetUrl;  // could disable external redirects by commenting-out this line
        return;
      }

      // if internal, patch the current url (sans base url) and page title into the query string
      // this allows linking back to the redirect page (enabling edits) on the target page
      const patchedRedirectTargetUrl = new URL(redirectTargetUrl);
      patchedRedirectTargetUrl.searchParams.set("redirected_from", location.href.replace(baseUrl, ""));
      patchedRedirectTargetUrl.searchParams.set("redirected_from_title", document.querySelector(".page-content h1").textContent);

      // go there!
      location.href = patchedRedirectTargetUrl.href;
      return;
    }

    // CASE 2: ON REDIRECT TARGT PAGE

    // note: shelves/books/chapters can also be redirect targets, so no need to ensure we're on a page here

    // check if relevant parameters are present in query string
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.has('redirected_from') && queryParams.has('redirected_from_title')) {

      // patch "no_redirect" into link back to redirect page (to allow users to go back and edit that one easily)
      const patchedRedirectSourceUrl = new URL(baseUrl + queryParams.get('redirected_from'))
      patchedRedirectSourceUrl.searchParams.set("no_redirect", "");

      // thell the user about the redirect and provide a link back to the redirect page
      showRedirectNotice(`Redirected from <a href="${patchedRedirectSourceUrl.href}" title="Click to modify the redirect">${queryParams.get('redirected_from_title')}</a>`);

      // clear url parameters without polluting history
      const unpatchedUrl = new URL(location.href);
      unpatchedUrl.searchParams.delete("redirected_from");
      unpatchedUrl.searchParams.delete("redirected_from_title");
      history.replaceState({}, '', unpatchedUrl.href);
    }
  });
</script>
```

With the way I've implemented redirects, there's two cases to consider:

1. If a reader navigates to a redirect page (*i.e.*, any page whose text starts with "#REDIRECT"), the code first checks

    * if a special URL query parameter `no_redirect` is set (either manually or by following a link *back* from the redirect's target) or
    * whether the page has just been edited.

    If either of these two special cases applies, no redirect occurs; a helpful message is displayed instead. After all: Without this kind of mechanism, it'd be tricky to modify a redirect after setting it up since you'd never be "allowed" to remain on the redirect page.

    But in the common case, the reader needs to be quickly sent on their merry way to the link following the redirect "directive". If it's

    * an external link: off they go, but
    * for internal links, my code first patches two query parameters into the redirect target URL: the path of the redirect page and its name. These will come in handy now:

2. Once a reader has been redirected – which, since it's a freshly-loaded page and I didn't want to set a cookie, is determined by the presence of our pair of query parameters – two steps remain:

    * A message with a link back to the redirect page is shown (with the query parameter `no_redirect` set).
    * Having served their purpose, the query parameters are removed from the URL.

Finally, a brief note on the "longevity" of this hack: As alluded to earlier, since it depends on the structure (class names and nesting) of the HTML markup generated by BookStack, it's liable to break after some future update. Breakage will, however, not lead to "catastrophic failures" that could meaningfully impact your readers (think infinite redirect loops or similar mayhem) – in the worst case, redirects would just stop working and they'd have to click manually. Like an animal.

{:.wide}
![]({% link /static/redirects.png %})

{:.caption}
A screenshot[^bookdemo] of a redirect target page.

[^bookdemo]: Note to self: To test my code on [BookStack's demo](https://demo.bookstackapp.com), where the "Custom HTML Head Content" setting can't be changed, I need to replace `addEventListener("load", e => {` with `(() => {` and the final line `});` with `})();`, then paste the resulting variant of the code snippet into the console. That's required on every page (notably *again* after being redirected). Clunky, but it works!
