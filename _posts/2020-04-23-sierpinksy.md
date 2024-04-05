---
layout:       post
title:        "Drawing the Sierpiński Triangle With Recursive SQL and SVG"
date:         2020-04-23 10:00:00 +0200
tags:         advancedsql
---
Databases are commonly used as dumb storage bins for [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) application data. However, this doesn't do them justice: database systems such as [PostgreSQL](https://www.postgresql.org/download/) are much more capable and versatile than that, supporting a wide range of operations across [many different data types](https://www.postgresql.org/docs/9.6/static/datatype.html).

The standard way of interfacing with Postgres is SQL -- you know, that thing you may have briefly learned in webdev class where you `SELECT` stuff `FROM` a set of tables `WHERE` some condition is met. But that's a far cry from what you can achieve when taking advantage of the full feature set of this declarative and -- surprise! -- [Turing complete](https://stackoverflow.com/a/7580013) programming language.

In this post, I'll present a surprisingly simple recursive CTE[^postgres] that implements an [iterated function system](https://en.wikipedia.org/wiki/Iterated_function_system) for generating a variant of the [Sierpiński triangle](https://en.wikipedia.org/wiki/Sierpiński_triangle), along with a basic SVG code generation routine for visualization purposes. The end result will look like this:

{:.center}
![]({% link /static/sierpinsky.svg %})

