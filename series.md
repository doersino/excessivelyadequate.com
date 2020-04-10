---
layout: page
title: Series
permalink: /series.html
---

TODO just manually list series?

<ol class="archive">
        {% for tag in site.tags %}
            <li><h3>{{ tag | replace: "+", " " }}</h3></li>
        {% endfor %}
    </ol>
