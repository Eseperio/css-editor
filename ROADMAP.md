- [ ] Allow users to define a custom element to activate item selector providing a css selector.
- [ ] Instead of color palett icon and floating button, for default use a fixed small dark bar on top with text "Press
  here to enter style editor", then, legend changes to "Click any element to edit its styles"
- [ ] Keep all css changes. All changes made to different elements should be kept in memory, so when user customizes a
  second element, the first one keeps its changes. And css generated includes all changes made to all elements.
- [ ] Improve the selector configuration. Now the selector is calculated automatically, but it may be too specific or
  too generic. Right to selector input label there must be a cog. Once pressed, a panel appears below the input with a
  list of containers, each one with a piece of the selector, and in between, a vertical line joining them in the middle,
  like a diagram. At the right side of that line there is a compact dropdown with options: "children" or "all
  descendants". This represents the joint between those parts, currently supporting > or a space. For each container
  representing a part of the selector, there is also a dropdown at its right side with options: "all", "even","odd" and
  then options like "only position 1", "only position 2", etc, up to the number of siblings of that type. This allows to
  refine the selector to avoid overbroad or overspecific selectors. Changes on this configuration update the selector
  input, and therefore the css rules generated.
- [ ] When user hovers the selector input, highlight the element(s) matching that selector in the page with the blue
  overlay.
