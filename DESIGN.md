# Views

 * Viewport
 * PinnedPanesStack

## Viewport

Holds panes.

Requirements:

  * Insert pane (arbitrary position).
  * Delete pane (arbitrary position).
  * Replace pane (arbitrary position).
  * Arbitrary animations.

Layout variants:

  * position: absolute
    * compute layout by hand
    * more flexible than flexbox
  * flexbox
    * flexible, do not need to compute layout by hand
  * __float: left__
    * hackish
  * what about rigth-first flow (float: right or reversed flexbox)

## PinnedPanesStack

Holds always visible(fixed) panes like "next" pane. Arbitrary shown over
the viewport or squeezes it from the side.
  * Shim is a fixed pane
  * Fixed panes should be separated, not to mess up collection size
    and index calculations.