*This post is loosely based on what I learned in the [Advanced SQL lecture held by Torsten Grust in the summer of 2017](https://db.cs.uni-tuebingen.de/teaching/archive/ss17/advanced-sql/) at the University of Tübingen. Take a look at the [lecture slides](https://db.cs.uni-tuebingen.de/teaching/archive/ss17/advanced-sql/) for in-depth explanations and a wide array of examples.*


## Theory

The *Sierpiński triangle*, which you've already seen above, is a self-similar fractal that takes the shape of an equailateral triangle that's divided into four "subtriangles": the middle one is blank, the rest are again divided in the same manner, *ad infinitum*. It can be constructed in a [variety of ways](https://en.wikipedia.org/wiki/Sierpiński_triangle#Constructions), all[^rule90] of which are interesting – but we'll focus on just one of them in this post.

*Iterated function systems*, meanwhile, are commonly [utilized in the generation of self-similar fractals](https://twitter.com/CentrlPotential/status/1250172108811927552) like the one we'll be drawing today. Wikipedia [defines](https://en.wikipedia.org/wiki/Iterated_function_system#Definition) them as follows:

> Formally, an iterated function system is a finite set of contraction mappings on a complete metric space.

There you go.

Just kidding – that sentence makes no sense to me because I'm bad at math, and I hope you won't be offended if I proceed under the assumption that you're not much better at it. *Informally*, an iterated function system (IFS) is a *set of functions that can be applied to each other's outputs in any order and as many times as you like*, with the results ending up distributed in a hopefully-interesting manner.

Wikipedia goes on to outline the particular application of IFS we'll be performing:

> The most common algorithm to compute IFS fractals is called the "[chaos game](https://en.wikipedia.org/wiki/Chaos_game)". It consists of picking a random point in the plane, then iteratively applying one of the functions chosen at random from the function system to transform the point to get a next point.

The functions, in this case, simply move the point halfway to one of three anchor points $$P_n = (P_n.x, P_n.y)$$ arranged in a triangular configuration. Assuming our canvas is a [unit square](https://en.wikipedia.org/wiki/Unit_square) (with the origin located at the top left because that's where it usually is in computer graphics):

$$ \begin{aligned}
P_1 &= (0.5, 0)\\
P_2 &= (0, 1)\\
P_3 &= (1, 1)\\
\end{aligned} $$

You'll notice that these points don't *quite* form an equilateral triangle, but that doesn't matter – we'll simply get a slightly stretched Sierpiński triangle as a result. (If we moved $$P_1$$ off-center, we'd get a skewed triangle instead.)

Let's define our function system. It comprises three functions, each corresponding to one of the anchor points. Every function moves its input point halfway to its assigned anchor point:

$$ \begin{aligned}
f_1(p) &= \frac12 (p + P_1) = \left(\frac12 \left(p.x + P_1.x\right), \frac12 \left(p.y + P_1.y\right)\right)\\
f_2 &= \frac12 (p + P_2) = \text{analogous}\\
f_3 &= \frac12 (p + P_3) = \text{analogous}\\
\end{aligned} $$

Now! If we start out with $$P = (0.5, 0.5)$$, feed it into one of the three functions at random, feed the result back into another random function, and keep doing that for $$n$$ iterations, the Sierpiński triangle slowly emerges from the initial noise.

You can observe this in the following[^subplots] image – each subplot, from top left to bottom right, advances[^keepgoing] the process by 10 iterations.

{:.center}
![]({% link /static/sierpinsky_process.svg %})


## Recursive CTEs

Let's get to know the SQL feature that will be instrumental in implementing our IFS!

[Common table expressions](https://www.postgresql.org/docs/12/queries-with.html) (CTEs) are [incredibly useful](https://stackoverflow.com/questions/4740748/when-to-use-common-table-expression-cte) for structuring complex queries, allowing the query writer to define temporary `VIEW`-like constructs. They help with breaking up a large query into potentially reusable components: The `WITH` keyword is used to chain queries together, while assigning a name to each component query by which its results can be referenced in all following queries within the same `WITH` block.

A `WITH` block is terminated by a standard query which may reference any of the named components – frequently, this is just a `TABLE` statement.

As an example, this basic[^toobasic] CTE computes the [sum of squared residuals](https://en.wikipedia.org/wiki/Residual_sum_of_squares) between a predicted result and a sequence[^oeis] of observations:

```sql
WITH predicted(id, n) AS (
  SELECT s.n, exp(s.n)
  FROM   generate_series(0, 4) AS s(n)
),
observed(id, n) AS (
  VALUES (0, 2), (1, 3), (2, 7), (3, 19), (4, 53)
),
residuals(id, n) AS (
  SELECT p.id, o.n - p.n
  FROM   predicted p JOIN observed o ON p.id = o.id
),
squares(id, n) AS (
  SELECT id, n ^ 2
  FROM   residuals
),
sum(n) AS (
  SELECT sum(n)
  FROM   squares
)
TABLE sum;
```

*Recursive CTEs*, recognizable by the `WITH RECURSIVE` keywords, have another ace up their sleeve: They can run a *self-referential* query multiple times until it produces no further rows. Somewhat unintuitively, this is an *iterative* process.

Let's consider an example which computes the factorial of the number 7:

```sql
WITH RECURSIVE fac(n, res) AS (
  SELECT 7, 1

    UNION ALL

  SELECT n - 1, res * n
  FROM   fac
  WHERE  n > 1
)
SELECT res
FROM   fac
WHERE  n = 1;
```

A recursive CTE must be [composed of three parts](https://www.postgresql.org/docs/12/queries-with.html#id-1.5.6.12.5.4), each with their own semantics:

1. A *non-recursive term* – here, `SELECT 7, 1`.

    This query is evaluated exactly once at the beginning of the iterative process. Its results are inserted into both a temporary <span style="color: darkblue;">*working* table</span> and, after the second part ↓ is considered, into the <span style="color: darkgreen;">*output* table</span>. This constitutes the first iteration of the CTE.

2. An operator that steers how results are combined after each iteration: either `UNION ALL` or `UNION`.

    In the latter case, rows of the <span style="color: darkblue;">working table</span> that are duplicates[^nodups] *with regard to both itself and the <span style="color: darkgreen;">output table</span>* are eliminated in-between iterations and before the contents of the <span style="color: darkblue;">working table</span> are appended to the <span style="color: darkgreen;">output table</span>.

3. The *recursive term*, which may reference the current CTE (here: `fac`) in its `FROM` list or in subqueries.

    Such references are resolved to the <span style="color: darkblue;">working table</span>, which always only contains rows created in the previous iteration: its old contents are flushed to the <span style="color: darkgreen;">output table</span> after each iteration and replaced with the current iteration's result.

    If and only if the <span style="color: darkblue;">working table</span> is empty at the beginning of an iteration, the process terminates.

In Postgres, the recursive term of a CTE merely supports a subset of the usual SQL querying toolbox. Most notably, `ORDER BY` cannot[^goodreason] be used – but it's allowed within subqueries, which makes this particular limitation a non-issue in practice.


## Implementation

Hoping that you've [grokked](http://catb.org/jargon/html/G/grok.html) the general concepts of iterated function systems and recursive CTEs, let's begin implementing our Sierpiński triangle generator in SQL.

First, we'll need to define a table[^hardcode] to house the three anchor points $$P_n$$ – nothing fancy, we don't even need an `id` column:

```sql
CREATE TABLE anchors (
  x float,
  y float
);

INSERT INTO anchors VALUES
  (0.5, 0),
  (0, 1),
  (1, 1);
```

Before writing the query, we'll define how many iterations of our function system we want to compute. `psql`'s [`\set` functionality](https://www.postgresql.org/docs/current/app-psql.html#APP-PSQL-VARIABLES) comes in handy here (note that `1e4` is just a shorthand for $$1 \cdot 10^4$$).

```sql
\set n 1e4
```

Let's now get to writing the recursive query that will play the chaos game for us!

I'll reveal it in stages in roughly the same order I formulated the query in, beginning with the schema of our `RECURSIVE`ly built-up table: We need to store $$p = (p.x, p.y)$$ along with an `id` column which is going to be incremented in each iteration until it eclipses `:n`, which is our termination condition.

```sql
WITH RECURSIVE points(id, x, y) AS (
  ...
)
...
```

Now, the non-recursive term must select a starting value of our point $$p$$ – we're just going to pick the center of our unit square for good measure.

```sql
WITH RECURSIVE points(id, x, y) AS (
  SELECT 1, 0.5::float, 0.5::float

    ...

  ...
)
...
```

Alright! Since we'll be incrementing the `id` column in each iteration, we'll never create any duplicates. Hence:

```sql
WITH RECURSIVE points(id, x, y) AS (
  SELECT 1, 0.5::float, 0.5::float

    UNION ALL

  ...
)
...
```

Speaking of incrementing the `id` column in each iteration – let's do that while also implementing our termination condition at the same time. Once we run the query, `:n` is going to be substituted with the value of the `psql` variable we've set up earlier. Remember that *only* the row added in the previous iteration is visible to the recursive term, otherwise we'd get exponential instead of linear growth.

```sql
WITH RECURSIVE points(id, x, y) AS (
  SELECT 1, 0.5::float, 0.5::float

    UNION ALL

  SELECT p.id + 1, ..., ...
  FROM   points p, ...
  WHERE  p.id < :n
)
...
```

The next step is the selection of a random anchor point (i.e. implicitly the random selection among $$f_n$$) from the `anchors` table. You might be inclined to formulate this as follows...

```sql
WITH RECURSIVE points(id, x, y) AS (
  SELECT 1, 0.5::float, 0.5::float

    UNION ALL

  SELECT p.id + 1, ..., ...
  FROM   points p, anchors a
  WHERE  p.id < :n
  ORDER BY random()  -- ⚠ this won't work
  LIMIT 1
)
...
```

...but that won't work because, as previously discussed, Postgres doesn't support `ORDER BY` in the outermost query of the recursive term. Back to the drawing board – let's try a subquery:

```sql
WITH RECURSIVE points(id, x, y) AS (
  SELECT 1, 0.5::float, 0.5::float

    UNION ALL

  SELECT p.id + 1, ..., ...
  FROM   points p, (SELECT * FROM anchors ORDER BY random() LIMIT 1) AS a(x, y)
  WHERE  p.id < :n
)
...
```

That's perhaps a bit less elegant, but it'll work just fine.

Finally, all that's left to do is implementing the computation of the updated position of our point $$p$$ – we can basically just fill in the formula for $$f_n$$ from above. We'll also utilize `TABLE points` at the very end to output the results.

```sql
WITH RECURSIVE points(id, x, y) AS (
  SELECT 1, 0.5::float, 0.5::float

    UNION ALL

  SELECT p.id + 1, (p.x + a.x) / 2, (p.y + a.y) / 2
  FROM   points p, (SELECT * FROM anchors ORDER BY random() LIMIT 1) AS a(x, y)
  WHERE  p.id < :n
)
TABLE points;
```

That's it! Our iterative function system iterates as expected, which we can try to verify by taking a look at the query result:

```
+-------+----------------------+---------------------+
|  id   |          x           |          y          |
+-------+----------------------+---------------------+
|     1 |                  0.5 |                 0.5 |
|     2 |                  0.5 |                0.25 |
|     3 |                 0.25 |               0.625 |
|     4 |                0.625 |              0.8125 |
|     5 |               0.3125 |             0.90625 |
|     6 |              0.40625 |            0.453125 |
|     7 |             0.453125 |           0.2265625 |
|     8 |            0.4765625 |          0.11328125 |
|     9 |           0.23828125 |         0.556640625 |
|    10 |          0.619140625 |        0.7783203125 |
|    11 |         0.8095703125 |       0.88916015625 |
|    12 |        0.90478515625 |      0.944580078125 |
|    13 |       0.952392578125 |     0.9722900390625 |
|    14 |      0.7261962890625 |    0.48614501953125 |
|    15 |     0.86309814453125 |   0.743072509765625 |
|    16 |    0.681549072265625 |   0.371536254882812 |
|    17 |    0.840774536132812 |   0.685768127441406 |
|    18 |    0.420387268066406 |   0.842884063720703 |
|    19 |    0.710193634033203 |   0.921442031860352 |
|    20 |    0.605096817016602 |   0.460721015930176 |
|    21 |    0.802548408508301 |   0.730360507965088 |
|    22 |     0.40127420425415 |   0.865180253982544 |
|    23 |    0.450637102127075 |   0.432590126991272 |
|    24 |    0.475318551063538 |   0.216295063495636 |
|    25 |    0.487659275531769 |   0.108147531747818 |
|    26 |    0.493829637765884 |   0.054073765873909 |
|    27 |    0.246914818882942 |   0.527036882936954 |
|    28 |    0.123457409441471 |   0.763518441468477 |
|    29 |    0.311728704720736 |   0.381759220734239 |
|    30 |    0.155864352360368 |   0.690879610367119 |
┆       ┆                      ┆                     ┆
|  9990 |    0.363056443960706 |    0.85909628057552 |
|  9991 |    0.431528221980353 |    0.42954814028776 |
|  9992 |    0.465764110990177 |    0.21477407014388 |
|  9993 |    0.482882055495088 |    0.10738703507194 |
|  9994 |    0.241441027747544 |    0.55369351753597 |
|  9995 |    0.370720513873772 |   0.276846758767985 |
|  9996 |    0.435360256936886 |   0.138423379383993 |
|  9997 |    0.217680128468443 |   0.569211689691996 |
|  9998 |    0.358840064234222 |   0.284605844845998 |
|  9999 |    0.179420032117111 |   0.642302922422999 |
| 10000 |    0.589710016058555 |     0.8211514612115 |
+-------+----------------------+---------------------+
(10000 rows)
```

This *looks* like it might be right, but how can we tell? I, for what it's worth, can't picture this sequence of points in my mind, so let's visualize it!

There's a plethora of tools[^drawingtools] we could feed this table into – but I think it's more fun to stay within the confines of SQL for now by generating a basic SVG image, which every web browser can display.


## Visualization

SVG, in case you're not familiar with it, [is](https://en.wikipedia.org/wiki/Scalable_Vector_Graphics)...

> ...an [Extensible Markup Language](https://en.wikipedia.org/wiki/XML) (XML)-based vector image format for two-dimensional graphics with support for interactivity and animation.

Interactivity and animation are cool, but for our purposes, only two[^doctype] of SVG's various tags are relevant:

* The `<svg>` tag serves as the root element of the document, quite similar to HTML's `<html>` tag. Its `viewBox` attribute demarcates the visible portion of the internal coordinate system – its value can be interpreted as `left_edge bottom_edge width height`.

  ```html
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
    <!-- document content goes here -->
  </svg>
  ```

* The `<circle>` tag draws a circle, whose radius must be defined via the `r` attribute, centered on the coordinate specified by the `cx` and `cy` attributes. We'll use this tag to draw both our anchor points and the point generated in each iteration. Its appearance can be defined with CSS located in the `style` attribute (if not overridden in this manner, appearance is inherited from the `<svg>` element's `style` attribute).

  In the following example, a solid black circle is drawn.

  ```html
  <circle cx="42" cy="1337" r="1" style="stroke: none; fill: black;" />
  ```

Armed with this knowledge, we can use SQL's string concatenation operator `||` and a couple of subqueries to generate our image:

```sql
\set width 1000
\set height 1000

WITH RECURSIVE points(id, x, y) AS (
  ...
),
svg(text) AS (
  SELECT '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-3 -3 ' || :width + 6 || ' ' || :height + 6 || '" style="stroke: none; fill: black;">'
         || (SELECT string_agg('<circle cx="' || x * :width || '" cy="' || y * :height || '" r="1" />', '') FROM points)
         || (SELECT string_agg('<circle cx="' || x * :width || '" cy="' || y * :height || '" r="3" style="fill: red;" />', '') FROM anchors)
         || '</svg>'
)
TABLE svg;
```

But if you execute this query, Postgres will present you with this:

```text
+----------------------------------------------------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------------------------------------
```

And so on – the giant string we've assembled is printed in the usual tabular output format, with the table's toprule taking up multiple screens of the terminal window. We *could* scroll way down, find the generated SVG code, copy-paste it into a text editor, save the buffer as an `.svg`, and open that file. But that's not very satisfying, so instead, let's invoke `psql` with the `--quiet` flag and pipe the query result into a file:

```
psql --quiet -f sierpinsky.sql > sierpinsky.svg
```

That's actually not *quite* enough. We need to execute a few more configuration commands...

```sql
\pset border 0
\pset footer off
\pset pager off
\pset tuples_only on
\timing off
```

...to disable various aspects of the default output format. But once that's done, we can lean back and bask in the glory of what we've achieved with just a few lines of SQL:

{:.center}
![]({% link /static/sierpinsky.svg %})

And in case you haven't been coding along, the finished `sierpinsky.sql` looks just about like this:

```sql
\set n 1e4
\set width 1000
\set height 1000

-- shut up, w̶e̶s̶l̶e̶y̶postgres
\pset border 0
\pset footer off
\pset pager off
\pset tuples_only on
\timing off

-- set up anchor points
DROP TABLE IF EXISTS anchors;
CREATE TABLE anchors (
  x float,
  y float
);

INSERT INTO anchors VALUES
  (0.5, 0),
  (0, 1),
  (1, 1);

--TRUNCATE anchors;
--INSERT INTO anchors VALUES
--  (0.5, 0),
--  (0, 0.4),
--  (1, 0.4),
--  (0.2, 1),
--  (0.8, 1);

-- let's-a go!
WITH RECURSIVE points(id, x, y) AS (
  SELECT 1, 0.5::float, 0.5::float

    UNION ALL

  SELECT p.id + 1, (p.x + a.x) / 2, (p.y + a.y) / 2
  FROM   points p, (SELECT * FROM anchors ORDER BY random() LIMIT 1) AS a(x, y)
  WHERE  p.id < :n
),
svg(text) AS (
  SELECT '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-3 -3 ' || :width + 6 || ' ' || :height + 6 || '" style="stroke: none; fill: black;">'
         || (SELECT string_agg('<circle cx="' || x * :width || '" cy="' || y * :height || '" r="1" />', '') FROM points)
         || (SELECT string_agg('<circle cx="' || x * :width || '" cy="' || y * :height || '" r="3" style="fill: red;" />', '') FROM anchors)
         || '</svg>'
)
TABLE svg;
```


## Addendum: Evolution visualization

In order to generate the "evolution" visualization shown at the bottom of the "Theory" section, I've adapted and parameterized the query detailed in this post to output a [small multiples chart](https://en.wikipedia.org/wiki/Small_multiple). In case you're interested, the following code snippet replaces everything below the `-- let's-a go!` comment:

```sql
\set width 100
\set height 100
\set rows 8
\set cols 8
\set fac 10
\set point_r 1
\set anchor_r 3

WITH RECURSIVE points(row, col, id, x, y) AS (
  SELECT row, col, 1, 0.5::float, 0.5::float
  FROM   generate_series(0, (SELECT :rows - 1)) AS row(row),
         generate_series(0, (SELECT :cols - 1)) AS col(col)

    UNION ALL

  SELECT p.row, p.col, p.id + 1, (p.x + a.x) / 2, (p.y + a.y) / 2
  FROM   points p, (SELECT * FROM anchors ORDER BY random() LIMIT 1) AS a(x, y)
  WHERE  p.id < :fac * (p.row * :cols + p.col)
  --WHERE p.id < p.col * (:fac ^ p.row)
),
svg(text) AS (
  SELECT '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-' || :anchor_r || ' -' || :anchor_r || ' ' || :width * (:cols + 1) + 2 * :anchor_r || ' ' || :height * (:rows + 1) + 2 * :anchor_r || '" style="stroke: none; fill: black;">'
         || (SELECT string_agg(''
                    || (SELECT string_agg('<circle cx="' || (col + x + col / (:cols - 1.0)) * :width || '" cy="' || (row + y + row / (:rows - 1.0)) * :height || '" r="' || :point_r || '" />', '')
                        FROM points
                        WHERE row = p.row AND col = p.col)
                    || (SELECT string_agg('<circle cx="' || (col + x + col / (:cols - 1.0)) * :width || '" cy="' || (row + y + row / (:rows - 1.0)) * :height || '" r="' || :anchor_r || '" style="fill: red;" />', '')
                        FROM anchors
                        WHERE row = p.row AND col = p.col)
                    , '')
             FROM   points p
             WHERE  p.id = 1)
         || '</svg>'
)
TABLE svg;
```



[^postgres]: The implementation will be based on PostgreSQL's dialect of SQL, but it should work universally with minor modifications.
[^rule90]: Personally, I'm quite fond of the fact that Stephen Wolfram's [Rule 90 cellular automaton](https://en.wikipedia.org/wiki/Sierpiński_triangle#Cellular_automata) takes the shape of Sierpiński's triangle – how to simulate elementary cellular automata in SQL might be the focus of a future post. Also, amazingly, you can draw it [using a single HTML `<div>` tag and a bit of CSS](https://yuanchuan.dev/single-div-sierpinski-triangle).
[^subplots]: This image has been generated by an adapted version of the query we're about to formulate. But if you prefer an animation, take a look at the [tweet that inspired me to write this post](https://twitter.com/CentrlPotential/status/1250172108811927552) or try out [this absolutely amazing interactive tool](https://andrew.wang-hoyer.com/experiments/chaos-game/).
[^keepgoing]: We could keep going *ad infinitum*, of course, but as is the case for all [Monte Carlo](https://en.wikipedia.org/wiki/Monte_Carlo_method)-esque processes, we'll soon hit a point of diminishing returns – besides, the SVG file is larger than 1 MB as it stands.
[^toobasic]: In a "production" context, one wouldn't split this specific problem into quite as many separate queries, but it makes for a good example.
[^oeis]: See [https://oeis.org/A037028](https://oeis.org/A037028).
[^nodups]: Many kinds of recursive queries won't ever produce duplicates, so in these cases, the choice of `UNION ALL` or `UNION` doesn't matter *semantically*. With an eye on *performance*, however, `UNION ALL` should be preferred here as it avoids expensive sorting/hashing operations.
[^goodreason]: For [good reasons](https://stackoverflow.com/a/45045637).
[^hardcode]: We could have hard-coded the anchor points within the query we're about to write, but keeping them in a table allows *you* to change them easily and observe what happens to the fractal as a result – this method can be used to generate all kinds of fractals depending on anchor point locations, rules constraining successive anchor point reuse, interpolation between current point and anchor point, and more!

    For example, populating `anchors` with the following data...

    ```sql
    INSERT INTO anchors VALUES
      (0.5, 0),
      (0, 0.4),
      (1, 0.4),
      (0.2, 1),
      (0.8, 1);
    ```
    ...will produce a wholly different fractal – try it out!

[^drawingtools]: [Gnuplot](http://www.gnuplot.info), [Graphviz](https://www.graphviz.org), spreadsheet apps like Excel, [various](https://chart-studio.plotly.com/create/) [online](https://www.desmos.com/calculator) [tools](http://www.webmath.com/gpoints.html), and probably a bunch more that I haven't heard of.
[^doctype]: If you're missing a DOCTYPE declaration or similar boilerplate: It's [not required anymore](https://stackoverflow.com/a/38172170).
