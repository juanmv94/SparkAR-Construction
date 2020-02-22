# Construction SparkAR filter by @Juanmv94

## What is this AR filter about?
This AR filter allows you to build your own things placing blocks (like Minecraft, in which this filter inspires) using the back camera.
![](http://i3.ytimg.com/vi/vxX0zP3heW4/maxresdefault.jpg)

## How was done?
Since SparkAR doesn't allows to dinamically place objects, the project contains 256 dummy (and hidden) blocks that are placed and set visible programmatically.

Each block is made of 6 planes, each one with a onTap event handler that makes it place another block at it's relative position, or delete the full block in erase mode.

## How to use?
Start placing blocks on the base grid by touching it, and touch block faces to keep inserting more blocks. Use the NativeUI to change the material, or switch to erase mode (at left). You can pan and pinch the screen to move and resize the base grid with your creation. Do a long-press in erase mode to delete all blocks, and do a long-press in normal mode to reset the plane tracker.