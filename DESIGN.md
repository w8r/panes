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
  * float: left
    * hackish
  * what about rigth-first flow (float: right or reversed flexbox)

## PinnedPanesStack

Holds always visible(fixed) panes like "next" pane.
