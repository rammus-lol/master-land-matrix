Here is the English translation of your documentation, keeping the same structure and tone for your repository.

---

# 🎨 Theme Prototyping Tool (OKLCH)

This script is an interactive color laboratory. It allows you to transform the entire design of the site by rotating its color palette across the chromatic wheel, while maintaining visual harmony.

🕹️ **Commands**

**The script relies on three buttons configured in the interface:**

**"Change the color based on oklch"** (`#color-switch-button`):

* **On the first click:** Opens a window to choose the change "speed" (e.g., 5% to complete the circle in 20 clicks) and the rendering mode (Adaptive or Objective).
* **Subsequent clicks:** Progresses all site colors through the spectrum (Green → Blue → Red → etc.).

**"Return to the last color"** (`#last-color-button`): Acts as a "Ctrl+Z". It allows you to return precisely to a shade you just passed.

**"Return to the original color"** (`#color-reset-button`): Erases all temporary modifications and restores the original theme defined in the CSS.

💡 **Operating Concepts**

#### 1. Hue Rotation

Instead of replacing colors one by one, the script applies an angular offset (in degrees) to all the site's CSS variables.

* If you had a dark green button and a light green background, they will become a dark blue button and a light blue background.
* **Harmony and contrasts are preserved automatically.**

#### 2. Adaptive vs. Objective Mode

The human eye perceives colors strangely: a yellow naturally appears much brighter to us than a blue, even if they have the same technical intensity.

* **Adaptive Mode (Boost):** The script "helps" colors like yellow or orange by increasing their lightness so they remain vibrant rather than looking "muddy/brown."
* **Objective Mode (Pure):** Applies the exact mathematical rotation of the OKLCH space, without human correction.

#### 3. Value Extraction

The tool is designed to assist in choosing a future brand identity. With every change, the **Browser Console (F12)** displays:

* The current rotation angle.
* The exact `oklch()` value of the main color.

> **Note:** If you find a color you like during the demo, simply note the value displayed in the console to permanently integrate it into the project's code.

💾 **Persistence**
The settings (speed, mode, current position) are saved in your browser's **LocalStorage**. You can refresh the page or switch tabs without losing your progress in the color cycle.

---
