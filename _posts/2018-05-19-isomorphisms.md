---
layout:       post
title:        "Isomorphisms Between Integers and Some Composite Types in Haskell"
date:         2018-05-19 21:30:00 +0200
---
In category theory, an [isomorphism is a morphism that can be reversed by an inverse morphism](https://en.wikipedia.org/wiki/Isomorphism#Isomorphism_vs._bijective_morphism). But let's not get too bothered by what exactly this means and [what it might imply](https://bartoszmilewski.com/2015/01/07/products-and-coproducts/), instead we'll jump straight to Haskell:

When applied to two not necessarily different Haskell types `a` and `b`, an isomorphism comprises two functions `f :: a -> b` and `g :: b -> a` such that `f . g == id` and `g . f == id`. The existence of `f` and `g` shows that both types are basically equivalent in the kind of information they can express – the other type is always just a "lossless" conversion away.

I suppose it's best to start with a few simple examples so you can get a feel for the concept:

* `(a,b)` is clearly isomorphic to `(b,a)`.
* The two sum types `data Crew = Malcolm | Kaylee | Jayne` and `data Job = Captain | Mechanic | PublicRelations` are isomorphic. If you don't see why, I suggest you watch [more prematurely-cancelled scifi shows](https://twitter.com/dreid/status/473647005751726081).
* `Maybe a` is isomorphic to `Either a ()`. The unit type `()` contains only a single value, also written `()`, so `Either a ()` can assume the form `Left a`, corresponding to `Just a`, or `Right ()`, corresponding to `Nothing`.
* In a similar vein, we can create an isomorphism between `Bool` and `Either () ()` by interpreting `True` as `Left ()` and `False` as `Right ()` (and the other way around).
* Integers [can be expressed as](https://codereview.stackexchange.com/q/79761) being either 0, the successor of an integer, or the predecessor[^peano] of an integer. Both representations can be converted into each other to your heart's desire, making them isomorphic.

Sounds reasonable enough. However, there are some somewhat perplexing (at first glance, anyway) isomorpishms between the `Integer` type and a few composite types. That's what this post is about!


## Let's `Maybe` `Just` get started

`Integer` is isomorphic to `Maybe Integer`. Think about it for a minute before reading on – if it throws you for a loop, you're not alone.

When I was first confronted with that statement, I was a bit confused because the obvious `Maybe Integer -> Integer` function – simply freeing the integers from their `Just` shells – seemed to leave no "space" for `Nothing` in the function domain.

The trick is to shift things around a bit:

```haskell
itom :: Integer -> Maybe Integer
itom 0 = Nothing
itom i = Just $ if i < 0 then i else i - 1

mtoi :: Maybe Integer -> Integer
mtoi Nothing  = 0
mtoi (Just i) = if i < 0 then i else i + 1
```

As you can see, when converting `Integer`s to `Maybe Integer`s, we return `Nothing` for 0, but because we need to acount for the `Just 0` case in the inverse function, we shift all positive integers a spot to the left. The inverse function then shifts them back to the right and all is well.


## `Either` go `Right` ahead or be `Left` behind

Things get a bit more tricky when we try to come up with an ismorphism between `Integer` and `Either Integer Integer`. A simple shift won't get the job done this time.

Our `Integer -> Either Integer Integer` function needs to somehow split up the set of integers such that both the `Left` and `Right` cases get slices of the pie. The inverse function then needs to reverse this split. Considered in isolation, this would be trivial – we could split based on [parity](https://en.wikipedia.org/wiki/Parity_(mathematics)) and reverse the split by simply unpacking the value fenced in by either the `Left` or `Right` constructor.

```haskell
itoe :: Integer -> Either Integer Integer
itoe i | odd  i = Left  i
       | even i = Right i

etoi :: Either Integer Integer -> Integer
etoi (Left  i) = i
etoi (Right i) = i
```

That's just a way of encoding `Integer` values as `Either Integer Integer`, though, not an isomorphism. For example, consider the other direction: If we feed a `Right 1` through `itoe . etoi`, which should compose to be equivalent to `id` if we had an isomorphism on our hands, what we get back is `Left 1`!

Let's try again. Each of our two functions, operating on arbitrary output values of its inverse, must be able to "fill" its domain fully, otherwise there will be a case where we cannot get the same value we put in out again.

Sticking with the basic structure from above, we can modify the `itoe` function to "compress" its input `Integer`s: Even numbers are halved and wrapped in `Right`, odd numbers are decremented (to make them even), then also halved and wrapped in `Left`. Knowing that `Left` values correspond to odd numbers, the inverse function `etoi` can now reverse our previous transformation steps without any loss of information. Going the other direction, `etoi` outputs odd numbers for `Left` inputs, enabling *its* inverse `itoe` to compute the original value correctly.

```haskell
itoe :: Integer -> Either Integer Integer
itoe i | odd  i = Left  $ (i - 1) `div` 2
       | even i = Right $  i      `div` 2

etoi :: Either Integer Integer -> Integer
etoi (Left  i) = i * 2 + 1
etoi (Right i) = i * 2
```

This time around, let's actually prove that these function form an isomorphism. We'll use [equational reasoning](http://www.haskellforall.com/2013/12/equational-reasoning.html) for this, first (out of four cases) considering the `etoi . itoe` composition for odd numbers. Our goal is to show that `id = etoi . itoe` holds:

* Plugging in the matching function definitions as [lambda expressions](https://wiki.haskell.org/Anonymous_function) yields ``id = (\(Left i) -> i * 2 + 1) . (\i -> Left $ (i - 1) `div` 2)``.
* Noticing that the second lambda wraps its result in a `Left` and the first simply unwraps it, we can remove both – as they cancel out – leaving us with ``id = (\i -> i * 2 + 1) . (\i -> (i - 1) `div` 2)``.
* With that out of the way, we can substitute the second lambda's body for `i` in the first function definition, resulting in ``id = \i -> ((i - 1) `div` 2) * 2 + 1``.
* Because `i` is odd, decrementing it leaves us with an even number – which can be halved without remainder – so `div` and `* 2` cancel each other out: `id = \i -> (i - 1) + 1`.
* You'll surely see how that's is equivalent to `id = \i -> i`, and `\i -> i` is the identity function, so we're done!

Showing `etoi . itoe` for even numbers works the same way, so I'll skip that here. That's two cases down, two to go – namely, we need to show that `id = itoe . etoi` for both `Left` and `Right` input values. Again, I'll only show this for `Right` (in a more concise format than above) and skip the very similar `Left` case.

```haskell
id = itoe . etoi
   = (\i -> Right $ i `div` 2) . (\(Right i) -> i * 2)
   = (\i -> i `div` 2) . (\i -> i * 2)
   = (\i -> (i * 2) `div` 2)
   = (\i -> i)
   = id
```


## Division among your newly enlisted units

If we were only considering non-negative integers, the isomorphism between `Integer` and `[()]` would be fairly obvious: The `Integer -> [()]` function could be implemented as `flip replicate ()`[^noflippinway] with the inverse being `length`.

The same approach can't Just Work™ here as scientists have yet to come up with a way to create lists of negative length. Due to of the scientists' utter ineptitude, we first have take a bit of a detour and find an isomorphism between `Integer` and non-negative integers (or natural numbers, as they're called by some).

Consider again[^sagan] the `Either` isomorphism from above, where we split the set of integers based on parity in the `itoe` function. There's nothing keeping us from doing something very similar based on the sign, so we'll do just that!

```haskell
type Nat = Integer  -- but not negative, which we won't enforce here

iton :: Integer -> Nat
iton i = if i >= 0 then i * 2 else -i * 2 - 1

ntoi :: Nat -> Integer
ntoi n = if even n then n `div` 2 else -(n + 1) `div` 2
```

Shooting a disappointed look at the clearly impressed scientists, we can now use our `iton` and `ntoi` functions to assemble the isomorphism we set out to implement:

```haskell
itol :: Integer -> [()]
itol i = replicate (fromIntegral $ iton i) ()

ltoi :: [()] -> Integer
ltoi l = ntoi $ (fromIntegral . length) l
```


## This is getting out hand, now there are two of them!

This is the last isomorphism we'll fully implement, and it's an interesting one: As it turns out, we can show that `Integer` is isomorphic to `(Integer,Integer)`. This may sound a bit confusing on a conceptual level – you can't make two out of one, can you? And then compress both back into one again, yielding the value you started out with? And vice versa?

However, when you think of this isomorphism in visual terms, it will quickly make sense to you:

{:.center}
![]({{ "/static/itot1.svg" | relative_url }})

Given a two-dimensional coordinate system, we can enumerate its $$(x,y)$$ coordinates (corresponding to our `(Integer,Integer)` type) by going in a spiral from the center successively outwards, yielding natural numbers (as long as we don't get too dizzy to keep on track). If this mapping function is invertible, all that's left to do is to chain it together with our `iton` and `ntoi` functions, and we've got our isomorphism.

Luckily, we don't have to descend into the depths of number theory to try and come up with a mapping function. The scientists we've met earlier, in a desperate ploy to redeem themselves, have already done that: the [Cantor pairing function](https://en.wikipedia.org/wiki/Pairing_function#Cantor_pairing_function)[^jpeg] is exactly what we're looking for. The German-language edition of Wikipedia even [gives a sample implementation](https://de.wikipedia.org/w/index.php?title=Cantorsche_Paarungsfunktion&oldid=168710663#Implementierung_der_Berechnungen_in_Java) – it's written in Java, but can trivially be <s>released from its misery</s>adapted to Haskell.

```haskell
itot :: Integer -> (Integer,Integer)
itot z = (ntoi $ j - k, ntoi k)
  where
    z' = iton z
    j = floor $ sqrt (0.25 + 2 * fromIntegral z') - 0.5
    k = z' - j * (j + 1) `div` 2

ttoi :: (Integer,Integer) -> Integer
ttoi (x,y) = ntoi $ ((x' + y') * (x' + y' + 1)) `div` 2 + y'
  where
    (x',y') = (iton x, iton y)
```

To make sure that this really works, I've taken to [plot.ly/create/](https://plot.ly/create/#/) where I've quickly-and-dirtily plotted the tuple representations, according to the implementation above, of the first 100 positive integers (in blue) and the first 100 negative integers (in orange).

{:.wide}
![]({{ "/static/itot2.png" | relative_url }})

Even though the lines connecting the $$(x,y)$$ coordinate pairs are looking a bit broken up in some places because of how the math works out, you can clearly see the spiral pattern – larger integers are further from the origin and there aren't any gaps.


## A fistful of numbers

If you think that's not cool enough, I'll have Steven Pigeon, author of the [article "Pairing Function" on Wolfram MathWorld](http://mathworld.wolfram.com/PairingFunction.html), drop some knowledge on you:

> To pair more than two numbers, pairings of pairings can be used. For example $$(i,j,k)$$ can be defined as $$(i,(j,k))$$ or $$((i,j),k)$$, but $$(i,j,k,l)$$ should be defined as $$((i,j),(k,l))$$ to minimize the size of the number thus produced. The general scheme is then
>
> $$ \begin{aligned} (a,b,c) &= (a,(b,c))\\
(a,b,c,d) &= ((a,b),(c,d))\\
(a,b,c,d,e) &= ((a,b),(c,(d,e)))\\
(a,b,c,d,e,f) &= ((a,b),((c,d),(e,f)))\\
(a,b,c,d,e,f,g) &= ((a,(b,c)),((d,e),(f,g))), \end{aligned}$$
>
> and so on.

In summary, by "stacking" this isomorphism an arbitrary number of times, we can show that an arbitrarily long tuple of `Integer`s is isomorphic to `Integer`. In theory, there's nothing keeping us from using the same logic to show...


## For a few numbers more

...that `Integer` is isomorphic to `[Integer]`!

In practice, my attempts to write the required pair of functions have only resulted in the ability to encode `[Integer]` values as `Integer`s – not the other way around. There are some other caveats, as well, which is why I've given up on getting it right:

* I suspect that there's no way to do this without also keeping track of the list's length. I considered using `takeWhile (\(x,_) -> x /= 0)` instead of `take (fromIntegral $ l)` below, but that won't work for lists containing the number 0. This isn't really a deal-breaker, though, because we can use `itot` and `ttoi` to encode and decode the `length`, respectively, which I've implemented below.
* Because our `itot` function from above (which encodes `Integer`s as `(Integer,Integer)`) relies on `sqrt`, which returns a finite-precision floating-point number, recovering a `[Integer]` value from its `Integer` representation breaks down for anything but the most basic lists. For example, `(itolofi . lofitoi) [42,1337]` returns an empty list because `itot` is unable to extract a reasonable list length from the incorrectly-rounded `Integer` that `lofitoi` outputs. It would, however, be possible to fix `itot` by [implementing](https://stackoverflow.com/a/19965405) an [integer square root algorithm](https://en.wikipedia.org/wiki/Integer_square_root).

```haskell
itolofi :: Integer -> [Integer]
itolofi i = map fst $ take (fromIntegral l) $ iterate (\(x,y) -> itot y) (itot i')
  where
    (l,i') = itot i

lofitoi :: [Integer] -> Integer
lofitoi is = ttoi (fromIntegral $ length is, foldr (\a b -> ttoi (a,b)) 0 is)
```

In closing, thinking about how objects are represented in memory shows that the isomorphisms presented in this post aren't really all that amazing: All types, in order to be usable at all, must be representable as some sequence[^defrag] of bits in memory. And "some sequence of bits in memory" is a good description of an arbitrary-length integer type such as `Integer`.

This segues nicely into the final point I'd like to make: All of the above only works because Haskell's `Integer`s are arbitrary-length numbers. When instead using a fixed-length type like `Int`, depending on the size of the numbers you're working with, you'll sooner or later run into overflow issues which completely break the isomorphisms presented in this article. As mentioned a few lines further up, our implementation of the isomorphism between `Integer` and `(Integer,Integer)` already exhibits this behavior due to the use of the `sqrt` function.

Still, I hope these isomorphisms have refreshed your perspective on composite types and how to have some fun with them!

*The code is [available on GitHub](https://github.com/doersino/isomorphisms).*


[^peano]: This is an extension of [Peano numbers](https://wiki.haskell.org/Peano_numbers).
[^noflippinway]: Or, without `flip`, as `\x -> replicate x ()`. Both variants also require a `fromIntegral` call to convert our `Integer` to the `Int` that `replicate` so badly craves as its first argument, but I've left that out for brevity, which is why I'm writing a long sentence about it in a footnote.
[^sagan]: ...that [dot](https://www.youtube.com/watch?v=wupToqz1e2g).
[^jpeg]: If you're familiar with [how the run-length encoding step in JPEG compression works](https://www.quora.com/Why-is-zigzag-scanning-used-in-JPEG-images), you've already seen something similar: The zigzag pattern that turns each post-DCT block into an array of roughly ordered weights is isomorphic to the Cantor pairing function.
[^defrag]: Whether this sequence is actually sequential or obscured behind a web of pointers is irrelevant in this context – you could always "defrag" to make things sequential.
