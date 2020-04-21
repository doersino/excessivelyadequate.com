---
layout:       post
title:        "Recreating the Starfield Screensaver in JavaScript"
date:         2018-05-11 14:00:00 +0200
---

Do you remember the old [Starfield screensaver](https://www.youtube.com/watch?v=n3n3m2B0KFo) from back when Windows still had sensible version numbers? Although that was mostly before my time, I vaguely remember[^eisenbahn] using a computer that came with it when I was around elementary school age.

Today, let's reimplement it (or something close to it, at least) in a couple dozen lines of vanilla JavaScript!

In case you're a bit impatient: Instead of embedding the finished result here, which would invariably break as soon as I change the post layout even a little bit, I've uploaded a [full-screen demo ready for your enjoyment]({{ "/static/starfield.html" | relative_url }})[^websaver].


## Implementation

First off, we need to write a few lines of HTML to set up a page with a black background and a `<canvas>` element that we can then smear virtual paint all over.

```html
<body style="margin: 0; background: black;">
    <canvas id="starfield"></canvas>
    <script>
        // further code snippets go here
    </script>
</body>
```

Before we can start implementing our version of the screensaver, we need to prepare the `<canvas>` for drawing. Most importantly, we've got to make sure to up the *resolution* for Retina displays (or high-ppi screens in general) while keeping the *size* the same. Note that in `if (window.devicePixelRatio)`, we don't check if the ratio is larger than one – merely whether it is set.

```js
var canvas = document.getElementById("starfield");

// get dimensions of body element
var w = document.body.offsetWidth;
var h = document.body.offsetHeight;

// detect device pixel ratio
if (window.devicePixelRatio) {
    var dpr = window.devicePixelRatio;

    // set dimensions of the canvas element to match the page
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    // adjust width and height variables according to the detected pixel ratio
    w = w * dpr;
    h = h * dpr;
}

// set drawing dimensions of canvas: if the pixel ratio is 1, this will match
// the size of the canvas element, but if it's higher (common values will be 2
// and 3), the canvas will allow for more detail (matching the physical pixels
// of the device but not the virtual pixels of the page)
canvas.setAttribute("width", w);
canvas.setAttribute("height", h);

// prepare a two-dimensional drawing context
var c = canvas.getContext("2d");
```

With this setup work out of the way, we can start igniting some stars. We'll generate their initial positions and `push` them onto a list which we'll later be able to iterate over in the main drawing loop.

The initial distribution of the stars should ideally be random – but not uniformly random: To get the mesmerizing perspective effect, we need a higher density[^converge] of (smaller) stars in the middle of the canvas compared to the edges. It's also a good idea to "reuse" stars by respawning them once they fall off the edges of the screen (more on that in a bit), keeping the star count constant over time.

After some trial and error, I came up with the following snippet that seems to do the job alright. The `rand()` function generates random numbers in the interval $$[-0.5,0.5]$$ with a strong bias toward the middle of that interval. After setting a desired star count and initializing a list, we can randomly generate the initial $$(x,y)$$ coordinate pairs by scaling the `rand()` output depending on the width and height of the canvas.

```js
// randomness generator
rand = function() { return (Math.random() - 0.5) * (Math.random() - 0.5) * Math.random() };

// compute center
var cx = w / 2;
var cy = h / 2;

// randomly generate stars around center
var count = 170;
var stars = [];
for (var i = 0; i < count; i++) {
    var sx = cx + rand() * w;
    var sy = cy + rand() * h;
    var s = [sx,sy];
    stars.push(s);
}
```

Now all the setup work is done, so we can start writing the main loop, which we tell JavaScript to kindly run 50 times per second using `setInterval`:

```js
// main loop
var fps = 50;
setInterval(function() {
    // further code snippets go here
}, 1000 / fps);
```

In there, our first order of business is to delete whatever's been drawn previously by clearing out a rectangle covering the entire canvas. Next, we start iterating over our list of stars, extracting their $$x$$ and $$y$$ coordinates for easier access later on:

```js
c.clearRect(0, 0, w, h);

// iterate over stars
for (var i = 0; i < stars.length; i++) {
    var x = stars[i][0];
    var y = stars[i][1];

    // further code snippets go here
}
```

Now, before drawing each star, we need to consider that as the stars travel further from the center of the screen and begin to move past the imaginary spaceship, you want them to grow larger. Put differently, their radius `r`[^realism] depends on their distance from the center:

```js
// compute radius depending on euclidean distance from center
var r = 0.005 * (Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2)));
```

You might recognize that what's implemented here is the formula for the [euclidean distance in two-dimensional space](https://en.wikipedia.org/wiki/Euclidean_distance#Two_dimensions), which in non-math terms is just the "normal" distance between two points. There are different ways of computing a point-to-point distance – an earlier version of my implementation featured a slightly different formula:

```js
var r = 0.005 * (Math.abs(x - cx) + Math.abs(y - cy));
```

Looks simpler, but some testing reveals its flaw: Let $$(c_x,c_y) = (0,0)$$ and $$(x,y) = (1,1)$$. Recalling the Pythoagorean theorem $$a^2 + b^2 = c^2$$, we note that the distance [should](https://proofwiki.org/wiki/Length_of_Diagonal_of_Unit_Square) be $$\sqrt{2}$$ in this case – but if we plug our test values into the two formulas, only one of them will return $$\sqrt{2}$$:

$$ \sqrt{(x-c_x)^2 + (y-c_y)^2} = \sqrt{1^2 + 1^2} = \sqrt{2} \\
|x-c_x| + |y-c_y| = |1| + |1| = 2 $$

Observe that the simpler-looking formula returns a larger number. However, this effect is greatly diminished for stars closer to the $$x$$ or $$y$$ axes, which you can easily check yourself by plugging different values into the formulas. You'll also notice that if a star is located on either the $$x$$ or $$y$$ axis (i.e. its $$y$$ or $$x$$ coordinate, respectively, is $$0$$), both formulas yield the same results.

In a nutshell: The second formula is fairly close to being correct most of the time[^expensive], but the first one is *always correct*.

After this short diversion, we can finally draw the current star by drawing a white circle (which is really a 360° arc) with the previously computed radius and located at the correct position.

```js
// draw star
c.beginPath();
c.arc(x, y, r, 0, 2 * Math.PI, false);
c.fillStyle = "white";
c.fill();
```

Finally, all that's left is to update its position, which can be accomplished by adding a number that grows[^speed] with increased distance to the center.

```js
// update star
var nx = x + (x - cx) * 0.025;
var ny = y + (y - cy) * 0.025;
stars[i] = [nx,ny];
```

But wait! We need to check whether the star has traveled beyond the edges of the canvas in the previos iteration. There's no real need to be precise here – choosing the value `100` lets each star travel quite a bit out of view before being reset, preventing any glitches on large screens where stars might appear quite massive as they approach the edges.

```js
// reset star if out of bounds
if (x < -100 || x > w + 100 || y < -100 || y > h + 100) {
    x = cx + rand() * w/10;
    y = cy + rand() * w/10;
    stars[i] = [x,y];
}
```

That's all there is to it, really! Once again, you can [see a demo over here]({{ "/static/starfield.html" | relative_url }}).


## Notes

It'd be easy to add a twinkling effect to the stars – this could be achieved by randomly varying each star's brightness during the drawing stage.

Another interesting modification would be to add differently sized stars to increase the perceived depth. This would require randomly generating a size factor along with the initital positions and adjusting the radius computation accordingly.

This implementation avoids two pitfalls I've commonly[^commonly] encountered in other JavaScript implementations: First, the stars don't move at a constant speed, instead accelerating as they approach the edges of the field of view. Second, stars are given time to travel well outside the bounds of the screen before being reset.




[^eisenbahn]: I also vividly remember [this screensaver](http://www.mm-eisenbahn.de/index_e.html), which seems to still be under semi-active development, with a [sizable community](http://www.mm-eisenbahn.de/ScrUser2_E.html).
[^websaver]: If you're on macOS, you can *actually* use this as a screensaver using [MacSaver](https://github.com/tlrobinson/WebSaver). If not, I'm sure there's similar tools for the operating system you're using!
[^converge]: In other words, an initial uniform distribution would not match what the distribution would invariably converge to after a while. Also, because of the speedup the stars experience as they approach the edges of the screen, most of the initial stars would fall off the edge almost immediately. This wouldn't be much of an issue after the first three or four seconds, but first impressions matter!
[^realism]: For a more realistic look, you could set `r` to a constant value – stars tend to be far away, after all. Growing them slightly larger as they come closer, however, tremendously helps in adding a sense of depth.
[^expensive]: It's also much less computationally expensive: Subtraction and sign removal is easier than multiplication and taking square roots. On modern hardware, this difference has very little impact, however.
[^speed]: Changes to the constants in these expressions will adjust the speed. For example, you could set different vertical and horizontal speeds for a somewhat psychedelic effect.
[^commonly]: Having written the initial draft for this post more than a year ago, I have no idea which implementations I'm talking about here – but leaving this bit in might help you avoid making the same mistakes if you implement this in another language.
