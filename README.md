Interactive Water-Themed Animation Project
CPSC 2130 – Multimedia & Animation

This project is an interactive, multi-scene animation built using HTML5 Canvas, JavaScript, and CSS.
It includes four atmospheric environments: Rain, River, Underwater Ocean, and Waves.
Each scene contains its own animations, background environment, and rotating poetic lines.

Features
Four Fully Animated Scenes
Rain Scene

Falling raindrops generated and animated at runtime

Cloud overlays and a night skyline

Animated car sprites with lane logic

Scene-specific poem lines with fade effects

River Scene

Pixel-style mountain and grass environment

Procedural water waves

Floating wood sprites with drift and bobbing motion

Scene-specific poems

Underwater Ocean Scene

Full-screen underwater looping video

Fish sprites that swim and can be removed on click

Multi-line ocean-themed poem

Waves Scene

HD looping ocean-wave footage

Soft overlay for readability

Scene-specific rotating poems

Custom Poem System

Users can add their own poem through a modal interface

Custom poems are added into the rotation for the selected scene

Supports resetting back to default poems

No use of browser storage unless enabled

Audio Integration

Each scene has its own ambient audio track.
Audio starts only after the user interacts with the page, ensuring browser autoplay compliance.

How the Code Works
Scene Loader (loadScene)

Initializes the active scene, poem animation state, audio file, and drawing method.
Updates the main animation loop reference so each scene renders independently.

Main Animation Loop (animate)

Runs continuously using requestAnimationFrame to redraw the active scene at approximately 60 FPS.
Responsible for calling scene-specific draw functions.

Poem Engine (updateUniversalPoem)

Controls fade-in, display, and fade-out transitions for the poetic lines.
Handles moving to the next two lines once the fade cycle completes.

Rain Animation

Generates raindrop objects, updates their vertical movement, and recycles drops that exit the screen.
Cars are spawned with random direction, lane placement, and speed.

Car Sprite Logic (spawnCar and updateCars)

Spawns cars at randomized intervals.
Determines direction, lane height, scaling, and off-screen recycling.

River Floating Objects (updateFloatingObjects)

Drifts wooden sprites slowly across the river.
Applies bobbing motion using sinusoidal offsets.
Resets objects to the right side when they exit on the left.

Project Structure
/images
    /cars
    /riverSprites
    /buildings
/js
    script.js
/css
    style.css
index.html
README.md

Technologies Used

HTML5 Canvas

JavaScript (ES6)

CSS3

requestAnimationFrame

Canvas sprite rendering, gradients, and custom drawing

Modal UI controls

Challenges and Solutions
Maintaining smooth performance across all scenes

Solved by consolidating rendering into a single animation loop and minimizing unnecessary redraw operations.

Poem transitions occurring too quickly

Fixed by implementing timers and a fade-state machine to pace transitions.

Aligning car sprites with the road

Calculated lane positions relative to canvas height and ensured wheel placement aligned consistently.

Creating natural floating movement in the river

Used sinusoidal motion and tiny randomized offsets to replicate water bobbing.

Browser autoplay restrictions on audio

Handled by triggering audio only after the user interacts with the page.

Future Improvements

Add a settings menu for animation speed and audio controls

Add more environmental scenes

Add interactivity (rain splashes, mouse ripple effects, etc.)

Improve mobile responsiveness

Explore WebGL for enhanced performance

Team

Tanzim
Tabassum
Madhav