---
layout:       post
title:        "Processing Markdown in Jekyll Post Titles"
date:         2023-08-19 17:20:00 +0200
---

This'll be a quick one.

My recent [post on pigeons]({% post_url 2023-08-19-pigeons %}) includes their scientific name *Columba livia domestica* in its title, and I wanted it to be italicized because that's just how you format scientific names – so I needed to convinve Jekyll to parse Markdown in post titles.

Depending on your site's architecture, you'll need to change stuff in multiple places – in my case, it [required changes in three spots](https://github.com/doersino/excessivelyadequate.com/commit/0e21ac764808d63b5115a9f6cd085c42b1cdef3a):

{% raw  %}

* The post/page template, commonly found at `_layouts/post.html`. The usual way of outputting the title is `{{ post.title | escape }}`[^escape], which you'll need to extend with the `markdownify` Liquid filter (converts Markdown-shaped input into HTML). But that introduces opening and closing `<p>` tags, so you need to [strip them out again](https://stackoverflow.com/a/57256532), yielding the following pipeline:

    ```liquid
{{ post.title | escape | markdownify | remove: '<p>' | remove: '</p>' }}
    ```

* The index page, commonly `_layouts/home.html` – you know, where you list all your posts. Same change required there.

* The `<title>` element. I didn't want my Markdown to be displayed here, but there's no built-in Liquid filter to strip Markdown – there is one to strip HTML, however; so:

    ```liquid
{{ page.title | escape | markdownify | strip_html }}
    ```

{% endraw  %}

[^escape]: The `| escape` bit converts certain characters into HTML entities – imagine a post clickbaitily titled "5 reasons to use &lt;em&gt; instead of &lt;i&gt;!"; it'd render as "5 reasons to use *instead of!*"
