# pi-glm-image-summary

A [pi](https://github.com/badlogic/pi-mono) extension that intercepts image reads when using non-vision GLM models and sends them to GLM-4.6v for detailed, categorized analysis.

## Why?

GLM text models (glm-4.6, glm-4.7, glm-4.7-flash) have no vision capabilities. GLM-4.6v does. This extension automatically detects when you're using a non-vision GLM model and intercepts image reads, sending them to GLM-4.6v with a structured prompt that:

1. **Classifies** the image (UI, code, error, diagram, chart, or general)
2. **Applies specialized analysis** based on the category

This approach is [48% faster and produces higher quality output](./test-fixtures/README.md#performance-comparison-generic-vs-structured-prompt) compared to a generic "analyze this image" prompt.

## Features

- **Automatic image interception**: When using glm-4.7/glm-4.7-long, image file reads are automatically redirected to glm-4.6v
- **Smart classification**: Images are categorized (UI, code, error, diagram, chart, general) for targeted analysis
- **Specialized prompts**: Each category gets analysis tailored to its content type:
  - **Code screenshots**: Extracts actual code with line numbers
  - **Error screenshots**: Provides root cause analysis and fix suggestions
  - **Diagrams**: Lists components, relationships, and protocols
  - **Charts**: Extracts data values, trends, and insights
- **Manual analysis command**: `/analyze-image <path>` to manually analyze any image

## Installation

Install globally:

```bash
pi install git:github.com/Whamp/glm-vision
```

Or install for a specific project (writes to `.pi/settings.json`):

```bash
pi install -l git:github.com/Whamp/glm-vision
```

To try it without installing:

```bash
pi -e git:github.com/Whamp/glm-vision
```

## Usage

Once installed, the extension loads automatically when you start pi:

```bash
pi --provider zai --model glm-4.7
```

### Automatic Mode

When the extension detects:
1. Current model is `glm-4.6`, `glm-4.7`, or `glm-4.7-flash`
2. A file being read is an image (jpg, jpeg, png, gif, webp)

It will automatically spawn a subprocess with glm-4.6v to analyze the image and return a categorized analysis.

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

## Development

```bash
# Install dependencies
npm install

# Run unit tests
npm run test

# Run integration tests (requires ZAI_API_KEY)
export ZAI_API_KEY="your-api-key"
npm run test:integration

# Type check
npm run typecheck

# Lint and format
npm run check
npm run format
```

See [test-fixtures/README.md](./test-fixtures/README.md) for test image details and performance benchmarks.

## Configuration

The extension uses the ZAI provider for the vision model. Make sure you have proper API credentials configured:

```bash
export ZAI_API_KEY="your-api-key"
```

## License

MIT
