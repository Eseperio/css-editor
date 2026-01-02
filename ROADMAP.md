- [x] Allow changing the width (or height, depending on anchor) of sidebar by dragging its border (for each anchor is a
  different border). No more than 50% of screen size, no less than 350px.
- [x] Use Lucide icons instead of emojis.
- [x] Use an icon for each config dropdown. When clicking the icon, it opens the dropdown. This reduces space used.
- [x] Remove sliders from direct view, instead, whenever user clicks on a numeric value input, something like a popover
  appears over the input with the slider for changing the value. To make this easier, the slider must use values from
  numeric input attributes slider-min, slider-max, slider-step. Slider will be also logarithmic, but this logarithm is
  defined based on min-max and step, meaning that if there are more than 100 steps between min and max, it will be
  logarithmic, otherwise linear. There may be cases where user can set a negative value, so logarithm must begin at 0,
  so it increases intensity when is far from 0 no matter negative or positive.
- [x] Responsive improvements:
    - For each property, right inline after the input (for numeric inputs, after the unit input) there will be an icon
      for choosing the media query for that property. When clicking on it, a dropdown will appear with option to choose
      between current media query selected in preview dropdown or all media queries (default).
      If user selects current media query, the property will be applied only for that media query, and the icon will be
      instead of light-gray, light orange, as a sign that property is media-query specific. When user changes the
      preview size, editor must show all the properties that has not been customized for that media query as they do
      when they have not been customized, where they look like semi-transparent. But an additional icon will be added
      inline to the one for choosing context to apply the rule, this time with a light red color and the icon of that
      media query, and a tooltip saying
      that property has been customized for that media query. This way, when user changes preview, it changes context of
      css editor, where it can still change all the properties modified in other previews that are not specific for a
      media query, while at the same time can identify which properties have been customized for other media queries. So
      user does not miss when a property is going to behave differently in other media queries.
- [x] Implement support for css native variables. Just inline, after each property name, there will be an icon. When
  user clicks on it, a popover appears with a list of all css variables defined in :root selector. User can choose one
  of them, and the value of the property will be set to that variable, instead of a fixed value. The icon will change to
  light blue as a sign that property is using a css variable and inputs for that property will be hidden, showing
  instead the name of variable used, and below it, in small light gray text, the actual value of that variable at that
  moment (so user can identify which variable is being used). On the right side of that box of name and value, a
  clickable cross icon will appear, so user can click on it to remove the variable and set back fixed value, which will
  be the current value of that variable, and the inputs will appear again for changing it.
- [x] Add a new panel for managing css variables. In that panel, user can create, edit and delete (delete only those
  created in this editor) css variables. Whenever a variable is edited, all properties using that variable must update
  their displayed value accordingly. 
