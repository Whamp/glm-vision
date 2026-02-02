# pi-glm-image-summary

A [pi](https://github.com/badlogic/pi-mono) extension that intercepts image reads when using glm-4.7 and sends them to glm-4.6v for detailed analysis.

## Why?

GLM-4.7 is a powerful text model but has limited vision capabilities. GLM-4.6v, on the other hand, has stronger vision support. This extension automatically detects when you're using glm-4.7 and intercepts image reads, sending them to glm-4.6v for comprehensive analysis.

## Features

- **Automatic image interception**: When using glm-4.7/glm-4.7-long, image file reads are automatically redirected to glm-4.6v for analysis
- **Comprehensive analysis**: Extracts text content, visual elements, technical details, and more
- **Manual analysis command**: `/analyze-image <path>` to manually analyze any image

## Installation

Install globally:

```bash
pi install npm:pi-glm-image-summary
```

Or install for a specific project (writes to `.pi/settings.json`):

```bash
pi install -l npm:pi-glm-image-summary
```

To try it without installing:

```bash
pi -e npm:pi-glm-image-summary
```

## Usage

Once installed, the extension loads automatically when you start pi:

```bash
pi --provider zai --model glm-4.7
```

### Automatic Mode

When the extension detects:
1. Current model is `glm-4.7` or `glm-4.7-long`
2. A file being read is an image (jpg, jpeg, png, gif, webp)

It will automatically spawn a subprocess with glm-4.6v to analyze the image and return a detailed summary.

### Manual Analysis

Use the `/analyze-image` command to analyze any image:

```
/analyze-image ./screenshot.png
```

## Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

## Configuration

The extension uses the ZAI provider for the vision model. Make sure you have proper API credentials configured.
