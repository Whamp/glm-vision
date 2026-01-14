# glm-vision

A skill that gives text-only GLM-4.7 vision capabilities by delegating to GLM-4.6v. A funny thing about GLM-4.7 is that it is CONVINCED it's name is claude, so you'll notice that claude is specified in the tool description even though this is targeted only at glm-4.7 because of glm-4.7's identity crisis. 

## What it does

Text-only models can't process images or videos. This skill provides a simple pattern: call [pi](https://github.com/mariozechner/pi-coding-agent) with GLM-4.6v and a reference prompt tailored to the task.

```bash
pi @screenshot.png --provider zai --model glm-4.6v -p "<prompt>"
```

That's it. The skill is just a lookup table mapping content types to pre-written prompts.

## Structure

- `SKILL.md` - Minimal instructions + task→reference lookup table
- `references/` - 25 prompt templates covering all vision use cases

The reference prompts are organized by task type:
- **UI-to-code**: Generate code, specs, or prompts from screenshots
- **OCR**: Extract text, code, or multi-language content
- **Error diagnosis**: Analyze error screenshots with optional context
- **Diagrams**: Architecture, flowchart, UML, ER, general technical
- **Charts**: General analysis, trends, anomalies, dashboards
- **Comparison**: UI diff between two screenshots
- **Video**: General analysis, tutorial step extraction

## About the skill description

The description in `SKILL.md` is intentionally emphatic:

> CLAUDE and GLM-4.7 (text-only) CANNOT process images or videos - you MUST ALWAYS delegate vision tasks to GLM-4.6v via this skill...

This wording was written by GLM-4.7 itself through iterative refinement until the model correctly triggered the skill 100% of the time on first try in testing.

GLM-4.7 is convinced it's Claude as the model name). This is relevant because the description explicitly addresses "CLAUDE" - the model the agent believes itself to be. The aggressive, self-referential phrasing ("this is your ONLY way to understand visual content", "NO EXCEPTIONS") works because the model wrote instructions it would actually follow.

## Why this approach

This skill replaced a dedicated MCP vision server. The original server had tools for each use case (OCR, UI-to-code, diagram analysis, etc.). This skill achieves the same coverage with:

1. **One command** - `pi @file --provider zai --model glm-4.6v -p "..."`
2. **Reference prompts** - Pre-written prompts for each task, loaded only when needed
3. **Minimal SKILL.md** - Just a lookup table, keeps context lean

The agent reads SKILL.md, picks the right reference file from the table, and constructs the pi command. No server, no dependencies beyond pi.

## Requirements

- [pi](https://github.com/mariozechner/pi-coding-agent) installed and configured
- z.ai API key set up in pi (see pi docs for provider configuration)

## Usage

Install as a skill in your agent's skills directory, or reference directly. The agent will automatically use it when visual content is mentioned.

## License

MIT
