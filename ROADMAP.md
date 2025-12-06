- [x] Allow users to define a custom element to activate item selector providing a css selector.
- [x] Instead of color palett icon and floating button, for default use a fixed small dark bar on top with text "Press
  here to enter style editor", then, legend changes to "Click any element to edit its styles"
- [x] Keep all css changes. All changes made to different elements should be kept in memory, so when user customizes a
  second element, the first one keeps its changes. And css generated includes all changes made to all elements.
- [x] Improve the selector configuration. Now the selector is calculated automatically, but it may be too specific or
  too generic. Right to selector input label there must be a cog. Once pressed, a panel appears below the input with a
  list of containers, each one with a piece of the selector, and in between, a vertical line joining them in the middle,
  like a diagram. At the right side of that line there is a compact dropdown with options: "children" or "all
  descendants". This represents the joint between those parts, currently supporting > or a space. For each container
  representing a part of the selector, there is also a dropdown at its right side with options: "all", "even","odd" and
  then options like "only position 1", "only position 2", etc, up to the number of siblings of that type. This allows to
  refine the selector to avoid overbroad or overspecific selectors. Changes on this configuration update the selector
  input, and therefore the css rules generated.
- [x] When user hovers the selector input, highlight the element(s) matching that selector in the page with the blue
  overlay.
- [ ] Margin items overflow because they are in a subpanel. Fix it.
- [ ] Allow to customize the action buttons in panel by changing labels, toggle visibility of each one, also ability to
  hide generated panel
- [ ] Add some kind of subpanel (may be simply a rectangle without border but slightly dark background) for each
  advanced rule.
- [ ] Ensure that the options already available in groups are not repeated in advanced panel.
- [ ] The border properties can be defined independently for each side, so we need to do something like with padding
  and margin, to allow user to define different values for each side.
- [ ] There are still many properties in advanced panel that can be added to main groups. Review them and add the most
  useful ones.
- [ ] There are a set of properties that are dependant on others, like align-items that only makes sense if display is
  flex or grid. We should hide or disable those properties when they don't make sense. Also those properties must be in
  same panel. So whenever a user changes display to flex, the flex properties appear in the same panel.
