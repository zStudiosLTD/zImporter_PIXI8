---
name: zimporter-components
description: Use zStudio buttons, toggles, sliders, scrollbars, states and text from code with zimporter-pixi8 (Pixi.js 8). Load before wiring up UI elements.
---
# zImporter components (Pixi.js 8)

The required child names below are exact. Set the container type in zStudio.

## Button: children `upState`, `overState`, `downState`, `disabledState`, optional `labelContainer`
```ts
btn.setCallback(fn); btn.setLongPressCallback(fn); btn.removeCallback(); btn.removeLongPressCallback();
btn.setLabel('Play'); btn.setLabel2('Level 3'); btn.setFixedTextSize(true);
btn.disable(); btn.enable();   // callbacks are kept
```
Visual states work without code. A press that moves over 20px counts as a drag, not a click.

## Toggle: children `onState`, `offState`. Starts off.
```ts
t.setCallback((isOn) => {});
t.isOn();
t.toggle(true);          // also runs the callback
t.toggle(saved, false);  // restore a saved value silently
t.disable(); t.enable();
t.setLabelOnAllStates('labelContainer', 'Sound');
```

## Slider: children `track`, `handle`. Horizontal, value 0 to 1.
```ts
s.setCallback((value) => {});
s.setHandlePosition(0.75);  // also runs the callback
```
- There is no silent setter and no getter. Set the position before attaching the callback, and keep the value yourself.

## Scroll Bar: children `scrollContent`, `scrollBar`, `beed`
`scrollBar` height is the visible height; visible width runs from `scrollContent` to `scrollBar`. Scrolling and clipping need no code. Buttons inside work normally.

Adding rows:
```ts
const row = ZSceneStack.spawn('ShopRow') as ZContainer;
row.y = i * rowHeight;
list.scrollContent.addChild(row);
list.applyTransform();   // call once after adding: re-measures the list
```
- Resizing or rotating scrolls the list back to the top.
- The wheel listener is global and moves every list. Set `scrollingEnabled = false` on inactive lists.
- Call `list.removeListeners()` before removing a list.

## State: one child visible at a time
```ts
st.setState('run'); st.getCurrentState()?.name; st.hasState('jump'); st.getAllStateNames();
```
Starts on `idle`, or the first child. An unknown name falls back to `idle` with no error. 

## Text
Text fields sit inside a container. Call methods on the container.
```ts
c.setText('1,250');
c.setFixedBoxSize(true);   // shrink font to fit the original box
c.setTextStyle({ fill: '#fc0', fontSize: 40 });
c.getTextField();          // the underlying text object
```

## Text input
```ts
const field = (form.get('nameInput') as ZContainer).getTextField() as any;
field.on('input', (text: string) => {}); field.text = 'x'; field.focus(); field.blur(); field.disabled = true;
```
